# 22. Repository Structure & Workspace Orchestration

## ITBengal Hosting Platform

| Field       | Value                              |
| ----------- | ---------------------------------- |
| **Version** | 1.0.0                             |
| **Date**    | 2026-07-04                         |
| **Status**  | Approved                           |
| **Owner**   | ITBengal Infrastructure & Platform Engineering Team |
| **Stack**   | Turborepo · npm Workspaces · TypeScript · Docker · GitHub Actions |

---

## Table of Contents

- [1. Monorepo Architecture Rationale](#1-monorepo-architecture-rationale)
  - [1.1 Monorepo vs. Multi-Repo Structural Comparison](#11-monorepo-vs-multi-repo-structural-comparison)
  - [1.2 Why Turborepo Was Selected as the Orchestrator](#12-why-turborepo-was-selected-as-the-orchestrator)
  - [1.3 Package Manager Workspaces: The Choice of npm Workspaces](#13-package-manager-workspaces-the-choice-of-npm-workspaces)
- [2. Complete Monorepo Directory Layout](#2-complete-monorepo-directory-layout)
  - [2.1 Visual Directory Tree Structure](#21-visual-directory-tree-structure)
  - [2.2 Detailed Workspace Deep-Dive](#22-detailed-workspace-deep-dive)
    - [2.2.1 Root Configurations](#221-root-configurations)
    - [2.2.2 Application Workspaces (`apps/`)](#222-application-workspaces-apps)
    - [2.2.3 Shared Package Workspaces (`packages/`)](#223-shared-package-workspaces-packages)
    - [2.2.4 Microservice & Worker Workspaces (`services/`)](#224-microservice--worker-workspaces-services)
    - [2.2.5 Infrastructure Configurations (`infrastructure/`)](#225-infrastructure-configurations-infrastructure)
    - [2.2.6 Documentation (`docs/`)](#226-documentation-docs)
- [3. Workspace Integration & Dependency Management](#3-workspace-integration--dependency-management)
  - [3.1 Workspace Configurations and Inter-dependencies](#31-workspace-configurations-and-inter-dependencies)
  - [3.2 Local Compilation, Imports, and Type Resolution](#32-local-compilation-imports-and-type-resolution)
  - [3.3 Adding, Upgrading, and Auditing Dependencies](#33-adding-upgrading-and-auditing-dependencies)
  - [3.4 Eliminating Dependency Version Drift](#34-eliminating-dependency-version-drift)
- [4. Production-Ready Turborepo Configuration](#4-production-ready-turborepo-configuration)
  - [4.1 Comprehensive `turbo.json` Configuration](#41-comprehensive-turbojson-configuration)
  - [4.2 Orchestration Pipeline Analysis](#42-orchestration-pipeline-analysis)
  - [4.3 Output Bundling and Caching Strategy](#43-output-bundling-and-caching-strategy)
  - [4.4 Environmental Hash Invalidation](#44-environmental-hash-invalidation)
  - [4.5 Remote Cache Integration (Self-Hosted and Cloud)](#45-remote-cache-integration-self-hosted-and-cloud)
- [5. Branching Strategy & Git Flow Orchestration](#5-branching-strategy--git-flow-orchestration)
  - [5.1 Branching Model for Scale](#51-branching-model-for-scale)
  - [5.2 Branching Lifecycle and Conventions](#52-branching-lifecycle-and-conventions)
  - [5.3 Quality Gates & Code Review Framework](#53-quality-gates--code-review-framework)
  - [5.4 Continuous Integration Pipelines (CI)](#54-continuous-integration-pipelines-ci)
  - [5.5 Squash Merge Policy and Conventional Commits](#55-squash-merge-policy-and-conventional-commits)
  - [5.6 Automated Release and Tagging Strategy](#56-automated-release-and-tagging-strategy)

---

## 1. Monorepo Architecture Rationale

The ITBengal Hosting Platform relies on a highly integrated set of components. Managing these components requires an architectural layout that balances developer velocity, code reuse, and ease of deployment.

### 1.1 Monorepo vs. Multi-Repo Structural Comparison

ITBengal evaluated both monorepo and multi-repo approaches for its systems. The platform includes web dashboards, backend REST APIs, background workers, and shared modules (types, DB models, UI libraries). 

| Dimensions | Multi-Repo Approach | Monorepo Approach (ITBengal Standard) |
| :--- | :--- | :--- |
| **Code Reuse & DRYness** | Hard. Requires building, packaging, and publishing shared packages (e.g., `@itbengal/types`) to a private npm registry on every minor interface change. | Extremely easy. Shared local packages are symlinked directly via workspace definitions. Code is updated globally instantly. |
| **Dependency Synchronization** | High risk of dependency drift. Different services end up using different versions of the same shared libraries, leading to runtime failures. | Single lockfile at the root ensures all workspace modules share identical versions of external tools, minimizing integration bugs. |
| **Onboarding & Local Setup** | Painful. A new developer must clone 10+ repositories, configure environment variables across all, and manually run linking commands. | Simple. A single `git clone` followed by `npm install` installs and configures all symlinks and packages across the workspace. |
| **Refactoring and API Changes** | Slow and risky. Changing a database schema requires updating the Prisma schema repo, compiling it, publishing, and updating downstream repos. | Atomic commits. A database schema alteration, the corresponding type changes, backend API updates, and frontend UI changes can be done in a single pull request. |
| **CI/CD Configuration Overhead** | Fragmented. Requires maintainers to manage distinct pipelines across dozens of repositories with redundant build setups. | Unified. One central CI configuration orchestrates the build dependency graph, running builds only on modified components. |
| **Commit Atomicity** | Impossible. Feature deployments must be carefully coordinated across multiple independent git repositories. | Perfect. Features spanning UI, API, database, and workers are merged together, eliminating incomplete intermediate states in branches. |

For ITBengal, which targets rapid expansion in the Bangladeshi hosting space and internationally, a monorepo is the optimal structure. The ability to make atomic commits that span database schemas, api validation, type bindings, and frontend views is essential for ensuring type safety across the entire application lifecycle.

---

### 1.2 Why Turborepo Was Selected as the Orchestrator

While package manager workspaces provide the underlying linking of folders, they do not manage task execution dependencies. We compared three major JS/TS monorepo orchestrators:

*   **Lerna**: Legacy standard. Lerna has historically been slow, lacks sophisticated caching, and relies on heavy config files. Although modern Lerna is powered by Nx under the hood, it introduces unnecessary layers for a TS-focused codebase.
*   **Nx**: Very powerful but highly opinionated. Nx introduces complex code-generation generators, custom wrapping configurations, and a steep learning curve. The configuration boilerplate is heavy, and it abstracts the underlying build tools too aggressively.
*   **Turborepo**: Selected. Turborepo provides a lightweight, configuration-sparse framework. It works directly with the native build scripts of the child projects without wrapping them. It provides exceptional speed via Rust-based caching, simple topological dependency trees, and native integration with npm workspaces.

#### Key Turborepo Benefits for ITBengal:
1.  **Topological Execution**: Turborepo understands that the Next.js `dashboard` application cannot be built until `@itbengal/ui` and `@itbengal/database` have finished compiling. It builds these dependencies first, in parallel, and then runs the dashboard build.
2.  **Local & Remote Caching**: Turborepo hashes the input files, environment variables, and build configurations. If these have not changed, it skips the build process and restores the output from the cache. This reduces our local compile times from minutes to seconds, and slashes CI pipeline run times.
3.  **Minimal Configuration**: The entire execution tree is defined in a single, simple `turbo.json` file in the repository root.

---

### 1.3 Package Manager Workspaces: The Choice of npm Workspaces

Workspaces are the mechanism that links local packages together without publishing them. We evaluated three workspace managers:

1.  **Yarn Workspaces (v1/v4)**: Yarn v1 (classic) is deprecated. Yarn v2+ (Berry) introduces Zero-Installs and Plug'n'Play (PnP). While PnP is efficient, it breaks compatibility with many standard Node modules, requiring custom SDK configurations and causing developer friction.
2.  **pnpm Workspaces**: pnpm is highly efficient due to its content-addressable store and hard-link layout. However, it can sometimes lead to peer-dependency resolution issues and hoisting edge cases in complex Next.js setups.
3.  **npm Workspaces (v7+)**: Chosen. npm workspaces are built directly into the Node.js runtime environment. This guarantees 100% compatibility with hosting runners, container builds, and deployment platforms without installing additional package managers. The standard hoisting model is highly predictable, and npm's audit commands run seamlessly across the entire workspace.

By coupling **npm Workspaces** (for link management) with **Turborepo** (for build orchestration), ITBengal secures a standardized, robust, and highly performant developer workspace.

---

## 2. Complete Monorepo Directory Layout

The ITBengal monorepo separates logic based on deployability and sharing characteristics. Applications (`apps/`) are user-facing, deployable websites. Services (`services/`) are background workers and microservices. Packages (`packages/`) are shared, non-deployable library dependencies. Infrastructure (`infrastructure/`) contains deployment, reverse-proxy, and monitoring blueprints.

### 2.1 Visual Directory Tree Structure

The structure of the monorepo down to the key files:

```
itbengal/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Main CI workflow (Lint, Test, Build validation)
│   │   └── cd.yml                 # Continuous Deployment configuration
│   └── CODEOWNERS                 # Automated reviewer assignment rules
├── apps/
│   ├── admin/                     # Admin Portal (Next.js)
│   │   ├── public/
│   │   ├── src/
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   ├── dashboard/                 # Customer Dashboard (Next.js)
│   │   ├── public/
│   │   ├── src/
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   └── api/                       # Core API Backend (Express.js)
│       ├── src/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── services/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui/                        # Shared UI Component Library
│   │   ├── src/
│   │   │   ├── components/        # Custom design system components
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   ├── database/                  # Prisma Database Client
│   │   ├── prisma/
│   │   │   ├── migrations/        # PostgreSQL migrations history
│   │   │   └── schema.prisma      # Central DB Schema definition
│   │   ├── src/
│   │   │   └── index.ts           # Shared Prisma Client export
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/                     # Shared TypeScript Types & DTOs
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── api.ts             # API request/response types
│   │   │   ├── db.ts              # Custom database-related types
│   │   │   └── domain.ts          # Hosting domain schemas
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/                     # Common JavaScript Utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── cryptography.ts    # Hashing, token generation
│   │   │   ├── formatters.ts      # Currency, dates, resource sizes
│   │   │   └── validation.ts      # Shared validation schemas
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/                    # Central Configuration Hub
│   │   ├── eslint/
│   │   │   ├── next.js            # Shared Next.js ESLint rules
│   │   │   └── server.js          # Shared Node/Express ESLint rules
│   │   ├── typescript/
│   │   │   ├── base.json          # Core compilation rules
│   │   │   ├── nextjs.json        # Next.js specific TypeScript rules
│   │   │   └── server.json        # Node/Express TypeScript rules
│   │   └── tailwind/
│   │       └── base.ts            # Core colors, spacing, fonts
│   └── logger/                    # Winston Logging Utility
│       ├── src/
│       │   └── index.ts           # Logger initialization with Winston & Loki
│       ├── package.json
│       └── tsconfig.json
├── services/
│   ├── deployment-engine/         # Container deployment daemon
│   │   ├── src/
│   │   │   ├── queue/             # BullMQ queue handlers
│   │   │   ├── build/             # Docker build execution logic
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── wordpress-manager/         # WordPress lifecycle agent
│   │   ├── src/
│   │   │   ├── backup/
│   │   │   ├── install/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── domain-service/            # Openprovider Domain registrar wrapper
│   │   ├── src/
│   │   │   ├── openprovider/      # XML-RPC client and commands
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── billing-service/           # Stripe, PayPal, bKash payments
│   │   ├── src/
│   │   │   ├── gateways/          # Payment integrations
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── notification-service/      # SMS and Email router
│       ├── src/
│       │   ├── templates/         # Shared message templates
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── infrastructure/
│   ├── docker/
│   │   ├── api.Dockerfile         # Production image build for API
│   │   ├── engine.Dockerfile      # Production build for Deploy Engine
│   │   └── wordpress.Dockerfile   # Customized WP container template
│   ├── traefik/
│   │   ├── traefik.yml            # Main reverse proxy configuration
│   │   └── dynamic_routing.yml    # Shared router rules
│   ├── nginx/
│   │   └── default.conf           # Static server configuration template
│   ├── prometheus/
│   │   └── prometheus.yml         # Server scraping configurations
│   ├── grafana/
│   │   └── provisioning/          # Preconfigured dashboards
│   └── ansible/
│       ├── inventories/           # Host classifications
│       ├── playbooks/             # Server setup definitions
│       └── roles/                 # Modular configuration scripts
├── .gitignore
├── eslint.config.mjs
├── package.json                   # Root package definition
├── README.md
├── tsconfig.json                  # Root TypeScript definition
└── turbo.json                     # Turborepo configuration
```

---

### 2.2 Detailed Workspace Deep-Dive

#### 2.2.1 Root Configurations

##### Root `package.json`
Specifies workspace inclusion and maps commands down to Turborepo.

```json
{
  "name": "itbengal-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "ITBengal Hosting Platform Monorepo Workspace",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:generate": "turbo run db:generate",
    "db:migrate": "turbo run db:migrate",
    "clean": "turbo run clean && rimraf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json,js}\""
  },
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ],
  "devDependencies": {
    "eslint": "^9.16.0",
    "prettier": "^3.4.2",
    "rimraf": "^6.0.1",
    "turbo": "^2.3.3",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

##### Root `tsconfig.json`
Provides a fallback baseline configuration, utilizing configuration package inheritance.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "dist", ".next"]
}
```

---

#### 2.2.2 Application Workspaces (`apps/`)

These folders hold the customer dashboards, administrator tools, and Express API.

##### 1. `apps/dashboard/` (Next.js Application)
*   **Role**: Serves the customer-facing interface. Includes cloud resource lists, databases, WordPress setups, invoice registers, domain settings, and deployment reports.
*   **Dependencies**: Uses `@itbengal/ui` (shared Tailwind elements), `@itbengal/types` (TypeScript contracts), `@itbengal/utils` (formatting), and `@itbengal/logger` (Winston-Loki logging adapter).
*   **`package.json`**:

```json
{
  "name": "@itbengal/dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rimraf .next dist"
  },
  "dependencies": {
    "@itbengal/ui": "workspace:*",
    "@itbengal/types": "workspace:*",
    "@itbengal/utils": "workspace:*",
    "@itbengal/logger": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@itbengal/config": "workspace:*",
    "@types/node": "^20.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.4.1"
  }
}
```

##### 2. `apps/admin/` (Next.js Application)
*   **Role**: Admin management portal for support agents, billing managers, and infrastructure sysadmins. Handles VPS additions, ticket reviews, bKash webhook reconciliation, coupon setups, and resource allocation adjustments.
*   **`package.json`**:

```json
{
  "name": "@itbengal/admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rimraf .next dist"
  },
  "dependencies": {
    "@itbengal/ui": "workspace:*",
    "@itbengal/types": "workspace:*",
    "@itbengal/utils": "workspace:*",
    "@itbengal/logger": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@itbengal/config": "workspace:*",
    "@types/node": "^20.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.4.1"
  }
}
```

##### 3. `apps/api/` (Express.js Backend API)
*   **Role**: Core orchestrator and gateway. Authenticates users, exposes REST endpoints, parses configuration targets, generates database calls, and dispatches tasks to the services directory via Redis queues (BullMQ).
*   **`package.json`**:

```json
{
  "name": "@itbengal/api",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts",
    "test": "jest",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@itbengal/database": "workspace:*",
    "@itbengal/types": "workspace:*",
    "@itbengal/utils": "workspace:*",
    "@itbengal/logger": "workspace:*",
    "bcrypt": "^5.1.1",
    "bullmq": "^5.32.0",
    "cors": "^2.8.5",
    "express": "^4.21.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@itbengal/config": "workspace:*",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "nodemon": "^3.1.7",
    "ts-node": "^10.9.2"
  }
}
```

---

#### 2.2.3 Shared Package Workspaces (`packages/`)

Packages are located under the `packages/` prefix and contain shared configurations, client objects, validation logic, and design patterns.

##### 1. `packages/database/` (Prisma Engine Wrapper)
*   **Role**: Manages the PostgreSQL migration scripts, schemas, and exposes a shared Prisma client.
*   **`package.json`**:

```json
{
  "name": "@itbengal/database",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "npm run db:generate && tsc",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@prisma/client": "^6.0.1"
  },
  "devDependencies": {
    "prisma": "^6.0.1"
  }
}
```

##### 2. `packages/ui/` (Design System UI Component Library)
*   **Role**: Bundles premium React UI elements (buttons, inputs, cards, tables, modal dialogues) built on Tailwind CSS, shared via NPM workspace imports.
*   **`package.json`**:

```json
{
  "name": "@itbengal/ui",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "lint": "eslint src/**/*.{ts,tsx}",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "react": "^19.0.0",
    "tsup": "^8.3.5"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "tailwindcss": ">=3.0.0"
  }
}
```

##### 3. `packages/types/` (TypeScript Domain Definitions)
*   **Role**: Declares all types, request payloads, response bodies, domain formats, and service structures used across apps and services.
*   **`package.json`**:

```json
{
  "name": "@itbengal/types",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc --noEmit",
    "clean": "rimraf dist"
  }
}
```

---

#### 2.2.4 Microservice & Worker Workspaces (`services/`)

These workspaces run in isolation as background processes, reading tasks from BullMQ, managing network interactions, and handling hardware modifications.

##### 1. `services/deployment-engine/` (Docker Build & Deploy Worker)
*   **Role**: Pulls source repositories, compiles code using dynamic runtime targets, builds Docker containers, creates custom Traefik routing records, and verifies site health.
*   **`package.json`**:

```json
{
  "name": "@itbengal/deployment-engine",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@itbengal/database": "workspace:*",
    "@itbengal/types": "workspace:*",
    "@itbengal/utils": "workspace:*",
    "@itbengal/logger": "workspace:*",
    "bullmq": "^5.32.0",
    "dockerode": "^4.0.2",
    "simple-git": "^3.27.0"
  },
  "devDependencies": {
    "@itbengal/config": "workspace:*",
    "@types/dockerode": "^3.3.33",
    "@types/jest": "^29.5.14"
  }
}
```

##### 2. `services/billing-service/` (Webhook Handler & Billing Runner)
*   **Role**: Handles Stripe, PayPal, bKash, and Nagad webhook notifications, runs subscription cron triggers, creates invoices, and updates database records.
*   **`package.json`**:

```json
{
  "name": "@itbengal/billing-service",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@itbengal/database": "workspace:*",
    "@itbengal/types": "workspace:*",
    "@itbengal/utils": "workspace:*",
    "@itbengal/logger": "workspace:*",
    "bullmq": "^5.32.0",
    "stripe": "^17.4.0"
  },
  "devDependencies": {
    "@itbengal/config": "workspace:*"
  }
}
```

##### 3. `services/domain-service/` (Openprovider Gateway Service)
*   **Role**: Interacts with the Openprovider registrar. Implements nameserver assignments, WHOIS security overrides, availability searches, domain ordering, and webhook notifications.
*   **`package.json`**:

```json
{
  "name": "@itbengal/domain-service",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@itbengal/database": "workspace:*",
    "@itbengal/types": "workspace:*",
    "@itbengal/utils": "workspace:*",
    "@itbengal/logger": "workspace:*",
    "xml2js": "^0.6.2"
  },
  "devDependencies": {
    "@itbengal/config": "workspace:*",
    "@types/xml2js": "^0.4.14"
  }
}
```

---

#### 2.2.5 Infrastructure Configurations (`infrastructure/`)

Non-JS workspace. Holds server configuration profiles, reverse-proxy definitions, and configuration code.

*   `/traefik/traefik.yml`: Configuration parameters mapping HTTP request entrypoints, Let's Encrypt automated ACME challenges, and secure dashboard endpoints.
*   `/nginx/default.conf`: Configures default performance profiles, caching settings, compression targets, and static response behaviors.
*   `/ansible/playbooks/site.yml`: Configures target VPS nodes with security groups, limits, package repositories, directories, Docker engines, and Prometheus exporters.

---

#### 2.2.6 Documentation (`docs/`)

Holds design manuals, recovery scenarios, architectural decisions, and integration specs.

*   `/architecture/`: System design plans, dataflow graphs, database entity relationships, and routing sequence diagrams.
*   `/deployment/`: Installation steps, environment variables documentation, and database restoration recipes.

---

## 3. Workspace Integration & Dependency Management

ITBengal uses **npm Workspaces** to coordinate paths, links, and builds across projects.

### 3.1 Workspace Configurations and Inter-dependencies

When `npm install` is executed at the root of the repository, the package manager resolves the target directories under `apps/*`, `packages/*`, and `services/*`. It links these workspace dependencies into the root `node_modules` directory using symbolic links.

To avoid package name conflicts with public registries, we scope all internal packages using the `@itbengal` organization namespace (e.g., `@itbengal/types`, `@itbengal/ui`).

#### Workspace Dependency Matrix
The table below highlights which internal projects consume which shared libraries:

| Internal Workspace Consumable | Consuming Application / Service |
| :--- | :--- |
| **`@itbengal/types`** | `@itbengal/api`, `@itbengal/dashboard`, `@itbengal/admin`, `@itbengal/deployment-engine`, `@itbengal/billing-service`, `@itbengal/domain-service`, `@itbengal/notification-service`, `@itbengal/ui` |
| **`@itbengal/database`** | `@itbengal/api`, `@itbengal/deployment-engine`, `@itbengal/billing-service`, `@itbengal/domain-service`, `@itbengal/notification-service` |
| **`@itbengal/utils`** | `@itbengal/api`, `@itbengal/dashboard`, `@itbengal/admin`, `@itbengal/deployment-engine`, `@itbengal/billing-service` |
| **`@itbengal/logger`** | `@itbengal/api`, `@itbengal/dashboard`, `@itbengal/admin`, `@itbengal/deployment-engine`, `@itbengal/billing-service`, `@itbengal/domain-service`, `@itbengal/notification-service` |
| **`@itbengal/ui`** | `@itbengal/dashboard`, `@itbengal/admin` |
| **`@itbengal/config`** | Consumed implicitly by every workspace for dev configurations (ESLint, TSConfig, Tailwind). |

---

### 3.2 Local Compilation, Imports, and Type Resolution

To ensure developers get real-time compiler feedback without manually rebuilding packages on every file change, ITBengal uses a dual-path resolution strategy.

#### 1. TypeScript Path Mapping (For Development & Editor Support)
In the configuration package (`packages/config/typescript/base.json`), we map types directly to source files. This gives editors instant feedback and enables autocompletion.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@itbengal/types": ["../../packages/types/src/index.ts"],
      "@itbengal/utils/*": ["../../packages/utils/src/*"],
      "@itbengal/logger": ["../../packages/logger/src/index.ts"]
    }
  }
}
```

#### 2. Transpilation & Bundling (For Production Builds)
For production builds and Node executions (which cannot run raw `.ts` files directly), packages are compiled using **tsup** (an esbuild-powered compiler) or `tsc`.

For example, `@itbengal/ui` uses a `tsup.config.ts` configuration to bundle React components into both CommonJS and ECMAScript modules, exporting typescript declaration definitions:

```typescript
// packages/ui/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  external: ['react', 'tailwindcss'],
  injectStyle: true,
});
```

Downstream consumers like the customer dashboard run their standard bundling pipelines. They resolve the compiled inputs directly from the `dist/` folders of these shared dependencies.

---

### 3.3 Adding, Upgrading, and Auditing Dependencies

In a monorepo workspace environment, you must manage external dependencies from the root directory to keep the root lockfile consistent.

#### Adding an External Dependency to a Specific Workspace
Never run installation scripts from within workspace subdirectories. Always use the `-w` (workspace) parameter from the root directory:

```bash
# Add Zod to the Express API application
npm install zod -w @itbengal/api

# Add Lucide Icons as a development dependency to the UI Package
npm install lucide-react --save-dev -w @itbengal/ui

# Add typescript globally to all workspaces
npm install typescript --save-dev
```

#### Upgrading Packages Globally
To upgrade an external library shared by multiple workspaces (e.g., `lodash`), update it from the root. This prevents different versions from being installed across the codebase:

```bash
npm update lodash -workspaces
```

#### Running Security Audits
Run safety verification scans across the entire workspace from the root. npm will audit all package definitions and resolve nested lockfile configurations:

```bash
npm audit
```

---

### 3.4 Eliminating Dependency Version Drift

When multiple developers build applications in different directories, dependency version drift (e.g., `apps/dashboard` using React `19.0.0` while `packages/ui` targets React `18.2.0`) can cause builds to fail. To prevent this, ITBengal enforces three strategies:

1.  **Direct Peer Dependencies**: Shared packages (like `@itbengal/ui`) define core runtime engines (like `react` and `react-dom`) as `peerDependencies`. This forces the host application to supply the package, avoiding duplicate installations.
2.  **Explicit Overrides**: The root `package.json` uses the `overrides` configuration to enforce matching dependency versions across all packages.
3.  **Strict Linting Guards**: Our linting workflows flag any direct imports of external libraries that are not explicitly declared in a workspace's local `package.json`.

```json
// Enforces a single React version across all workspaces
"overrides": {
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

---

## 4. Production-Ready Turborepo Configuration

ITBengal uses **Turborepo** to manage build pipelines, testing suites, and lint tasks. Turborepo handles task prioritization, manages execution order, and caches build artifacts.

### 4.1 Comprehensive `turbo.json` Configuration

The core execution configuration:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "tsconfig.json",
    ".env.production"
  ],
  "globalEnv": [
    "NODE_ENV",
    "PORT"
  ],
  "tasks": {
    "db:generate": {
      "inputs": ["prisma/schema.prisma"],
      "outputs": ["node_modules/.prisma/client/**"]
    },
    "db:migrate": {
      "cache": false
    },
    "build": {
      "dependsOn": [
        "^build",
        "db:generate"
      ],
      "inputs": [
        "src/**/*",
        "public/**/*",
        "next.config.ts",
        "tailwind.config.ts",
        "postcss.config.js"
      ],
      "outputs": [
        ".next/**",
        "!.next/cache/**",
        "dist/**"
      ],
      "env": [
        "DATABASE_URL",
        "NEXT_PUBLIC_API_URL",
        "JWT_SECRET",
        "BKASH_API_URL",
        "STRIPE_PUBLISHABLE_KEY"
      ]
    },
    "lint": {
      "inputs": ["src/**/*", "eslint.config.mjs"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.test.ts", "src/**/*.test.tsx"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

---

### 4.2 Orchestration Pipeline Analysis

Turborepo relies on topological graphs to determine the correct build order.

```mermaid
graph TD
    A[db:generate] --> B[@itbengal/database build]
    B --> C[@itbengal/api build]
    B --> D[@itbengal/deployment-engine build]
    E[@itbengal/types build] --> C
    E --> F[@itbengal/ui build]
    F --> G[@itbengal/dashboard build]
    F --> H[@itbengal/admin build]
    E --> G
    E --> H
```

*   **`^build`**: The caret (`^`) symbol is a critical Turborepo convention. It tells Turbo that a workspace's build task depends on its upstream dependencies completing their build tasks first. For example, `@itbengal/ui` must build *before* `@itbengal/dashboard` starts its build.
*   **`db:generate` Execution**: Next.js builds compile code down to static bundles and parse dynamic models. If they use the database package `@itbengal/database`, they need the Prisma client types generated first. By listing `db:generate` in the `dependsOn` array for the `build` target, Turborepo guarantees the database client is generated before compiling the frontend and backend.
*   **`db:migrate` Exemption**: Database migrations write data directly to the database. They cannot be cached because they run outside the local build artifact sandbox. We set `"cache": false` to force migrations to run every time they are called in CI/CD.

---

### 4.3 Output Bundling and Caching Strategy

When Turborepo runs a task, it checks if the task has run before with the exact same inputs. If it has, it restores the output directories from the cache rather than running the build command.

For Next.js applications, the build artifacts are stored in the `.next` directory. However, we exclude `.next/cache` from the cache outputs configuration because it contains temporary webpack cache files that are not needed for deployments. This keeps our cache sizes small.

Shared packages compile their assets into `dist/` folders, which are cached to speed up downstream builds.

---

### 4.4 Environmental Hash Invalidation

React and Next.js applications inject public environment variables (e.g., `NEXT_PUBLIC_API_URL`) into their HTML/JS bundles at build time. 

If you change the target API URL in your environment configuration but don't modify the source code, Turborepo might serve a cached build compiled with the old URL.

To prevent this, the `build` task configuration includes an `env` array. Turborepo adds these environment variables to its build signature hash. If any of these values change, the cache is invalidated, and a fresh build is triggered.

*   **`globalEnv`**: Environment variables (like `NODE_ENV` or `PORT`) that affect all workspaces. If these change, all cached build tasks are invalidated.
*   **Task-Specific `env`**: Workspace-specific variables (like `NEXT_PUBLIC_API_URL`) that only invalidate the builds of the packages that declare them.

---

### 4.5 Remote Cache Integration (Self-Hosted and Cloud)

While local caching speeds up individual developer environments, Remote Caching shares these build savings across the entire engineering team and the CI/CD pipeline.

If Developer A builds `@itbengal/ui` on their machine, Developer B can pull the latest changes, run `npm run build`, and Turborepo will download Developer A's pre-compiled assets from the remote cache in milliseconds.

#### 1. Configuring Remote Caching in GitHub Actions
To share build cache artifacts with the CI/CD pipeline, authenticate the runner with the remote cache service using environment variables:

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: itbengal-platform
```

#### 2. Running Builds via the Remote Cache Link
Execute builds with remote caching active:

```bash
npx turbo run build --api="https://api.turbo.build" --token="$TURBO_TOKEN" --team="itbengal-platform"
```

#### 3. Self-Hosted Custom Remote Cache (Alternative Setup)
If you want to avoid hosting the cache on Vercel's infrastructure, you can run a self-hosted remote cache using an open-source server like `turborepo-remote-cache`. Run the caching daemon as a Docker container behind Traefik:

```yaml
# infrastructure/docker-compose.infra.yml
version: '3.8'
services:
  turbo-cache:
    image: ducktors/turborepo-remote-cache:latest
    environment:
      - PORT=3000
      - TURBO_TOKEN=super_secure_internal_token
      - STORAGE_PROVIDER=local
      - LOCAL_STORAGE_PATH=/data
    volumes:
      - turbo-cache-data:/data
    networks:
      - web-traffic
```

---

## 5. Branching Strategy & Git Flow Orchestration

ITBengal uses a structured Git Flow model to coordinate team contributions and support parallel development. This ensures that the primary deployment branches remain stable and deployable.

```
                  [ Hotfix Branch ]
                 /                 \
main     =======+===================+======> [ Production Releases ]
               /                     ^
              /                       \
release/ ====+=+======================+====> [ QA & Staging Testing ]
            / /                      /
           / /                      /
develop  =+=+======================+=======> [ Integration Mainline ]
             \                    /
              \                  /
feature/       +--[ feature/1 ]-+-----------> [ Feature Branches ]
```

---

### 5.1 Branching Model for Scale

1.  **`main` (Production Branch)**: Represents our stable, production-ready code. Commits are never made directly to `main`. It is only updated via squash merges from `release/*` or `hotfix/*` branches. Every commit to `main` is tagged with a version number (e.g., `v1.0.0`).
2.  **`develop` (Integration Branch)**: The primary integration branch. Developers merge their features and bugfixes here. Once the integration tests pass on `develop`, code is promoted to a `release/*` branch.
3.  **`feature/*` (Feature Branches)**: Used for building new features. These branches branch off from `develop` and are merged back into `develop` once complete.
4.  **`bugfix/*` (Standard Bugfixes)**: Used for resolving bugs found in QA or staging. They branch off from `develop` and merge back into `develop`.
5.  **`release/*` (Release Candidate Branches)**: Used for staging and final QA before a production release. They branch off from `develop` and merge into both `main` and `develop`.
6.  **`hotfix/*` (Urgent Production Patches)**: Used for resolving critical bugs found in production. They branch off from `main`, are tested, and then merged into both `main` and `develop`.

---

### 5.2 Branching Lifecycle and Conventions

| Branch Class | Source Branch | Target Branch | Naming Pattern | Lifecycle / Deletion |
| :--- | :--- | :--- | :--- | :--- |
| **Feature** | `develop` | `develop` | `feature/issue-number-short-desc` | Deleted immediately after PR is squash-merged. |
| **Bugfix** | `develop` | `develop` | `bugfix/issue-number-short-desc` | Deleted immediately after PR is squash-merged. |
| **Release** | `develop` | `main` & `develop` | `release/vMajor.Minor.Patch` | Kept active until the deployment is validated, then tagged and deleted. |
| **Hotfix** | `main` | `main` & `develop` | `hotfix/issue-number-short-desc` | Deleted immediately after the fix is merged and tagged. |

---

### 5.3 Quality Gates & Code Review Framework

To maintain a clean codebase, every Pull Request must pass our automated quality gates before it can be merged.

#### 1. Pre-Commit Hooks via Husky & Lint-Staged
We configure Git hooks to run formatting and linting checks on the developer's local machine before they can commit:

```json
// package.json (root configuration snippet)
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"
  }
},
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.json": [
    "prettier --write"
  ]
}
```

#### 2. CODEOWNERS Review Routing
We use a `.github/CODEOWNERS` configuration to automatically assign reviews to the developers responsible for specific modules. This ensures sensitive code (like billing integrations or deployment logic) is reviewed by domain experts:

```
# .github/CODEOWNERS
# Global owners
* @itbengal/platform-engineers

# Database modifications require Database Architect approval
/packages/database/ @itbengal/database-architects

# Billing modifications require Payment Service lead approval
/services/billing-service/ @itbengal/billing-engineers

# Deployment engine modifications require DevOps approval
/services/deployment-engine/ @itbengal/devops-engineers
/infrastructure/ @itbengal/devops-engineers
```

#### 3. PR Approval Criteria
*   **Code Review Requirements**: At least two approvals from engineers listed in the code owners group.
*   **Test Coverage**: Core packages (like `@itbengal/database`, `@itbengal/utils`, and `deployment-engine`) must maintain a minimum of 80% test coverage.
*   **Successful Build Verification**: The automated CI suite must successfully compile all projects without errors.

---

### 5.4 Continuous Integration Pipelines (CI)

Our CI pipeline uses Turborepo's `--filter` flag to run linting, testing, and build checks only on the workspaces that have changed in the pull request. This keeps our CI runs fast.

#### Pull Request Validation Workflow (`.github/workflows/ci.yml`)

```yaml
name: Continuous Integration

on:
  pull_request:
    branches:
      - develop
      - main

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Fetches full history for change detection

      - name: Setup Node.js Runtime
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Monorepo Dependencies
        run: npm ci

      - name: Verify Environment Formats
        run: npx prettier --check "**/*.{ts,tsx,json,md}"

      - name: Run Schema Generation
        run: npx turbo run db:generate

      - name: Execute Builds (Targeting Only Changed Components)
        run: npx turbo run build --filter=[origin/develop]
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: itbengal-platform

      - name: Execute Linting Suites
        run: npx turbo run lint --filter=[origin/develop]

      - name: Execute Test Suites
        run: npx turbo run test --filter=[origin/develop]
```

---

### 5.5 Squash Merge Policy and Conventional Commits

ITBengal enforces a **Squash Merge** policy for all pull requests merged into `develop` and `main`. 

Squashing combines all commits from a feature branch into a single, well-formatted commit. This keeps our git history clean, makes rollbacks simple (reverting a feature is a single commit revert), and makes it easy to trace changes.

#### Conventional Commits Specification
We require all commit messages to follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

*   **Types**:
    *   `feat`: A new feature (e.g., `feat(billing): add bkash checkout integration`).
    *   `fix`: A bugfix (e.g., `fix(deployment): resolve traefik route creation delay`).
    *   `docs`: Documentation changes (e.g., `docs(readme): update environment setup steps`).
    *   `style`: Formatting updates, missing semicolons, etc. (no production code changes).
    *   `refactor`: Code changes that neither fix a bug nor add a feature.
    *   `perf`: Performance optimizations.
    *   `test`: Adding missing tests or correcting existing tests.
    *   `chore`: Maintenance tasks, dependency updates, build configurations.
*   **Scope**: The name of the workspace package being changed (e.g., `api`, `dashboard`, `database`, `ui`).

---

### 5.6 Automated Release and Tagging Strategy

ITBengal uses **Changesets** to automate version management and changelog generation.

#### 1. Adding a Change Definition
When a developer finishes a feature, they run the `changeset` CLI command to document their changes:

```bash
npx changeset
```

This starts an interactive prompt where the developer chooses which workspaces to version (major, minor, patch) and writes a description of the change. This creates a small markdown file in the `.changeset/` directory.

#### 2. Release Candidate Version Promotion
When we merge our changes into the `develop` branch, a GitHub Actions workflow runs. If it finds new files in the `.changeset/` folder, it automatically opens a PR to update the version numbers and changelogs.

Once this PR is merged, the package versions are updated, and the changes are tagged in Git.

#### 3. Automatic Tag Deployment Gate
When a release tag (`vX.Y.Z`) is pushed to `main`, it triggers our CD pipeline. This builds the production Docker containers, tags them with the version number, and deploys them to our infrastructure nodes:

```yaml
name: Continuous Deployment

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'

jobs:
  release-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Log in to Docker Registry
        uses: docker/login-action@v3
        with:
          registry: registry.itbengal.com
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and Push Core API Image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./infrastructure/docker/api.Dockerfile
          push: true
          tags: |
            registry.itbengal.com/api:${{ github.ref_name }}
            registry.itbengal.com/api:latest

      - name: Run Infrastructure Deployment Playbook
        run: |
          ansible-playbook -i infrastructure/ansible/inventories/production \
                           infrastructure/ansible/playbooks/deploy-app.yml \
                           --extra-vars "app_version=${{ github.ref_name }}"
        env:
          ANSIBLE_HOST_KEY_CHECKING: 'False'
          ANSIBLE_PRIVATE_KEY: ${{ secrets.ANSIBLE_SSH_KEY }}
```
