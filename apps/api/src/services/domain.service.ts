import { prisma, DomainRegistrationStatus, DnsRecordType } from '@itbengal/database';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import * as openprovider from './openprovider.service.js';
import { appConfig } from '../config/app.js';

const TLD_PRICES: Record<string, number> = {
  com: 1200,
  net: 1400,
  org: 1500,
  xyz: 500,
  info: 1600,
  tech: 999,
};

/**
 * Fetch all registered domains for an organization.
 */
export async function listDomains(organizationId: string) {
  return prisma.domain.findMany({
    where: { organizationId },
    include: { dnsRecords: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Fetch a specific domain's details.
 */
export async function getDomainDetails(domainId: string, organizationId: string) {
  const domain = await prisma.domain.findFirst({
    where: { id: domainId, organizationId },
    include: { dnsRecords: true },
  });

  if (!domain) {
    throw new NotFoundError('Domain not found');
  }

  return domain;
}

/**
 * Search domain availability.
 */
export async function searchDomains(domainName: string) {
  return openprovider.searchDomain(domainName);
}

/**
 * Request domain registration (creates pending domain and invoice).
 */
export async function requestDomainRegistration(
  organizationId: string,
  domainName: string,
  tld: string
) {
  // Validate domain uniqueness in DB
  const existing = await prisma.domain.findUnique({
    where: { name: domainName },
  });

  if (existing) {
    throw new ForbiddenError('Domain is already registered or request is pending');
  }

  const basePrice = TLD_PRICES[tld] || 1200;
  const priceWithMarkup = Math.round(basePrice * 1.2);

  // 1. Create PENDING domain in DB
  const domain = await prisma.domain.create({
    data: {
      organizationId,
      name: domainName,
      status: 'PENDING_PAYMENT' as DomainRegistrationStatus,
      autoRenew: true,
      whoisPrivacy: false,
    },
  });

  // 2. Add default Nameservers to DNS Records
  await prisma.dnsRecord.createMany({
    data: [
      { domainId: domain.id, name: '@', type: 'NS' as DnsRecordType, content: `ns1.${appConfig.domain}`, ttl: 86400 },
      { domainId: domain.id, name: '@', type: 'NS' as DnsRecordType, content: `ns2.${appConfig.domain}`, ttl: 86400 },
    ],
  });

  // 3. Create Invoice for the purchase
  const now = new Date();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const invoiceNumber = `INV-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;

  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      invoiceNumber,
      status: 'PENDING',
      subtotal: priceWithMarkup,
      total: priceWithMarkup,
      dueDate: now,
    },
  });

  // Create Invoice Item
  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice.id,
      description: `Domain Registration - ${domainName} (1 Year TLD: .${tld})`,
      quantity: 1,
      unitPrice: priceWithMarkup,
      total: priceWithMarkup,
      type: 'DOMAIN',
    },
  });

  return {
    domain,
    invoice,
  };
}

/**
 * Register/Activate domain once payment is received.
 */
export async function activateDomain(domainId: string) {
  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
  });

  if (!domain) {
    throw new NotFoundError('Domain not found');
  }

  // Register with Openprovider wrapper
  const regResult = await openprovider.registerDomain(domain.name, {});

  // Update DB status to ACTIVE
  return prisma.domain.update({
    where: { id: domainId },
    data: {
      status: 'ACTIVE' as DomainRegistrationStatus,
      registrationDate: regResult.registrationDate,
      expiryDate: regResult.expiryDate,
      authCode: regResult.authCode,
    },
  });
}

/**
 * Toggle WHOIS privacy status.
 */
export async function toggleWhoisPrivacy(domainId: string, organizationId: string, enabled: boolean) {
  const domain = await getDomainDetails(domainId, organizationId);

  await openprovider.toggleWhoisPrivacy(domain.name, enabled);

  return prisma.domain.update({
    where: { id: domainId },
    data: { whoisPrivacy: enabled },
  });
}

/**
 * Add a custom DNS record.
 */
export async function addDnsRecord(
  domainId: string,
  organizationId: string,
  data: { name: string; type: DnsRecordType; content: string; ttl?: number; priority?: number }
) {
  const domain = await getDomainDetails(domainId, organizationId);

  const record = await prisma.dnsRecord.create({
    data: {
      domainId,
      name: data.name,
      type: data.type,
      content: data.content,
      ttl: data.ttl || 3600,
      priority: data.priority || null,
    },
  });

  // Synchronize to Openprovider nameservers
  const allRecords = await prisma.dnsRecord.findMany({ where: { domainId } });
  const openproviderFormat = allRecords.map((r) => ({
    type: r.type,
    name: r.name,
    value: r.content,
    ttl: r.ttl,
    priority: r.priority || undefined,
  }));

  await openprovider.updateDnsZone(domain.name, openproviderFormat);

  return record;
}

/**
 * Update a custom DNS record.
 */
export async function updateDnsRecord(
  domainId: string,
  organizationId: string,
  recordId: string,
  data: { name: string; type: DnsRecordType; content: string; ttl?: number; priority?: number }
) {
  const domain = await getDomainDetails(domainId, organizationId);

  const existingRecord = await prisma.dnsRecord.findFirst({
    where: { id: recordId, domainId },
  });

  if (!existingRecord) {
    throw new NotFoundError('DNS record not found');
  }

  const record = await prisma.dnsRecord.update({
    where: { id: recordId },
    data: {
      name: data.name,
      type: data.type,
      content: data.content,
      ttl: data.ttl || 3600,
      priority: data.priority !== undefined ? data.priority : null,
    },
  });

  // Sync to Openprovider
  const allRecords = await prisma.dnsRecord.findMany({ where: { domainId } });
  const openproviderFormat = allRecords.map((r) => ({
    type: r.type,
    name: r.name,
    value: r.content,
    ttl: r.ttl,
    priority: r.priority || undefined,
  }));

  await openprovider.updateDnsZone(domain.name, openproviderFormat);

  return record;
}

/**
 * Delete a custom DNS record.
 */
export async function deleteDnsRecord(domainId: string, organizationId: string, recordId: string) {
  const domain = await getDomainDetails(domainId, organizationId);

  const existingRecord = await prisma.dnsRecord.findFirst({
    where: { id: recordId, domainId },
  });

  if (!existingRecord) {
    throw new NotFoundError('DNS record not found');
  }

  await prisma.dnsRecord.delete({
    where: { id: recordId },
  });

  // Sync to Openprovider
  const allRecords = await prisma.dnsRecord.findMany({ where: { domainId } });
  const openproviderFormat = allRecords.map((r) => ({
    type: r.type,
    name: r.name,
    value: r.content,
    ttl: r.ttl,
    priority: r.priority || undefined,
  }));

  await openprovider.updateDnsZone(domain.name, openproviderFormat);

  return true;
}
