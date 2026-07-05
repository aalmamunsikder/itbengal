/**
 * Shared enum-like const objects used across the ITBengal platform.
 *
 * Pattern: export const EnumName = { VALUE: 'value' } as const;
 *          export type EnumName = (typeof EnumName)[keyof typeof EnumName];
 *
 * @module @itbengal/types/enums
 */

// ─── Users ───────────────────────────────────────────────────────────────────

/** Roles a user can hold within the platform. */
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CUSTOMER_OWNER: 'customer_owner',
  CUSTOMER_MEMBER: 'customer_member',
  CUSTOMER_VIEWER: 'customer_viewer',
  SUPPORT_AGENT: 'support_agent',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Lifecycle status of a user account. */
export const UserStatus = {
  PENDING_VERIFICATION: 'pending_verification',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  LOCKED: 'locked',
  DELETED: 'deleted',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// ─── Projects ────────────────────────────────────────────────────────────────

/** Lifecycle status of a hosting project. */
export const ProjectStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

/** Front-end framework supported by the platform. */
export const Framework = {
  REACT: 'react',
  NEXTJS: 'nextjs',
  VUE: 'vue',
  ANGULAR: 'angular',
  SVELTE: 'svelte',
  ASTRO: 'astro',
  VITE: 'vite',
  STATIC_HTML: 'static_html',
} as const;
export type Framework = (typeof Framework)[keyof typeof Framework];

/** Git hosting provider. */
export const GitProvider = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  BITBUCKET: 'bitbucket',
} as const;
export type GitProvider = (typeof GitProvider)[keyof typeof GitProvider];

// ─── Deployments ─────────────────────────────────────────────────────────────

/** Current status of a deployment pipeline run. */
export const DeploymentStatus = {
  QUEUED: 'queued',
  BUILDING: 'building',
  DEPLOYING: 'deploying',
  LIVE: 'live',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ROLLED_BACK: 'rolled_back',
} as const;
export type DeploymentStatus = (typeof DeploymentStatus)[keyof typeof DeploymentStatus];

/** What triggered a deployment. */
export const DeploymentTrigger = {
  GIT_PUSH: 'git_push',
  MANUAL: 'manual',
  ROLLBACK: 'rollback',
  ZIP_UPLOAD: 'zip_upload',
  WEBHOOK: 'webhook',
} as const;
export type DeploymentTrigger = (typeof DeploymentTrigger)[keyof typeof DeploymentTrigger];

// ─── Servers & Containers ────────────────────────────────────────────────────

/** Classification of a server node. */
export const ServerType = {
  PLATFORM: 'platform',
  REACT: 'react',
  WORDPRESS: 'wordpress',
} as const;
export type ServerType = (typeof ServerType)[keyof typeof ServerType];

/** Operational status of a server node. */
export const ServerStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  PROVISIONING: 'provisioning',
} as const;
export type ServerStatus = (typeof ServerStatus)[keyof typeof ServerStatus];

/** Runtime status of a container. */
export const ContainerStatus = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  STARTING: 'starting',
  STOPPING: 'stopping',
  ERROR: 'error',
  BUILDING: 'building',
} as const;
export type ContainerStatus = (typeof ContainerStatus)[keyof typeof ContainerStatus];

/** SSL certificate lifecycle status. */
export const SSLStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  FAILED: 'failed',
  RENEWING: 'renewing',
} as const;
export type SSLStatus = (typeof SSLStatus)[keyof typeof SSLStatus];

// ─── Billing ─────────────────────────────────────────────────────────────────

/** Tier level of a hosting plan. */
export const PlanTier = {
  STARTER: 'starter',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

/** Category of hosting plan. */
export const PlanType = {
  REACT_HOSTING: 'react_hosting',
  WORDPRESS_HOSTING: 'wordpress_hosting',
} as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];

/** Lifecycle status of a subscription. */
export const SubscriptionStatus = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  TRIAL: 'trial',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

/** Status of an invoice. */
export const InvoiceStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

/** Status of a payment transaction. */
export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** Supported payment methods / gateways. */
export const PaymentMethod = {
  BKASH: 'bkash',
  NAGAD: 'nagad',
  ROCKET: 'rocket',
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// ─── Backups ─────────────────────────────────────────────────────────────────

/** Type of backup. */
export const BackupType = {
  FULL: 'full',
  DATABASE: 'database',
  FILES: 'files',
} as const;
export type BackupType = (typeof BackupType)[keyof typeof BackupType];

/** Status of a backup job. */
export const BackupStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type BackupStatus = (typeof BackupStatus)[keyof typeof BackupStatus];

// ─── Domains & DNS ───────────────────────────────────────────────────────────

/** Lifecycle status of a domain. */
export const DomainStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  EXPIRED: 'expired',
  TRANSFERRING: 'transferring',
  SUSPENDED: 'suspended',
} as const;
export type DomainStatus = (typeof DomainStatus)[keyof typeof DomainStatus];

/** DNS record types supported by the platform. */
export const DNSRecordType = {
  A: 'A',
  AAAA: 'AAAA',
  CNAME: 'CNAME',
  MX: 'MX',
  TXT: 'TXT',
  SRV: 'SRV',
  NS: 'NS',
} as const;
export type DNSRecordType = (typeof DNSRecordType)[keyof typeof DNSRecordType];

// ─── Notifications & Support ─────────────────────────────────────────────────

/** Channel through which a notification is delivered. */
export const NotificationType = {
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
  PUSH: 'push',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/** Status of a support ticket. */
export const SupportTicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_CUSTOMER: 'waiting_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;
export type SupportTicketStatus = (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus];

// ─── Audit ───────────────────────────────────────────────────────────────────

/** Actions recorded in the audit log. */
export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  DEPLOY: 'deploy',
  PAYMENT: 'payment',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
