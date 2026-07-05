/**
 * Billing, plans, subscriptions, invoices, and payments.
 * @module @itbengal/types/billing
 */

import type {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  PlanTier,
  PlanType,
  SubscriptionStatus,
} from './enums.js';

/**
 * A hosting plan that customers can subscribe to.
 */
export interface Plan {
  /** Primary key (UUIDv7). */
  id: string;
  /** Display name of the plan. */
  name: string;
  /** URL-safe slug (unique). */
  slug: string;
  /** Category of the plan. */
  type: PlanType;
  /** Tier level. */
  tier: PlanTier;
  /** Monthly price in the smallest currency unit (e.g. paisa / cents). */
  priceMonthly: number;
  /** Yearly price in the smallest currency unit. */
  priceYearly: number;
  /** ISO-4217 currency code. */
  currency: string;
  /** CPU allocation (number of vCPU cores). */
  cpu: number;
  /** Memory allocation in megabytes. */
  memoryMb: number;
  /** Disk storage allocation in megabytes. */
  storageMb: number;
  /** Monthly bandwidth allowance in megabytes. */
  bandwidthMb: number;
  /** Maximum number of projects allowed. */
  maxProjects: number;
  /** Maximum number of custom domains. */
  maxDomains: number;
  /** Maximum team members (including owner). */
  maxTeamMembers: number;
  /** Monthly build-minutes allowance. */
  buildMinutes: number;
  /** Maximum deployments per day. */
  deploymentsPerDay: number;
  /** Number of days backups are retained. */
  backupRetentionDays: number;
  /** Whether free SSL is included. */
  sslIncluded: boolean;
  /** Whether the plan grants priority support. */
  prioritySupport: boolean;
  /** Feature flags and metadata stored as JSONB. */
  features: Record<string, unknown>;
  /** Whether the plan is currently available for purchase. */
  isActive: boolean;
  /** Display order on the pricing page. */
  sortOrder: number;
  /** When the plan was created. */
  createdAt: string;
  /** When the plan was last updated. */
  updatedAt: string;
}

/**
 * A customer's subscription to a plan.
 */
export interface Subscription {
  /** Primary key (UUIDv7). */
  id: string;
  /** The organization that holds this subscription. */
  organizationId: string;
  /** The plan being subscribed to. */
  planId: string;
  /** Current subscription status. */
  status: SubscriptionStatus;
  /** Start of the current billing period (ISO-8601). */
  currentPeriodStart: string;
  /** End of the current billing period (ISO-8601). */
  currentPeriodEnd: string;
  /** When the subscription was cancelled (null if active). */
  cancelledAt: string | null;
  /** Whether the subscription auto-renews. */
  autoRenew: boolean;
  /** When the subscription was created. */
  createdAt: string;
  /** When the subscription was last updated. */
  updatedAt: string;
}

/**
 * An invoice generated for a subscription billing period.
 */
export interface Invoice {
  /** Primary key (UUIDv7). */
  id: string;
  /** The organization billed. */
  organizationId: string;
  /** The related subscription. */
  subscriptionId: string;
  /** Sequential, human-readable invoice number (e.g. INV-2026-0001). */
  invoiceNumber: string;
  /** Invoice status. */
  status: InvoiceStatus;
  /** Subtotal before discount and tax (smallest currency unit). */
  subtotal: number;
  /** Discount amount applied (smallest currency unit). */
  discount: number;
  /** Tax amount (smallest currency unit). */
  tax: number;
  /** Total due (smallest currency unit). */
  total: number;
  /** ISO-4217 currency code. */
  currency: string;
  /** Payment due date (ISO-8601). */
  dueDate: string;
  /** When the invoice was paid (null if unpaid). */
  paidAt: string | null;
  /** URL to a generated PDF of the invoice. */
  pdfUrl: string | null;
  /** Internal or customer-facing notes. */
  notes: string | null;
  /** When the invoice was created. */
  createdAt: string;
  /** When the invoice was last updated. */
  updatedAt: string;
}

/**
 * A line item on an invoice.
 */
export interface InvoiceItem {
  /** Primary key. */
  id: string;
  /** The parent invoice. */
  invoiceId: string;
  /** Description of the line item. */
  description: string;
  /** Quantity. */
  quantity: number;
  /** Unit price (smallest currency unit). */
  unitPrice: number;
  /** Line total (quantity × unitPrice). */
  total: number;
}

/**
 * A payment transaction against an invoice.
 */
export interface Payment {
  /** Primary key (UUIDv7). */
  id: string;
  /** The invoice being paid. */
  invoiceId: string;
  /** The organization making the payment. */
  organizationId: string;
  /** Amount paid (smallest currency unit). */
  amount: number;
  /** ISO-4217 currency code. */
  currency: string;
  /** Payment method used. */
  method: PaymentMethod;
  /** Transaction status. */
  status: PaymentStatus;
  /** Gateway-issued transaction ID. */
  transactionId: string | null;
  /** Raw gateway response for debugging. */
  gatewayResponse: Record<string, unknown> | null;
  /** When the payment was made. */
  createdAt: string;
  /** When the payment record was last updated. */
  updatedAt: string;
}

/**
 * A purchase order (used for enterprise / offline payments).
 */
export interface Order {
  /** Primary key (UUIDv7). */
  id: string;
  /** The organization placing the order. */
  organizationId: string;
  /** The plan being purchased. */
  planId: string;
  /** Order total (smallest currency unit). */
  total: number;
  /** ISO-4217 currency code. */
  currency: string;
  /** Order status. */
  status: PaymentStatus;
  /** Related invoice ID (created upon order confirmation). */
  invoiceId: string | null;
  /** When the order was placed. */
  createdAt: string;
  /** When the order was last updated. */
  updatedAt: string;
}

/**
 * Request body for creating a new subscription.
 */
export interface CreateSubscriptionRequest {
  /** The plan to subscribe to. */
  planId: string;
  /** Payment method to use. */
  paymentMethod: PaymentMethod;
  /** Whether to enable auto-renewal. */
  autoRenew?: boolean;
}

/**
 * Request body for creating a payment.
 */
export interface CreatePaymentRequest {
  /** The invoice to pay. */
  invoiceId: string;
  /** Payment method. */
  method: PaymentMethod;
  /** Amount to pay (smallest currency unit). */
  amount: number;
  /** ISO-4217 currency code. */
  currency: string;
  /** Optional gateway-specific metadata. */
  metadata?: Record<string, unknown>;
}
