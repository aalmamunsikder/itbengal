# ITBengal Platform — Complete API Documentation

> **Document Version:** 1.0.0
> **Last Updated:** 2026-07-04
> **Base URL:** `https://api.itbengal.com/v1`
> **Status:** Production Specification

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Request & Response Conventions](#3-request--response-conventions)
4. [Rate Limiting](#4-rate-limiting)
5. [Error Codes Reference](#5-error-codes-reference)
6. [Data Models (TypeScript Interfaces)](#6-data-models-typescript-interfaces)
7. [Authentication Endpoints](#7-authentication-endpoints)
8. [Users Endpoints](#8-users-endpoints)
9. [Organizations Endpoints](#9-organizations-endpoints)
10. [Teams Endpoints](#10-teams-endpoints)
11. [Projects Endpoints](#11-projects-endpoints)
12. [Applications Endpoints](#12-applications-endpoints)
13. [Deployments Endpoints](#13-deployments-endpoints)
14. [Domains Endpoints](#14-domains-endpoints)
15. [DNS Records Endpoints](#15-dns-records-endpoints)
16. [WordPress Management Endpoints](#16-wordpress-management-endpoints)
17. [Billing Endpoints](#17-billing-endpoints)
18. [Payments Endpoints](#18-payments-endpoints)
19. [Servers (Admin) Endpoints](#19-servers-admin-endpoints)
20. [Admin Endpoints](#20-admin-endpoints)
21. [Notifications Endpoints](#21-notifications-endpoints)
22. [Support Tickets Endpoints](#22-support-tickets-endpoints)
23. [API Keys Endpoints](#23-api-keys-endpoints)
24. [Webhooks](#24-webhooks)
25. [Authentication Flow Diagrams](#25-authentication-flow-diagrams)
26. [API Versioning Strategy](#26-api-versioning-strategy)

---

## 1. API Overview

The ITBengal API is a RESTful interface providing programmatic access to the ITBengal hosting platform. It enables management of applications, deployments, domains, DNS, WordPress sites, billing, and all administrative operations.

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.itbengal.com/v1` |
| **Protocol** | HTTPS (TLS 1.2+ required) |
| **Content Type** | `application/json` (unless noted for file uploads) |
| **Character Encoding** | UTF-8 |
| **API Versioning** | URL path-based (`/v1`, `/v2`) |
| **Date Format** | ISO 8601 (`2026-07-04T10:53:10Z`) |
| **ID Format** | UUID v4 (`550e8400-e29b-41d4-a716-446655440000`) |
| **Currency** | BDT (Bangladesh Taka), USD |

### HTTP Methods

| Method | Usage |
|--------|-------|
| `GET` | Retrieve resources |
| `POST` | Create resources or trigger actions |
| `PATCH` | Partial update of resources |
| `PUT` | Full replacement of resources |
| `DELETE` | Remove resources |

---

## 2. Authentication & Authorization

### 2.1 Bearer Token Authentication (User Sessions)

All authenticated endpoints require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

| Token Type | Lifetime | Storage |
|-----------|----------|---------|
| Access Token | 15 minutes | Memory / HTTP-only cookie |
| Refresh Token | 7 days | HTTP-only secure cookie |

### 2.2 API Key Authentication (Server-to-Server)

For programmatic / CI-CD integrations, use the `X-API-Key` header:

```
X-API-Key: itb_live_k1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6
```

API keys are scoped with granular permissions and can be created from the dashboard or via the API Keys endpoints.

### 2.3 Role-Based Access Control (RBAC)

| Role | Scope | Permissions |
|------|-------|-------------|
| `super_admin` | Platform | Full platform access |
| `admin` | Platform | Platform management (no billing config) |
| `support_agent` | Platform | Support tickets and customer read |
| `owner` | Organization | Full organization access |
| `admin` | Organization | Manage members, projects, billing |
| `developer` | Organization | Manage projects, deploy |
| `viewer` | Organization | Read-only access |
| `billing` | Organization | Billing and invoices only |

---

## 3. Request & Response Conventions

### 3.1 Success Response Envelope

All successful responses follow this structure:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "req_a1b2c3d4e5",
    "timestamp": "2026-07-04T10:53:10Z"
  }
}
```

### 3.2 Error Response Envelope

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials provided.",
    "details": [
      {
        "field": "email",
        "message": "Email address not found."
      }
    ]
  },
  "meta": {
    "requestId": "req_a1b2c3d4e5",
    "timestamp": "2026-07-04T10:53:10Z"
  }
}
```

### 3.3 Cursor-Based Pagination

List endpoints support cursor-based pagination for consistent results during concurrent writes.

**Request Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | `string` | `null` | Opaque cursor from previous response |
| `limit` | `integer` | `20` | Items per page (max: 100) |

**Response Meta:**

```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "pagination": {
      "cursor": "eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9",
      "limit": 20,
      "hasMore": true,
      "total": 156
    }
  }
}
```

### 3.4 Filtering

Filter via query parameters. Multiple filters use AND logic:

```
GET /projects?type=react&status=active&org_id=org_123
```

### 3.5 Sorting

```
GET /projects?sort=created_at&order=desc
```

| Parameter | Values | Default |
|-----------|--------|---------|
| `sort` | Any sortable field (e.g., `created_at`, `name`, `updated_at`) | `created_at` |
| `order` | `asc`, `desc` | `desc` |

### 3.6 Search

Full-text search via the `search` or `q` query parameter:

```
GET /projects?search=my-portfolio
```

---

## 4. Rate Limiting

### 4.1 Response Headers

Every response includes rate limiting headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait (only on 429 responses) |

### 4.2 Default Limits

| Context | Limit | Window |
|---------|-------|--------|
| Authenticated user | 100 requests | 1 minute |
| Unauthenticated | 20 requests | 1 minute |
| API Key | 200 requests | 1 minute |
| Login/Register | 5 requests | 1 minute |
| Password reset | 3 requests | 15 minutes |
| Deployment trigger | 10 requests | 1 minute |
| Domain search | 30 requests | 1 minute |
| File upload | 10 requests | 1 minute |
| Admin endpoints | 200 requests | 1 minute |
| Webhook delivery | 1000 events | 1 minute |

### 4.3 Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_001",
    "message": "Rate limit exceeded. Please retry after 45 seconds.",
    "details": []
  }
}
```

HTTP Status: `429 Too Many Requests`

---

## 5. Error Codes Reference

### 5.1 Authentication Errors (AUTH_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 401 | `AUTH_001` | Invalid credentials (email or password incorrect) |
| 401 | `AUTH_002` | Access token expired |
| 401 | `AUTH_003` | Invalid or malformed access token |
| 401 | `AUTH_004` | Refresh token expired or revoked |
| 401 | `AUTH_005` | API key invalid or revoked |
| 403 | `AUTH_006` | Email not verified |
| 403 | `AUTH_007` | Account suspended |
| 403 | `AUTH_008` | Account deactivated |
| 403 | `AUTH_009` | 2FA verification required |
| 400 | `AUTH_010` | Invalid 2FA code |
| 400 | `AUTH_011` | 2FA already enabled |
| 400 | `AUTH_012` | 2FA not enabled |
| 409 | `AUTH_013` | Email already registered |
| 400 | `AUTH_014` | Password reset token invalid or expired |
| 400 | `AUTH_015` | Email verification token invalid or expired |
| 403 | `AUTH_016` | Insufficient permissions for this action |
| 403 | `AUTH_017` | API key lacks required scope |

### 5.2 Validation Errors (VAL_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VAL_001` | Request body validation failed |
| 400 | `VAL_002` | Invalid email format |
| 400 | `VAL_003` | Password does not meet requirements |
| 400 | `VAL_004` | Required field missing |
| 400 | `VAL_005` | Invalid UUID format |
| 400 | `VAL_006` | Invalid query parameter |
| 400 | `VAL_007` | File size exceeds maximum allowed |
| 400 | `VAL_008` | Unsupported file type |
| 400 | `VAL_009` | Invalid date format |
| 400 | `VAL_010` | Value out of allowed range |

### 5.3 Resource Errors (RES_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 404 | `RES_001` | Resource not found |
| 409 | `RES_002` | Resource already exists |
| 409 | `RES_003` | Resource name conflict |
| 423 | `RES_004` | Resource is locked |
| 410 | `RES_005` | Resource has been deleted |

### 5.4 Billing Errors (BIL_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 402 | `BIL_001` | Payment required |
| 402 | `BIL_002` | Subscription expired |
| 400 | `BIL_003` | Invalid plan for upgrade/downgrade |
| 400 | `BIL_004` | Coupon code invalid or expired |
| 400 | `BIL_005` | Coupon already redeemed |
| 409 | `BIL_006` | Active subscription already exists for this resource |
| 400 | `BIL_007` | Refund window expired |
| 400 | `BIL_008` | Insufficient account balance |
| 402 | `BIL_009` | Payment method declined |
| 400 | `BIL_010` | Invoice already paid |

### 5.5 Deployment Errors (DEP_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `DEP_001` | Build failed |
| 400 | `DEP_002` | Invalid deployment source |
| 400 | `DEP_003` | Git repository not accessible |
| 400 | `DEP_004` | Branch not found |
| 409 | `DEP_005` | Deployment already in progress |
| 400 | `DEP_006` | Deployment cancelled |
| 400 | `DEP_007` | Rollback target not found |
| 503 | `DEP_008` | No available deployment nodes |
| 400 | `DEP_009` | Build minutes quota exceeded |
| 408 | `DEP_010` | Build timeout exceeded |

### 5.6 Domain Errors (DOM_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `DOM_001` | Domain not available for registration |
| 400 | `DOM_002` | Invalid domain name format |
| 400 | `DOM_003` | Domain transfer failed — auth code invalid |
| 409 | `DOM_004` | Domain already registered on this account |
| 400 | `DOM_005` | Domain is locked — unlock before transfer |
| 400 | `DOM_006` | TLD not supported |
| 400 | `DOM_007` | Domain renewal failed |
| 400 | `DOM_008` | Nameserver update failed |
| 404 | `DOM_009` | Domain not found in account |

### 5.7 DNS Errors (DNS_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `DNS_001` | Invalid DNS record type |
| 400 | `DNS_002` | Invalid DNS record value |
| 409 | `DNS_003` | Conflicting DNS record exists |
| 400 | `DNS_004` | CNAME record conflicts with existing records |
| 400 | `DNS_005` | Invalid TTL value |

### 5.8 WordPress Errors (WP_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `WP_001` | WordPress installation failed |
| 400 | `WP_002` | Backup creation failed |
| 400 | `WP_003` | Backup restore failed |
| 400 | `WP_004` | Staging environment creation failed |
| 409 | `WP_005` | Staging environment already exists |
| 400 | `WP_006` | Malware scan in progress |
| 400 | `WP_007` | File operation failed |
| 400 | `WP_008` | WordPress update failed |
| 400 | `WP_009` | Database operation failed |
| 400 | `WP_010` | Clone operation failed |

### 5.9 Server Errors (SRV_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 503 | `SRV_001` | Server unreachable |
| 503 | `SRV_002` | Server in maintenance mode |
| 500 | `SRV_003` | Internal server error |
| 503 | `SRV_004` | Server capacity exceeded |
| 504 | `SRV_005` | Gateway timeout |

### 5.10 Rate Limit Errors (RATE_xxx)

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 429 | `RATE_001` | Rate limit exceeded |
| 429 | `RATE_002` | Too many login attempts |

---

## 6. Data Models (TypeScript Interfaces)

### 6.1 Common Types

```typescript
type UUID = string;
type ISODateTime = string; // ISO 8601
type Email = string;
type URL = string;

interface Timestamp {
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

interface PaginationMeta {
  cursor: string | null;
  limit: number;
  hasMore: boolean;
  total: number;
}

interface ApiResponse<T> {
  success: true;
  data: T;
  meta: {
    requestId: string;
    timestamp: ISODateTime;
    pagination?: PaginationMeta;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details: Array<{
      field?: string;
      message: string;
    }>;
  };
  meta: {
    requestId: string;
    timestamp: ISODateTime;
  };
}

type PaginatedResponse<T> = ApiResponse<T[]>;
```

### 6.2 User

```typescript
interface User extends Timestamp {
  id: UUID;
  email: Email;
  name: string;
  avatar_url: URL | null;
  phone: string | null;
  country: string;               // ISO 3166-1 alpha-2
  timezone: string;              // IANA timezone
  email_verified: boolean;
  two_factor_enabled: boolean;
  status: 'active' | 'suspended' | 'deactivated';
  role: 'user' | 'admin' | 'super_admin';
  last_login_at: ISODateTime | null;
  last_login_ip: string | null;
}
```

### 6.3 Organization

```typescript
interface Organization extends Timestamp {
  id: UUID;
  name: string;
  slug: string;
  logo_url: URL | null;
  owner_id: UUID;
  billing_email: Email;
  country: string;
  plan_id: UUID | null;
  member_count: number;
  project_count: number;
}

interface OrganizationMember extends Timestamp {
  id: UUID;
  user_id: UUID;
  organization_id: UUID;
  role: 'owner' | 'admin' | 'developer' | 'viewer' | 'billing';
  status: 'active' | 'invited' | 'suspended';
  invited_by: UUID | null;
  invited_at: ISODateTime | null;
  accepted_at: ISODateTime | null;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'>;
}
```

### 6.4 Team

```typescript
interface Team extends Timestamp {
  id: UUID;
  organization_id: UUID;
  name: string;
  slug: string;
  description: string | null;
  member_count: number;
  project_ids: UUID[];
}

interface TeamMember extends Timestamp {
  id: UUID;
  team_id: UUID;
  user_id: UUID;
  role: 'lead' | 'member';
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'>;
}
```

### 6.5 Project

```typescript
interface Project extends Timestamp {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  type: 'react' | 'wordpress';
  status: 'active' | 'archived' | 'suspended';
  owner_type: 'user' | 'organization';
  owner_id: UUID;
  organization_id: UUID | null;
  team_id: UUID | null;
  application_count: number;
  region: string;
}
```

### 6.6 Application

```typescript
interface Application extends Timestamp {
  id: UUID;
  project_id: UUID;
  name: string;
  slug: string;
  framework: 'react' | 'nextjs' | 'vue' | 'angular' | 'svelte' | 'astro' | 'vite' | 'html' | 'wordpress';
  status: 'running' | 'stopped' | 'deploying' | 'failed' | 'suspended';
  git_provider: 'github' | 'gitlab' | 'bitbucket' | null;
  git_repo_url: URL | null;
  git_branch: string | null;
  auto_deploy: boolean;
  custom_domain: string | null;
  default_domain: string;           // e.g., app-slug.itbengal.app
  server_id: UUID;
  node_id: UUID;
  container_id: string | null;
  ssl_status: 'active' | 'pending' | 'expired' | 'none';
  last_deployed_at: ISODateTime | null;
  env_var_count: number;
  build_command: string | null;
  output_directory: string | null;
  install_command: string | null;
  node_version: string | null;
  root_directory: string;
}
```

### 6.7 Deployment

```typescript
interface Deployment extends Timestamp {
  id: UUID;
  application_id: UUID;
  status: 'queued' | 'building' | 'deploying' | 'live' | 'failed' | 'cancelled' | 'rolled_back';
  source: 'git' | 'zip' | 'rollback' | 'redeploy';
  git_commit_sha: string | null;
  git_commit_message: string | null;
  git_branch: string | null;
  triggered_by: UUID;
  build_duration_ms: number | null;
  deploy_duration_ms: number | null;
  build_logs_url: URL | null;
  deploy_logs_url: URL | null;
  error_message: string | null;
  is_current: boolean;
  node_id: UUID;
  container_id: string | null;
  rollback_from_id: UUID | null;
}
```

### 6.8 Domain

```typescript
interface Domain extends Timestamp {
  id: UUID;
  user_id: UUID;
  domain_name: string;
  tld: string;
  status: 'active' | 'pending' | 'expired' | 'transferring' | 'suspended';
  registrar: string;                  // 'openprovider'
  registration_date: ISODateTime;
  expiry_date: ISODateTime;
  auto_renew: boolean;
  nameservers: string[];
  whois_privacy: boolean;
  is_locked: boolean;
  connected_application_id: UUID | null;
  dns_zone_id: UUID | null;
  ssl_status: 'active' | 'pending' | 'expired' | 'none';
  openprovider_id: string;
}
```

### 6.9 DNS Record

```typescript
interface DnsRecord extends Timestamp {
  id: UUID;
  domain_id: UUID;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA';
  name: string;                       // e.g., '@', 'www', 'mail'
  value: string;
  ttl: number;                        // seconds, default 3600
  priority: number | null;            // for MX, SRV
  weight: number | null;              // for SRV
  port: number | null;                // for SRV
  tag: string | null;                 // for CAA (issue, issuewild, iodef)
  is_managed: boolean;                // true if auto-managed by platform
}
```

### 6.10 WordPress Site

```typescript
interface WordPressSite extends Timestamp {
  id: UUID;
  project_id: UUID;
  user_id: UUID;
  site_name: string;
  domain: string;
  status: 'active' | 'installing' | 'suspended' | 'maintenance';
  wp_version: string;
  php_version: string;
  admin_url: URL;
  admin_username: string;
  server_id: UUID;
  node_id: UUID;
  disk_usage_mb: number;
  database_size_mb: number;
  ssl_status: 'active' | 'pending' | 'expired' | 'none';
  caching_enabled: boolean;
  auto_updates_enabled: boolean;
  staging_site_id: UUID | null;
  last_backup_at: ISODateTime | null;
  last_malware_scan_at: ISODateTime | null;
  malware_status: 'clean' | 'infected' | 'scanning' | 'unknown';
}
```

### 6.11 Plan

```typescript
interface Plan extends Timestamp {
  id: UUID;
  name: string;                       // e.g., 'Starter', 'Professional'
  slug: string;
  type: 'react' | 'wordpress';
  tier: 'starter' | 'basic' | 'professional' | 'business' | 'enterprise';
  price_monthly_bdt: number;
  price_monthly_usd: number;
  price_yearly_bdt: number;
  price_yearly_usd: number;
  features: {
    cpu_cores: number;
    ram_mb: number;
    storage_gb: number;
    bandwidth_gb: number;
    projects: number;                  // -1 for unlimited
    custom_domains: number;
    backups_per_day: number;
    build_minutes: number;
    deployments_per_day: number;
    team_members: number;
    ssl: boolean;
    priority_support: boolean;
    priority_build_queue: boolean;
    log_retention_days: number;
    staging_environments: number;
  };
  is_active: boolean;
  sort_order: number;
}
```

### 6.12 Subscription

```typescript
interface Subscription extends Timestamp {
  id: UUID;
  user_id: UUID;
  organization_id: UUID | null;
  plan_id: UUID;
  resource_type: 'application' | 'wordpress_site' | 'domain';
  resource_id: UUID;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: ISODateTime;
  current_period_end: ISODateTime;
  cancel_at_period_end: boolean;
  cancelled_at: ISODateTime | null;
  trial_start: ISODateTime | null;
  trial_end: ISODateTime | null;
  amount_bdt: number;
  amount_usd: number;
  currency: 'BDT' | 'USD';
}
```

### 6.13 Invoice

```typescript
interface Invoice extends Timestamp {
  id: UUID;
  user_id: UUID;
  subscription_id: UUID | null;
  invoice_number: string;             // e.g., 'INV-2026-00001'
  status: 'draft' | 'open' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  amount: number;
  tax: number;
  discount: number;
  total: number;
  currency: 'BDT' | 'USD';
  due_date: ISODateTime;
  paid_at: ISODateTime | null;
  payment_id: UUID | null;
  line_items: InvoiceLineItem[];
  pdf_url: URL | null;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}
```

### 6.14 Payment

```typescript
interface Payment extends Timestamp {
  id: UUID;
  user_id: UUID;
  invoice_id: UUID | null;
  amount: number;
  currency: 'BDT' | 'USD';
  gateway: 'bkash' | 'nagad' | 'rocket' | 'stripe' | 'paypal';
  gateway_transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  method: 'mobile_wallet' | 'card' | 'bank_transfer' | 'paypal';
  refund_amount: number | null;
  refund_reason: string | null;
  refunded_at: ISODateTime | null;
  metadata: Record<string, any>;
}
```

### 6.15 Server & Server Node

```typescript
interface Server extends Timestamp {
  id: UUID;
  name: string;
  hostname: string;
  ip_address: string;
  type: 'platform' | 'react_hosting' | 'wordpress_hosting' | 'database' | 'redis' | 'monitoring' | 'backup';
  status: 'active' | 'maintenance' | 'offline' | 'decommissioned';
  region: string;
  provider: string;
  specs: {
    cpu_cores: number;
    ram_gb: number;
    storage_gb: number;
    bandwidth_gb: number;
  };
  load: {
    cpu_percent: number;
    ram_percent: number;
    disk_percent: number;
    active_containers: number;
  };
  max_applications: number;
  current_applications: number;
}

interface ServerNode extends Timestamp {
  id: UUID;
  server_id: UUID;
  node_type: 'react' | 'wordpress' | 'worker';
  status: 'active' | 'draining' | 'offline';
  capacity: number;
  current_load: number;
}
```

### 6.16 Notification

```typescript
interface Notification extends Timestamp {
  id: UUID;
  user_id: UUID;
  type: 'deployment' | 'billing' | 'security' | 'domain' | 'wordpress' | 'support' | 'system' | 'announcement';
  title: string;
  message: string;
  is_read: boolean;
  read_at: ISODateTime | null;
  action_url: URL | null;
  metadata: Record<string, any>;
}
```

### 6.17 Support Ticket

```typescript
interface SupportTicket extends Timestamp {
  id: UUID;
  user_id: UUID;
  ticket_number: string;             // e.g., 'TKT-2026-00001'
  subject: string;
  category: 'billing' | 'technical' | 'domain' | 'wordpress' | 'deployment' | 'account' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'waiting_staff' | 'resolved' | 'closed';
  assigned_to: UUID | null;
  related_resource_type: string | null;
  related_resource_id: UUID | null;
  message_count: number;
  last_reply_at: ISODateTime | null;
  resolved_at: ISODateTime | null;
  closed_at: ISODateTime | null;
}

interface TicketMessage extends Timestamp {
  id: UUID;
  ticket_id: UUID;
  sender_id: UUID;
  sender_type: 'customer' | 'staff' | 'system';
  body: string;
  attachments: TicketAttachment[];
}

interface TicketAttachment {
  id: UUID;
  filename: string;
  url: URL;
  size_bytes: number;
  mime_type: string;
}
```

### 6.18 Audit Log

```typescript
interface AuditLog extends Timestamp {
  id: UUID;
  user_id: UUID;
  action: string;                     // e.g., 'user.login', 'project.delete'
  resource_type: string;
  resource_id: UUID;
  ip_address: string;
  user_agent: string;
  changes: Record<string, { old: any; new: any }> | null;
  metadata: Record<string, any>;
}
```

### 6.19 API Key

```typescript
interface ApiKey extends Timestamp {
  id: UUID;
  user_id: UUID;
  name: string;
  key_prefix: string;                // First 8 chars, e.g., 'itb_live'
  permissions: string[];             // e.g., ['deployments:write', 'projects:read']
  last_used_at: ISODateTime | null;
  expires_at: ISODateTime | null;
  is_active: boolean;
}
```

### 6.20 Backup

```typescript
interface Backup extends Timestamp {
  id: UUID;
  resource_type: 'wordpress_site' | 'application';
  resource_id: UUID;
  type: 'manual' | 'automatic' | 'pre_update';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  size_mb: number;
  storage_url: URL;
  expires_at: ISODateTime;
  metadata: {
    wp_version?: string;
    php_version?: string;
    database_size_mb?: number;
    files_count?: number;
  };
}
```

### 6.21 Coupon

```typescript
interface Coupon extends Timestamp {
  id: UUID;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  currency: 'BDT' | 'USD' | null;    // null for percentage
  applies_to: 'all' | 'react' | 'wordpress' | 'domain';
  min_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  valid_from: ISODateTime;
  valid_until: ISODateTime;
  is_active: boolean;
}
```

---

## 7. Authentication Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/auth/register` | Register new user | No | 5/min |
| 2 | POST | `/auth/login` | Login | No | 5/min |
| 3 | POST | `/auth/logout` | Logout | Yes | 100/min |
| 4 | POST | `/auth/refresh` | Refresh access token | No | 10/min |
| 5 | POST | `/auth/forgot-password` | Request password reset | No | 3/15min |
| 6 | POST | `/auth/reset-password` | Reset password | No | 3/15min |
| 7 | POST | `/auth/verify-email` | Verify email | No | 5/min |
| 8 | POST | `/auth/resend-verification` | Resend verification | No | 3/15min |
| 9 | POST | `/auth/2fa/enable` | Enable 2FA | Yes | 5/min |
| 10 | POST | `/auth/2fa/verify` | Verify 2FA code | Yes | 10/min |
| 11 | POST | `/auth/2fa/disable` | Disable 2FA | Yes | 5/min |
| 12 | GET | `/auth/sessions` | List active sessions | Yes | 100/min |
| 13 | DELETE | `/auth/sessions/:id` | Revoke session | Yes | 100/min |

---

#### POST `/auth/register`

Register a new user account.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Full name (2–100 characters) |
| `email` | `string` | Yes | Valid email address |
| `password` | `string` | Yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char |
| `country` | `string` | Yes | ISO 3166-1 alpha-2 country code |
| `phone` | `string` | No | Phone number with country code |
| `timezone` | `string` | No | IANA timezone (default: `Asia/Dhaka`) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Rahim Ahmed",
      "email": "rahim@example.com",
      "avatar_url": null,
      "country": "BD",
      "timezone": "Asia/Dhaka",
      "email_verified": false,
      "two_factor_enabled": false,
      "status": "active",
      "role": "user",
      "created_at": "2026-07-04T10:53:10Z",
      "updated_at": "2026-07-04T10:53:10Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g...",
      "token_type": "Bearer",
      "expires_in": 900
    }
  },
  "meta": {
    "requestId": "req_a1b2c3d4e5",
    "timestamp": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 409 | `AUTH_013` | Email already registered |
| 400 | `VAL_001` | Validation failed |
| 400 | `VAL_002` | Invalid email format |
| 400 | `VAL_003` | Password does not meet requirements |
| 429 | `RATE_001` | Rate limit exceeded |

---

#### POST `/auth/login`

Authenticate user with email and password.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Registered email address |
| `password` | `string` | Yes | Account password |
| `two_factor_code` | `string` | No | 6-digit TOTP code (required if 2FA enabled) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Rahim Ahmed",
      "email": "rahim@example.com",
      "email_verified": true,
      "two_factor_enabled": false,
      "status": "active",
      "role": "user",
      "last_login_at": "2026-07-04T10:53:10Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g...",
      "token_type": "Bearer",
      "expires_in": 900
    }
  }
}
```

**2FA Required Response (200 OK with requires_2fa):**

```json
{
  "success": true,
  "data": {
    "requires_2fa": true,
    "temp_token": "tmp_2fa_a1b2c3d4e5f6..."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 401 | `AUTH_001` | Invalid credentials |
| 403 | `AUTH_006` | Email not verified |
| 403 | `AUTH_007` | Account suspended |
| 403 | `AUTH_009` | 2FA verification required |
| 400 | `AUTH_010` | Invalid 2FA code |
| 429 | `RATE_002` | Too many login attempts |

---

#### POST `/auth/logout`

Invalidate the current access and refresh tokens.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refresh_token` | `string` | No | Refresh token to invalidate (also invalidated from cookie) |
| `all_sessions` | `boolean` | No | If `true`, logout from all devices (default: `false`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 401 | `AUTH_002` | Access token expired |
| 401 | `AUTH_003` | Invalid access token |

---

#### POST `/auth/refresh`

Obtain a new access token using a valid refresh token.

| Property | Value |
|----------|-------|
| **Auth Required** | No (uses refresh token) |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refresh_token` | `string` | Yes | Valid refresh token |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "bmV3IHJlZnJlc2ggdG9rZW4...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 401 | `AUTH_004` | Refresh token expired or revoked |
| 403 | `AUTH_007` | Account suspended |

---

#### POST `/auth/forgot-password`

Send a password reset email.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Rate Limit** | 3 requests / 15 minutes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Registered email address |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a password reset link has been sent."
  }
}
```

> **Security Note:** Always returns 200 regardless of whether email exists to prevent enumeration.

---

#### POST `/auth/reset-password`

Reset password using the token from the reset email.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Rate Limit** | 3 requests / 15 minutes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `string` | Yes | Password reset token from email |
| `password` | `string` | Yes | New password (same requirements as registration) |
| `password_confirmation` | `string` | Yes | Must match `password` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `AUTH_014` | Password reset token invalid or expired |
| 400 | `VAL_003` | Password does not meet requirements |

---

#### POST `/auth/verify-email`

Verify email address using the token from the verification email.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `string` | Yes | Email verification token |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully.",
    "email_verified": true
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `AUTH_015` | Email verification token invalid or expired |

---

#### POST `/auth/resend-verification`

Resend the email verification link.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Rate Limit** | 3 requests / 15 minutes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Email address to resend verification to |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Verification email has been resent."
  }
}
```

---

#### POST `/auth/2fa/enable`

Enable two-factor authentication. Returns a TOTP secret and QR code.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:** None

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code_url": "data:image/png;base64,iVBOR...",
    "backup_codes": [
      "a1b2c3d4",
      "e5f6g7h8",
      "i9j0k1l2",
      "m3n4o5p6",
      "q7r8s9t0"
    ],
    "message": "Scan the QR code and verify with a TOTP code to complete setup."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `AUTH_011` | 2FA already enabled |
| 401 | `AUTH_002` | Access token expired |

---

#### POST `/auth/2fa/verify`

Verify a 2FA TOTP code to complete 2FA enable or to authenticate.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | 6-digit TOTP code |
| `temp_token` | `string` | No | Temporary token from login (if verifying during login) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "2FA verification successful.",
    "two_factor_enabled": true
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `AUTH_010` | Invalid 2FA code |

---

#### POST `/auth/2fa/disable`

Disable two-factor authentication.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Current 6-digit TOTP code or backup code |
| `password` | `string` | Yes | Current account password |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "2FA has been disabled.",
    "two_factor_enabled": false
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `AUTH_010` | Invalid 2FA code |
| 400 | `AUTH_012` | 2FA not enabled |
| 401 | `AUTH_001` | Invalid password |

---

#### GET `/auth/sessions`

List all active sessions for the current user.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "sess_a1b2c3d4",
      "ip_address": "103.45.67.89",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "location": "Dhaka, Bangladesh",
      "is_current": true,
      "last_active_at": "2026-07-04T10:53:10Z",
      "created_at": "2026-07-04T08:00:00Z"
    }
  ]
}
```

---

#### DELETE `/auth/sessions/:id`

Revoke a specific session (remote logout).

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Session ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Session revoked successfully."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 404 | `RES_001` | Session not found |

---

## 8. Users Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | GET | `/users/me` | Get current user profile | Yes | 100/min |
| 2 | PATCH | `/users/me` | Update profile | Yes | 100/min |
| 3 | PUT | `/users/me/password` | Change password | Yes | 5/min |
| 4 | PUT | `/users/me/avatar` | Upload avatar | Yes | 10/min |
| 5 | DELETE | `/users/me` | Delete account | Yes | 5/min |
| 6 | GET | `/users/me/activity` | Get activity log | Yes | 100/min |

---

#### GET `/users/me`

Retrieve the authenticated user's profile.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Rahim Ahmed",
    "email": "rahim@example.com",
    "avatar_url": "https://cdn.itbengal.com/avatars/550e8400.jpg",
    "phone": "+8801700000000",
    "country": "BD",
    "timezone": "Asia/Dhaka",
    "email_verified": true,
    "two_factor_enabled": true,
    "status": "active",
    "role": "user",
    "last_login_at": "2026-07-04T10:53:10Z",
    "created_at": "2026-01-15T08:00:00Z",
    "updated_at": "2026-07-04T10:53:10Z"
  }
}
```

---

#### PATCH `/users/me`

Update the authenticated user's profile.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Request Body (all fields optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Full name |
| `phone` | `string` | No | Phone number |
| `country` | `string` | No | ISO country code |
| `timezone` | `string` | No | IANA timezone |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Rahim Ahmed Updated",
    "email": "rahim@example.com",
    "phone": "+8801700000001",
    "country": "BD",
    "timezone": "Asia/Dhaka",
    "updated_at": "2026-07-04T11:00:00Z"
  }
}
```

---

#### PUT `/users/me/password`

Change the authenticated user's password.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current_password` | `string` | Yes | Current password |
| `new_password` | `string` | Yes | New password (meets password policy) |
| `new_password_confirmation` | `string` | Yes | Must match `new_password` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 401 | `AUTH_001` | Current password is incorrect |
| 400 | `VAL_003` | New password does not meet requirements |

---

#### PUT `/users/me/avatar`

Upload a new avatar image.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |
| **Content Type** | `multipart/form-data` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `avatar` | `file` | Yes | Image file (JPEG, PNG, WebP; max 5MB; min 100x100px) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "avatar_url": "https://cdn.itbengal.com/avatars/550e8400-v2.jpg"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VAL_007` | File size exceeds 5MB |
| 400 | `VAL_008` | Unsupported file type |

---

#### DELETE `/users/me`

Delete the authenticated user's account. This is a soft-delete with 30-day recovery window.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | `string` | Yes | Current password for confirmation |
| `reason` | `string` | No | Optional reason for leaving |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Account scheduled for deletion. You have 30 days to recover it.",
    "deletion_scheduled_at": "2026-08-03T10:53:10Z"
  }
}
```

---

#### GET `/users/me/activity`

Get the authenticated user's activity log.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page (default: 20, max: 100) |
| `action` | `string` | No | Filter by action type |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "log_a1b2c3d4",
      "action": "user.login",
      "ip_address": "103.45.67.89",
      "user_agent": "Mozilla/5.0...",
      "metadata": {},
      "created_at": "2026-07-04T10:53:10Z"
    }
  ],
  "meta": {
    "pagination": {
      "cursor": "eyJpZCI6ImxvZ19hMWIyYzNkNCJ9",
      "limit": 20,
      "hasMore": true,
      "total": 245
    }
  }
}
```

---

## 9. Organizations Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/organizations` | Create organization | Yes | 10/min |
| 2 | GET | `/organizations` | List user's organizations | Yes | 100/min |
| 3 | GET | `/organizations/:orgId` | Get organization details | Yes | 100/min |
| 4 | PATCH | `/organizations/:orgId` | Update organization | Yes | 100/min |
| 5 | DELETE | `/organizations/:orgId` | Delete organization | Yes | 5/min |
| 6 | GET | `/organizations/:orgId/members` | List members | Yes | 100/min |
| 7 | POST | `/organizations/:orgId/members/invite` | Invite member | Yes | 20/min |
| 8 | PATCH | `/organizations/:orgId/members/:userId` | Update member role | Yes | 100/min |
| 9 | DELETE | `/organizations/:orgId/members/:userId` | Remove member | Yes | 100/min |
| 10 | POST | `/organizations/:orgId/members/accept-invite` | Accept invite | Yes | 10/min |

---

#### POST `/organizations`

Create a new organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Organization name (2–100 chars) |
| `slug` | `string` | No | URL slug (auto-generated from name if omitted) |
| `billing_email` | `string` | No | Billing email (defaults to user email) |
| `country` | `string` | No | ISO country code |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "org_550e8400-e29b-41d4",
    "name": "TechBD Solutions",
    "slug": "techbd-solutions",
    "logo_url": null,
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "billing_email": "rahim@example.com",
    "country": "BD",
    "plan_id": null,
    "member_count": 1,
    "project_count": 0,
    "created_at": "2026-07-04T10:53:10Z",
    "updated_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 409 | `RES_003` | Organization slug already taken |
| 400 | `VAL_001` | Validation failed |

---

#### GET `/organizations`

List organizations the authenticated user belongs to.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page (default: 20) |
| `role` | `string` | No | Filter by user's role in org |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "org_550e8400-e29b-41d4",
      "name": "TechBD Solutions",
      "slug": "techbd-solutions",
      "logo_url": null,
      "role": "owner",
      "member_count": 5,
      "project_count": 12,
      "created_at": "2026-07-04T10:53:10Z"
    }
  ],
  "meta": {
    "pagination": {
      "cursor": null,
      "limit": 20,
      "hasMore": false,
      "total": 1
    }
  }
}
```

---

#### GET `/organizations/:orgId`

Get detailed information about an organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (member of org) |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Organization` object.

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 404 | `RES_001` | Organization not found |
| 403 | `AUTH_016` | Not a member of this organization |

---

#### PATCH `/organizations/:orgId`

Update organization details.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner or admin) |
| **Rate Limit** | 100 requests / minute |

**Request Body (all fields optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Organization name |
| `slug` | `string` | No | URL slug |
| `billing_email` | `string` | No | Billing email |
| `country` | `string` | No | ISO country code |

**Response (200 OK):** Returns updated `Organization` object.

---

#### DELETE `/organizations/:orgId`

Delete an organization. Requires owner role. All projects and resources must be deleted first or will be cascade deleted.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner only) |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | `string` | Yes | Owner's password for confirmation |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Organization deleted successfully."
  }
}
```

---

#### GET `/organizations/:orgId/members`

List all members of an organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (member of org) |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `role` | `string` | No | Filter by role |
| `status` | `string` | No | Filter by status (`active`, `invited`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "mem_a1b2c3d4",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "organization_id": "org_550e8400-e29b-41d4",
      "role": "owner",
      "status": "active",
      "invited_by": null,
      "accepted_at": "2026-07-04T10:53:10Z",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Rahim Ahmed",
        "email": "rahim@example.com",
        "avatar_url": "https://cdn.itbengal.com/avatars/550e8400.jpg"
      },
      "created_at": "2026-07-04T10:53:10Z"
    }
  ]
}
```

---

#### POST `/organizations/:orgId/members/invite`

Invite a user to join the organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner or admin) |
| **Rate Limit** | 20 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Email to invite |
| `role` | `string` | Yes | Role to assign: `admin`, `developer`, `viewer`, `billing` |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "mem_e5f6g7h8",
    "email": "karim@example.com",
    "role": "developer",
    "status": "invited",
    "invited_by": "550e8400-e29b-41d4-a716-446655440000",
    "invited_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 409 | `RES_002` | User is already a member |
| 403 | `AUTH_016` | Insufficient permissions |

---

#### PATCH `/organizations/:orgId/members/:userId`

Update a member's role.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner or admin) |
| **Rate Limit** | 100 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | `string` | Yes | New role: `admin`, `developer`, `viewer`, `billing` |

**Response (200 OK):** Returns updated `OrganizationMember` object.

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 403 | `AUTH_016` | Cannot change owner's role |
| 404 | `RES_001` | Member not found |

---

#### DELETE `/organizations/:orgId/members/:userId`

Remove a member from the organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner or admin) |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Member removed successfully."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 403 | `AUTH_016` | Cannot remove organization owner |
| 404 | `RES_001` | Member not found |

---

#### POST `/organizations/:orgId/members/accept-invite`

Accept an invitation to join an organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invite_token` | `string` | Yes | Token from invitation email |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "org_550e8400-e29b-41d4",
      "name": "TechBD Solutions",
      "role": "developer"
    },
    "message": "Invitation accepted successfully."
  }
}
```

---

## 10. Teams Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/organizations/:orgId/teams` | Create team | Yes | 20/min |
| 2 | GET | `/organizations/:orgId/teams` | List teams | Yes | 100/min |
| 3 | GET | `/organizations/:orgId/teams/:teamId` | Get team | Yes | 100/min |
| 4 | PATCH | `/organizations/:orgId/teams/:teamId` | Update team | Yes | 100/min |
| 5 | DELETE | `/organizations/:orgId/teams/:teamId` | Delete team | Yes | 20/min |
| 6 | POST | `/organizations/:orgId/teams/:teamId/members` | Add member | Yes | 20/min |
| 7 | DELETE | `/organizations/:orgId/teams/:teamId/members/:userId` | Remove member | Yes | 20/min |

---

#### POST `/organizations/:orgId/teams`

Create a new team within an organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner or admin) |
| **Rate Limit** | 20 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Team name (2–50 chars) |
| `description` | `string` | No | Team description |
| `member_ids` | `UUID[]` | No | Initial members to add |
| `project_ids` | `UUID[]` | No | Projects to assign |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "team_a1b2c3d4",
    "organization_id": "org_550e8400-e29b-41d4",
    "name": "Frontend Team",
    "slug": "frontend-team",
    "description": "Handles all frontend projects",
    "member_count": 3,
    "project_ids": ["proj_x1y2z3"],
    "created_at": "2026-07-04T10:53:10Z",
    "updated_at": "2026-07-04T10:53:10Z"
  }
}
```

---

#### GET `/organizations/:orgId/teams`

List all teams in an organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (member of org) |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns array of `Team` objects with pagination.

---

#### GET `/organizations/:orgId/teams/:teamId`

Get team details including members.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (member of org) |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns `Team` object with members array included.

---

#### PATCH `/organizations/:orgId/teams/:teamId`

Update team details.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner, admin, or team lead) |
| **Rate Limit** | 100 requests / minute |

**Request Body (all fields optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Team name |
| `description` | `string` | No | Description |
| `project_ids` | `UUID[]` | No | Updated project assignments |

**Response (200 OK):** Returns updated `Team` object.

---

#### DELETE `/organizations/:orgId/teams/:teamId`

Delete a team. Members are not removed from the organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner or admin) |
| **Rate Limit** | 20 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Team deleted successfully."
  }
}
```

---

#### POST `/organizations/:orgId/teams/:teamId/members`

Add a member to a team. The user must already be an organization member.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner, admin, or team lead) |
| **Rate Limit** | 20 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | `UUID` | Yes | Organization member's user ID |
| `role` | `string` | No | `lead` or `member` (default: `member`) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "tm_a1b2c3d4",
    "team_id": "team_a1b2c3d4",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "member",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Karim Hassan",
      "email": "karim@example.com",
      "avatar_url": null
    },
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 409 | `RES_002` | User is already a team member |
| 404 | `RES_001` | User is not a member of the organization |

---

#### DELETE `/organizations/:orgId/teams/:teamId/members/:userId`

Remove a member from a team.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (owner, admin, or team lead) |
| **Rate Limit** | 20 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Member removed from team."
  }
}
```

---

## 11. Projects Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/projects` | Create project | Yes | 20/min |
| 2 | GET | `/projects` | List projects | Yes | 100/min |
| 3 | GET | `/projects/:projectId` | Get project details | Yes | 100/min |
| 4 | PATCH | `/projects/:projectId` | Update project | Yes | 100/min |
| 5 | DELETE | `/projects/:projectId` | Delete project | Yes | 10/min |
| 6 | POST | `/projects/:projectId/transfer` | Transfer ownership | Yes | 5/min |
| 7 | GET | `/projects/:projectId/analytics` | Get analytics | Yes | 100/min |

---

#### POST `/projects`

Create a new project.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 20 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Project name (2–100 chars) |
| `description` | `string` | No | Project description |
| `type` | `string` | Yes | `react` or `wordpress` |
| `organization_id` | `UUID` | No | Assign to organization (null = personal) |
| `team_id` | `UUID` | No | Assign to team |
| `region` | `string` | No | Deployment region (default: `bd-dhaka-1`) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "proj_a1b2c3d4",
    "name": "My Portfolio",
    "slug": "my-portfolio",
    "description": "Personal portfolio website",
    "type": "react",
    "status": "active",
    "owner_type": "user",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_id": null,
    "team_id": null,
    "application_count": 0,
    "region": "bd-dhaka-1",
    "created_at": "2026-07-04T10:53:10Z",
    "updated_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 409 | `RES_003` | Project name conflict |
| 402 | `BIL_001` | Project limit reached for current plan |
| 400 | `VAL_001` | Validation failed |

---

#### GET `/projects`

List user's projects with filtering and search.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page (default: 20, max: 100) |
| `type` | `string` | No | Filter: `react`, `wordpress`, or omit for all |
| `status` | `string` | No | Filter: `active`, `archived`, `suspended` |
| `org_id` | `UUID` | No | Filter by organization |
| `search` | `string` | No | Search by project name |
| `sort` | `string` | No | Sort field (default: `created_at`) |
| `order` | `string` | No | `asc` or `desc` (default: `desc`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "proj_a1b2c3d4",
      "name": "My Portfolio",
      "slug": "my-portfolio",
      "type": "react",
      "status": "active",
      "owner_type": "user",
      "application_count": 1,
      "region": "bd-dhaka-1",
      "created_at": "2026-07-04T10:53:10Z",
      "updated_at": "2026-07-04T10:53:10Z"
    }
  ],
  "meta": {
    "pagination": {
      "cursor": "eyJpZCI6InByb2pfYTFiMmMzZDQifQ==",
      "limit": 20,
      "hasMore": false,
      "total": 1
    }
  }
}
```

---

#### GET `/projects/:projectId`

Get detailed project information.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (project owner or org member) |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Project` object with nested `applications` array.

---

#### PATCH `/projects/:projectId`

Update project details.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (project owner, org admin+) |
| **Rate Limit** | 100 requests / minute |

**Request Body (all optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Project name |
| `description` | `string` | No | Description |
| `status` | `string` | No | `active` or `archived` |

**Response (200 OK):** Returns updated `Project` object.

---

#### DELETE `/projects/:projectId`

Delete a project and all its applications.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (project owner, org owner/admin) |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `confirm` | `boolean` | Yes | Must be `true` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Project and all associated resources have been deleted."
  }
}
```

---

#### POST `/projects/:projectId/transfer`

Transfer project ownership to another user or organization.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (project owner) |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_type` | `string` | Yes | `user` or `organization` |
| `target_id` | `UUID` | Yes | Target user or org ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Project transferred successfully.",
    "new_owner_type": "organization",
    "new_owner_id": "org_550e8400-e29b-41d4"
  }
}
```

---

#### GET `/projects/:projectId/analytics`

Get project analytics data.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | `string` | No | `7d`, `30d`, `90d`, `1y` (default: `30d`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "deployments": {
      "total": 42,
      "successful": 39,
      "failed": 3
    },
    "bandwidth": {
      "total_gb": 15.7,
      "daily_avg_gb": 0.52
    },
    "uptime_percent": 99.98,
    "build_minutes_used": 128,
    "requests": {
      "total": 145230,
      "daily_avg": 4841
    }
  }
}
```

---

## 12. Applications Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/projects/:projectId/applications` | Create application | Yes | 10/min |
| 2 | GET | `/projects/:projectId/applications` | List applications | Yes | 100/min |
| 3 | GET | `/applications/:appId` | Get application details | Yes | 100/min |
| 4 | PATCH | `/applications/:appId` | Update application | Yes | 100/min |
| 5 | DELETE | `/applications/:appId` | Delete application | Yes | 5/min |
| 6 | POST | `/applications/:appId/restart` | Restart application | Yes | 10/min |
| 7 | GET | `/applications/:appId/settings` | Get settings | Yes | 100/min |
| 8 | PATCH | `/applications/:appId/settings` | Update settings | Yes | 100/min |
| 9 | GET | `/applications/:appId/env` | List env vars | Yes | 100/min |
| 10 | POST | `/applications/:appId/env` | Add env var | Yes | 100/min |
| 11 | PATCH | `/applications/:appId/env/:envId` | Update env var | Yes | 100/min |
| 12 | DELETE | `/applications/:appId/env/:envId` | Delete env var | Yes | 100/min |
| 13 | POST | `/applications/:appId/env/bulk` | Bulk set env vars | Yes | 20/min |
| 14 | GET | `/applications/:appId/metrics` | Get metrics | Yes | 100/min |

---

#### POST `/projects/:projectId/applications`

Create a new application within a project.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Application name |
| `framework` | `string` | Yes | `react`, `nextjs`, `vue`, `angular`, `svelte`, `astro`, `vite`, `html` |
| `git_provider` | `string` | No | `github`, `gitlab`, `bitbucket` |
| `git_repo_url` | `string` | No | Repository URL |
| `git_branch` | `string` | No | Branch to deploy (default: `main`) |
| `auto_deploy` | `boolean` | No | Auto-deploy on push (default: `true`) |
| `build_command` | `string` | No | Build command (e.g., `npm run build`) |
| `output_directory` | `string` | No | Build output dir (e.g., `dist`, `.next`) |
| `install_command` | `string` | No | Install command (default: `npm install`) |
| `node_version` | `string` | No | Node.js version (default: `20`) |
| `root_directory` | `string` | No | Root dir in repo (default: `/`) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "app_x1y2z3",
    "project_id": "proj_a1b2c3d4",
    "name": "portfolio-frontend",
    "slug": "portfolio-frontend",
    "framework": "react",
    "status": "stopped",
    "git_provider": "github",
    "git_repo_url": "https://github.com/rahim/portfolio",
    "git_branch": "main",
    "auto_deploy": true,
    "custom_domain": null,
    "default_domain": "portfolio-frontend-a1b2c3.itbengal.app",
    "ssl_status": "pending",
    "build_command": "npm run build",
    "output_directory": "dist",
    "install_command": "npm install",
    "node_version": "20",
    "root_directory": "/",
    "env_var_count": 0,
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 402 | `BIL_001` | Application limit reached for plan |
| 400 | `DEP_003` | Git repository not accessible |

---

#### GET `/projects/:projectId/applications`

List applications in a project.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `status` | `string` | No | Filter by status |
| `framework` | `string` | No | Filter by framework |

**Response (200 OK):** Returns paginated array of `Application` objects.

---

#### GET `/applications/:appId`

Get detailed application information.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Application` object.

---

#### PATCH `/applications/:appId`

Update application configuration.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Request Body (all optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Application name |
| `git_branch` | `string` | No | Deploy branch |
| `auto_deploy` | `boolean` | No | Toggle auto-deploy |
| `build_command` | `string` | No | Build command |
| `output_directory` | `string` | No | Output directory |
| `install_command` | `string` | No | Install command |
| `node_version` | `string` | No | Node.js version |
| `root_directory` | `string` | No | Root directory |

**Response (200 OK):** Returns updated `Application` object.

---

#### DELETE `/applications/:appId`

Delete an application and all its deployments.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Application and all deployments deleted."
  }
}
```

---

#### POST `/applications/:appId/restart`

Restart the application container.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Application restart initiated.",
    "status": "restarting"
  }
}
```

---

#### GET `/applications/:appId/settings`

Get application settings.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "framework": "react",
    "node_version": "20",
    "build_command": "npm run build",
    "install_command": "npm install",
    "output_directory": "dist",
    "root_directory": "/",
    "auto_deploy": true,
    "git_branch": "main",
    "custom_headers": {},
    "redirects": [],
    "rewrites": []
  }
}
```

---

#### PATCH `/applications/:appId/settings`

Update application settings.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Request Body (all optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `custom_headers` | `object` | No | Custom HTTP headers |
| `redirects` | `array` | No | Redirect rules |
| `rewrites` | `array` | No | Rewrite rules |

**Response (200 OK):** Returns updated settings object.

---

#### GET `/applications/:appId/env`

List all environment variables (values masked).

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "env_a1b2c3d4",
      "key": "DATABASE_URL",
      "value": "post****5432/mydb",
      "target": "production",
      "created_at": "2026-07-04T10:53:10Z",
      "updated_at": "2026-07-04T10:53:10Z"
    },
    {
      "id": "env_e5f6g7h8",
      "key": "API_SECRET",
      "value": "sk_l****n5o6",
      "target": "production",
      "created_at": "2026-07-04T10:53:10Z",
      "updated_at": "2026-07-04T10:53:10Z"
    }
  ]
}
```

---

#### POST `/applications/:appId/env`

Add a new environment variable.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Variable name (uppercase, no spaces) |
| `value` | `string` | Yes | Variable value |
| `target` | `string` | No | `production`, `preview`, `all` (default: `production`) |

**Response (201 Created):** Returns created env var (value masked).

---

#### PATCH `/applications/:appId/env/:envId`

Update an environment variable.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | `string` | No | New value |
| `target` | `string` | No | New target environment |

**Response (200 OK):** Returns updated env var.

---

#### DELETE `/applications/:appId/env/:envId`

Delete an environment variable.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Environment variable deleted."
  }
}
```

---

#### POST `/applications/:appId/env/bulk`

Set multiple environment variables at once. Existing keys are updated, new keys are created.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 20 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `variables` | `array` | Yes | Array of `{ key, value, target }` objects |
| `overwrite` | `boolean` | No | Overwrite existing keys (default: `true`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "created": 3,
    "updated": 2,
    "total": 5
  }
}
```

---

#### GET `/applications/:appId/metrics`

Get application resource metrics.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | `string` | No | `1h`, `6h`, `24h`, `7d`, `30d` (default: `24h`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "cpu": {
      "current_percent": 12.5,
      "avg_percent": 8.3,
      "max_percent": 45.2
    },
    "memory": {
      "current_mb": 128,
      "avg_mb": 112,
      "max_mb": 256,
      "limit_mb": 512
    },
    "disk": {
      "used_mb": 450,
      "limit_mb": 1024
    },
    "network": {
      "inbound_mb": 234,
      "outbound_mb": 1890
    },
    "requests": {
      "total": 14523,
      "avg_response_time_ms": 45,
      "error_rate_percent": 0.3
    }
  }
}
```

---

## 13. Deployments Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/applications/:appId/deployments` | Trigger deployment | Yes | 10/min |
| 2 | GET | `/applications/:appId/deployments` | List deployments | Yes | 100/min |
| 3 | GET | `/deployments/:deploymentId` | Get deployment details | Yes | 100/min |
| 4 | POST | `/deployments/:deploymentId/rollback` | Rollback | Yes | 10/min |
| 5 | POST | `/deployments/:deploymentId/cancel` | Cancel deployment | Yes | 10/min |
| 6 | POST | `/deployments/:deploymentId/redeploy` | Redeploy | Yes | 10/min |
| 7 | GET | `/deployments/:deploymentId/logs` | Get logs (HTTP) | Yes | 100/min |
| 8 | WS | `/deployments/:deploymentId/logs/stream` | Stream logs (WebSocket) | Yes | N/A |

---

#### POST `/applications/:appId/deployments`

Trigger a new deployment.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body (Git Deploy):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | `string` | Yes | `git` |
| `branch` | `string` | No | Branch to deploy (default: app's configured branch) |
| `commit_sha` | `string` | No | Specific commit SHA (defaults to HEAD) |

**Request Body (ZIP Upload):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | `string` | Yes | `zip` |
| `file` | `file` | Yes | ZIP file (multipart/form-data, max 500MB) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "dep_a1b2c3d4",
    "application_id": "app_x1y2z3",
    "status": "queued",
    "source": "git",
    "git_commit_sha": "abc123def456",
    "git_commit_message": "Update homepage design",
    "git_branch": "main",
    "triggered_by": "550e8400-e29b-41d4-a716-446655440000",
    "is_current": false,
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 409 | `DEP_005` | Deployment already in progress |
| 400 | `DEP_003` | Git repository not accessible |
| 400 | `DEP_004` | Branch not found |
| 400 | `DEP_009` | Build minutes quota exceeded |
| 503 | `DEP_008` | No available deployment nodes |

---

#### GET `/applications/:appId/deployments`

List deployments for an application.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `status` | `string` | No | Filter by status |

**Response (200 OK):** Returns paginated array of `Deployment` objects.

---

#### GET `/deployments/:deploymentId`

Get detailed deployment information.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Deployment` object.

---

#### POST `/deployments/:deploymentId/rollback`

Rollback to a previous deployment.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "dep_e5f6g7h8",
    "status": "queued",
    "source": "rollback",
    "rollback_from_id": "dep_a1b2c3d4",
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `DEP_007` | Rollback target not found or invalid |
| 409 | `DEP_005` | Deployment already in progress |

---

#### POST `/deployments/:deploymentId/cancel`

Cancel a running deployment.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "dep_a1b2c3d4",
    "status": "cancelled",
    "message": "Deployment cancelled."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `DEP_006` | Deployment cannot be cancelled (already completed) |

---

#### POST `/deployments/:deploymentId/redeploy`

Redeploy using the same source and config.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (201 Created):** Returns new `Deployment` object with `source: "redeploy"`.

---

#### GET `/deployments/:deploymentId/logs`

Get build and deployment logs via HTTP.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `string` | No | `build`, `deploy`, or `all` (default: `all`) |
| `since` | `string` | No | ISO timestamp to get logs after |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "deployment_id": "dep_a1b2c3d4",
    "logs": [
      {
        "timestamp": "2026-07-04T10:53:10Z",
        "phase": "build",
        "level": "info",
        "message": "Installing dependencies..."
      },
      {
        "timestamp": "2026-07-04T10:53:25Z",
        "phase": "build",
        "level": "info",
        "message": "Build completed successfully."
      },
      {
        "timestamp": "2026-07-04T10:53:30Z",
        "phase": "deploy",
        "level": "info",
        "message": "Starting container..."
      }
    ]
  }
}
```

---

#### WS `/deployments/:deploymentId/logs/stream`

Stream deployment logs in real-time via WebSocket.

**Connection URL:**
```
wss://api.itbengal.com/v1/deployments/:deploymentId/logs/stream?token=<access_token>
```

**Authentication:** Pass JWT access token via `token` query parameter.

**Server → Client Messages:**

```json
{
  "type": "log",
  "data": {
    "timestamp": "2026-07-04T10:53:10Z",
    "phase": "build",
    "level": "info",
    "message": "npm install completed in 12.5s"
  }
}
```

```json
{
  "type": "status_change",
  "data": {
    "status": "deploying",
    "timestamp": "2026-07-04T10:53:30Z"
  }
}
```

```json
{
  "type": "complete",
  "data": {
    "status": "live",
    "deployment_url": "https://portfolio-frontend-a1b2c3.itbengal.app",
    "duration_ms": 45000
  }
}
```

```json
{
  "type": "error",
  "data": {
    "status": "failed",
    "error_message": "Build failed: Module not found 'react-router'",
    "phase": "build"
  }
}
```

**Client → Server Messages:**

```json
{
  "type": "ping"
}
```

**Connection Lifecycle:**
1. Client connects with valid token
2. Server sends existing logs as `log` messages
3. Server streams new log entries as they occur
4. Server sends `status_change` on deployment phase transitions
5. Server sends `complete` or `error` when deployment finishes
6. Connection closes after deployment completes

---

## 14. Domains Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | GET | `/domains/search` | Search availability | Yes | 30/min |
| 2 | POST | `/domains/register` | Register domain | Yes | 10/min |
| 3 | POST | `/domains/transfer` | Transfer domain | Yes | 5/min |
| 4 | GET | `/domains` | List domains | Yes | 100/min |
| 5 | GET | `/domains/:domainId` | Get domain details | Yes | 100/min |
| 6 | POST | `/domains/:domainId/renew` | Renew domain | Yes | 5/min |
| 7 | PATCH | `/domains/:domainId/nameservers` | Update nameservers | Yes | 10/min |
| 8 | PATCH | `/domains/:domainId/whois-privacy` | Toggle WHOIS privacy | Yes | 10/min |
| 9 | POST | `/domains/:domainId/lock` | Lock domain | Yes | 10/min |
| 10 | POST | `/domains/:domainId/unlock` | Unlock domain | Yes | 10/min |
| 11 | GET | `/domains/:domainId/auth-code` | Get auth code | Yes | 5/min |
| 12 | POST | `/domains/:domainId/connect` | Connect to app | Yes | 10/min |

---

#### GET `/domains/search`

Search domain availability via Openprovider API.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 30 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | `string` | Yes | Domain name to search (e.g., `example`) |
| `tlds` | `string` | No | Comma-separated TLDs (default: `com,net,org,io,dev,bd,com.bd`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "domain": "example.com",
      "available": true,
      "premium": false,
      "price": {
        "registration_bdt": 1200,
        "registration_usd": 10.99,
        "renewal_bdt": 1400,
        "renewal_usd": 12.99
      }
    },
    {
      "domain": "example.net",
      "available": true,
      "premium": false,
      "price": {
        "registration_bdt": 1100,
        "registration_usd": 9.99,
        "renewal_bdt": 1300,
        "renewal_usd": 11.99
      }
    },
    {
      "domain": "example.io",
      "available": false,
      "premium": false,
      "price": null
    }
  ]
}
```

---

#### POST `/domains/register`

Register a new domain via Openprovider.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain_name` | `string` | Yes | Full domain (e.g., `example.com`) |
| `period` | `integer` | No | Registration period in years (default: 1) |
| `auto_renew` | `boolean` | No | Enable auto-renewal (default: `true`) |
| `whois_privacy` | `boolean` | No | Enable WHOIS privacy (default: `true`) |
| `nameservers` | `string[]` | No | Custom nameservers (default: ITBengal NS) |
| `registrant` | `object` | Yes | Registrant contact info |
| `registrant.name` | `string` | Yes | Full name |
| `registrant.email` | `string` | Yes | Email |
| `registrant.phone` | `string` | Yes | Phone |
| `registrant.address` | `string` | Yes | Address |
| `registrant.city` | `string` | Yes | City |
| `registrant.country` | `string` | Yes | ISO country code |
| `registrant.postal_code` | `string` | Yes | Postal code |
| `payment_method_id` | `UUID` | No | Saved payment method |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "dom_a1b2c3d4",
    "domain_name": "example.com",
    "status": "pending",
    "registration_date": "2026-07-04T10:53:10Z",
    "expiry_date": "2027-07-04T10:53:10Z",
    "auto_renew": true,
    "whois_privacy": true,
    "nameservers": ["ns1.itbengal.com", "ns2.itbengal.com"],
    "invoice_id": "inv_x1y2z3",
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `DOM_001` | Domain not available |
| 400 | `DOM_002` | Invalid domain format |
| 400 | `DOM_006` | TLD not supported |
| 402 | `BIL_001` | Payment required |

---

#### POST `/domains/transfer`

Transfer a domain to ITBengal.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain_name` | `string` | Yes | Domain to transfer |
| `auth_code` | `string` | Yes | Transfer authorization code from current registrar |
| `registrant` | `object` | Yes | Contact info (same as registration) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "dom_e5f6g7h8",
    "domain_name": "mysite.com",
    "status": "transferring",
    "message": "Transfer initiated. This may take 5-7 days."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `DOM_003` | Invalid auth code |
| 400 | `DOM_005` | Domain is locked at current registrar |

---

#### GET `/domains`

List user's domains.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `status` | `string` | No | Filter: `active`, `expired`, `transferring` |
| `search` | `string` | No | Search by domain name |

**Response (200 OK):** Returns paginated array of `Domain` objects.

---

#### GET `/domains/:domainId`

Get domain details.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Domain` object.

---

#### POST `/domains/:domainId/renew`

Renew a domain registration.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | `integer` | No | Renewal period in years (default: 1) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "domain_name": "example.com",
    "new_expiry_date": "2028-07-04T10:53:10Z",
    "invoice_id": "inv_renew_123"
  }
}
```

---

#### PATCH `/domains/:domainId/nameservers`

Update domain nameservers.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nameservers` | `string[]` | Yes | Array of 2-4 nameserver hostnames |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "nameservers": ["ns1.itbengal.com", "ns2.itbengal.com"],
    "message": "Nameservers updated. Propagation may take up to 48 hours."
  }
}
```

---

#### PATCH `/domains/:domainId/whois-privacy`

Toggle WHOIS privacy protection.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | `boolean` | Yes | Enable or disable WHOIS privacy |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "whois_privacy": true,
    "message": "WHOIS privacy enabled."
  }
}
```

---

#### POST `/domains/:domainId/lock`

Lock domain to prevent unauthorized transfer.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "is_locked": true,
    "message": "Domain locked."
  }
}
```

---

#### POST `/domains/:domainId/unlock`

Unlock domain to allow transfer.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "is_locked": false,
    "message": "Domain unlocked."
  }
}
```

---

#### GET `/domains/:domainId/auth-code`

Get the EPP/authorization code for domain transfer.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "auth_code": "aBc123!@#dEf456",
    "expires_at": "2026-07-11T10:53:10Z"
  }
}
```

---

#### POST `/domains/:domainId/connect`

Connect a domain to an application.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `application_id` | `UUID` | Yes | Application to connect to |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "domain_name": "example.com",
    "application_id": "app_x1y2z3",
    "ssl_status": "pending",
    "dns_records_required": [
      {
        "type": "A",
        "name": "@",
        "value": "103.45.67.89"
      },
      {
        "type": "CNAME",
        "name": "www",
        "value": "portfolio-frontend-a1b2c3.itbengal.app"
      }
    ],
    "message": "Domain connected. Configure the DNS records shown above."
  }
}
```

---

## 15. DNS Records Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | GET | `/domains/:domainId/dns` | List records | Yes | 100/min |
| 2 | POST | `/domains/:domainId/dns` | Create record | Yes | 30/min |
| 3 | GET | `/domains/:domainId/dns/:recordId` | Get record | Yes | 100/min |
| 4 | PATCH | `/domains/:domainId/dns/:recordId` | Update record | Yes | 30/min |
| 5 | DELETE | `/domains/:domainId/dns/:recordId` | Delete record | Yes | 30/min |
| 6 | POST | `/domains/:domainId/dns/import` | Import zone | Yes | 5/min |
| 7 | GET | `/domains/:domainId/dns/export` | Export zone | Yes | 10/min |

---

#### GET `/domains/:domainId/dns`

List all DNS records for a domain.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `string` | No | Filter by record type: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SRV`, `CAA` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "dns_a1b2c3d4",
      "domain_id": "dom_a1b2c3d4",
      "type": "A",
      "name": "@",
      "value": "103.45.67.89",
      "ttl": 3600,
      "priority": null,
      "is_managed": true,
      "created_at": "2026-07-04T10:53:10Z"
    },
    {
      "id": "dns_e5f6g7h8",
      "domain_id": "dom_a1b2c3d4",
      "type": "MX",
      "name": "@",
      "value": "mail.example.com",
      "ttl": 3600,
      "priority": 10,
      "is_managed": false,
      "created_at": "2026-07-04T10:53:10Z"
    }
  ]
}
```

---

#### POST `/domains/:domainId/dns`

Create a new DNS record.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 30 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `string` | Yes | `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SRV`, `CAA` |
| `name` | `string` | Yes | Record name (`@` for root, `www`, `mail`, etc.) |
| `value` | `string` | Yes | Record value |
| `ttl` | `integer` | No | TTL in seconds (default: 3600, min: 60, max: 86400) |
| `priority` | `integer` | No | Priority (required for MX, SRV) |
| `weight` | `integer` | No | Weight (for SRV) |
| `port` | `integer` | No | Port (for SRV) |
| `tag` | `string` | No | Tag (for CAA: `issue`, `issuewild`, `iodef`) |

**Response (201 Created):** Returns created `DnsRecord` object.

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `DNS_001` | Invalid record type |
| 400 | `DNS_002` | Invalid record value |
| 409 | `DNS_003` | Conflicting record exists |
| 400 | `DNS_004` | CNAME conflicts with existing records |
| 400 | `DNS_005` | Invalid TTL value |

---

#### GET `/domains/:domainId/dns/:recordId`

Get a specific DNS record.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns `DnsRecord` object.

---

#### PATCH `/domains/:domainId/dns/:recordId`

Update a DNS record.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 30 requests / minute |

**Request Body (all optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | `string` | No | Record value |
| `ttl` | `integer` | No | TTL |
| `priority` | `integer` | No | Priority |

**Response (200 OK):** Returns updated `DnsRecord` object.

---

#### DELETE `/domains/:domainId/dns/:recordId`

Delete a DNS record.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 30 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "DNS record deleted."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 423 | `RES_004` | Managed record cannot be deleted |

---

#### POST `/domains/:domainId/dns/import`

Import DNS records from a BIND zone file.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |
| **Content Type** | `multipart/form-data` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `zone_file` | `file` | Yes | BIND zone file (.txt, max 1MB) |
| `overwrite` | `boolean` | No | Replace existing records (default: `false`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "imported": 15,
    "skipped": 2,
    "errors": [
      {
        "line": 12,
        "message": "Invalid record format"
      }
    ]
  }
}
```

---

#### GET `/domains/:domainId/dns/export`

Export DNS records as a BIND zone file.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (200 OK):**

```
Content-Type: text/plain
Content-Disposition: attachment; filename="example.com.zone"

$ORIGIN example.com.
$TTL 3600
@    IN    A       103.45.67.89
www  IN    CNAME   portfolio-frontend-a1b2c3.itbengal.app.
@    IN    MX  10  mail.example.com.
@    IN    TXT     "v=spf1 include:_spf.google.com ~all"
```

---

## 16. WordPress Management Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/wordpress` | Install WordPress | Yes | 5/min |
| 2 | GET | `/wordpress` | List sites | Yes | 100/min |
| 3 | GET | `/wordpress/:siteId` | Get site details | Yes | 100/min |
| 4 | DELETE | `/wordpress/:siteId` | Delete site | Yes | 5/min |
| 5 | POST | `/wordpress/:siteId/backup` | Create backup | Yes | 5/min |
| 6 | GET | `/wordpress/:siteId/backups` | List backups | Yes | 100/min |
| 7 | POST | `/wordpress/:siteId/backups/:backupId/restore` | Restore backup | Yes | 3/min |
| 8 | POST | `/wordpress/:siteId/clone` | Clone site | Yes | 3/min |
| 9 | POST | `/wordpress/:siteId/staging` | Create staging | Yes | 3/min |
| 10 | POST | `/wordpress/:siteId/staging/push` | Push staging to prod | Yes | 3/min |
| 11 | GET | `/wordpress/:siteId/files` | Browse files | Yes | 100/min |
| 12 | POST | `/wordpress/:siteId/files/upload` | Upload file | Yes | 10/min |
| 13 | DELETE | `/wordpress/:siteId/files` | Delete file | Yes | 30/min |
| 14 | POST | `/wordpress/:siteId/malware-scan` | Trigger scan | Yes | 3/min |
| 15 | GET | `/wordpress/:siteId/malware-scan/results` | Get scan results | Yes | 100/min |
| 16 | POST | `/wordpress/:siteId/update` | Update WP/plugins | Yes | 5/min |
| 17 | GET | `/wordpress/:siteId/updates` | Check updates | Yes | 100/min |
| 18 | GET | `/wordpress/:siteId/settings` | Get settings | Yes | 100/min |
| 19 | PATCH | `/wordpress/:siteId/settings` | Update settings | Yes | 20/min |
| 20 | POST | `/wordpress/:siteId/cache/purge` | Purge cache | Yes | 10/min |
| 21 | GET | `/wordpress/:siteId/database` | DB manager info | Yes | 100/min |
| 22 | POST | `/wordpress/:siteId/ssl` | Install/renew SSL | Yes | 5/min |

---

#### POST `/wordpress`

Install a new WordPress site.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_id` | `UUID` | Yes | Project to install in (must be `wordpress` type) |
| `site_name` | `string` | Yes | Site name / title |
| `admin_username` | `string` | Yes | WP admin username |
| `admin_password` | `string` | Yes | WP admin password |
| `admin_email` | `string` | Yes | WP admin email |
| `php_version` | `string` | No | PHP version: `8.1`, `8.2`, `8.3` (default: `8.3`) |
| `domain` | `string` | No | Custom domain (or auto-assigned `*.itbengal.app`) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "wp_a1b2c3d4",
    "project_id": "proj_a1b2c3d4",
    "site_name": "My Blog",
    "domain": "my-blog-a1b2c3.itbengal.app",
    "status": "installing",
    "wp_version": "6.7",
    "php_version": "8.3",
    "admin_url": "https://my-blog-a1b2c3.itbengal.app/wp-admin",
    "message": "WordPress installation initiated. Usually completes in 2-3 minutes.",
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `WP_001` | Installation failed |
| 402 | `BIL_001` | Site limit reached for plan |

---

#### GET `/wordpress`

List user's WordPress sites.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `status` | `string` | No | Filter by status |
| `search` | `string` | No | Search by site name |

**Response (200 OK):** Returns paginated array of `WordPressSite` objects.

---

#### GET `/wordpress/:siteId`

Get WordPress site details.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `WordPressSite` object.

---

#### DELETE `/wordpress/:siteId`

Delete a WordPress site and all associated data.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `confirm` | `boolean` | Yes | Must be `true` |
| `delete_backups` | `boolean` | No | Also delete backups (default: `false`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "WordPress site deleted."
  }
}
```

---

#### POST `/wordpress/:siteId/backup`

Create a manual backup.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `string` | No | `full`, `database`, `files` (default: `full`) |
| `description` | `string` | No | Backup description |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "bkp_a1b2c3d4",
    "status": "in_progress",
    "type": "full",
    "message": "Backup creation started."
  }
}
```

---

#### GET `/wordpress/:siteId/backups`

List all backups for a WordPress site.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns paginated array of `Backup` objects.

---

#### POST `/wordpress/:siteId/backups/:backupId/restore`

Restore a WordPress site from a backup.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 3 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `confirm` | `boolean` | Yes | Must be `true` |
| `create_backup_first` | `boolean` | No | Create backup before restore (default: `true`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Restore initiated. Site will be in maintenance mode during restoration.",
    "estimated_duration_minutes": 5
  }
}
```

---

#### POST `/wordpress/:siteId/clone`

Clone a WordPress site.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 3 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `new_site_name` | `string` | Yes | Name for the cloned site |
| `domain` | `string` | No | Domain for clone (auto-assigned if omitted) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "wp_clone_e5f6g7h8",
    "site_name": "My Blog Clone",
    "status": "installing",
    "message": "Cloning initiated."
  }
}
```

---

#### POST `/wordpress/:siteId/staging`

Create a staging environment.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 3 requests / minute |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "staging_site_id": "wp_stg_i9j0k1l2",
    "staging_url": "https://staging-my-blog-a1b2c3.itbengal.app",
    "message": "Staging environment created."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 409 | `WP_005` | Staging already exists |

---

#### POST `/wordpress/:siteId/staging/push`

Push staging changes to production.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 3 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `confirm` | `boolean` | Yes | Must be `true` |
| `include_database` | `boolean` | No | Push database changes (default: `true`) |
| `include_files` | `boolean` | No | Push file changes (default: `true`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Staging pushed to production. A backup was created before push."
  }
}
```

---

#### GET `/wordpress/:siteId/files`

Browse WordPress files.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | No | Directory path (default: `/`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "path": "/wp-content/themes",
    "files": [
      {
        "name": "twentytwentysix",
        "type": "directory",
        "size_bytes": null,
        "modified_at": "2026-07-04T10:53:10Z"
      },
      {
        "name": "style.css",
        "type": "file",
        "size_bytes": 12480,
        "modified_at": "2026-07-04T10:53:10Z"
      }
    ]
  }
}
```

---

#### POST `/wordpress/:siteId/files/upload`

Upload a file to the WordPress installation.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |
| **Content Type** | `multipart/form-data` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | `file` | Yes | File to upload (max 100MB) |
| `path` | `string` | Yes | Destination path |
| `overwrite` | `boolean` | No | Overwrite if exists (default: `false`) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "path": "/wp-content/uploads/logo.png",
    "size_bytes": 45230
  }
}
```

---

#### DELETE `/wordpress/:siteId/files`

Delete a file or directory.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 30 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | `string` | Yes | File/directory path to delete |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "File deleted."
  }
}
```

---

#### POST `/wordpress/:siteId/malware-scan`

Trigger a malware scan.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 3 requests / minute |

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "scan_id": "scan_a1b2c3d4",
    "status": "scanning",
    "message": "Malware scan initiated. Results will be available shortly."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `WP_006` | Scan already in progress |

---

#### GET `/wordpress/:siteId/malware-scan/results`

Get malware scan results.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "status": "clean",
    "scanned_files": 4523,
    "threats_found": 0,
    "threats": [],
    "scanned_at": "2026-07-04T10:53:10Z",
    "scan_duration_seconds": 45
  }
}
```

---

#### POST `/wordpress/:siteId/update`

Update WordPress core, plugins, or themes.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targets` | `array` | Yes | Array of update targets |
| `targets[].type` | `string` | Yes | `core`, `plugin`, `theme` |
| `targets[].slug` | `string` | Yes | Plugin/theme slug or `wordpress` for core |
| `targets[].version` | `string` | No | Target version (default: latest) |
| `create_backup` | `boolean` | No | Create backup before update (default: `true`) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "updated": [
      {
        "type": "core",
        "slug": "wordpress",
        "from_version": "6.6",
        "to_version": "6.7"
      },
      {
        "type": "plugin",
        "slug": "woocommerce",
        "from_version": "8.0",
        "to_version": "8.5"
      }
    ],
    "backup_id": "bkp_pre_update_123"
  }
}
```

---

#### GET `/wordpress/:siteId/updates`

Check available updates.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "core": {
      "current_version": "6.6",
      "latest_version": "6.7",
      "update_available": true
    },
    "plugins": [
      {
        "slug": "woocommerce",
        "name": "WooCommerce",
        "current_version": "8.0",
        "latest_version": "8.5",
        "update_available": true
      }
    ],
    "themes": []
  }
}
```

---

#### GET `/wordpress/:siteId/settings`

Get WordPress site settings.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "php_version": "8.3",
    "wp_version": "6.7",
    "caching_enabled": true,
    "auto_updates_enabled": true,
    "auto_update_core": true,
    "auto_update_plugins": false,
    "auto_update_themes": false,
    "debug_mode": false,
    "max_upload_size_mb": 64,
    "memory_limit_mb": 256,
    "max_execution_time": 300
  }
}
```

---

#### PATCH `/wordpress/:siteId/settings`

Update WordPress site settings.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 20 requests / minute |

**Request Body (all optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `php_version` | `string` | No | `8.1`, `8.2`, `8.3` |
| `caching_enabled` | `boolean` | No | Toggle caching |
| `auto_updates_enabled` | `boolean` | No | Toggle auto-updates |
| `auto_update_core` | `boolean` | No | Auto-update WordPress core |
| `auto_update_plugins` | `boolean` | No | Auto-update plugins |
| `auto_update_themes` | `boolean` | No | Auto-update themes |
| `debug_mode` | `boolean` | No | Toggle debug mode |
| `max_upload_size_mb` | `integer` | No | Max upload size |
| `memory_limit_mb` | `integer` | No | PHP memory limit |

**Response (200 OK):** Returns updated settings object.

---

#### POST `/wordpress/:siteId/cache/purge`

Purge all cache for the WordPress site.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Cache purged successfully.",
    "purged_items": 1523
  }
}
```

---

#### GET `/wordpress/:siteId/database`

Get database manager information.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "database_name": "wp_myblog_a1b2c3",
    "database_size_mb": 45.2,
    "tables": [
      {
        "name": "wp_posts",
        "rows": 1523,
        "size_mb": 12.5
      },
      {
        "name": "wp_options",
        "rows": 456,
        "size_mb": 3.2
      }
    ],
    "phpmyadmin_url": "https://db.itbengal.com/pma/?site=wp_a1b2c3d4"
  }
}
```

---

#### POST `/wordpress/:siteId/ssl`

Install or renew SSL certificate (via Let's Encrypt).

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "ssl_status": "active",
    "issuer": "Let's Encrypt",
    "valid_from": "2026-07-04T00:00:00Z",
    "valid_until": "2026-10-02T00:00:00Z",
    "auto_renew": true
  }
}
```

---

## 17. Billing Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | GET | `/billing/plans` | List plans | No | 100/min |
| 2 | GET | `/billing/plans/:planId` | Get plan details | No | 100/min |
| 3 | POST | `/billing/subscriptions` | Create subscription | Yes | 10/min |
| 4 | GET | `/billing/subscriptions` | List subscriptions | Yes | 100/min |
| 5 | GET | `/billing/subscriptions/:subId` | Get subscription | Yes | 100/min |
| 6 | PATCH | `/billing/subscriptions/:subId` | Upgrade/downgrade | Yes | 10/min |
| 7 | POST | `/billing/subscriptions/:subId/cancel` | Cancel | Yes | 5/min |
| 8 | POST | `/billing/subscriptions/:subId/resume` | Resume | Yes | 5/min |
| 9 | GET | `/billing/invoices` | List invoices | Yes | 100/min |
| 10 | GET | `/billing/invoices/:invoiceId` | Get invoice | Yes | 100/min |
| 11 | GET | `/billing/invoices/:invoiceId/download` | Download PDF | Yes | 20/min |
| 12 | GET | `/billing/usage` | Current usage | Yes | 100/min |
| 13 | GET | `/billing/usage/history` | Usage history | Yes | 100/min |

---

#### GET `/billing/plans`

List all available hosting plans.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `string` | No | Filter: `react`, `wordpress` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "plan_starter_react",
      "name": "Starter",
      "slug": "starter",
      "type": "react",
      "tier": "starter",
      "price_monthly_bdt": 299,
      "price_monthly_usd": 2.99,
      "price_yearly_bdt": 2990,
      "price_yearly_usd": 29.90,
      "features": {
        "cpu_cores": 0.5,
        "ram_mb": 512,
        "storage_gb": 5,
        "bandwidth_gb": 50,
        "projects": 3,
        "custom_domains": 1,
        "backups_per_day": 1,
        "build_minutes": 100,
        "deployments_per_day": 10,
        "team_members": 1,
        "ssl": true,
        "priority_support": false,
        "priority_build_queue": false,
        "log_retention_days": 3,
        "staging_environments": 0
      },
      "is_active": true
    }
  ]
}
```

---

#### GET `/billing/plans/:planId`

Get detailed plan information.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Plan` object.

---

#### POST `/billing/subscriptions`

Create a new subscription.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plan_id` | `UUID` | Yes | Plan to subscribe to |
| `billing_cycle` | `string` | Yes | `monthly` or `yearly` |
| `resource_type` | `string` | Yes | `application`, `wordpress_site` |
| `resource_id` | `UUID` | Yes | Resource ID |
| `payment_method_id` | `UUID` | No | Saved payment method |
| `coupon_code` | `string` | No | Coupon code |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "sub_a1b2c3d4",
    "plan_id": "plan_starter_react",
    "status": "active",
    "billing_cycle": "monthly",
    "current_period_start": "2026-07-04T00:00:00Z",
    "current_period_end": "2026-08-04T00:00:00Z",
    "amount_bdt": 299,
    "currency": "BDT",
    "invoice_id": "inv_x1y2z3"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 409 | `BIL_006` | Active subscription exists for this resource |
| 400 | `BIL_004` | Invalid coupon |
| 402 | `BIL_009` | Payment method declined |

---

#### GET `/billing/subscriptions`

List user's subscriptions.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns paginated array of `Subscription` objects.

---

#### GET `/billing/subscriptions/:subId`

Get subscription details.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Subscription` object with nested `plan`.

---

#### PATCH `/billing/subscriptions/:subId`

Upgrade or downgrade a subscription.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plan_id` | `UUID` | Yes | New plan ID |
| `billing_cycle` | `string` | No | Change billing cycle |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "sub_a1b2c3d4",
    "plan_id": "plan_pro_react",
    "status": "active",
    "prorated_amount": 150,
    "message": "Subscription upgraded. Prorated amount charged."
  }
}
```

---

#### POST `/billing/subscriptions/:subId/cancel`

Cancel a subscription. Service continues until period end.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | `string` | No | Cancellation reason |
| `immediate` | `boolean` | No | Cancel immediately (default: at period end) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "status": "cancelled",
    "cancel_at_period_end": true,
    "current_period_end": "2026-08-04T00:00:00Z",
    "message": "Subscription will cancel at end of billing period."
  }
}
```

---

#### POST `/billing/subscriptions/:subId/resume`

Resume a cancelled subscription (before period end).

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "status": "active",
    "message": "Subscription resumed."
  }
}
```

---

#### GET `/billing/invoices`

List user's invoices.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `status` | `string` | No | Filter: `paid`, `open`, `overdue` |

**Response (200 OK):** Returns paginated array of `Invoice` objects.

---

#### GET `/billing/invoices/:invoiceId`

Get invoice details.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Invoice` object with line items.

---

#### GET `/billing/invoices/:invoiceId/download`

Download invoice as PDF.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 20 requests / minute |

**Response (200 OK):**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="INV-2026-00001.pdf"
```

---

#### GET `/billing/usage`

Get current billing period usage summary.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "period_start": "2026-07-04T00:00:00Z",
    "period_end": "2026-08-04T00:00:00Z",
    "bandwidth": { "used_gb": 23.5, "limit_gb": 50, "percent": 47 },
    "storage": { "used_gb": 3.2, "limit_gb": 5, "percent": 64 },
    "build_minutes": { "used": 45, "limit": 100, "percent": 45 },
    "deployments": { "used_today": 3, "limit_per_day": 10, "percent": 30 },
    "projects": { "used": 2, "limit": 3, "percent": 67 }
  }
}
```

---

#### GET `/billing/usage/history`

Get historical usage data.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | `string` | No | `3m`, `6m`, `1y` (default: `3m`) |

**Response (200 OK):** Returns monthly usage breakdown.

---

## 18. Payments Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/payments/initiate` | Initiate payment | Yes | 10/min |
| 2 | POST | `/payments/confirm` | Confirm payment | Yes | 10/min |
| 3 | GET | `/payments` | List payments | Yes | 100/min |
| 4 | GET | `/payments/:paymentId` | Get payment | Yes | 100/min |
| 5 | POST | `/payments/:paymentId/refund` | Request refund | Yes | 5/min |
| 6 | POST | `/payments/bkash/callback` | bKash callback | No | — |
| 7 | POST | `/payments/nagad/callback` | Nagad callback | No | — |
| 8 | POST | `/payments/rocket/callback` | Rocket callback | No | — |
| 9 | POST | `/payments/stripe/webhook` | Stripe webhook | No | — |
| 10 | POST | `/payments/paypal/webhook` | PayPal webhook | No | — |
| 11 | GET | `/payments/methods` | List methods | Yes | 100/min |
| 12 | POST | `/payments/methods` | Add method | Yes | 10/min |
| 13 | DELETE | `/payments/methods/:methodId` | Remove method | Yes | 10/min |
| 14 | POST | `/coupons/validate` | Validate coupon | Yes | 20/min |
| 15 | GET | `/coupons/:code` | Get coupon info | Yes | 20/min |

---

#### POST `/payments/initiate`

Initiate a payment for an invoice.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invoice_id` | `UUID` | Yes | Invoice to pay |
| `gateway` | `string` | Yes | `bkash`, `nagad`, `rocket`, `stripe`, `paypal` |
| `return_url` | `string` | No | Redirect URL after payment |
| `payment_method_id` | `UUID` | No | Saved payment method (for Stripe) |

**Response (200 OK) — bKash/Nagad/Rocket:**

```json
{
  "success": true,
  "data": {
    "payment_id": "pay_a1b2c3d4",
    "gateway": "bkash",
    "redirect_url": "https://payment.bkash.com/checkout/abc123",
    "expires_at": "2026-07-04T11:08:10Z"
  }
}
```

**Response (200 OK) — Stripe:**

```json
{
  "success": true,
  "data": {
    "payment_id": "pay_e5f6g7h8",
    "gateway": "stripe",
    "client_secret": "pi_abc123_secret_def456",
    "publishable_key": "pk_live_..."
  }
}
```

---

#### POST `/payments/confirm`

Confirm a payment after gateway callback.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `payment_id` | `UUID` | Yes | Payment ID from initiate |
| `gateway_transaction_id` | `string` | Yes | Transaction ID from gateway |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "payment_id": "pay_a1b2c3d4",
    "status": "completed",
    "amount": 299,
    "currency": "BDT",
    "invoice_id": "inv_x1y2z3"
  }
}
```

---

#### GET `/payments`

List payment history.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `status` | `string` | No | Filter by status |
| `gateway` | `string` | No | Filter by gateway |

**Response (200 OK):** Returns paginated array of `Payment` objects.

---

#### GET `/payments/:paymentId`

Get payment details.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):** Returns full `Payment` object.

---

#### POST `/payments/:paymentId/refund`

Request a refund.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | `number` | No | Partial refund amount (default: full) |
| `reason` | `string` | Yes | Refund reason |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "payment_id": "pay_a1b2c3d4",
    "refund_status": "pending",
    "refund_amount": 299,
    "message": "Refund request submitted for review."
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `BIL_007` | Refund window expired (30 days) |

---

#### POST `/payments/bkash/callback`

bKash payment notification callback. Verified via bKash signature.

| Property | Value |
|----------|-------|
| **Auth Required** | No (verified via signature) |
| **Rate Limit** | None |

> **Note:** Payment gateway webhook endpoints (bKash, Nagad, Rocket, Stripe, PayPal) are internal callbacks. They verify requests using gateway-specific signatures and are not called by platform users.

---

#### POST `/payments/nagad/callback`

Nagad payment notification callback.

Same structure as bKash callback.

---

#### POST `/payments/rocket/callback`

Rocket payment notification callback.

Same structure as bKash callback.

---

#### POST `/payments/stripe/webhook`

Stripe webhook endpoint. Verified via `Stripe-Signature` header.

---

#### POST `/payments/paypal/webhook`

PayPal webhook endpoint. Verified via PayPal IPN validation.

---

#### GET `/payments/methods`

List user's saved payment methods.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "pm_a1b2c3d4",
      "gateway": "bkash",
      "type": "mobile_wallet",
      "identifier": "01700****000",
      "is_default": true,
      "created_at": "2026-07-04T10:53:10Z"
    },
    {
      "id": "pm_e5f6g7h8",
      "gateway": "stripe",
      "type": "card",
      "identifier": "•••• 4242",
      "brand": "visa",
      "exp_month": 12,
      "exp_year": 2028,
      "is_default": false,
      "created_at": "2026-07-04T10:53:10Z"
    }
  ]
}
```

---

#### POST `/payments/methods`

Add a saved payment method.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gateway` | `string` | Yes | Payment gateway |
| `token` | `string` | Yes | Gateway-specific token |
| `is_default` | `boolean` | No | Set as default method |

**Response (201 Created):** Returns created payment method object.

---

#### DELETE `/payments/methods/:methodId`

Remove a saved payment method.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Payment method removed."
  }
}
```

---

#### POST `/coupons/validate`

Validate a coupon code.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 20 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Coupon code |
| `plan_id` | `UUID` | No | Plan to apply coupon to |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "LAUNCH50",
    "discount_type": "percentage",
    "discount_value": 50,
    "applies_to": "all",
    "valid_until": "2026-12-31T23:59:59Z"
  }
}
```

**Error Codes:**

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `BIL_004` | Coupon invalid or expired |
| 400 | `BIL_005` | Coupon already redeemed |

---

#### GET `/coupons/:code`

Get coupon details by code.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 20 requests / minute |

**Response (200 OK):** Returns `Coupon` object (public fields only).

---

## 19. Servers (Admin) Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/admin/servers` | Register server | Admin | 200/min |
| 2 | GET | `/admin/servers` | List servers | Admin | 200/min |
| 3 | GET | `/admin/servers/:serverId` | Get server | Admin | 200/min |
| 4 | PATCH | `/admin/servers/:serverId` | Update server | Admin | 200/min |
| 5 | DELETE | `/admin/servers/:serverId` | Decommission | Admin | 200/min |
| 6 | GET | `/admin/servers/:serverId/health` | Health metrics | Admin | 200/min |
| 7 | POST | `/admin/servers/:serverId/maintenance` | Toggle maintenance | Admin | 200/min |
| 8 | GET | `/admin/servers/:serverId/applications` | List apps | Admin | 200/min |

> **Note:** All admin endpoints require `super_admin` or `admin` role.

---

#### POST `/admin/servers`

Register a new server in the platform.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (Admin) |
| **Rate Limit** | 200 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Server name |
| `hostname` | `string` | Yes | Hostname |
| `ip_address` | `string` | Yes | IP address |
| `type` | `string` | Yes | `react_hosting`, `wordpress_hosting`, `database`, etc. |
| `region` | `string` | Yes | Server region |
| `provider` | `string` | Yes | VPS provider name |
| `specs.cpu_cores` | `number` | Yes | CPU cores |
| `specs.ram_gb` | `number` | Yes | RAM in GB |
| `specs.storage_gb` | `number` | Yes | Storage in GB |
| `specs.bandwidth_gb` | `number` | Yes | Monthly bandwidth |
| `max_applications` | `number` | Yes | Max apps on this server |

**Response (201 Created):** Returns created `Server` object.

---

#### GET `/admin/servers`

List all platform servers.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (Admin) |
| **Rate Limit** | 200 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | `string` | No | Filter by server type |
| `status` | `string` | No | Filter by status |

**Response (200 OK):** Returns array of `Server` objects.

---

#### GET `/admin/servers/:serverId`

Get server details including health metrics.

**Response (200 OK):** Returns full `Server` object.

---

#### PATCH `/admin/servers/:serverId`

Update server configuration.

**Request Body (all optional):** Fields from `Server` that can be updated.

**Response (200 OK):** Returns updated `Server` object.

---

#### DELETE `/admin/servers/:serverId`

Decommission a server. All apps must be migrated first.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Server decommissioned.",
    "status": "decommissioned"
  }
}
```

---

#### GET `/admin/servers/:serverId/health`

Get real-time server health metrics.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "server_id": "srv_a1b2c3d4",
    "timestamp": "2026-07-04T10:53:10Z",
    "cpu": { "usage_percent": 23.5, "cores": 8, "load_avg": [1.2, 0.8, 0.6] },
    "memory": { "total_gb": 32, "used_gb": 12.5, "usage_percent": 39.1 },
    "disk": { "total_gb": 500, "used_gb": 145, "usage_percent": 29.0 },
    "network": { "inbound_mbps": 45, "outbound_mbps": 120 },
    "containers": { "total": 45, "running": 42, "stopped": 3 },
    "uptime_seconds": 2592000,
    "status": "healthy"
  }
}
```

---

#### POST `/admin/servers/:serverId/maintenance`

Toggle server maintenance mode. Apps are drained before maintenance.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | `boolean` | Yes | Enable or disable maintenance mode |
| `reason` | `string` | No | Reason for maintenance |
| `estimated_duration_minutes` | `integer` | No | Estimated downtime |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "status": "maintenance",
    "message": "Maintenance mode enabled. New deployments will be routed to other servers."
  }
}
```

---

#### GET `/admin/servers/:serverId/applications`

List all applications hosted on a server.

**Response (200 OK):** Returns array of `Application` objects on this server.

---

## 20. Admin Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | GET | `/admin/customers` | List customers | Admin | 200/min |
| 2 | GET | `/admin/customers/:userId` | Get customer | Admin | 200/min |
| 3 | PATCH | `/admin/customers/:userId` | Update customer | Admin | 200/min |
| 4 | GET | `/admin/analytics/overview` | Dashboard analytics | Admin | 200/min |
| 5 | GET | `/admin/analytics/revenue` | Revenue analytics | Admin | 200/min |
| 6 | GET | `/admin/analytics/signups` | Signup analytics | Admin | 200/min |
| 7 | GET | `/admin/audit-logs` | List audit logs | Admin | 200/min |
| 8 | POST | `/admin/coupons` | Create coupon | Admin | 200/min |
| 9 | GET | `/admin/coupons` | List coupons | Admin | 200/min |
| 10 | PATCH | `/admin/coupons/:couponId` | Update coupon | Admin | 200/min |
| 11 | DELETE | `/admin/coupons/:couponId` | Delete coupon | Admin | 200/min |
| 12 | GET | `/admin/pricing` | Get pricing config | Admin | 200/min |
| 13 | PATCH | `/admin/pricing` | Update pricing | Admin | 200/min |
| 14 | POST | `/admin/announcements` | Create announcement | Admin | 200/min |
| 15 | GET | `/admin/announcements` | List announcements | Admin | 200/min |
| 16 | PATCH | `/admin/announcements/:id` | Update announcement | Admin | 200/min |
| 17 | DELETE | `/admin/announcements/:id` | Delete announcement | Admin | 200/min |
| 18 | GET | `/admin/support-tickets` | List all tickets | Admin | 200/min |
| 19 | PATCH | `/admin/support-tickets/:ticketId` | Update ticket | Admin | 200/min |

---

#### GET `/admin/customers`

List all platform customers with search and filtering.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (Admin) |
| **Rate Limit** | 200 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `status` | `string` | No | `active`, `suspended`, `deactivated` |
| `search` | `string` | No | Search by name or email |
| `sort` | `string` | No | Sort field |
| `order` | `string` | No | `asc` or `desc` |

**Response (200 OK):** Returns paginated array of `User` objects with subscription info.

---

#### GET `/admin/customers/:userId`

Get full customer details including subscriptions, payments, and activity.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": { },
    "subscriptions": [ ],
    "recent_payments": [ ],
    "projects_count": 5,
    "total_revenue_bdt": 14500,
    "support_tickets_count": 2
  }
}
```

---

#### PATCH `/admin/customers/:userId`

Update customer account (suspend, activate, change role).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `string` | No | `active`, `suspended` |
| `role` | `string` | No | `user`, `admin` |
| `reason` | `string` | No | Reason for action |

---

#### GET `/admin/analytics/overview`

Get platform-wide dashboard analytics.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "total_customers": 1523,
    "active_subscriptions": 1245,
    "total_revenue_bdt": 4523000,
    "total_revenue_usd": 52430,
    "active_applications": 3456,
    "active_wordpress_sites": 2345,
    "total_domains": 890,
    "servers_health": { "healthy": 8, "warning": 1, "critical": 0 },
    "open_tickets": 12,
    "period": "30d"
  }
}
```

---

#### GET `/admin/analytics/revenue`

Get revenue analytics with breakdown.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | `string` | No | `7d`, `30d`, `90d`, `1y` |
| `group_by` | `string` | No | `day`, `week`, `month` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "total": 4523000,
    "currency": "BDT",
    "by_product": {
      "react_hosting": 2100000,
      "wordpress_hosting": 1800000,
      "domains": 623000
    },
    "by_gateway": {
      "bkash": 2500000,
      "nagad": 1200000,
      "stripe": 823000
    },
    "timeline": [
      { "date": "2026-07-01", "amount": 145000 },
      { "date": "2026-07-02", "amount": 156000 }
    ]
  }
}
```

---

#### GET `/admin/analytics/signups`

Get signup analytics.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "total_signups": 45,
    "verified": 42,
    "converted": 28,
    "conversion_rate": 62.2,
    "period": "30d",
    "timeline": [
      { "date": "2026-07-01", "signups": 5, "converted": 3 }
    ]
  }
}
```

---

#### GET `/admin/audit-logs`

List platform audit logs.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `user_id` | `UUID` | No | Filter by user |
| `action` | `string` | No | Filter by action type |
| `resource_type` | `string` | No | Filter by resource type |
| `from` | `string` | No | Start date (ISO) |
| `to` | `string` | No | End date (ISO) |

**Response (200 OK):** Returns paginated array of `AuditLog` objects.

---

#### POST `/admin/coupons`

Create a new coupon.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | Unique coupon code |
| `description` | `string` | Yes | Description |
| `discount_type` | `string` | Yes | `percentage` or `fixed_amount` |
| `discount_value` | `number` | Yes | Discount value |
| `currency` | `string` | No | For fixed_amount: `BDT` or `USD` |
| `applies_to` | `string` | No | `all`, `react`, `wordpress`, `domain` |
| `min_amount` | `number` | No | Minimum order amount |
| `max_discount` | `number` | No | Maximum discount cap |
| `usage_limit` | `number` | No | Total usage limit |
| `per_user_limit` | `number` | No | Per-user limit (default: 1) |
| `valid_from` | `string` | Yes | Start date (ISO) |
| `valid_until` | `string` | Yes | End date (ISO) |

**Response (201 Created):** Returns created `Coupon` object.

---

#### GET `/admin/coupons`

List all coupons. Returns paginated `Coupon` array.

---

#### PATCH `/admin/coupons/:couponId`

Update a coupon.

**Response (200 OK):** Returns updated `Coupon` object.

---

#### DELETE `/admin/coupons/:couponId`

Deactivate/delete a coupon.

---

#### GET `/admin/pricing`

Get current pricing configuration for all plans.

**Response (200 OK):** Returns array of all `Plan` objects.

---

#### PATCH `/admin/pricing`

Update pricing for plans.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plans` | `array` | Yes | Array of plan updates with `id` and fields to change |

---

#### POST `/admin/announcements`

Create a platform announcement.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Announcement title |
| `body` | `string` | Yes | Announcement body (Markdown) |
| `type` | `string` | Yes | `info`, `warning`, `maintenance`, `feature` |
| `target` | `string` | No | `all`, `react`, `wordpress` (default: `all`) |
| `starts_at` | `string` | No | Display start (ISO) |
| `ends_at` | `string` | No | Display end (ISO) |

**Response (201 Created):** Returns created announcement.

---

#### GET `/admin/announcements`

List all announcements.

---

#### PATCH `/admin/announcements/:id`

Update an announcement.

---

#### DELETE `/admin/announcements/:id`

Delete an announcement.

---

#### GET `/admin/support-tickets`

List all support tickets across all customers.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | `string` | No | Filter by status |
| `priority` | `string` | No | Filter by priority |
| `assigned_to` | `UUID` | No | Filter by assigned agent |
| `category` | `string` | No | Filter by category |

**Response (200 OK):** Returns paginated array of `SupportTicket` objects.

---

#### PATCH `/admin/support-tickets/:ticketId`

Update a support ticket (assign, change priority, update status).

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assigned_to` | `UUID` | No | Assign to staff member |
| `priority` | `string` | No | `low`, `medium`, `high`, `urgent` |
| `status` | `string` | No | `in_progress`, `waiting_customer`, etc. |
| `internal_note` | `string` | No | Internal note (not visible to customer) |

**Response (200 OK):** Returns updated `SupportTicket` object.

---

## 21. Notifications Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | GET | `/notifications` | List notifications | Yes | 100/min |
| 2 | GET | `/notifications/unread-count` | Get unread count | Yes | 200/min |
| 3 | PATCH | `/notifications/:notificationId/read` | Mark as read | Yes | 100/min |
| 4 | POST | `/notifications/mark-all-read` | Mark all read | Yes | 10/min |
| 5 | DELETE | `/notifications/:notificationId` | Delete | Yes | 100/min |
| 6 | GET | `/notifications/preferences` | Get preferences | Yes | 100/min |
| 7 | PATCH | `/notifications/preferences` | Update preferences | Yes | 20/min |

---

#### GET `/notifications`

List user's notifications with cursor-based pagination.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 100 requests / minute |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `type` | `string` | No | Filter by type |
| `is_read` | `boolean` | No | Filter read/unread |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif_a1b2c3d4",
      "type": "deployment",
      "title": "Deployment Successful",
      "message": "Your application 'portfolio-frontend' has been deployed successfully.",
      "is_read": false,
      "action_url": "/projects/proj_a1b2c3d4/deployments/dep_a1b2c3d4",
      "metadata": {
        "deployment_id": "dep_a1b2c3d4",
        "application_id": "app_x1y2z3"
      },
      "created_at": "2026-07-04T10:53:10Z"
    }
  ],
  "meta": {
    "pagination": {
      "cursor": "eyJpZCI6Im5vdGlmX2ExYjJjM2Q0In0=",
      "limit": 20,
      "hasMore": true,
      "total": 45
    }
  }
}
```

---

#### GET `/notifications/unread-count`

Get count of unread notifications.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "unread_count": 7
  }
}
```

---

#### PATCH `/notifications/:notificationId/read`

Mark a notification as read.

**Response (200 OK):**

```json
{
  "success": true,
  "data": { "is_read": true, "read_at": "2026-07-04T10:53:10Z" }
}
```

---

#### POST `/notifications/mark-all-read`

Mark all notifications as read.

**Response (200 OK):**

```json
{
  "success": true,
  "data": { "marked_count": 7 }
}
```

---

#### DELETE `/notifications/:notificationId`

Delete a notification.

**Response (200 OK):**

```json
{ "success": true, "data": { "message": "Notification deleted." } }
```

---

#### GET `/notifications/preferences`

Get notification preferences.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "email": {
      "deployment_success": true,
      "deployment_failure": true,
      "billing_invoice": true,
      "billing_payment": true,
      "security_alert": true,
      "domain_expiry": true,
      "wordpress_update": false,
      "marketing": false
    },
    "push": {
      "deployment_success": true,
      "deployment_failure": true,
      "billing_invoice": false,
      "security_alert": true
    }
  }
}
```

---

#### PATCH `/notifications/preferences`

Update notification preferences.

**Request Body:** Partial update of the preferences object structure shown above.

**Response (200 OK):** Returns updated preferences.

---

## 22. Support Tickets Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/support/tickets` | Create ticket | Yes | 10/min |
| 2 | GET | `/support/tickets` | List tickets | Yes | 100/min |
| 3 | GET | `/support/tickets/:ticketId` | Get ticket | Yes | 100/min |
| 4 | PATCH | `/support/tickets/:ticketId` | Update ticket | Yes | 100/min |
| 5 | POST | `/support/tickets/:ticketId/close` | Close ticket | Yes | 10/min |
| 6 | POST | `/support/tickets/:ticketId/reopen` | Reopen ticket | Yes | 10/min |
| 7 | POST | `/support/tickets/:ticketId/messages` | Add message | Yes | 30/min |
| 8 | GET | `/support/tickets/:ticketId/messages` | List messages | Yes | 100/min |
| 9 | POST | `/support/tickets/:ticketId/messages/:messageId/attachments` | Upload attachment | Yes | 10/min |

---

#### POST `/support/tickets`

Create a new support ticket.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | `string` | Yes | Ticket subject (5–200 chars) |
| `category` | `string` | Yes | `billing`, `technical`, `domain`, `wordpress`, `deployment`, `account`, `general` |
| `priority` | `string` | No | `low`, `medium`, `high` (default: `medium`) |
| `message` | `string` | Yes | Initial message body |
| `related_resource_type` | `string` | No | e.g., `application`, `domain` |
| `related_resource_id` | `UUID` | No | Related resource ID |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "tkt_a1b2c3d4",
    "ticket_number": "TKT-2026-00042",
    "subject": "Cannot deploy my React app",
    "category": "deployment",
    "priority": "high",
    "status": "open",
    "message_count": 1,
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

---

#### GET `/support/tickets`

List user's support tickets.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | `string` | No | Pagination cursor |
| `limit` | `integer` | No | Items per page |
| `status` | `string` | No | Filter by status |
| `category` | `string` | No | Filter by category |
| `priority` | `string` | No | Filter by priority |

**Response (200 OK):** Returns paginated array of `SupportTicket` objects.

---

#### GET `/support/tickets/:ticketId`

Get ticket details with latest messages.

**Response (200 OK):** Returns `SupportTicket` with first 20 messages.

---

#### PATCH `/support/tickets/:ticketId`

Update ticket details.

**Request Body (all optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | `string` | No | Updated subject |
| `priority` | `string` | No | Updated priority |

---

#### POST `/support/tickets/:ticketId/close`

Close a ticket.

**Response (200 OK):**

```json
{
  "success": true,
  "data": { "status": "closed", "closed_at": "2026-07-04T10:53:10Z" }
}
```

---

#### POST `/support/tickets/:ticketId/reopen`

Reopen a closed ticket.

**Response (200 OK):**

```json
{
  "success": true,
  "data": { "status": "open" }
}
```

---

#### POST `/support/tickets/:ticketId/messages`

Add a message to a ticket.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `body` | `string` | Yes | Message body (Markdown supported) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "msg_a1b2c3d4",
    "ticket_id": "tkt_a1b2c3d4",
    "sender_id": "550e8400-e29b-41d4-a716-446655440000",
    "sender_type": "customer",
    "body": "I'm getting a build error on line 42...",
    "attachments": [],
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

---

#### GET `/support/tickets/:ticketId/messages`

List all messages in a ticket.

**Response (200 OK):** Returns paginated array of `TicketMessage` objects.

---

#### POST `/support/tickets/:ticketId/messages/:messageId/attachments`

Upload an attachment to a ticket message.

| Property | Value |
|----------|-------|
| **Content Type** | `multipart/form-data` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | `file` | Yes | Attachment (max 10MB; images, PDF, txt, log) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "att_a1b2c3d4",
    "filename": "error-screenshot.png",
    "url": "https://cdn.itbengal.com/attachments/att_a1b2c3d4.png",
    "size_bytes": 245000,
    "mime_type": "image/png"
  }
}
```

---

## 23. API Keys Endpoints

### Endpoint Summary

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/api-keys` | Create API key | Yes | 10/min |
| 2 | GET | `/api-keys` | List API keys | Yes | 100/min |
| 3 | GET | `/api-keys/:keyId` | Get key details | Yes | 100/min |
| 4 | PATCH | `/api-keys/:keyId` | Update key | Yes | 100/min |
| 5 | DELETE | `/api-keys/:keyId` | Revoke key | Yes | 10/min |
| 6 | POST | `/api-keys/:keyId/regenerate` | Regenerate secret | Yes | 5/min |

---

#### POST `/api-keys`

Create a new API key.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 10 requests / minute |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Key name (e.g., "CI/CD Pipeline") |
| `permissions` | `string[]` | Yes | Scopes: `projects:read`, `projects:write`, `deployments:write`, `applications:read`, `applications:write`, `domains:read`, `domains:write`, `billing:read` |
| `expires_at` | `string` | No | Expiry date (ISO). Null = no expiry |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "key_a1b2c3d4",
    "name": "CI/CD Pipeline",
    "key": "itb_live_k1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6",
    "key_prefix": "itb_live",
    "permissions": ["deployments:write", "applications:read"],
    "expires_at": null,
    "is_active": true,
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

> ⚠️ **Important:** The full `key` value is only returned once at creation. Store it securely.

---

#### GET `/api-keys`

List user's API keys (key values are masked).

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "key_a1b2c3d4",
      "name": "CI/CD Pipeline",
      "key_prefix": "itb_live",
      "permissions": ["deployments:write", "applications:read"],
      "last_used_at": "2026-07-04T09:30:00Z",
      "expires_at": null,
      "is_active": true,
      "created_at": "2026-07-04T10:53:10Z"
    }
  ]
}
```

---

#### GET `/api-keys/:keyId`

Get API key details.

**Response (200 OK):** Returns `ApiKey` object (key value masked).

---

#### PATCH `/api-keys/:keyId`

Update API key name, permissions, or expiry.

**Request Body (all optional):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Key name |
| `permissions` | `string[]` | No | Updated scopes |
| `expires_at` | `string` | No | New expiry |

**Response (200 OK):** Returns updated `ApiKey` object.

---

#### DELETE `/api-keys/:keyId`

Revoke an API key immediately.

**Response (200 OK):**

```json
{
  "success": true,
  "data": { "message": "API key revoked.", "is_active": false }
}
```

---

#### POST `/api-keys/:keyId/regenerate`

Regenerate the API key secret. Old key is immediately invalidated.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Rate Limit** | 5 requests / minute |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "key_a1b2c3d4",
    "key": "itb_live_p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2",
    "message": "API key regenerated. Previous key is now invalid."
  }
}
```

---

## 24. Webhooks

### 24.1 Webhook Management Endpoints

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | POST | `/webhooks` | Register webhook | Yes | 10/min |
| 2 | GET | `/webhooks` | List webhooks | Yes | 100/min |
| 3 | GET | `/webhooks/:webhookId` | Get webhook | Yes | 100/min |
| 4 | PATCH | `/webhooks/:webhookId` | Update webhook | Yes | 100/min |
| 5 | DELETE | `/webhooks/:webhookId` | Delete webhook | Yes | 10/min |
| 6 | POST | `/webhooks/:webhookId/test` | Send test event | Yes | 5/min |
| 7 | GET | `/webhooks/:webhookId/deliveries` | List deliveries | Yes | 100/min |

#### POST `/webhooks`

Register a webhook endpoint.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | HTTPS endpoint URL |
| `events` | `string[]` | Yes | Events to subscribe to |
| `secret` | `string` | No | Shared secret for HMAC verification (auto-generated if omitted) |
| `is_active` | `boolean` | No | Enable webhook (default: `true`) |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "wh_a1b2c3d4",
    "url": "https://myapp.com/webhooks/itbengal",
    "events": ["deployment.succeeded", "deployment.failed"],
    "secret": "whsec_a1b2c3d4e5f6g7h8i9j0",
    "is_active": true,
    "created_at": "2026-07-04T10:53:10Z"
  }
}
```

#### POST `/webhooks/:webhookId/test`

Send a test event to the webhook endpoint.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "delivery_id": "del_test_123",
    "status_code": 200,
    "response_time_ms": 145,
    "success": true
  }
}
```

#### GET `/webhooks/:webhookId/deliveries`

List webhook delivery attempts.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "del_a1b2c3d4",
      "event": "deployment.succeeded",
      "status_code": 200,
      "response_time_ms": 145,
      "success": true,
      "attempts": 1,
      "created_at": "2026-07-04T10:53:10Z"
    }
  ]
}
```

---

### 24.2 Webhook Event Types

| Event | Description | Key Payload Fields |
|-------|-------------|-------------------|
| `deployment.started` | Deployment build started | `deployment_id`, `application_id`, `source`, `triggered_by` |
| `deployment.succeeded` | Deployment completed successfully | `deployment_id`, `application_id`, `url`, `duration_ms` |
| `deployment.failed` | Deployment failed | `deployment_id`, `application_id`, `error_message`, `phase` |
| `application.created` | New application created | `application_id`, `project_id`, `framework`, `name` |
| `application.updated` | Application settings changed | `application_id`, `changes` |
| `application.deleted` | Application deleted | `application_id`, `project_id`, `name` |
| `domain.registered` | Domain registered | `domain_id`, `domain_name`, `expiry_date` |
| `domain.transferred` | Domain transfer completed | `domain_id`, `domain_name` |
| `domain.expired` | Domain expired | `domain_id`, `domain_name`, `expired_at` |
| `domain.renewed` | Domain renewed | `domain_id`, `domain_name`, `new_expiry_date` |
| `dns.record.created` | DNS record created | `record_id`, `domain_id`, `type`, `name`, `value` |
| `dns.record.updated` | DNS record updated | `record_id`, `domain_id`, `changes` |
| `dns.record.deleted` | DNS record deleted | `record_id`, `domain_id`, `type`, `name` |
| `wordpress.installed` | WordPress site installed | `site_id`, `domain`, `wp_version` |
| `wordpress.backup.completed` | Backup completed | `site_id`, `backup_id`, `size_mb`, `type` |
| `wordpress.malware.detected` | Malware found | `site_id`, `threats_count`, `scan_id` |
| `billing.invoice.created` | New invoice generated | `invoice_id`, `amount`, `currency`, `due_date` |
| `billing.invoice.paid` | Invoice paid | `invoice_id`, `payment_id`, `amount` |
| `billing.invoice.overdue` | Invoice overdue | `invoice_id`, `amount`, `days_overdue` |
| `subscription.created` | New subscription | `subscription_id`, `plan_id`, `billing_cycle` |
| `subscription.cancelled` | Subscription cancelled | `subscription_id`, `cancel_at`, `reason` |
| `subscription.renewed` | Subscription auto-renewed | `subscription_id`, `invoice_id`, `next_renewal` |
| `subscription.upgraded` | Plan upgrade/downgrade | `subscription_id`, `old_plan_id`, `new_plan_id` |
| `payment.completed` | Payment successful | `payment_id`, `amount`, `gateway`, `invoice_id` |
| `payment.failed` | Payment failed | `payment_id`, `amount`, `gateway`, `error` |
| `payment.refunded` | Payment refunded | `payment_id`, `refund_amount`, `reason` |
| `server.health.warning` | Server health warning | `server_id`, `metric`, `value`, `threshold` |
| `server.health.critical` | Server health critical | `server_id`, `metric`, `value`, `threshold` |
| `server.maintenance.scheduled` | Maintenance scheduled | `server_id`, `starts_at`, `estimated_duration` |
| `support.ticket.created` | New ticket | `ticket_id`, `subject`, `category`, `priority` |
| `support.ticket.replied` | Ticket reply | `ticket_id`, `message_id`, `sender_type` |
| `support.ticket.resolved` | Ticket resolved | `ticket_id`, `resolved_by` |
| `user.created` | New user registered | `user_id`, `email`, `country` |
| `user.deleted` | User account deleted | `user_id`, `email` |
| `certificate.issued` | SSL certificate issued | `domain`, `issuer`, `valid_until` |
| `certificate.expiring` | SSL certificate expiring | `domain`, `expires_at`, `days_remaining` |

---

### 24.3 Webhook Payload Format

**Standard Envelope:**

```json
{
  "id": "evt_a1b2c3d4e5f6g7h8",
  "event": "deployment.succeeded",
  "timestamp": "2026-07-04T10:53:10Z",
  "api_version": "v1",
  "data": {
    "deployment_id": "dep_a1b2c3d4",
    "application_id": "app_x1y2z3",
    "url": "https://portfolio-frontend-a1b2c3.itbengal.app",
    "duration_ms": 45000
  }
}
```

**Signature Verification:**

All webhook deliveries include an HMAC-SHA256 signature in the `X-ITBengal-Signature` header:

```
X-ITBengal-Signature: sha256=5d7e7c8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d
```

**Verification (Node.js example):**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

**Retry Policy:**

| Attempt | Delay | Description |
|---------|-------|-------------|
| 1 | Immediate | First delivery attempt |
| 2 | 1 minute | First retry |
| 3 | 5 minutes | Second retry |
| 4 | 30 minutes | Final retry |

After 4 failed attempts, the delivery is marked as failed. Webhooks receiving 5+ consecutive failures are automatically disabled.

---

### 24.4 Example Webhook Payloads

**deployment.succeeded:**

```json
{
  "id": "evt_dep_succ_001",
  "event": "deployment.succeeded",
  "timestamp": "2026-07-04T10:55:00Z",
  "api_version": "v1",
  "data": {
    "deployment_id": "dep_a1b2c3d4",
    "application_id": "app_x1y2z3",
    "application_name": "portfolio-frontend",
    "url": "https://portfolio-frontend-a1b2c3.itbengal.app",
    "source": "git",
    "git_branch": "main",
    "git_commit_sha": "abc123def456",
    "triggered_by": "550e8400-e29b-41d4-a716-446655440000",
    "build_duration_ms": 30000,
    "deploy_duration_ms": 15000
  }
}
```

**billing.invoice.paid:**

```json
{
  "id": "evt_inv_paid_001",
  "event": "billing.invoice.paid",
  "timestamp": "2026-07-04T10:55:00Z",
  "api_version": "v1",
  "data": {
    "invoice_id": "inv_x1y2z3",
    "invoice_number": "INV-2026-00042",
    "payment_id": "pay_a1b2c3d4",
    "amount": 299,
    "currency": "BDT",
    "gateway": "bkash",
    "subscription_id": "sub_a1b2c3d4"
  }
}
```

**wordpress.malware.detected:**

```json
{
  "id": "evt_wp_malware_001",
  "event": "wordpress.malware.detected",
  "timestamp": "2026-07-04T10:55:00Z",
  "api_version": "v1",
  "data": {
    "site_id": "wp_a1b2c3d4",
    "site_name": "My Blog",
    "domain": "myblog.com",
    "scan_id": "scan_x1y2z3",
    "threats_count": 3,
    "threats": [
      {
        "file": "/wp-content/plugins/old-plugin/shell.php",
        "type": "backdoor",
        "severity": "critical"
      }
    ]
  }
}
```

**server.health.critical:**

```json
{
  "id": "evt_srv_crit_001",
  "event": "server.health.critical",
  "timestamp": "2026-07-04T10:55:00Z",
  "api_version": "v1",
  "data": {
    "server_id": "srv_a1b2c3d4",
    "server_name": "react-node-01",
    "metric": "cpu_usage",
    "value": 98.5,
    "threshold": 90,
    "message": "CPU usage has exceeded critical threshold."
  }
}
```

**domain.expired:**

```json
{
  "id": "evt_dom_exp_001",
  "event": "domain.expired",
  "timestamp": "2026-07-04T10:55:00Z",
  "api_version": "v1",
  "data": {
    "domain_id": "dom_a1b2c3d4",
    "domain_name": "example.com",
    "expired_at": "2026-07-04T00:00:00Z",
    "grace_period_ends": "2026-08-03T00:00:00Z",
    "auto_renew_failed": true,
    "failure_reason": "Payment method declined"
  }
}
```

---

## 25. Authentication Flow Diagrams

### 25.1 User Registration & Email Verification

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant DB as PostgreSQL
    participant R as Redis
    participant E as Email Service

    C->>A: POST /auth/register
    A->>DB: Check email uniqueness
    DB-->>A: Email available
    A->>DB: Create user (email_verified=false)
    A->>R: Store verification token (24h TTL)
    A->>E: Send verification email
    A-->>C: 201 { user, tokens }

    Note over C: User clicks email link

    C->>A: POST /auth/verify-email { token }
    A->>R: Validate token
    R-->>A: Token valid
    A->>DB: Set email_verified=true
    A->>R: Delete token
    A-->>C: 200 { email_verified: true }
```

### 25.2 Login Flow with 2FA

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant DB as PostgreSQL
    participant R as Redis

    C->>A: POST /auth/login { email, password }
    A->>DB: Find user by email
    A->>A: Verify password (bcrypt)

    alt 2FA Disabled
        A->>R: Create session
        A->>A: Generate JWT tokens
        A-->>C: 200 { user, tokens }
    else 2FA Enabled
        A->>R: Store temp_token (5min TTL)
        A-->>C: 200 { requires_2fa: true, temp_token }

        C->>A: POST /auth/2fa/verify { code, temp_token }
        A->>R: Validate temp_token
        A->>A: Verify TOTP code
        A->>R: Create session, delete temp_token
        A->>A: Generate JWT tokens
        A-->>C: 200 { user, tokens }
    end
```

### 25.3 Token Refresh Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant R as Redis

    Note over C: Access token expired (401)

    C->>A: POST /auth/refresh { refresh_token }
    A->>R: Validate refresh token
    R-->>A: Token valid, user_id

    alt Token Valid
        A->>A: Generate new access token
        A->>A: Rotate refresh token
        A->>R: Store new refresh token, invalidate old
        A-->>C: 200 { access_token, refresh_token }
    else Token Invalid/Expired
        A-->>C: 401 { error: AUTH_004 }
        Note over C: Redirect to login
    end
```

### 25.4 Password Reset Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant DB as PostgreSQL
    participant R as Redis
    participant E as Email Service

    C->>A: POST /auth/forgot-password { email }
    A->>DB: Find user by email
    A->>R: Store reset token (1h TTL)
    A->>E: Send reset email
    A-->>C: 200 { message }

    Note over C: User clicks reset link

    C->>A: POST /auth/reset-password { token, password }
    A->>R: Validate reset token
    R-->>A: Token valid, user_id
    A->>DB: Update password hash
    A->>R: Invalidate all sessions
    A->>R: Delete reset token
    A-->>C: 200 { message: "Password reset" }
```

### 25.5 API Key Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client/CI
    participant A as API Server
    participant R as Redis
    participant DB as PostgreSQL

    C->>A: Request with X-API-Key header
    A->>R: Check key in cache
    alt Cache Hit
        R-->>A: Key data (user_id, permissions)
    else Cache Miss
        A->>DB: Lookup API key (hash match)
        DB-->>A: Key record
        A->>R: Cache key data (5min TTL)
    end
    A->>A: Check key is active & not expired
    A->>A: Verify required permissions
    A->>DB: Update last_used_at
    A-->>C: Response
```

### 25.6 Deployment Pipeline Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant Q as BullMQ Queue
    participant W as Worker Node
    participant D as Docker
    participant T as Traefik
    participant DB as PostgreSQL

    C->>A: POST /applications/:appId/deployments
    A->>DB: Create deployment (status: queued)
    A->>Q: Enqueue deployment job
    A-->>C: 201 { deployment_id, status: queued }

    Q->>W: Pick up job
    W->>DB: Update status: building
    W->>W: Clone git repo / extract ZIP
    W->>W: Install dependencies
    W->>W: Run build command
    W->>D: Build Docker image
    W->>D: Create & start container
    W->>D: Health check (HTTP GET /)

    alt Health Check Passes
        W->>T: Update routing rules
        W->>D: Remove old container
        W->>DB: Update status: live, is_current: true
        W-->>C: WebSocket: { type: complete, status: live }
    else Health Check Fails
        W->>D: Remove new container
        W->>DB: Update status: failed
        W-->>C: WebSocket: { type: error, status: failed }
    end
```

---

## 26. API Versioning Strategy

### 26.1 Versioning Approach

ITBengal uses **URL path-based versioning**:

```
https://api.itbengal.com/v1/projects
https://api.itbengal.com/v2/projects
```

### 26.2 Version Lifecycle

| Phase | Duration | Description |
|-------|----------|-------------|
| **Active** | Indefinite | Current stable version. Full support. |
| **Deprecated** | 6 months | Still functional. `Deprecation` and `Sunset` headers added. New features only on latest version. |
| **Sunset** | 3 months | Read-only. Write operations return warnings. Migration required. |
| **Removed** | — | All requests return `410 Gone`. |

### 26.3 Deprecation Headers

When a version is deprecated, all responses include:

```
Deprecation: true
Sunset: Sat, 04 Jan 2027 00:00:00 GMT
Link: <https://docs.itbengal.com/api/migration/v1-to-v2>; rel="successor-version"
```

### 26.4 Breaking vs Non-Breaking Changes

**Non-breaking (no version bump):**
- Adding new optional request fields
- Adding new response fields
- Adding new endpoints
- Adding new event types
- Adding new enum values
- Increasing rate limits

**Breaking (requires version bump):**
- Removing or renaming existing fields
- Changing field types
- Removing endpoints
- Changing authentication mechanism
- Changing error response format
- Changing pagination mechanism
- Removing enum values

### 26.5 Migration Support

Each major version migration includes:
1. **Migration Guide** — Step-by-step documentation
2. **Compatibility Mode** — `X-API-Compat: v1` header to receive v1-format responses from v2 endpoints (transitional)
3. **Changelog** — Complete list of all changes
4. **SDK Updates** — Updated client libraries with migration helpers

---

*End of API Documentation*

> **Document maintained by:** ITBengal Engineering Team
> **Last review:** 2026-07-04
> **Next review:** 2026-08-04
