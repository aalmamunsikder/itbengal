# 23. Detailed Folder Structure

> **ITBengal Hosting Platform — Engineering Specification**
> **Document Version:** 1.0.0
> **Last Updated:** 2026-07-04
> **Status:** Approved

---

## Table of Contents

1. [apps/dashboard/ — Customer Dashboard](#1-appsdashboard--customer-dashboard)
2. [apps/admin/ — Admin Panel](#2-appsadmin--admin-panel)
3. [apps/api/ — Platform API](#3-appsapi--platform-api)
4. [services/deployment-engine/](#4-servicesdeployment-engine)
5. [services/wordpress-manager/](#5-serviceswordpress-manager)
6. [services/domain-service/](#6-servicesdomain-service)
7. [services/billing-service/](#7-servicesbilling-service)
8. [services/notification-service/](#8-servicesnotification-service)
9. [Key Files Reference](#9-key-files-reference)

---

## 1. apps/dashboard/ — Customer Dashboard

The customer-facing Next.js application using App Router, Tailwind CSS, and Zustand for state management.

```
apps/dashboard/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── og-image.png                       # Open Graph default image
│   └── manifest.json                      # PWA manifest
│
├── src/
│   ├── app/                               # Next.js App Router
│   │   ├── layout.tsx                     # Root layout (providers, fonts, metadata)
│   │   ├── page.tsx                       # Landing / redirect to dashboard
│   │   ├── loading.tsx                    # Root loading skeleton
│   │   ├── error.tsx                      # Root error boundary
│   │   ├── not-found.tsx                  # 404 page
│   │   ├── globals.css                    # Global styles import
│   │   │
│   │   ├── (auth)/                        # Auth route group (no layout chrome)
│   │   │   ├── layout.tsx                 # Auth layout (centered, minimal)
│   │   │   ├── login/
│   │   │   │   └── page.tsx               # Email/password + OAuth login
│   │   │   ├── register/
│   │   │   │   └── page.tsx               # Account registration
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx               # Password reset request
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx               # Password reset form
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx               # Email verification
│   │   │   └── two-factor/
│   │   │       └── page.tsx               # 2FA challenge
│   │   │
│   │   ├── (dashboard)/                   # Dashboard route group (with sidebar)
│   │   │   ├── layout.tsx                 # Dashboard shell (sidebar + header)
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx               # Overview: stats, recent activity
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx               # Project list with filters
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # Create new project wizard
│   │   │   │   └── [projectId]/
│   │   │   │       ├── layout.tsx         # Project detail layout (tabs)
│   │   │   │       ├── page.tsx           # Project overview
│   │   │   │       ├── deployments/
│   │   │   │       │   ├── page.tsx       # Deployment history
│   │   │   │       │   └── [deploymentId]/
│   │   │   │       │       └── page.tsx   # Deployment detail + logs
│   │   │   │       ├── settings/
│   │   │   │       │   └── page.tsx       # Project settings
│   │   │   │       ├── environment/
│   │   │   │       │   └── page.tsx       # Environment variables
│   │   │   │       ├── domains/
│   │   │   │       │   └── page.tsx       # Project custom domains
│   │   │   │       ├── analytics/
│   │   │   │       │   └── page.tsx       # Usage analytics
│   │   │   │       └── logs/
│   │   │   │           └── page.tsx       # Application logs
│   │   │   │
│   │   │   ├── wordpress/
│   │   │   │   ├── page.tsx               # WordPress sites list
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # New WordPress site setup
│   │   │   │   └── [siteId]/
│   │   │   │       ├── layout.tsx         # WP site layout (tabs)
│   │   │   │       ├── page.tsx           # Site overview
│   │   │   │       ├── file-manager/
│   │   │   │       │   └── page.tsx       # File browser
│   │   │   │       ├── database/
│   │   │   │       │   └── page.tsx       # Database manager
│   │   │   │       ├── backups/
│   │   │   │       │   └── page.tsx       # Backup management
│   │   │   │       ├── staging/
│   │   │   │       │   └── page.tsx       # Staging environments
│   │   │   │       ├── security/
│   │   │   │       │   └── page.tsx       # Security & malware scan
│   │   │   │       ├── performance/
│   │   │   │       │   └── page.tsx       # Caching & optimization
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx       # WP site settings
│   │   │   │
│   │   │   ├── domains/
│   │   │   │   ├── page.tsx               # Domain management list
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx           # Domain registration search
│   │   │   │   ├── transfer/
│   │   │   │   │   └── page.tsx           # Domain transfer wizard
│   │   │   │   └── [domainId]/
│   │   │   │       ├── page.tsx           # Domain detail
│   │   │   │       ├── dns/
│   │   │   │       │   └── page.tsx       # DNS record management
│   │   │   │       ├── ssl/
│   │   │   │       │   └── page.tsx       # SSL certificate status
│   │   │   │       ├── nameservers/
│   │   │   │       │   └── page.tsx       # Nameserver configuration
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx       # Domain settings / WHOIS
│   │   │   │
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx               # Billing overview
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── invoices/
│   │   │   │   │   ├── page.tsx           # Invoice history
│   │   │   │   │   └── [invoiceId]/
│   │   │   │   │       └── page.tsx       # Invoice detail / PDF
│   │   │   │   ├── subscriptions/
│   │   │   │   │   └── page.tsx           # Active subscriptions
│   │   │   │   ├── payment-methods/
│   │   │   │   │   └── page.tsx           # Saved payment methods
│   │   │   │   └── usage/
│   │   │   │       └── page.tsx           # Resource usage breakdown
│   │   │   │
│   │   │   ├── support/
│   │   │   │   ├── page.tsx               # Support ticket list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # Create support ticket
│   │   │   │   └── [ticketId]/
│   │   │   │       └── page.tsx           # Ticket conversation
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx               # Notification center
│   │   │   │
│   │   │   ├── organizations/
│   │   │   │   ├── page.tsx               # Organization list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # Create organization
│   │   │   │   └── [orgId]/
│   │   │   │       ├── page.tsx           # Org overview
│   │   │   │       ├── members/
│   │   │   │       │   └── page.tsx       # Team member management
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx       # Org settings
│   │   │   │
│   │   │   ├── profile/
│   │   │   │   └── page.tsx               # User profile & preferences
│   │   │   │
│   │   │   ├── security/
│   │   │   │   └── page.tsx               # 2FA, sessions, API keys
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx               # Account settings
│   │   │
│   │   └── api/                           # Next.js API routes (if needed)
│   │       └── health/
│   │           └── route.ts               # Health check endpoint
│   │
│   ├── components/                        # React components
│   │   ├── common/                        # Shared across all pages
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   ├── CopyButton.tsx
│   │   │   ├── StatusIndicator.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── index.ts                  # Barrel export
│   │   │
│   │   ├── layout/                        # Layout components
│   │   │   ├── Sidebar.tsx                # Main navigation sidebar
│   │   │   ├── Header.tsx                 # Top header bar
│   │   │   ├── Footer.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── MobileNav.tsx              # Mobile navigation drawer
│   │   │   ├── ThemeToggle.tsx            # Dark/light mode toggle
│   │   │   ├── NotificationBell.tsx       # Notification dropdown
│   │   │   ├── UserMenu.tsx               # User profile dropdown
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/                     # Dashboard-specific components
│   │   │   ├── StatsGrid.tsx              # KPI stat cards
│   │   │   ├── RecentActivity.tsx         # Recent activity feed
│   │   │   ├── QuickActions.tsx           # Quick action shortcuts
│   │   │   ├── ResourceUsageChart.tsx     # Usage visualization
│   │   │   └── index.ts
│   │   │
│   │   ├── projects/                      # Project-related components
│   │   │   ├── ProjectCard.tsx            # Project list card
│   │   │   ├── ProjectGrid.tsx            # Project grid layout
│   │   │   ├── CreateProjectWizard.tsx    # Multi-step project creation
│   │   │   ├── FrameworkSelector.tsx      # Framework detection/selection
│   │   │   ├── GitRepositoryInput.tsx     # Git repo URL input
│   │   │   ├── EnvironmentVarEditor.tsx   # Env var key-value editor
│   │   │   ├── BuildSettings.tsx          # Build configuration form
│   │   │   └── index.ts
│   │   │
│   │   ├── deployments/                   # Deployment-related components
│   │   │   ├── DeploymentList.tsx         # Deployment history list
│   │   │   ├── DeploymentCard.tsx         # Individual deployment card
│   │   │   ├── DeploymentStatus.tsx       # Status badge with animation
│   │   │   ├── BuildLogViewer.tsx         # Real-time build log stream
│   │   │   ├── RollbackDialog.tsx         # Rollback confirmation
│   │   │   └── index.ts
│   │   │
│   │   ├── wordpress/                     # WordPress-specific components
│   │   │   ├── WPSiteCard.tsx
│   │   │   ├── FileExplorer.tsx           # File manager tree view
│   │   │   ├── DatabaseBrowser.tsx        # SQL table browser
│   │   │   ├── BackupManager.tsx
│   │   │   ├── StagingManager.tsx
│   │   │   ├── MalwareScanResults.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── domains/                       # Domain-related components
│   │   │   ├── DomainCard.tsx
│   │   │   ├── DomainSearch.tsx           # TLD availability search
│   │   │   ├── DNSRecordEditor.tsx        # DNS record CRUD
│   │   │   ├── SSLStatus.tsx
│   │   │   ├── NameserverConfig.tsx
│   │   │   ├── WHOISInfo.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── billing/                       # Billing-related components
│   │   │   ├── PricingTable.tsx           # Plan comparison
│   │   │   ├── InvoiceTable.tsx           # Invoice list
│   │   │   ├── PaymentMethodCard.tsx      # Saved payment display
│   │   │   ├── CheckoutForm.tsx           # Payment form (bKash/Stripe)
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── UsageBreakdown.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── support/                       # Support-related components
│   │   │   ├── TicketList.tsx
│   │   │   ├── TicketThread.tsx           # Conversation thread
│   │   │   ├── CreateTicketForm.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── settings/                      # Settings-related components
│   │       ├── ProfileForm.tsx
│   │       ├── SecuritySettings.tsx
│   │       ├── APIKeyManager.tsx
│   │       ├── NotificationPreferences.tsx
│   │       └── index.ts
│   │
│   ├── hooks/                             # Custom React hooks
│   │   ├── useAuth.ts                     # Authentication state & actions
│   │   ├── useProjects.ts                 # Project CRUD operations
│   │   ├── useDeployments.ts              # Deployment management
│   │   ├── useDomains.ts                  # Domain operations
│   │   ├── useBilling.ts                  # Billing & subscriptions
│   │   ├── useWordPress.ts                # WordPress site operations
│   │   ├── useSupport.ts                  # Support ticket operations
│   │   ├── useOrganizations.ts            # Organization management
│   │   ├── useNotifications.ts            # Notification state
│   │   ├── useWebSocket.ts                # WebSocket connection manager
│   │   ├── useDebounce.ts                 # Input debouncing
│   │   ├── useInfiniteScroll.ts           # Infinite scroll pagination
│   │   ├── useMediaQuery.ts               # Responsive breakpoints
│   │   ├── useClipboard.ts                # Copy to clipboard
│   │   ├── useLocalStorage.ts             # Local storage with SSR safety
│   │   └── index.ts
│   │
│   ├── lib/                               # Core library code
│   │   ├── api.ts                         # Axios/fetch API client instance
│   │   ├── auth.ts                        # Auth token management
│   │   ├── utils.ts                       # General utility functions
│   │   ├── constants.ts                   # App-wide constants
│   │   ├── validators.ts                  # Form validation schemas (Zod)
│   │   ├── formatters.ts                  # Date, currency, byte formatters
│   │   └── websocket.ts                   # WebSocket client setup
│   │
│   ├── stores/                            # Zustand state stores
│   │   ├── authStore.ts                   # Auth state (user, tokens)
│   │   ├── projectStore.ts                # Active project state
│   │   ├── notificationStore.ts           # In-app notification queue
│   │   ├── themeStore.ts                  # Theme preference (dark/light)
│   │   ├── sidebarStore.ts                # Sidebar collapsed state
│   │   └── index.ts
│   │
│   ├── styles/                            # Global styles
│   │   ├── globals.css                    # Tailwind directives + custom CSS
│   │   └── variables.css                  # CSS custom properties (tokens)
│   │
│   └── types/                             # Dashboard-specific types
│       ├── navigation.ts                  # Sidebar/menu types
│       ├── forms.ts                       # Form state types
│       └── index.ts
│
├── next.config.ts                         # Next.js configuration
├── tailwind.config.ts                     # Tailwind configuration (extends preset)
├── postcss.config.js                      # PostCSS configuration
├── tsconfig.json                          # TypeScript configuration
├── middleware.ts                          # Next.js middleware (auth guard)
├── package.json
├── Dockerfile
└── .env.local                             # Local environment overrides
```

---

## 2. apps/admin/ — Admin Panel

The internal administration panel follows the same structural pattern as the dashboard but with admin-specific routes and components.

```
apps/admin/
├── public/
│   ├── favicon.ico
│   └── logo-admin.svg
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout
│   │   ├── page.tsx                       # Redirect to admin dashboard
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx               # Admin-only login
│   │   │
│   │   └── (admin)/                       # Admin route group
│   │       ├── layout.tsx                 # Admin shell (sidebar + header)
│   │       │
│   │       ├── dashboard/
│   │       │   └── page.tsx               # Admin KPI overview
│   │       │
│   │       ├── customers/
│   │       │   ├── page.tsx               # Customer list with search/filter
│   │       │   └── [customerId]/
│   │       │       ├── page.tsx           # Customer detail & activity
│   │       │       ├── projects/
│   │       │       │   └── page.tsx       # Customer's projects
│   │       │       ├── billing/
│   │       │       │   └── page.tsx       # Customer billing history
│   │       │       └── actions/
│   │       │           └── page.tsx       # Suspend/ban/impersonate
│   │       │
│   │       ├── orders/
│   │       │   ├── page.tsx               # All orders
│   │       │   └── [orderId]/
│   │       │       └── page.tsx           # Order detail
│   │       │
│   │       ├── servers/
│   │       │   ├── page.tsx               # Server fleet overview
│   │       │   ├── react-nodes/
│   │       │   │   ├── page.tsx           # React hosting nodes
│   │       │   │   └── [nodeId]/
│   │       │   │       └── page.tsx       # Node health & containers
│   │       │   └── wp-nodes/
│   │       │       ├── page.tsx           # WordPress hosting nodes
│   │       │       └── [nodeId]/
│   │       │           └── page.tsx       # Node detail
│   │       │
│   │       ├── deployments/
│   │       │   ├── page.tsx               # All deployments queue
│   │       │   └── [deploymentId]/
│   │       │       └── page.tsx           # Deployment detail + logs
│   │       │
│   │       ├── domains/
│   │       │   ├── page.tsx               # All domains
│   │       │   └── [domainId]/
│   │       │       └── page.tsx           # Domain admin view
│   │       │
│   │       ├── billing/
│   │       │   ├── page.tsx               # Revenue overview
│   │       │   ├── invoices/
│   │       │   │   └── page.tsx           # All invoices
│   │       │   ├── payments/
│   │       │   │   └── page.tsx           # Payment transactions
│   │       │   ├── subscriptions/
│   │       │   │   └── page.tsx           # All subscriptions
│   │       │   └── coupons/
│   │       │       ├── page.tsx           # Coupon management
│   │       │       └── new/
│   │       │           └── page.tsx       # Create coupon
│   │       │
│   │       ├── support/
│   │       │   ├── page.tsx               # Support ticket queue
│   │       │   └── [ticketId]/
│   │       │       └── page.tsx           # Ticket response
│   │       │
│   │       ├── monitoring/
│   │       │   ├── page.tsx               # System health dashboard
│   │       │   ├── alerts/
│   │       │   │   └── page.tsx           # Active alerts
│   │       │   └── logs/
│   │       │       └── page.tsx           # System log viewer
│   │       │
│   │       ├── pricing/
│   │       │   └── page.tsx               # Plan & pricing management
│   │       │
│   │       ├── announcements/
│   │       │   ├── page.tsx               # Announcement list
│   │       │   └── new/
│   │       │       └── page.tsx           # Create announcement
│   │       │
│   │       ├── audit-logs/
│   │       │   └── page.tsx               # Audit trail viewer
│   │       │
│   │       ├── analytics/
│   │       │   └── page.tsx               # Business analytics
│   │       │
│   │       └── settings/
│   │           ├── page.tsx               # System settings
│   │           ├── general/
│   │           │   └── page.tsx           # Platform-wide settings
│   │           ├── email-templates/
│   │           │   └── page.tsx           # Email template editor
│   │           └── security/
│   │               └── page.tsx           # Security policies
│   │
│   ├── components/
│   │   ├── common/                        # (Shared from @itbengal/ui mostly)
│   │   ├── layout/
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   └── index.ts
│   │   ├── customers/
│   │   │   ├── CustomerTable.tsx
│   │   │   ├── CustomerDetail.tsx
│   │   │   ├── ImpersonateButton.tsx
│   │   │   └── index.ts
│   │   ├── servers/
│   │   │   ├── ServerHealthCard.tsx
│   │   │   ├── ContainerList.tsx
│   │   │   ├── NodeMetricsChart.tsx
│   │   │   └── index.ts
│   │   ├── monitoring/
│   │   │   ├── SystemHealthGrid.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   ├── MetricsChart.tsx
│   │   │   └── index.ts
│   │   └── billing/
│   │       ├── RevenueChart.tsx
│   │       ├── CouponForm.tsx
│   │       ├── PricingEditor.tsx
│   │       └── index.ts
│   │
│   ├── hooks/
│   │   ├── useAdmin.ts                    # Admin context & permissions
│   │   ├── useCustomers.ts                # Customer management
│   │   ├── useServers.ts                  # Server fleet management
│   │   ├── useAnalytics.ts                # Analytics data fetching
│   │   ├── useAuditLogs.ts                # Audit log queries
│   │   └── index.ts
│   │
│   ├── lib/
│   │   ├── api.ts                         # Admin API client
│   │   ├── auth.ts                        # Admin auth helpers
│   │   ├── constants.ts
│   │   └── permissions.ts                 # RBAC permission checks
│   │
│   ├── stores/
│   │   ├── adminAuthStore.ts
│   │   ├── serverStore.ts
│   │   └── index.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   │
│   └── types/
│       ├── admin.ts
│       └── index.ts
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── middleware.ts                           # Admin auth + role guard
├── package.json
└── Dockerfile
```

---

## 3. apps/api/ — Platform API

The Express.js REST API follows a layered architecture: Controllers → Services → Repositories.

```
apps/api/
├── src/
│   ├── index.ts                           # Application entry point
│   ├── app.ts                             # Express app factory
│   ├── server.ts                          # HTTP server setup
│   │
│   ├── controllers/                       # Request handlers (thin layer)
│   │   ├── auth.controller.ts             # Login, register, refresh, logout
│   │   ├── user.controller.ts             # User profile CRUD
│   │   ├── project.controller.ts          # Project CRUD
│   │   ├── deployment.controller.ts       # Trigger, rollback, status
│   │   ├── domain.controller.ts           # Domain registration & management
│   │   ├── dns.controller.ts              # DNS record CRUD
│   │   ├── wordpress.controller.ts        # WordPress site management
│   │   ├── billing.controller.ts          # Billing overview & plans
│   │   ├── payment.controller.ts          # Payment processing
│   │   ├── subscription.controller.ts     # Subscription lifecycle
│   │   ├── invoice.controller.ts          # Invoice management
│   │   ├── server.controller.ts           # Server/node management
│   │   ├── organization.controller.ts     # Organization CRUD
│   │   ├── team.controller.ts             # Team & member management
│   │   ├── support.controller.ts          # Support ticket CRUD
│   │   ├── notification.controller.ts     # Notification management
│   │   ├── admin.controller.ts            # Admin-only operations
│   │   ├── webhook.controller.ts          # Incoming webhook handlers
│   │   ├── health.controller.ts           # Health check endpoint
│   │   └── index.ts
│   │
│   ├── services/                          # Business logic layer
│   │   ├── auth.service.ts                # Authentication logic
│   │   ├── user.service.ts                # User operations
│   │   ├── project.service.ts             # Project operations
│   │   ├── deployment.service.ts          # Deployment orchestration
│   │   ├── domain.service.ts              # Domain operations
│   │   ├── dns.service.ts                 # DNS operations
│   │   ├── wordpress.service.ts           # WordPress operations
│   │   ├── billing.service.ts             # Billing logic
│   │   ├── payment.service.ts             # Payment processing
│   │   ├── subscription.service.ts        # Subscription management
│   │   ├── invoice.service.ts             # Invoice generation
│   │   ├── server.service.ts              # Server management
│   │   ├── organization.service.ts        # Organization operations
│   │   ├── team.service.ts                # Team operations
│   │   ├── support.service.ts             # Support operations
│   │   ├── notification.service.ts        # Notification dispatch
│   │   ├── email.service.ts               # Email sending (SMTP)
│   │   ├── cache.service.ts               # Redis cache abstraction
│   │   ├── storage.service.ts             # File storage operations
│   │   └── index.ts
│   │
│   ├── repositories/                      # Data access layer (Prisma)
│   │   ├── user.repository.ts
│   │   ├── project.repository.ts
│   │   ├── deployment.repository.ts
│   │   ├── domain.repository.ts
│   │   ├── dns.repository.ts
│   │   ├── wordpress.repository.ts
│   │   ├── subscription.repository.ts
│   │   ├── invoice.repository.ts
│   │   ├── payment.repository.ts
│   │   ├── server.repository.ts
│   │   ├── organization.repository.ts
│   │   ├── support.repository.ts
│   │   ├── notification.repository.ts
│   │   ├── audit.repository.ts
│   │   └── index.ts
│   │
│   ├── middleware/                         # Express middleware
│   │   ├── auth.middleware.ts             # JWT verification & user loading
│   │   ├── admin.middleware.ts            # Admin role enforcement
│   │   ├── rateLimiter.middleware.ts      # Rate limiting per route
│   │   ├── validator.middleware.ts        # Request validation wrapper
│   │   ├── errorHandler.middleware.ts     # Global error handler
│   │   ├── cors.middleware.ts             # CORS configuration
│   │   ├── logger.middleware.ts           # Request/response logging
│   │   ├── upload.middleware.ts           # Multer file upload config
│   │   ├── pagination.middleware.ts       # Pagination parameter parsing
│   │   ├── apiKey.middleware.ts           # API key authentication
│   │   └── index.ts
│   │
│   ├── routes/                            # Route definitions
│   │   ├── v1/                            # API version 1
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── deployment.routes.ts
│   │   │   ├── domain.routes.ts
│   │   │   ├── dns.routes.ts
│   │   │   ├── wordpress.routes.ts
│   │   │   ├── billing.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── subscription.routes.ts
│   │   │   ├── invoice.routes.ts
│   │   │   ├── server.routes.ts
│   │   │   ├── organization.routes.ts
│   │   │   ├── team.routes.ts
│   │   │   ├── support.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── webhook.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   └── index.ts                   # Route aggregator
│   │   └── index.ts                       # Version router (/api/v1/)
│   │
│   ├── validators/                        # Request validation schemas (Zod)
│   │   ├── auth.validator.ts              # Login, register schemas
│   │   ├── user.validator.ts
│   │   ├── project.validator.ts
│   │   ├── deployment.validator.ts
│   │   ├── domain.validator.ts
│   │   ├── dns.validator.ts
│   │   ├── billing.validator.ts
│   │   ├── payment.validator.ts
│   │   ├── support.validator.ts
│   │   ├── organization.validator.ts
│   │   ├── common.validator.ts            # Pagination, ID, query schemas
│   │   └── index.ts
│   │
│   ├── jobs/                              # BullMQ background job processors
│   │   ├── deployment.job.ts              # Process deployment queue
│   │   ├── billing.job.ts                 # Invoice generation, renewals
│   │   ├── domain.job.ts                  # Domain sync, expiry checks
│   │   ├── backup.job.ts                  # Scheduled backups
│   │   ├── notification.job.ts            # Async notification delivery
│   │   ├── cleanup.job.ts                 # Temp file & log cleanup
│   │   ├── healthCheck.job.ts             # Periodic health checks
│   │   └── index.ts                       # Job queue registration
│   │
│   ├── events/                            # Event-driven architecture
│   │   ├── emitter.ts                     # Event emitter singleton
│   │   ├── handlers/
│   │   │   ├── deployment.handler.ts      # On deploy success/failure
│   │   │   ├── billing.handler.ts         # On payment received
│   │   │   ├── user.handler.ts            # On user created/deleted
│   │   │   ├── domain.handler.ts          # On domain registered
│   │   │   └── server.handler.ts          # On node health change
│   │   └── index.ts                       # Event handler registration
│   │
│   ├── utils/                             # API utility functions
│   │   ├── apiResponse.ts                 # Standardized response builder
│   │   ├── apiError.ts                    # Custom error classes
│   │   ├── crypto.ts                      # Hashing & encryption helpers
│   │   ├── jwt.ts                         # JWT sign/verify helpers
│   │   ├── pagination.ts                  # Pagination meta builder
│   │   ├── fileUpload.ts                  # File upload utilities
│   │   └── index.ts
│   │
│   ├── types/                             # API-specific type definitions
│   │   ├── express.d.ts                   # Express type augmentation
│   │   ├── request.ts                     # Request body/param types
│   │   ├── response.ts                    # Response payload types
│   │   └── index.ts
│   │
│   ├── config/                            # Configuration modules
│   │   ├── app.config.ts                  # App settings (port, env)
│   │   ├── database.config.ts             # Database connection config
│   │   ├── redis.config.ts                # Redis connection config
│   │   ├── mail.config.ts                 # SMTP configuration
│   │   ├── storage.config.ts              # File storage paths
│   │   ├── queue.config.ts                # BullMQ queue configuration
│   │   ├── cors.config.ts                 # CORS allowed origins
│   │   ├── rateLimit.config.ts            # Rate limiting rules
│   │   └── index.ts
│   │
│   └── database/                          # Database setup
│       ├── client.ts                      # Prisma client singleton
│       ├── migrations/                    # Prisma migrations
│       └── seeds/                         # Database seed scripts
│           ├── users.seed.ts
│           ├── plans.seed.ts
│           ├── admin.seed.ts
│           └── index.ts
│
├── tests/                                 # Test directory
│   ├── unit/                              # Unit tests (mirror src/ structure)
│   │   ├── services/
│   │   └── utils/
│   ├── integration/                       # Integration tests
│   │   ├── auth.test.ts
│   │   ├── projects.test.ts
│   │   └── deployments.test.ts
│   └── helpers/                           # Test utilities
│       ├── setup.ts
│       ├── factory.ts                     # Test data factories
│       └── mocks.ts                       # Service mocks
│
├── tsconfig.json
├── package.json
├── Dockerfile
└── nodemon.json                           # Dev server auto-reload config
```

---

## 4. services/deployment-engine/

The custom deployment engine handles Git clone, framework detection, Docker build, container orchestration, and Traefik routing.

```
services/deployment-engine/
├── src/
│   ├── index.ts                           # Service entry point
│   ├── server.ts                          # HTTP server for health & API
│   │
│   ├── builders/                          # Framework-specific build strategies
│   │   ├── base.builder.ts                # Abstract base builder class
│   │   ├── react.builder.ts               # Create React App builds
│   │   ├── nextjs.builder.ts              # Next.js builds (standalone)
│   │   ├── vite.builder.ts                # Vite-based app builds
│   │   ├── vue.builder.ts                 # Vue.js builds
│   │   ├── angular.builder.ts             # Angular builds
│   │   ├── svelte.builder.ts              # SvelteKit builds
│   │   ├── astro.builder.ts               # Astro builds
│   │   ├── static.builder.ts              # Static HTML/CSS/JS
│   │   ├── docker.builder.ts              # Custom Dockerfile builds
│   │   ├── detector.ts                    # Framework auto-detection logic
│   │   └── index.ts
│   │
│   ├── docker/                            # Docker container management
│   │   ├── client.ts                      # Dockerode client singleton
│   │   ├── container.manager.ts           # Container CRUD operations
│   │   ├── image.manager.ts               # Image build & cleanup
│   │   ├── network.manager.ts             # Docker network management
│   │   ├── volume.manager.ts              # Volume management
│   │   └── index.ts
│   │
│   ├── git/                               # Git operations
│   │   ├── clone.ts                       # Repository cloning
│   │   ├── webhook.handler.ts             # GitHub/GitLab webhook processor
│   │   ├── providers/                     # Git provider integrations
│   │   │   ├── github.ts                  # GitHub API client
│   │   │   ├── gitlab.ts                  # GitLab API client
│   │   │   └── bitbucket.ts               # Bitbucket API client
│   │   └── index.ts
│   │
│   ├── queue/                             # BullMQ deployment queue
│   │   ├── deployment.queue.ts            # Queue definition
│   │   ├── deployment.worker.ts           # Job processor worker
│   │   ├── deployment.scheduler.ts        # Scheduled tasks
│   │   └── index.ts
│   │
│   ├── health/                            # Health check system
│   │   ├── checker.ts                     # HTTP/TCP health checks
│   │   ├── monitor.ts                     # Continuous monitoring loop
│   │   ├── reporter.ts                    # Health status reporting
│   │   └── index.ts
│   │
│   ├── proxy/                             # Reverse proxy configuration
│   │   ├── traefik.manager.ts             # Traefik dynamic config generator
│   │   ├── ssl.manager.ts                 # SSL certificate management
│   │   ├── routing.ts                     # Route rule generation
│   │   └── index.ts
│   │
│   ├── storage/                           # Build artifact management
│   │   ├── artifact.manager.ts            # Build output storage
│   │   ├── log.manager.ts                 # Build log storage
│   │   ├── cleanup.ts                     # Old artifact cleanup
│   │   └── index.ts
│   │
│   ├── config/                            # Service configuration
│   │   ├── app.config.ts
│   │   ├── docker.config.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   └── helpers.ts
│   │
│   └── types/
│       ├── deployment.ts
│       ├── builder.ts
│       └── index.ts
│
├── templates/                             # Dockerfile templates
│   ├── Dockerfile.react
│   ├── Dockerfile.nextjs
│   ├── Dockerfile.vite
│   ├── Dockerfile.vue
│   ├── Dockerfile.angular
│   ├── Dockerfile.svelte
│   ├── Dockerfile.astro
│   ├── Dockerfile.static
│   └── nginx.conf.template               # Nginx config for static sites
│
├── tsconfig.json
├── package.json
├── Dockerfile
└── nodemon.json
```

---

## 5. services/wordpress-manager/

Manages the complete WordPress site lifecycle including installation, backups, staging, and security.

```
services/wordpress-manager/
├── src/
│   ├── index.ts                           # Service entry point
│   ├── server.ts                          # HTTP server
│   │
│   ├── sites/                             # Site lifecycle management
│   │   ├── provisioner.ts                 # New site creation
│   │   ├── manager.ts                     # Site start/stop/restart
│   │   ├── migrator.ts                    # Site migration between nodes
│   │   ├── cloner.ts                      # Clone site functionality
│   │   └── index.ts
│   │
│   ├── php/                               # PHP management
│   │   ├── fpm.manager.ts                 # PHP-FPM pool management
│   │   ├── version.manager.ts             # PHP version switching
│   │   ├── extensions.ts                  # PHP extension management
│   │   └── index.ts
│   │
│   ├── database/                          # MySQL database management
│   │   ├── mysql.client.ts                # MySQL connection manager
│   │   ├── database.manager.ts            # Create/drop/optimize databases
│   │   ├── import-export.ts               # SQL import/export
│   │   └── index.ts
│   │
│   ├── backup/                            # Backup & restore engine
│   │   ├── backup.manager.ts              # Backup orchestration
│   │   ├── restore.manager.ts             # Restore from backup
│   │   ├── scheduler.ts                   # Automated backup scheduling
│   │   ├── encryption.ts                  # Backup encryption/decryption
│   │   ├── storage.ts                     # Backup file storage
│   │   └── index.ts
│   │
│   ├── staging/                           # Staging environment management
│   │   ├── staging.manager.ts             # Create/delete staging
│   │   ├── sync.ts                        # Push/pull staging ↔ production
│   │   └── index.ts
│   │
│   ├── files/                             # File management operations
│   │   ├── explorer.ts                    # Directory listing & navigation
│   │   ├── editor.ts                      # File read/write
│   │   ├── uploader.ts                    # File upload handling
│   │   ├── permissions.ts                 # File permission management
│   │   └── index.ts
│   │
│   ├── security/                          # Security & malware scanning
│   │   ├── scanner.ts                     # Malware detection engine
│   │   ├── hardening.ts                   # Security hardening rules
│   │   ├── firewall.ts                    # Application-level firewall
│   │   ├── updates.ts                     # WP core/plugin/theme updates
│   │   └── index.ts
│   │
│   ├── performance/                       # Performance optimization
│   │   ├── cache.manager.ts               # Object cache & page cache
│   │   ├── optimizer.ts                   # Database & asset optimization
│   │   └── index.ts
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── mysql.config.ts
│   │   └── index.ts
│   │
│   └── types/
│       ├── wordpress.ts
│       └── index.ts
│
├── tsconfig.json
├── package.json
├── Dockerfile
└── nodemon.json
```

---

## 6. services/domain-service/

Handles domain registration, DNS management, and WHOIS operations via the Openprovider API.

```
services/domain-service/
├── src/
│   ├── index.ts                           # Service entry point
│   ├── server.ts
│   │
│   ├── client/                            # Openprovider API client
│   │   ├── openprovider.client.ts         # HTTP client wrapper
│   │   ├── auth.ts                        # API authentication
│   │   ├── retry.ts                       # Retry with exponential backoff
│   │   ├── rate-limiter.ts                # API rate limit handling
│   │   └── index.ts
│   │
│   ├── domains/                           # Domain operations
│   │   ├── availability.ts                # Domain availability check
│   │   ├── registration.ts                # Domain registration
│   │   ├── transfer.ts                    # Domain transfer in/out
│   │   ├── renewal.ts                     # Domain renewal
│   │   ├── nameservers.ts                 # Nameserver management
│   │   └── index.ts
│   │
│   ├── dns/                               # DNS record management
│   │   ├── records.manager.ts             # DNS record CRUD
│   │   ├── templates.ts                   # DNS record templates
│   │   ├── validation.ts                  # DNS record validation
│   │   └── index.ts
│   │
│   ├── whois/                             # WHOIS operations
│   │   ├── lookup.ts                      # WHOIS lookups
│   │   ├── privacy.ts                     # WHOIS privacy management
│   │   └── index.ts
│   │
│   ├── sync/                              # Domain synchronization
│   │   ├── synchronizer.ts                # Sync domains with Openprovider
│   │   ├── expiry-checker.ts              # Domain expiry notifications
│   │   └── index.ts
│   │
│   ├── webhooks/                          # Webhook processing
│   │   ├── handler.ts                     # Incoming webhook processor
│   │   ├── verifier.ts                    # Webhook signature verification
│   │   └── index.ts
│   │
│   ├── config/
│   │   └── app.config.ts
│   │
│   └── types/
│       ├── domain.ts
│       ├── dns.ts
│       └── index.ts
│
├── tsconfig.json
├── package.json
├── Dockerfile
└── nodemon.json
```

---

## 7. services/billing-service/

Handles payment processing across multiple gateways, invoice generation, and subscription lifecycle management.

```
services/billing-service/
├── src/
│   ├── index.ts                           # Service entry point
│   ├── server.ts
│   │
│   ├── gateways/                          # Payment gateway integrations
│   │   ├── base.gateway.ts                # Abstract gateway interface
│   │   ├── gateway.factory.ts             # Gateway factory pattern
│   │   │
│   │   ├── bkash/                         # bKash mobile payment
│   │   │   ├── bkash.gateway.ts           # bKash API integration
│   │   │   ├── bkash.types.ts             # bKash-specific types
│   │   │   └── index.ts
│   │   │
│   │   ├── nagad/                          # Nagad mobile payment
│   │   │   ├── nagad.gateway.ts
│   │   │   ├── nagad.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── rocket/                         # Rocket mobile payment
│   │   │   ├── rocket.gateway.ts
│   │   │   ├── rocket.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── stripe/                         # Stripe international payment
│   │   │   ├── stripe.gateway.ts
│   │   │   ├── stripe.webhook.ts          # Stripe webhook handler
│   │   │   ├── stripe.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── paypal/                         # PayPal international payment
│   │   │   ├── paypal.gateway.ts
│   │   │   ├── paypal.webhook.ts
│   │   │   ├── paypal.types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── invoicing/                         # Invoice management
│   │   ├── generator.ts                   # Invoice PDF generation
│   │   ├── calculator.ts                  # Price & tax calculation
│   │   ├── numbering.ts                   # Invoice number sequence
│   │   └── index.ts
│   │
│   ├── subscriptions/                     # Subscription lifecycle
│   │   ├── manager.ts                     # Create/upgrade/downgrade/cancel
│   │   ├── renewal.ts                     # Automatic renewal processing
│   │   ├── trial.ts                       # Trial period management
│   │   ├── proration.ts                   # Plan change proration
│   │   └── index.ts
│   │
│   ├── discounts/                         # Discount & promotion engine
│   │   ├── coupon.manager.ts              # Coupon code management
│   │   ├── promo.engine.ts                # Promotional pricing
│   │   └── index.ts
│   │
│   ├── config/
│   │   └── app.config.ts
│   │
│   └── types/
│       ├── billing.ts
│       ├── payment.ts
│       └── index.ts
│
├── tsconfig.json
├── package.json
├── Dockerfile
└── nodemon.json
```

---

## 8. services/notification-service/

Manages multi-channel notification delivery including email, SMS, push notifications, and webhooks.

```
services/notification-service/
├── src/
│   ├── index.ts                           # Service entry point
│   ├── server.ts
│   │
│   ├── email/                             # Email delivery
│   │   ├── sender.ts                      # SMTP email sender
│   │   ├── renderer.ts                    # Template rendering engine
│   │   ├── templates/                     # Email HTML templates
│   │   │   ├── base.hbs                   # Base email layout
│   │   │   ├── welcome.hbs               # Welcome email
│   │   │   ├── verify-email.hbs           # Email verification
│   │   │   ├── password-reset.hbs         # Password reset
│   │   │   ├── deployment-success.hbs     # Deployment complete
│   │   │   ├── deployment-failed.hbs      # Deployment failure
│   │   │   ├── invoice.hbs               # Invoice notification
│   │   │   ├── payment-received.hbs       # Payment confirmation
│   │   │   ├── subscription-expiring.hbs  # Expiry warning
│   │   │   ├── domain-expiring.hbs        # Domain expiry warning
│   │   │   ├── support-reply.hbs          # Support ticket reply
│   │   │   ├── server-alert.hbs           # Server health alert
│   │   │   └── announcement.hbs           # Platform announcement
│   │   └── index.ts
│   │
│   ├── sms/                               # SMS delivery
│   │   ├── sender.ts                      # SMS gateway client
│   │   ├── templates.ts                   # SMS message templates
│   │   └── index.ts
│   │
│   ├── push/                              # Push notifications
│   │   ├── sender.ts                      # Web push sender
│   │   ├── subscription.manager.ts        # Push subscription management
│   │   └── index.ts
│   │
│   ├── webhook/                           # Outgoing webhook delivery
│   │   ├── dispatcher.ts                  # Webhook HTTP dispatch
│   │   ├── retry.ts                       # Failed webhook retry logic
│   │   ├── signer.ts                      # Webhook payload signing
│   │   └── index.ts
│   │
│   ├── queue/                             # Notification queue
│   │   ├── notification.queue.ts          # BullMQ queue definition
│   │   ├── notification.worker.ts         # Queue processor
│   │   └── index.ts
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── smtp.config.ts
│   │   └── index.ts
│   │
│   └── types/
│       ├── notification.ts
│       └── index.ts
│
├── tsconfig.json
├── package.json
├── Dockerfile
└── nodemon.json
```

---

## 9. Key Files Reference

### 9.1 Root Configuration Files

| File | Purpose | Description |
|---|---|---|
| `package.json` | Workspace root | Defines workspaces, root scripts, shared dev dependencies |
| `pnpm-workspace.yaml` | Workspace definition | Declares workspace package locations for pnpm |
| `turbo.json` | Build pipeline | Turborepo task definitions, caching, and dependency graph |
| `tsconfig.json` | TypeScript root | Base TypeScript configuration with path aliases |
| `.eslintrc.js` | Linting root | ESLint configuration extending shared config |
| `.prettierrc` | Formatting | Code formatting rules (Prettier) |
| `.prettierignore` | Formatting exclusions | Files excluded from formatting |
| `.gitignore` | Git exclusions | Build artifacts, node_modules, env files |
| `.dockerignore` | Docker exclusions | Files excluded from Docker build context |
| `.nvmrc` | Node version | Pins Node.js version for all developers |
| `.env.example` | Env template | Template for required environment variables |
| `docker-compose.yml` | Dev environment | Local development Docker compose |
| `docker-compose.override.yml` | Dev overrides | Local-only compose overrides |
| `commitlint.config.js` | Commit linting | Conventional Commits enforcement |
| `LICENSE` | Legal | Project license |
| `README.md` | Documentation | Project overview, setup, contributing guide |

### 9.2 Application Entry Points

| File | Purpose | Description |
|---|---|---|
| `apps/dashboard/src/app/layout.tsx` | Dashboard root | Root layout with providers, fonts, global metadata |
| `apps/dashboard/middleware.ts` | Auth guard | Protects dashboard routes, redirects unauthenticated users |
| `apps/admin/src/app/layout.tsx` | Admin root | Root layout for admin panel |
| `apps/admin/middleware.ts` | Admin guard | Enforces admin role access |
| `apps/api/src/index.ts` | API entry | Express.js server bootstrap |
| `apps/api/src/app.ts` | App factory | Express app creation with middleware registration |

### 9.3 Service Entry Points

| File | Purpose | Description |
|---|---|---|
| `services/deployment-engine/src/index.ts` | Deployment service | Starts deployment queue worker and health API |
| `services/wordpress-manager/src/index.ts` | WordPress service | Starts WordPress management service |
| `services/domain-service/src/index.ts` | Domain service | Starts domain registration service |
| `services/billing-service/src/index.ts` | Billing service | Starts payment processing service |
| `services/notification-service/src/index.ts` | Notification service | Starts notification delivery service |

### 9.4 Shared Package Entry Points

| File | Purpose | Description |
|---|---|---|
| `packages/types/src/index.ts` | Type exports | Barrel export of all shared TypeScript types |
| `packages/utils/src/index.ts` | Utility exports | Barrel export of all utility functions |
| `packages/ui/src/index.ts` | Component exports | Barrel export of shared React components |
| `packages/database/src/index.ts` | Database exports | Prisma client and generated types |
| `packages/database/prisma/schema.prisma` | Database schema | Complete PostgreSQL schema definition |
| `packages/logger/src/index.ts` | Logger exports | Configured logger instance |
| `packages/config/eslint/base.js` | ESLint base | Base ESLint rules for all workspaces |
| `packages/config/typescript/base.json` | TSConfig base | Base TypeScript configuration |
| `packages/config/tailwind/preset.ts` | Tailwind preset | Shared Tailwind design tokens and plugins |

### 9.5 Infrastructure Files

| File | Purpose | Description |
|---|---|---|
| `infrastructure/traefik/traefik.yml` | Proxy config | Traefik static configuration (entrypoints, providers) |
| `infrastructure/traefik/dynamic/middlewares.yml` | Proxy middleware | Rate limiting, security headers, auth middleware |
| `infrastructure/prometheus/prometheus.yml` | Monitoring config | Scrape targets, scrape intervals, alert rules |
| `infrastructure/prometheus/alertmanager.yml` | Alert routing | Alert notification routing (Slack, email) |
| `infrastructure/grafana/provisioning/datasources/datasources.yml` | Data sources | Prometheus and Loki data source auto-provisioning |
| `infrastructure/ansible/playbooks/setup-platform.yml` | Server setup | Ansible playbook for initial platform server provisioning |
| `infrastructure/ansible/inventory/production.yml` | Server inventory | Production server hostnames and variables |

---

*End of Document — 23. Detailed Folder Structure*
