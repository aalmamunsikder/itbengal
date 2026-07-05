/**
 * @itbengal/types — Shared TypeScript types, interfaces, DTOs, and enums
 * used across all workspaces in the ITBengal monorepo.
 *
 * @module @itbengal/types
 */

// ─── Common ──────────────────────────────────────────────────────────────────
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationMeta,
  PaginationQuery,
  DateRange,
  KeyValue,
} from './common.js';

export { SortOrder } from './common.js';

// ─── Enums ───────────────────────────────────────────────────────────────────
export {
  UserRole,
  UserStatus,
  ProjectStatus,
  Framework,
  GitProvider,
  DeploymentStatus,
  DeploymentTrigger,
  ServerType,
  ServerStatus,
  ContainerStatus,
  SSLStatus,
  PlanTier,
  PlanType,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  BackupType,
  BackupStatus,
  DomainStatus,
  DNSRecordType,
  NotificationType,
  SupportTicketStatus,
  AuditAction,
} from './enums.js';

// ─── Auth ────────────────────────────────────────────────────────────────────
export type {
  User,
  Session,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  JWTPayload,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  TwoFactorSetupResponse,
  VerifyEmailRequest,
  ApiKeyCreateRequest,
  ApiKey,
} from './auth.js';

// ─── Project ─────────────────────────────────────────────────────────────────
export type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectWithDeployments,
} from './project.js';

// ─── Deployment ──────────────────────────────────────────────────────────────
export type {
  Deployment,
  DeploymentLog,
  CreateDeploymentRequest,
  DeploymentWithProject,
} from './deployment.js';

// ─── Server ──────────────────────────────────────────────────────────────────
export type {
  ServerNode,
  ServerHealthResponse,
  RegisterNodeRequest,
} from './server.js';

// ─── Billing ─────────────────────────────────────────────────────────────────
export type {
  Plan,
  Subscription,
  Invoice,
  InvoiceItem,
  Payment,
  Order,
  CreateSubscriptionRequest,
  CreatePaymentRequest,
} from './billing.js';

// ─── WordPress ───────────────────────────────────────────────────────────────
export type {
  WordPressSite,
  Backup,
  CreateWordPressSiteRequest,
  RestoreBackupRequest,
  FileEntry,
} from './wordpress.js';

// ─── Domain ──────────────────────────────────────────────────────────────────
export type {
  Domain,
  DNSRecord,
  DomainAvailabilityResponse,
  RegisterDomainRequest,
  CreateDNSRecordRequest,
} from './domain.js';

// ─── Notification ────────────────────────────────────────────────────────────
export type {
  Notification,
  SupportTicket,
  CreateSupportTicketRequest,
  SupportTicketMessage,
} from './notification.js';

// ─── Organization ────────────────────────────────────────────────────────────
export type {
  Organization,
  TeamMember,
  CreateOrganizationRequest,
  InviteTeamMemberRequest,
} from './organization.js';
