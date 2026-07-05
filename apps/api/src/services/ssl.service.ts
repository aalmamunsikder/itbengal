import { prisma, SslCertificateStatus, SslCertificateType } from '@itbengal/database';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import dns from 'dns';
import { appConfig } from '../config/app.js';

/**
 * Fetch SSL certificates for a given application.
 */
export async function getCertificates(applicationId: string) {
  return prisma.sSLCertificate.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Perform a DNS check to verify if the domain points to our platform IP.
 */
export async function checkDnsConfig(domainName: string): Promise<{
  isValid: boolean;
  resolvedIps: string[];
  platformIp: string;
  message: string;
}> {
  // Use a fallback public IP for platform in development
  const platformIp = process.env['PLATFORM_IP'] || '127.0.0.1';

  return new Promise((resolve) => {
    dns.resolve4(domainName, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve({
          isValid: false,
          resolvedIps: [],
          platformIp,
          message: `Domain does not resolve to any IPv4 address. Please add an A record pointing to ${platformIp}.`,
        });
        return;
      }

      // Check if it matches platform IP or if we are in development (where we might mock success)
      const matches = addresses.includes(platformIp) || appConfig.isDevelopment;
      
      resolve({
        isValid: matches,
        resolvedIps: addresses,
        platformIp,
        message: matches
          ? 'DNS is configured correctly.'
          : `Domain resolves to ${addresses.join(', ')} instead of our platform IP: ${platformIp}.`,
      });
    });
  });
}

/**
 * Provision a Let's Encrypt certificate record.
 * Performs a pre-flight DNS check, then inserts/updates the SSLCertificate record.
 */
export async function provisionCertificate(applicationId: string, domainName: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!app) {
    throw new NotFoundError('Application not found');
  }

  // Pre-flight DNS check
  const dnsCheck = await checkDnsConfig(domainName);
  if (!dnsCheck.isValid && appConfig.isProduction) {
    throw new ForbiddenError(`DNS configuration check failed: ${dnsCheck.message}`);
  }

  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  // Upsert SSL Certificate record
  const cert = await prisma.sSLCertificate.create({
    data: {
      applicationId,
      domainName,
      type: 'LETS_ENCRYPT' as SslCertificateType,
      status: 'ACTIVE' as SslCertificateStatus,
      issuedAt: now,
      expiresAt: ninetyDaysFromNow,
      autoRenew: true,
      certificatePath: `/etc/letsencrypt/live/${domainName}/fullchain.pem`,
      privateKeyPath: `/etc/letsencrypt/live/${domainName}/privkey.pem`,
    },
  });

  // Update SSL status on Application
  await prisma.application.update({
    where: { id: applicationId },
    data: { sslStatus: 'ACTIVE' },
  });

  return cert;
}

/**
 * Manually renew a certificate.
 */
export async function renewCertificate(certificateId: string) {
  const cert = await prisma.sSLCertificate.findUnique({
    where: { id: certificateId },
  });

  if (!cert) {
    throw new NotFoundError('Certificate not found');
  }

  const dnsCheck = await checkDnsConfig(cert.domainName);
  if (!dnsCheck.isValid && appConfig.isProduction) {
    throw new ForbiddenError(`Cannot renew: DNS check failed: ${dnsCheck.message}`);
  }

  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  return prisma.sSLCertificate.update({
    where: { id: certificateId },
    data: {
      status: 'ACTIVE' as SslCertificateStatus,
      issuedAt: now,
      expiresAt: ninetyDaysFromNow,
      lastRenewalAttempt: now,
    },
  });
}

/**
 * Fetch all applications for an organization.
 */
export async function getApplications(orgId: string) {
  return prisma.application.findMany({
    where: {
      project: {
        organizationId: orgId,
      },
    },
    include: {
      wordpressSite: true,
      project: true,
    },
  });
}
