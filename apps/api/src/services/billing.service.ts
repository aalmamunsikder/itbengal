import { prisma, SubscriptionStatus, InvoiceStatus, PaymentStatus } from '@itbengal/database';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { activateDomain } from './domain.service.js';

/**
 * Fetch all active hosting plans.
 */
export async function getPlans() {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Fetch subscription details for an organization.
 */
export async function getSubscription(organizationId: string) {
  return prisma.subscription.findFirst({
    where: { organizationId },
    include: { plan: true },
  });
}

/**
 * Fetch all invoices for an organization.
 */
export async function getInvoices(organizationId: string) {
  return prisma.invoice.findMany({
    where: { organizationId },
    include: {
      items: true,
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Subscribe to a plan or upgrade/downgrade.
 * Creates an invoice in PENDING status, awaiting manual bKash payment.
 */
export async function createSubscription(organizationId: string, planId: string) {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new NotFoundError('Plan not found');
  }

  // Find existing subscription
  const existingSub = await prisma.subscription.findFirst({
    where: { organizationId },
  });

  const now = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(now.getMonth() + 1);

  let subscription;

  if (existingSub) {
    // Upgrade / Downgrade subscription
    subscription = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        planId: plan.id,
        status: 'PAST_DUE' as SubscriptionStatus, // Awaiting bKash payment to activate
      },
    });
  } else {
    // Create new subscription
    subscription = await prisma.subscription.create({
      data: {
        organizationId,
        planId: plan.id,
        status: 'PAST_DUE' as SubscriptionStatus, // Awaiting bKash payment to activate
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthFromNow,
      },
    });
  }

  // Generate invoice number: INV-YYYYMMDD-[Random 4 chars]
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const invoiceNumber = `INV-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;

  // Create Invoice
  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      subscriptionId: subscription.id,
      invoiceNumber,
      status: 'PENDING' as InvoiceStatus,
      subtotal: plan.priceMonthly,
      total: plan.priceMonthly,
      dueDate: now,
    },
  });

  // Create Invoice Item
  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice.id,
      description: `Managed WordPress Hosting - ${plan.name} Tier (1 Month)`,
      quantity: 1,
      unitPrice: plan.priceMonthly,
      total: plan.priceMonthly,
      type: 'HOSTING',
      periodStart: now,
      periodEnd: oneMonthFromNow,
    },
  });

  return {
    subscription,
    invoice,
  };
}

/**
 * Submit a manual bKash payment claim for a pending invoice.
 */
export async function payBkash(
  organizationId: string,
  invoiceId: string,
  senderNumber: string,
  trxId: string,
  amount: number
) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId },
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  if (invoice.status === ('PAID' as InvoiceStatus)) {
    throw new ForbiddenError('Invoice is already paid');
  }

  // Create Payment record
  const payment = await prisma.payment.create({
    data: {
      organizationId,
      invoiceId,
      amount,
      paymentMethod: 'BKASH',
      gatewayTransactionId: trxId,
      gatewayResponse: {
        senderNumber,
        submittedAt: new Date().toISOString(),
      },
      status: 'PENDING' as PaymentStatus,
    },
  });

  return payment;
}

/**
 * Admin action to approve a pending bKash payment.
 * Activates subscription and marks invoice as paid.
 */
export async function approveBkashPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true },
  });

  if (!payment) {
    throw new NotFoundError('Payment claim not found');
  }

  if (payment.status === ('COMPLETED' as PaymentStatus)) {
    throw new ForbiddenError('Payment is already completed');
  }

  // Update Payment to completed
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'COMPLETED' as PaymentStatus },
  });

  // Update Invoice to paid
  await prisma.invoice.update({
    where: { id: payment.invoiceId },
    data: {
      status: 'PAID' as InvoiceStatus,
      paidAt: new Date(),
    },
  });

  // If there's a subscription associated with the invoice, activate it
  if (payment.invoice.subscriptionId) {
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    await prisma.subscription.update({
      where: { id: payment.invoice.subscriptionId },
      data: {
        status: 'ACTIVE' as SubscriptionStatus,
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthFromNow,
      },
    });
  }

  // Look for any domain registration items in this invoice to activate
  const items = await prisma.invoiceItem.findMany({
    where: { invoiceId: payment.invoiceId },
  });

  for (const item of items) {
    if (item.type === 'DOMAIN') {
      const match = item.description.match(/Domain Registration - ([a-zA-Z0-9.-]+)/);
      if (match && match[1]) {
        const domainName = match[1];
        const pendingDomain = await prisma.domain.findFirst({
          where: { name: domainName, status: 'PENDING_PAYMENT' },
        });
        if (pendingDomain) {
          await activateDomain(pendingDomain.id);
        }
      }
    }
  }

  return updatedPayment;
}
