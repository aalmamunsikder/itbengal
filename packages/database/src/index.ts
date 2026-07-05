/**
 * @module @itbengal/database
 * @description Public API for the ITBengal database package.
 *
 * Re-exports the singleton Prisma client instance, lifecycle helpers,
 * and all generated Prisma types so downstream packages need only
 * depend on `@itbengal/database`.
 *
 * @example
 * ```ts
 * import { prisma, initializeDatabase } from '@itbengal/database';
 * import type { User, Organization, Prisma } from '@itbengal/database';
 *
 * await initializeDatabase();
 * const user: User = await prisma.user.findUniqueOrThrow({ where: { id } });
 * ```
 */

// ── Client instance & lifecycle helpers ─────────────────────────────────────
export { prisma, initializeDatabase, disconnectDatabase } from './client.js';

// ── Generated Prisma types ──────────────────────────────────────────────────
// Re-export everything from @prisma/client so consumers don't need a
// direct dependency on it.
export {
  PrismaClient,
  Prisma,
  // ── Enums ──
  UserRole,
  UserStatus,
  TeamMemberRole,
  Framework,
  GitProvider,
  ProjectStatus,
  ApplicationType,
  ContainerStatus,
  SslStatus,
  DeploymentTrigger,
  DeploymentStatus,
  LogLevel,
  LogSource,
  EnvVarTarget,
  SslCertificateType,
  SslCertificateStatus,
  ServerNodeType,
  ServerNodeStatus,
  BackupType,
  BackupStatus,
  BackupTrigger,
  PlanType,
  PlanTier,
  SubscriptionStatus,
  InvoiceStatus,
  InvoiceItemType,
  PaymentMethod,
  PaymentStatus,
  OrderType,
  OrderStatus,
  NotificationChannel,
  DomainRegistrationStatus,
  DnsRecordType,
} from '@prisma/client';

// ── Model types (re-exported as type-only) ──────────────────────────────────
export type {
  User,
  Organization,
  TeamMember,
  Session,
  ApiKey,
  Project,
  Application,
  Deployment,
  DeploymentLog,
  EnvironmentVariable,
  SSLCertificate,
  ServerNode,
  WordPressSite,
  Backup,
  Plan,
  Subscription,
  Invoice,
  InvoiceItem,
  Payment,
  Order,
  AuditLog,
  Notification,
  Domain,
  DnsRecord,
} from '@prisma/client';
