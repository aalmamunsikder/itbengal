# ITBengal Hosting Platform — Phase 1 MVP Implementation Plan

## Overview

Build a modern hosting platform combining the simplicity of Vercel/Netlify with managed WordPress like Cloudways. Phase 1 delivers core infrastructure, authentication, React hosting, WordPress hosting, and bKash payment integration — targeting first paying customer within 3 months.

**Tech Stack:** TypeScript monorepo (Turborepo + npm workspaces), Next.js 15 (App Router), Express.js 4, Prisma 6, PostgreSQL 16, Redis 7, BullMQ, Docker, Traefik v3.

---

## User Review Required

> [!IMPORTANT]
> **Monorepo Scope**: The documentation specifies a large monorepo with 5 apps, 6 shared packages, and 5 services. For Phase 1, I propose building incrementally — starting with the foundational packages and Sprint 1 deliverables, then expanding sprint by sprint. This avoids generating 200+ empty placeholder files upfront.

> [!IMPORTANT]
> **Infrastructure**: The docs assume 3 VPS servers (Platform, React, WordPress). Since we're building the codebase locally first, I'll focus on application code with Docker Compose for local development. Server provisioning (Ansible playbooks) will be scaffolded but not executed until you have VPS servers ready.

> [!WARNING]
> **Scope Management**: The full documentation suite (29 documents) describes a 12-month, 9-person team effort. As a single AI assistant, I'll implement Sprint 1–2 (Foundation + Auth) first, then proceed sprint-by-sprint based on your feedback. Each sprint builds on the previous one.

---

## Open Questions

> [!IMPORTANT]
> **Domain**: What will the production domain be? (e.g., `itbengal.com`, `itbengal.dev`?) This affects CORS, cookie domains, and Traefik config.

> [!IMPORTANT]
> **Email Provider**: The docs mention SMTP/Resend for email. Which email service do you want to use for verification emails and notifications? (Resend, SendGrid, Mailgun, or raw SMTP?)

> [!IMPORTANT]
> **bKash Credentials**: Do you already have bKash merchant API credentials (sandbox or production)? This determines whether we can test payment flows early.

> [!IMPORTANT]
> **GitHub OAuth App**: Do you have a GitHub OAuth application registered for Git repository integration? We'll need Client ID and Secret for the React hosting Git import feature.

---

## Proposed Changes — Sprint-by-Sprint

The implementation follows the documented milestone structure (10 sprints across 4 milestones). I'll execute Sprint 1 first, then proceed sequentially.

---

### Sprint 1: Monorepo Foundation & Infrastructure Setup (Weeks 1–2)

This is the critical bootstrap sprint. Everything else depends on this.

---

#### [NEW] Root Monorepo Configuration

| File | Purpose |
|---|---|
| `package.json` | Monorepo root with npm workspaces (`apps/*`, `packages/*`, `services/*`) |
| `turbo.json` | Turborepo pipeline: build, dev, lint, test, db:generate, db:migrate |
| `tsconfig.json` | Base TypeScript config (ES2022, NodeNext, strict) |
| `eslint.config.mjs` | Flat ESLint 9 config with TypeScript rules |
| `.prettierrc` | Prettier config (single quotes, trailing commas, 2-space indent) |
| `.gitignore` | Node/Docker/IDE ignores |
| `.nvmrc` | Node 20 LTS pinning |
| `.husky/pre-commit` | lint-staged hook |

---

#### [NEW] `packages/types/` — Shared TypeScript Types

Shared DTOs, enums, and interfaces consumed by all workspaces.

| File | Contents |
|---|---|
| `src/index.ts` | Barrel export |
| `src/auth.ts` | `User`, `Session`, `LoginRequest`, `RegisterRequest`, `JWTPayload`, `AuthResponse` |
| `src/project.ts` | `Project`, `Framework`, `GitProvider`, `ProjectStatus` |
| `src/deployment.ts` | `Deployment`, `DeploymentStatus`, `DeploymentTrigger`, `BuildLog` |
| `src/server.ts` | `ServerNode`, `ServerType`, `ServerStatus`, `HealthScore` |
| `src/billing.ts` | `Plan`, `Subscription`, `Invoice`, `Payment`, `PaymentMethod`, `PlanTier` |
| `src/wordpress.ts` | `WordPressSite`, `Backup`, `BackupType`, `BackupStatus` |
| `src/domain.ts` | `Domain`, `DNSRecord`, `DNSRecordType`, `DomainStatus` |
| `src/common.ts` | `PaginatedResponse`, `ApiError`, `ApiResponse`, `SortOrder` |
| `src/enums.ts` | All shared enums |
| `package.json` | `@itbengal/types` workspace package |
| `tsconfig.json` | Extends root tsconfig |

---

#### [NEW] `packages/database/` — Prisma ORM & Schema

PostgreSQL schema with Prisma, covering all Phase 1 tables (~18 tables).

| File | Contents |
|---|---|
| `prisma/schema.prisma` | Full Phase 1 schema: users, organizations, sessions, projects, applications, deployments, environment_variables, ssl_certificates, server_nodes, wordpress_sites, backups, plans, subscriptions, invoices, invoice_items, payments, orders, audit_logs |
| `prisma/seed.ts` | Seed data: default admin user, hosting plans (5 React tiers + 5 WordPress tiers), initial server nodes |
| `src/client.ts` | Prisma client singleton (connection pooling, logging) |
| `src/index.ts` | Barrel export |
| `package.json` | `@itbengal/database` with Prisma as dependency |
| `tsconfig.json` | Extends root |

**Schema highlights:**
- UUID v4 primary keys everywhere
- Soft deletes (`deleted_at`) on core entities
- Timestamps with auto-update triggers
- Enums via CHECK constraints
- JSONB for flexible metadata
- Indexes on foreign keys and common query patterns
- Partial indexes on `deleted_at IS NULL`

---

#### [NEW] `packages/utils/` — Common Utilities

| File | Contents |
|---|---|
| `src/crypto.ts` | AES-256-GCM encrypt/decrypt, password hashing (bcrypt), random token generation |
| `src/jwt.ts` | RS256 JWT sign/verify, token pair generation, refresh token logic |
| `src/formatters.ts` | Date, currency (BDT/USD), file size, duration formatters |
| `src/validators.ts` | Email, password complexity, domain name, IP address validators |
| `src/pagination.ts` | Cursor/offset pagination helpers |
| `src/apiResponse.ts` | Standardized API response/error builders |
| `src/constants.ts` | App-wide constants (rate limits, cache TTLs, error codes) |
| `src/index.ts` | Barrel export |
| `package.json` | `@itbengal/utils` |

---

#### [NEW] `packages/logger/` — Structured Logging

| File | Contents |
|---|---|
| `src/index.ts` | Winston logger with JSON transport, console transport, Loki transport |
| `src/middleware.ts` | Express request logging middleware (Pino-style) |
| `package.json` | `@itbengal/logger` |

---

#### [NEW] `packages/config/` — Shared Configs

| File | Contents |
|---|---|
| `eslint/base.js` | Base ESLint config |
| `eslint/next.js` | Next.js ESLint config |
| `typescript/base.json` | Base tsconfig |
| `typescript/next.json` | Next.js tsconfig |
| `tailwind/base.ts` | Shared Tailwind config with ITBengal design tokens |
| `prettier/base.json` | Prettier config |
| `package.json` | `@itbengal/config` |

---

#### [NEW] `apps/api/` — Express.js API Boilerplate

Core API server with middleware chain, health endpoint, and foundational structure.

| File | Contents |
|---|---|
| `src/index.ts` | Express app bootstrap, graceful shutdown |
| `src/app.ts` | Middleware chain: CORS → Helmet → Rate Limiter → Body Parser → Logger → Routes → Error Handler |
| `src/config/app.ts` | App config from environment variables |
| `src/config/database.ts` | Database connection config |
| `src/config/redis.ts` | Redis connection config |
| `src/config/cors.ts` | CORS whitelist config |
| `src/config/rateLimit.ts` | Rate limiting tiers config |
| `src/middleware/errorHandler.ts` | Global error handler with structured JSON responses |
| `src/middleware/logger.ts` | Request/response logging middleware |
| `src/middleware/cors.ts` | CORS middleware |
| `src/middleware/rateLimiter.ts` | Redis-backed rate limiter (express-rate-limit + rate-limit-redis) |
| `src/middleware/validator.ts` | Zod schema validation middleware |
| `src/middleware/pagination.ts` | Pagination query parameter parsing |
| `src/routes/v1/index.ts` | API v1 route aggregator |
| `src/routes/v1/health.routes.ts` | Health check endpoint |
| `src/utils/apiResponse.ts` | Response helpers: success, error, paginated |
| `src/utils/apiError.ts` | Custom error classes (NotFound, Unauthorized, Forbidden, ValidationError, etc.) |
| `Dockerfile` | Multi-stage Docker build |
| `package.json` | `@itbengal/api` |
| `tsconfig.json` | Extends root |

---

#### [NEW] `apps/dashboard/` — Next.js Customer Dashboard Boilerplate

| File | Contents |
|---|---|
| `src/app/layout.tsx` | Root layout with providers (theme, auth, query) |
| `src/app/page.tsx` | Landing redirect to dashboard |
| `src/app/(auth)/layout.tsx` | Auth pages layout (centered card) |
| `src/app/(auth)/login/page.tsx` | Login page shell |
| `src/app/(auth)/register/page.tsx` | Register page shell |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout (sidebar + header + main) |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard overview shell |
| `src/middleware.ts` | Auth guard middleware |
| `src/lib/api.ts` | Fetch client with interceptors |
| `src/lib/auth.ts` | Token management (cookies) |
| `src/stores/authStore.ts` | Zustand auth store |
| `src/stores/themeStore.ts` | Zustand theme store (dark/light) |
| `src/styles/globals.css` | Tailwind directives + CSS custom properties |
| `src/styles/variables.css` | Design tokens (colors, spacing, typography) |
| `next.config.ts` | Next.js config |
| `tailwind.config.ts` | Tailwind config extending shared |
| `postcss.config.js` | PostCSS config |
| `Dockerfile` | Multi-stage Docker build |
| `package.json` | `@itbengal/dashboard` |

---

#### [NEW] `apps/admin/` — Next.js Admin Dashboard Boilerplate

Same structural pattern as customer dashboard, with admin-specific route group.

| File | Contents |
|---|---|
| `src/app/(admin)/layout.tsx` | Admin layout with admin sidebar |
| `src/app/(admin)/dashboard/page.tsx` | Admin dashboard overview shell |
| Remaining structure | Mirrors dashboard structure with admin-specific routes |

---

#### [NEW] `infrastructure/` — Docker & DevOps

| File | Contents |
|---|---|
| `docker/Dockerfile.api` | API server Dockerfile |
| `docker/Dockerfile.dashboard` | Dashboard Dockerfile |
| `docker/Dockerfile.admin` | Admin Dockerfile |
| `docker-compose.yml` | Full local dev stack: PostgreSQL, Redis, API, Dashboard, Admin, Traefik |
| `docker-compose.dev.yml` | Dev overrides (hot reload, debug ports) |
| `traefik/traefik.yml` | Traefik static config (entrypoints, providers, dashboard) |
| `traefik/dynamic/` | Dynamic routing configs |
| `.env.example` | All environment variables with descriptions |

---

### Sprint 2: Authentication System (Weeks 3–4)

Depends on: Sprint 1 complete.

---

#### [NEW/MODIFY] `apps/api/` — Auth Controllers, Services, Repositories

| File | Purpose |
|---|---|
| `src/controllers/auth.controller.ts` | Register, login, logout, refresh token, verify email, forgot/reset password, 2FA setup/verify |
| `src/services/auth.service.ts` | Auth business logic, token management, email verification |
| `src/services/user.service.ts` | User CRUD, profile management |
| `src/services/email.service.ts` | Email sending via configured provider |
| `src/repositories/user.repository.ts` | Prisma user queries |
| `src/middleware/auth.ts` | JWT verification middleware, token extraction from cookies |
| `src/middleware/admin.ts` | Admin role check middleware |
| `src/validators/auth.validator.ts` | Zod schemas for all auth endpoints |
| `src/routes/v1/auth.routes.ts` | Auth API routes |
| `src/routes/v1/user.routes.ts` | User API routes |
| `src/config/mail.ts` | Email provider config |
| `src/jobs/notification.job.ts` | BullMQ email sending processor |

**Auth Features:**
- Email/password registration with complexity validation (10+ chars, uppercase, lowercase, digit, special)
- Email verification via token (24h expiry)
- JWT RS256 (15min access token) + refresh token (7 days, stored in Redis)
- HTTP-only secure same-site cookies
- Account lockout (5 failures in 15min → 30min lock)
- 2FA TOTP setup (QR code) with AES-256-GCM encrypted secret
- 10 backup recovery codes (single-use, 8-char)
- Password reset flow
- Session management (30-min sliding idle, 7-day absolute)
- Redis token blacklist on logout
- RBAC (Super Admin, Admin, Customer Owner, Customer Member, Customer Viewer)

---

#### [NEW/MODIFY] `apps/dashboard/` — Auth UI Pages

| File | Purpose |
|---|---|
| `src/app/(auth)/login/page.tsx` | Login form with email/password, 2FA step, remember me |
| `src/app/(auth)/register/page.tsx` | Registration form with password strength indicator |
| `src/app/(auth)/forgot-password/page.tsx` | Forgot password email form |
| `src/app/(auth)/reset-password/page.tsx` | Password reset with token |
| `src/app/(auth)/verify-email/page.tsx` | Email verification handler |
| `src/app/(auth)/two-factor/page.tsx` | 2FA verification page |
| `src/hooks/useAuth.ts` | Auth hook (login, register, logout, refresh) |
| `src/components/auth/LoginForm.tsx` | Login form component |
| `src/components/auth/RegisterForm.tsx` | Registration form component |
| `src/components/auth/PasswordStrength.tsx` | Password strength indicator |
| `src/components/auth/TwoFactorSetup.tsx` | 2FA QR code setup |

---

### Sprint 3: Dashboard Shells & API Foundation (Weeks 5–6)

---

#### [NEW] `packages/ui/` — Shared UI Component Library

Reusable React component library bundled with tsup, consumed by dashboard and admin.

| Component | Description |
|---|---|
| `Button` | Primary, secondary, ghost, danger variants with loading state |
| `Input` | Text input with label, error, helper text |
| `Card` | Content card with header, body, footer |
| `Modal` | Accessible dialog with overlay |
| `Table` | Data table with sorting, pagination |
| `Badge` | Status badges (success, warning, error, info) |
| `Toast` | Toast notifications (success, error, info, warning) |
| `Skeleton` | Loading skeletons |
| `Dropdown` | Dropdown menu |
| `Tabs` | Tab navigation |
| `Avatar` | User avatar with fallback |
| `Breadcrumbs` | Navigation breadcrumbs |
| `EmptyState` | Empty state illustrations |
| `Pagination` | Page navigation |
| `Sidebar` | Collapsible sidebar navigation |
| `ThemeToggle` | Dark/light mode toggle |
| `CodeBlock` | Syntax-highlighted code display |
| `FileTree` | File/folder tree view |
| `Terminal` | Terminal-style log output |
| `CopyButton` | Click-to-copy with feedback |

---

#### [MODIFY] `apps/dashboard/` — Customer Dashboard Pages

Full dashboard layout with navigation and page shells for all Phase 1 sections.

| Page | Features |
|---|---|
| Dashboard Overview | Stats cards, recent deployments, quick actions |
| Projects List | Project cards with status, framework icon, last deploy |
| Project Detail | Tabs: Deployments, Environment, Domains, Settings |
| Profile | User info, avatar, email, password change |
| Security | 2FA management, active sessions, API keys |
| Settings | Preferences, notifications, danger zone |

---

#### [MODIFY] `apps/admin/` — Admin Dashboard Pages

| Page | Features |
|---|---|
| Admin Dashboard | System health, customer count, revenue, server status |
| Customer List | Searchable/filterable customer table with actions |
| Server Overview | Node health cards with CPU/RAM/storage metrics |

---

#### [MODIFY] `apps/api/` — CRUD APIs

| Endpoint Group | Routes |
|---|---|
| Users | GET/PATCH profile, change password, manage 2FA |
| Projects | Full CRUD with pagination, filtering, sorting |
| Admin Users | List, view, suspend, delete users |
| Admin Servers | List, view, health check nodes |
| Health | Detailed health check (DB, Redis, disk, memory) |

---

### Sprint 4–6: React Hosting MVP (Weeks 7–12)

---

#### [NEW] `services/deployment-engine/` — Deployment Engine

The core deployment pipeline for React/Next.js/Vue/Angular/Svelte/Astro/Vite/HTML apps.

| Component | Files | Purpose |
|---|---|---|
| **Builders** | `base.builder.ts`, `react.builder.ts`, `nextjs.builder.ts`, `vite.builder.ts`, `vue.builder.ts`, `angular.builder.ts`, `svelte.builder.ts`, `astro.builder.ts`, `static.builder.ts`, `detector.ts` | Strategy pattern — auto-detect framework from package.json, generate appropriate Dockerfile |
| **Docker** | `client.ts`, `container.manager.ts`, `image.manager.ts`, `network.manager.ts` | Dockerode-based container lifecycle management |
| **Git** | `clone.ts`, `github.provider.ts` | Git clone with OAuth, branch checkout |
| **Proxy** | `traefik.manager.ts`, `ssl.manager.ts`, `routing.ts` | Dynamic Traefik routing, Let's Encrypt SSL |
| **Queue** | `deployment.queue.ts`, `deployment.worker.ts`, `deployment.scheduler.ts` | BullMQ deployment pipeline with priority levels |
| **Health** | `checker.ts`, `monitor.ts` | Container health checks (HTTP GET every 5s) |
| **Templates** | `Dockerfile.react`, `Dockerfile.nextjs`, etc. | Pre-built Dockerfile templates per framework |
| **Logs** | `log.manager.ts` | Build/deployment log capture, WebSocket streaming |

---

#### [MODIFY] `apps/api/` — Deployment & Project APIs

| File | Purpose |
|---|---|
| `src/controllers/project.controller.ts` | Create project (Git import or ZIP), manage settings |
| `src/controllers/deployment.controller.ts` | Trigger deploy, view status, logs, rollback |
| `src/services/deployment.service.ts` | Orchestrate deployment pipeline via BullMQ |
| `src/services/git.service.ts` | GitHub OAuth, repo listing, branch listing |
| `src/routes/v1/project.routes.ts` | Project CRUD routes |
| `src/routes/v1/deployment.routes.ts` | Deployment routes |
| WebSocket handler | Real-time build log streaming |

---

#### [MODIFY] `apps/dashboard/` — React Hosting UI

| Page | Features |
|---|---|
| New Project | Framework selector, Git import (GitHub OAuth), ZIP upload |
| Project Overview | Current deployment status, domain, framework badge |
| Deployments | Deployment history with status, duration, commit info |
| Deployment Detail | Real-time build logs (terminal-style), status timeline |
| Environment Variables | Add/edit/delete env vars, encrypted display |
| Domains | Custom domain setup with CNAME verification, SSL status |
| Settings | Build command, output directory, Node version, danger zone |
| Rollback | One-click rollback to previous deployment |

---

### Sprint 7–8: WordPress Hosting MVP (Weeks 13–16)

---

#### [NEW] `services/wordpress-manager/` — WordPress Lifecycle

| Component | Purpose |
|---|---|
| `provisioner.ts` | One-click WP install: Docker container (PHP-FPM + Nginx + MariaDB), wp-cli setup |
| `manager.ts` | Start/stop/restart WordPress sites |
| `backup.manager.ts` | Automated daily backups (mysqldump + tar.gz + AES-256-CBC encryption) |
| `restore.manager.ts` | Backup restoration with verification |
| `file.explorer.ts` | Browse/upload/download/edit/delete files |
| `database.manager.ts` | Table browser, SQL editor, export/import |
| `security.scanner.ts` | ClamAV malware scanning |

---

#### [MODIFY] Dashboard + API — WordPress UI & APIs

| Feature | Description |
|---|---|
| WordPress Sites List | Site cards with status, WP version, domain |
| One-Click Install | Version selector, site title, admin credentials |
| Site Management | File manager, DB manager, backups, settings |
| Backup Management | View/restore/download backups |

---

### Sprint 9–10: Payment & Billing (Weeks 17–20)

---

#### [NEW] `services/billing-service/` — Payment Processing

| Component | Purpose |
|---|---|
| `bkash/client.ts` | bKash API integration (create/execute/query payment) |
| `bkash/webhook.ts` | IPN callback handler |
| `gateway.factory.ts` | Payment gateway factory pattern |
| `subscription.manager.ts` | Subscription lifecycle (create, renew, cancel, upgrade/downgrade) |
| `invoice.generator.ts` | Invoice PDF generation |
| `proration.ts` | Plan upgrade/downgrade proration calculation |

---

#### [MODIFY] Dashboard + API — Billing UI & APIs

| Feature | Description |
|---|---|
| Pricing Page | 5-tier pricing cards (React + WordPress) |
| Checkout Flow | Plan selection → bKash payment → confirmation |
| Billing Dashboard | Active subscription, upcoming invoice, payment history |
| Invoices | Invoice list, PDF download, email delivery |
| Plan Management | Upgrade/downgrade with prorated billing |

---

## Verification Plan

### Automated Tests

```bash
# Run all tests
npx turbo test

# Run specific workspace tests
npx turbo test --filter=@itbengal/api
npx turbo test --filter=@itbengal/utils

# Database migrations
npx turbo db:migrate

# Build check
npx turbo build

# Lint
npx turbo lint
```

### Per-Sprint Verification

| Sprint | Verification |
|---|---|
| Sprint 1 | `turbo build` succeeds, `docker compose up` starts all services, health endpoint returns 200, DB migrations run |
| Sprint 2 | Auth flow E2E: register → verify email → login → 2FA → refresh → logout. 80% test coverage on auth service |
| Sprint 3 | Dashboard loads, dark/light mode works, all CRUD APIs return proper responses, pagination works |
| Sprint 4-6 | All 8 frameworks deploy successfully, deploy < 5min, SSL auto-provisions, real-time logs stream, rollback works |
| Sprint 7-8 | WP installs < 3min, file manager CRUD works, DB export/import, backup restore completes |
| Sprint 9-10 | bKash payment succeeds (sandbox), invoices generated, plan limits enforced, auto-renewal works |

### Manual Verification
- Visual review of dashboard UI in both dark and light modes
- Mobile responsiveness testing
- Cross-browser testing (Chrome, Firefox, Safari)
- Load testing with 20 concurrent deployments (Sprint 6 gate)
