# 08 — Deployment Architecture

> **ITBengal Hosting Platform — Engineering Specification**
> Version 1.0 · July 2026
> Classification: Internal — Engineering Team

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Deployment Pipeline Overview](#2-deployment-pipeline-overview)
3. [Source Acquisition](#3-source-acquisition)
4. [Build Process](#4-build-process)
5. [Docker Image Creation](#5-docker-image-creation)
6. [Container Creation & Management](#6-container-creation--management)
7. [Reverse Proxy Configuration (Traefik)](#7-reverse-proxy-configuration-traefik)
8. [SSL/TLS Certificate Management](#8-ssltls-certificate-management)
9. [Health Checks](#9-health-checks)
10. [DNS Configuration](#10-dns-configuration)
11. [Build System — Framework-Specific Builders](#11-build-system--framework-specific-builders)
12. [Deployment Queue System (BullMQ)](#12-deployment-queue-system-bullmq)
13. [Node Selection Algorithm](#13-node-selection-algorithm)
14. [Deployment Scheduling](#14-deployment-scheduling)
15. [Rollback Mechanism](#15-rollback-mechanism)
16. [Environment Variable Management](#16-environment-variable-management)
17. [Build Log Streaming](#17-build-log-streaming)
18. [Deployment History & Audit](#18-deployment-history--audit)
19. [Zero-Downtime Deployment Strategy](#19-zero-downtime-deployment-strategy)
20. [Preview Deployments (Future)](#20-preview-deployments-future)
21. [WordPress Deployment](#21-wordpress-deployment)
22. [Resource Allocation Summary](#22-resource-allocation-summary)
23. [Deployment Failure Handling](#23-deployment-failure-handling)

---

## 1. Executive Overview

### 1.1 Purpose

ITBengal's **Custom Deployment Engine** is the core runtime responsible for transforming source code into production-running containers across the platform's self-managed VPS infrastructure. It replaces the need for external CI/CD services (GitHub Actions, CircleCI, etc.) by providing a fully integrated, opinionated deployment pipeline that handles:

- Source acquisition from Git providers and ZIP uploads
- Framework-aware build orchestration
- Docker image creation with multi-stage optimization
- Container lifecycle management with resource limits
- Reverse proxy routing via Traefik
- Automatic SSL provisioning via Let's Encrypt
- Health monitoring with automated remediation
- Zero-downtime deployments with instant rollback

### 1.2 Design Principles

| Principle | Description |
|---|---|
| **Immutable Deployments** | Every deployment produces a new Docker image tagged with a unique identifier. Running containers are never modified in-place. |
| **Zero-Downtime** | Blue-green deployment strategy ensures traffic is only routed to healthy new containers before old ones are drained. |
| **Horizontal Scaling** | The engine is node-aware. New VPS servers are registered and automatically receive workloads without architectural changes. |
| **Queue-First** | All deployment work is processed through BullMQ priority queues, enabling fair scheduling, retry logic, and back-pressure. |
| **Framework Intelligence** | The build system auto-detects frameworks and applies optimized build configurations without user intervention. |
| **Auditability** | Every deployment action is logged, timestamped, and associated with a user and organization for full traceability. |

### 1.3 High-Level Architecture

```mermaid
graph TB
    subgraph "Platform Server"
        API["Express.js API"]
        Dashboard["Next.js Dashboard"]
        DB[(PostgreSQL)]
        Redis[(Redis)]
        BullMQ["BullMQ Workers"]
    end

    subgraph "React Hosting Node(s)"
        Traefik_R["Traefik Edge Router"]
        Registry_R["Docker Registry"]
        Containers_R["App Containers"]
    end

    subgraph "WordPress Hosting Node(s)"
        Traefik_W["Traefik Edge Router"]
        WP_Containers["WP Containers"]
        MariaDB_W["MariaDB Instances"]
    end

    User["Developer / User"] --> Dashboard
    Dashboard --> API
    GitHub["GitHub / GitLab / Bitbucket"] -->|Webhook| API
    API --> Redis
    API --> DB
    Redis --> BullMQ
    BullMQ -->|Build & Deploy| Registry_R
    BullMQ -->|Build & Deploy| Traefik_W
    Registry_R --> Containers_R
    Traefik_R --> Containers_R
    Traefik_W --> WP_Containers
    WP_Containers --> MariaDB_W

    Internet["Internet Traffic"] --> Traefik_R
    Internet --> Traefik_W
```

---

## 2. Deployment Pipeline Overview

### 2.1 Complete Pipeline Flow

```mermaid
flowchart TD
    A[Trigger Received] --> B{Source Type?}
    B -->|Git Push / Manual| C[Clone Repository]
    B -->|ZIP Upload| D[Extract Archive]
    C --> E[Detect Framework]
    D --> E
    E --> F[Resolve Build Configuration]
    F --> G[Install Dependencies]
    G --> H[Execute Build Command]
    H --> I{Build Successful?}
    I -->|No| J[Mark Deployment Failed]
    I -->|Yes| K[Create Docker Image]
    K --> L[Push to Local Registry]
    L --> M[Select Target Node]
    M --> N[Pull Image on Node]
    N --> O[Create New Container]
    O --> P[Run Health Checks]
    P --> Q{Healthy?}
    Q -->|No| R[Retry Health Check]
    R --> S{Max Retries?}
    S -->|Yes| J
    S -->|No| P
    Q -->|Yes| T[Update Traefik Routing]
    T --> U[Drain Old Container]
    U --> V[Stop Old Container]
    V --> W[Mark Deployment Live]
    W --> X[Cleanup Old Images]
    J --> Y[Send Failure Notification]
    W --> Z[Send Success Notification]
```

### 2.2 Pipeline Stage Timing

| Stage | Typical Duration | Timeout |
|---|---|---|
| Source acquisition (Git clone) | 5–30s | 120s |
| Source acquisition (ZIP extract) | 2–10s | 60s |
| Framework detection | < 1s | 5s |
| Dependency installation | 30–180s | 600s |
| Build command execution | 30–300s | 900s |
| Docker image creation | 10–60s | 300s |
| Image push to registry | 5–30s | 120s |
| Node selection | < 1s | 5s |
| Image pull on node | 5–30s | 120s |
| Container creation | 2–5s | 30s |
| Health check (initial) | 5–30s | 120s |
| Traefik routing update | 1–3s | 10s |
| Old container drain | 10–30s | 60s |
| **Total (typical)** | **2–8 min** | **25 min max** |

---

## 3. Source Acquisition

### 3.1 Git Clone (GitHub / GitLab / Bitbucket)

The platform supports connecting repositories from the three major Git providers via OAuth 2.0.

#### 3.1.1 OAuth Integration

| Provider | OAuth Scope | Webhook Events |
|---|---|---|
| GitHub | `repo`, `read:user`, `user:email` | `push`, `pull_request`, `delete` |
| GitLab | `read_repository`, `read_user`, `api` | `push_events`, `merge_request_events` |
| Bitbucket | `repository`, `account` | `repo:push`, `pullrequest:created` |

#### 3.1.2 Git Clone Process

1. **Validate webhook signature** — HMAC-SHA256 for GitHub, token for GitLab, HMAC-SHA256 for Bitbucket.
2. **Fetch OAuth access token** — from encrypted storage, refresh if expired.
3. **Clone specific branch** — shallow clone (`--depth=1`) for performance.
4. **Pin to commit SHA** — recorded in deployment record for reproducibility.
5. **Checkout to build directory** — isolated per deployment: `/tmp/builds/{deployment_id}/`.

```bash
# Shallow clone for performance
git clone --depth=1 --branch=${BRANCH} \
  https://x-access-token:${TOKEN}@github.com/${OWNER}/${REPO}.git \
  /tmp/builds/${DEPLOYMENT_ID}/source
```

#### 3.1.3 Webhook Processing

```mermaid
sequenceDiagram
    participant Git as GitHub/GitLab/Bitbucket
    participant API as ITBengal API
    participant Redis as Redis
    participant Worker as BullMQ Worker

    Git->>API: POST /webhooks/{provider}
    API->>API: Verify webhook signature
    API->>API: Parse payload (branch, commit, repo)
    API->>API: Find matching project
    API->>API: Check auto-deploy enabled
    API->>API: Check branch matches
    API->>Redis: Enqueue build job
    Redis->>Worker: Dequeue job
    Worker->>Worker: Clone repository
    Worker->>Worker: Build & deploy
    Worker->>API: Update deployment status
    API->>Git: Update commit status (pending/success/failure)
```

### 3.2 ZIP Upload

| Constraint | Value |
|---|---|
| Max file size | 500 MB |
| Allowed extensions | `.zip` |
| Max files after extraction | 50,000 |
| Max extracted size | 2 GB |
| Upload timeout | 300s |

**Process:**

1. Upload received via multipart form endpoint `POST /api/v1/applications/{id}/deploy/upload`.
2. Virus scan (ClamAV) on uploaded archive.
3. Extract to isolated build directory `/tmp/builds/{deployment_id}/source`.
4. Validate no symlink escapes, no forbidden files (`.env` with secrets, binary executables).
5. Proceed to framework detection.

### 3.3 Source Validation

Before proceeding to the build phase, all sources are validated:

| Check | Action on Failure |
|---|---|
| `.itbengal-ignore` present | Exclude listed paths from build context |
| `package.json` syntax valid | Fail with parse error |
| No binary executables in source | Warning logged |
| No `.env` files committed | Warning logged, not injected |
| Directory size < plan limit | Fail with quota exceeded |
| No symlinks escaping build dir | Fail with security error |

---

## 4. Build Process

### 4.1 Framework Detection Algorithm

The build system inspects the project root (or configured `root_directory`) and identifies the framework using a priority-ordered detection chain.

```mermaid
flowchart TD
    A[Scan Project Root] --> B{next.config.* exists?}
    B -->|Yes| C[Next.js]
    B -->|No| D{nuxt.config.* exists?}
    D -->|Yes| E[Nuxt.js]
    D -->|No| F{angular.json exists?}
    F -->|Yes| G[Angular]
    F -->|No| H{svelte.config.* exists?}
    H -->|Yes| I[SvelteKit]
    H -->|No| J{astro.config.* exists?}
    J -->|Yes| K[Astro]
    J -->|No| L{vite.config.* exists?}
    L -->|Yes| M{Check vite plugins}
    M -->|@vitejs/plugin-react| N[React + Vite]
    M -->|@vitejs/plugin-vue| O[Vue + Vite]
    M -->|@sveltejs/vite-plugin-svelte| P[Svelte + Vite]
    M -->|None specific| Q[Vite Generic]
    L -->|No| R{vue.config.* exists?}
    R -->|Yes| S[Vue CLI]
    R -->|No| T{package.json has react-scripts?}
    T -->|Yes| U[Create React App]
    T -->|No| V{package.json exists?}
    V -->|Yes| W[Node.js Generic]
    V -->|No| X{index.html exists?}
    X -->|Yes| Y[Static HTML]
    X -->|No| Z[Unknown — Fail]
```

### 4.2 Supported Frameworks

| Framework | Detection File(s) | Default Build Command | Output Directory | Runtime |
|---|---|---|---|---|
| Next.js | `next.config.js/ts/mjs` | `npm run build` | `.next` | Node.js (SSR) |
| React (CRA) | `react-scripts` in deps | `npm run build` | `build` | Nginx (static) |
| React (Vite) | `vite.config.*` + react plugin | `npm run build` | `dist` | Nginx (static) |
| Vue (Vite) | `vite.config.*` + vue plugin | `npm run build` | `dist` | Nginx (static) |
| Vue (CLI) | `vue.config.js` | `npm run build` | `dist` | Nginx (static) |
| Angular | `angular.json` | `npm run build -- --configuration production` | `dist/{project}` | Nginx (static) |
| SvelteKit | `svelte.config.js` | `npm run build` | `build` | Node.js (SSR) |
| Astro | `astro.config.mjs` | `npm run build` | `dist` | Node.js or Nginx |
| Vite (generic) | `vite.config.*` | `npm run build` | `dist` | Nginx (static) |
| Nuxt.js | `nuxt.config.*` | `npm run build` | `.output` | Node.js (SSR) |
| Static HTML | `index.html` (no package.json) | None | `.` (root) | Nginx (static) |

### 4.3 Package Manager Detection

| Indicator | Package Manager | Lock File |
|---|---|---|
| `pnpm-lock.yaml` present | pnpm | `pnpm-lock.yaml` |
| `yarn.lock` present | Yarn | `yarn.lock` |
| `package-lock.json` present | npm | `package-lock.json` |
| `bun.lockb` present | Bun | `bun.lockb` |
| None present | npm (fallback) | — |

### 4.4 Build Execution Environment

Builds execute inside ephemeral Docker containers on the **Platform Server** (or dedicated worker nodes at scale).

| Parameter | Value |
|---|---|
| Base image | `node:20-alpine` (configurable per project) |
| Working directory | `/app` |
| Build timeout | 15 min (configurable per plan) |
| Max build concurrency | 4 per worker node |
| Build volume mount | Source code bind-mounted |
| Network | Isolated build network (internet access for dependencies) |
| Environment | Build-time env vars injected |

### 4.5 Build Caching Strategy

| Cache Target | Strategy | Location |
|---|---|---|
| `node_modules` | Docker layer caching + named volume | `/cache/{project_id}/node_modules` |
| `.next/cache` | Persistent volume per project | `/cache/{project_id}/next-cache` |
| `pnpm store` | Global shared store | `/cache/pnpm-store` |
| Yarn cache | Global shared store | `/cache/yarn-cache` |
| Docker layers | BuildKit layer caching | Docker build cache |

### 4.6 Build Timeout by Plan

| Plan | Build Timeout | Build Minutes/Month |
|---|---|---|
| Starter | 10 min | 100 |
| Basic | 15 min | 300 |
| Professional | 20 min | 1,000 |
| Business | 30 min | 3,000 |
| Enterprise | 45 min | Unlimited |

---

## 5. Docker Image Creation

### 5.1 Multi-Stage Build Strategy

Every deployment produces a Docker image using multi-stage builds to minimize final image size.

#### 5.1.1 Static SPA Dockerfile (React/Vue/Angular/Vite)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

#### 5.1.2 SSR Application Dockerfile (Next.js/SvelteKit/Nuxt)

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
```

#### 5.1.3 Static HTML Dockerfile

```dockerfile
FROM nginx:1.25-alpine
COPY . /usr/share/nginx/html
COPY nginx-static.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### 5.2 Image Tagging Strategy

```
registry.itbengal.internal:5000/{org_slug}/{app_slug}:{deployment_id}
```

| Tag Component | Source | Example |
|---|---|---|
| Registry host | Internal registry | `registry.itbengal.internal:5000` |
| Organization slug | Organization record | `acme-corp` |
| Application slug | Application record | `my-portfolio` |
| Deployment ID | UUID (short) | `dep_a1b2c3d4` |

Additional tags applied:
- `latest` — always points to the current live deployment
- `{commit_sha_short}` — e.g., `abc1234` (7 chars)
- `{timestamp}` — e.g., `20260704-165300`

### 5.3 Image Registry

ITBengal operates a **private Docker registry** on the Platform Server for storing deployment images.

| Configuration | Value |
|---|---|
| Registry software | Docker Registry v2 |
| Storage backend | Local filesystem (`/data/registry`) |
| Authentication | Token-based (internal only) |
| TLS | Internal CA certificate |
| Garbage collection | Weekly (Sunday 03:00 UTC+6) |
| Max image age | Based on plan retention policy |

### 5.4 Image Cleanup Policy

| Plan | Images Retained | Max Age |
|---|---|---|
| Starter | 3 | 7 days |
| Basic | 5 | 14 days |
| Professional | 10 | 30 days |
| Business | 20 | 60 days |
| Enterprise | 50 | 90 days |

Cleanup runs as a scheduled BullMQ job every 6 hours.

---

## 6. Container Creation & Management

### 6.1 Container Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Creating
    Creating --> Starting: docker create
    Starting --> HealthChecking: docker start
    HealthChecking --> Healthy: health check passes
    HealthChecking --> Unhealthy: health check fails
    Unhealthy --> HealthChecking: retry
    Unhealthy --> Failed: max retries exceeded
    Healthy --> Routing: update Traefik labels
    Routing --> Live: traffic serving
    Live --> Draining: new deployment live
    Live --> Stopping: manual stop
    Draining --> Stopped: drain timeout reached
    Stopping --> Stopped: docker stop
    Stopped --> Removed: docker rm
    Failed --> Removed: cleanup
    Removed --> [*]
```

### 6.2 Resource Limits by Plan — React Hosting

| Plan | CPU Shares | CPU Limit (cores) | Memory Limit | Memory Reservation | Storage | Swap | PIDs Limit |
|---|---|---|---|---|---|---|---|
| Starter | 256 | 0.25 | 256 MB | 128 MB | 1 GB | 0 | 128 |
| Basic | 512 | 0.5 | 512 MB | 256 MB | 5 GB | 0 | 256 |
| Professional | 1024 | 1.0 | 1 GB | 512 MB | 10 GB | 256 MB | 512 |
| Business | 2048 | 2.0 | 2 GB | 1 GB | 25 GB | 512 MB | 1024 |
| Enterprise | 4096 | 4.0 | 4 GB | 2 GB | 50 GB | 1 GB | 2048 |

### 6.3 Resource Limits by Plan — WordPress Hosting

| Plan | CPU Shares | CPU Limit (cores) | Memory Limit | Memory Reservation | Storage | Swap | PIDs Limit |
|---|---|---|---|---|---|---|---|
| Starter | 512 | 0.5 | 512 MB | 256 MB | 5 GB | 0 | 256 |
| Basic | 1024 | 1.0 | 1 GB | 512 MB | 10 GB | 256 MB | 512 |
| Professional | 2048 | 2.0 | 2 GB | 1 GB | 25 GB | 512 MB | 1024 |
| Business | 3072 | 3.0 | 4 GB | 2 GB | 50 GB | 1 GB | 2048 |
| Enterprise | 4096 | 4.0 | 8 GB | 4 GB | 100 GB | 2 GB | 4096 |

### 6.4 Container Networking

Each hosting node runs a dedicated Docker network:

```bash
docker network create \
  --driver bridge \
  --subnet 172.20.0.0/16 \
  --opt com.docker.network.bridge.name=itbengal0 \
  itbengal-apps
```

Containers are attached to this network and discovered by Traefik via Docker socket.

### 6.5 Container Labels

Every application container is created with Traefik-compatible labels:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.${APP_SLUG}.rule=Host(`${DOMAIN}`)"
  - "traefik.http.routers.${APP_SLUG}.tls=true"
  - "traefik.http.routers.${APP_SLUG}.tls.certresolver=letsencrypt"
  - "traefik.http.services.${APP_SLUG}.loadbalancer.server.port=${PORT}"
  - "traefik.http.routers.${APP_SLUG}.middlewares=security-headers@file,gzip@file"
  - "itbengal.app.id=${APP_ID}"
  - "itbengal.deployment.id=${DEPLOYMENT_ID}"
  - "itbengal.org.id=${ORG_ID}"
  - "itbengal.plan=${PLAN_TIER}"
```

### 6.6 Container Restart Policies

| Scenario | Restart Policy |
|---|---|
| Application container (production) | `unless-stopped` |
| Build container (ephemeral) | `no` |
| WordPress container | `unless-stopped` |
| MariaDB container | `always` |

### 6.7 Volume Mounts

| Mount | Purpose | Type |
|---|---|---|
| `/app/data` | Persistent application data | Named volume |
| `/var/log/app` | Application logs | Bind mount to host |
| `/tmp` | Temp files (tmpfs, size-limited) | tmpfs |
| WordPress: `/var/www/html` | WordPress files | Named volume |
| WordPress: `/var/lib/mysql` | Database data | Named volume |

---

## 7. Reverse Proxy Configuration (Traefik)

### 7.1 Traefik Architecture

Traefik serves as the **edge router** on each hosting node. It performs:

- Automatic service discovery via the Docker socket
- Dynamic routing based on container labels
- Automatic SSL via Let's Encrypt ACME
- HTTP → HTTPS redirection
- Load balancing between blue/green containers
- Middleware application (security headers, compression, rate limiting)

### 7.2 Request Flow

```mermaid
flowchart LR
    Client[Client Browser] -->|HTTPS| Traefik[Traefik Edge Router]
    Traefik -->|Host Header Match| Router{Router}
    Router --> MW1[Security Headers]
    MW1 --> MW2[Gzip Compression]
    MW2 --> MW3[Rate Limiting]
    MW3 --> LB[Load Balancer]
    LB --> C1[Container v2 - New]
    LB -.->|draining| C2[Container v1 - Old]
```

### 7.3 Traefik Static Configuration

```yaml
# /etc/traefik/traefik.yml
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt
    transport:
      respondingTimeouts:
        readTimeout: 60s
        writeTimeout: 60s
        idleTimeout: 180s

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: itbengal-apps
    watch: true
  file:
    directory: /etc/traefik/dynamic
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: ssl@itbengal.com
      storage: /data/acme.json
      httpChallenge:
        entryPoint: web
      dnsChallenge:
        provider: cloudflare
        delayBeforeCheck: 10s

log:
  level: INFO
  filePath: /var/log/traefik/traefik.log

accessLog:
  filePath: /var/log/traefik/access.log
  bufferingSize: 100

metrics:
  prometheus:
    entryPoint: metrics
    addEntryPointsLabels: true
    addServicesLabels: true
```

### 7.4 Dynamic Middleware Configuration

```yaml
# /etc/traefik/dynamic/middlewares.yml
http:
  middlewares:
    security-headers:
      headers:
        browserXssFilter: true
        contentTypeNosniff: true
        frameDeny: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000
        customFrameOptionsValue: "SAMEORIGIN"
        referrerPolicy: "strict-origin-when-cross-origin"
        permissionsPolicy: "camera=(), microphone=(), geolocation=()"
        customResponseHeaders:
          X-Powered-By: ""
          Server: ""

    gzip:
      compress:
        excludedContentTypes:
          - "text/event-stream"
        minResponseBodyBytes: 1024

    rate-limit-default:
      rateLimit:
        average: 100
        burst: 200
        period: 1s

    rate-limit-api:
      rateLimit:
        average: 30
        burst: 50
        period: 1s
```

### 7.5 Traefik Monitoring

| Metric | Source | Alert Threshold |
|---|---|---|
| Request rate | Prometheus metrics | > 10,000 req/s |
| Error rate (5xx) | Access logs | > 5% of requests |
| Certificate expiry | ACME storage | < 14 days |
| Backend response time | Prometheus | P99 > 5s |
| Active connections | Traefik API | > 80% of limit |

---

## 8. SSL/TLS Certificate Management

### 8.1 Certificate Architecture

```mermaid
sequenceDiagram
    participant User as User
    participant API as ITBengal API
    participant Worker as SSL Worker
    participant Traefik as Traefik
    participant LE as Let's Encrypt

    User->>API: Add custom domain
    API->>API: Create DNS verification TXT record
    API->>User: Show DNS verification instructions
    User->>User: Configure DNS records
    API->>Worker: Enqueue SSL provisioning job
    Worker->>Worker: Verify DNS records propagated
    Worker->>Traefik: Add router with domain
    Traefik->>LE: ACME HTTP-01 Challenge
    LE->>Traefik: Challenge token
    Traefik->>LE: Challenge response
    LE->>Traefik: Issue certificate
    Traefik->>Traefik: Store certificate
    Worker->>API: Update SSL status to active
    API->>User: Notify SSL active
```

### 8.2 Certificate Types

| Type | Use Case | Challenge | Auto-Renew |
|---|---|---|---|
| **Platform wildcard** | `*.itbengal.app` subdomains | DNS-01 (Cloudflare) | Yes (30 days before expiry) |
| **Custom domain** | User's own domain | HTTP-01 | Yes (30 days before expiry) |
| **Custom wildcard** | `*.customer-domain.com` | DNS-01 (requires DNS on ITBengal) | Yes |

### 8.3 Certificate Storage

| Item | Location |
|---|---|
| ACME account key | `/data/traefik/acme.json` (chmod 600) |
| Certificate files | Managed by Traefik in `acme.json` |
| Certificate metadata | PostgreSQL `ssl_certificates` table |
| Backup | Encrypted daily backup to backup server |

### 8.4 Certificate Renewal

- Traefik handles automatic renewal 30 days before expiry.
- A BullMQ cron job checks certificate status daily and alerts if renewal fails.
- If automated renewal fails 3 times, a support ticket is auto-created.

---

## 9. Health Checks

### 9.1 Health Check Types

| Type | Use Case | Method |
|---|---|---|
| **HTTP** | Web applications | `GET /health` or `GET /` → expect 200 |
| **TCP** | Non-HTTP services | TCP connection to port |
| **Startup Probe** | Slow-starting apps | Extended initial check period |

### 9.2 Health Check Configuration by Framework

| Framework | Health Endpoint | Protocol | Interval | Timeout | Start Period | Retries |
|---|---|---|---|---|---|---|
| Next.js (SSR) | `/api/health` | HTTP | 30s | 5s | 30s | 3 |
| React (static) | `/health` (nginx) | HTTP | 30s | 3s | 5s | 3 |
| Vue (static) | `/health` (nginx) | HTTP | 30s | 3s | 5s | 3 |
| Angular (static) | `/health` (nginx) | HTTP | 30s | 3s | 5s | 3 |
| SvelteKit (SSR) | `/health` | HTTP | 30s | 5s | 20s | 3 |
| Astro (SSR) | `/health` | HTTP | 30s | 5s | 15s | 3 |
| Astro (static) | `/health` (nginx) | HTTP | 30s | 3s | 5s | 3 |
| WordPress | `/wp-login.php` | HTTP | 60s | 10s | 60s | 5 |
| MariaDB | TCP :3306 | TCP | 30s | 5s | 30s | 3 |

### 9.3 Container Health States

```mermaid
stateDiagram-v2
    [*] --> Starting: container starts
    Starting --> Healthy: startup probe passes
    Starting --> Unhealthy: startup probe fails
    Healthy --> Unhealthy: health check fails
    Unhealthy --> Healthy: health check passes
    Unhealthy --> Failed: max consecutive failures
    Failed --> Restarting: auto-restart policy
    Restarting --> Starting: container restarts
    Failed --> Alerting: restart limit reached
    Alerting --> [*]: manual intervention
```

### 9.4 Automated Actions on Health Failure

| Consecutive Failures | Action |
|---|---|
| 1 | Log warning |
| 2 | Log error |
| 3 | Restart container |
| 6 (2 restarts failed) | Remove from Traefik routing |
| 9 (3 restarts failed) | Send alert to user + admin |
| 12 | Attempt rollback to previous deployment |
| 15 | Escalate — create support ticket |

### 9.5 Nginx Health Endpoint for Static Sites

All static site Nginx configurations include a health check endpoint:

```nginx
server {
    listen 80;
    server_name _;

    location /health {
        access_log off;
        return 200 '{"status":"healthy","timestamp":"$time_iso8601"}';
        add_header Content-Type application/json;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
```

---

## 10. DNS Configuration

### 10.1 Platform Subdomain Assignment

Every application receives a platform subdomain upon creation:

```
{app_slug}-{short_id}.itbengal.app
```

Example: `my-portfolio-a1b2.itbengal.app`

This subdomain is automatically configured via a wildcard DNS record (`*.itbengal.app → Node IP`) and a wildcard SSL certificate.

### 10.2 Custom Domain Flow

```mermaid
sequenceDiagram
    participant User
    participant API as ITBengal API
    participant DNS as DNS Checker
    participant Node as Hosting Node

    User->>API: Add custom domain (example.com)
    API->>API: Generate verification TXT record
    Note over API: _itbengal-verify.example.com TXT "itb_verify_abc123"
    API->>User: Show DNS instructions
    User->>User: Add DNS records at registrar
    Note over User: A record → Node IP<br/>TXT record → verification
    User->>API: Click "Verify Domain"
    API->>DNS: Check TXT record
    DNS->>API: Record found
    API->>API: Mark domain verified
    API->>Node: Configure Traefik router for domain
    Node->>Node: Traefik requests SSL from Let's Encrypt
    API->>User: Domain active with SSL
```

### 10.3 Required DNS Records for Custom Domains

| Record Type | Name | Value | Purpose |
|---|---|---|---|
| `A` | `@` | `{node_ip}` | Points domain to hosting node |
| `A` | `www` | `{node_ip}` | Points www subdomain |
| `CNAME` | `www` | `{app_slug}.itbengal.app` | Alternative: CNAME to platform subdomain |
| `TXT` | `_itbengal-verify` | `itb_verify_{token}` | Domain ownership verification |

### 10.4 DNS Propagation Checking

The platform checks DNS propagation against multiple public DNS resolvers:

| Resolver | Provider |
|---|---|
| `8.8.8.8` | Google |
| `1.1.1.1` | Cloudflare |
| `9.9.9.9` | Quad9 |
| `208.67.222.222` | OpenDNS |

Verification is considered complete when at least 3 of 4 resolvers return the expected record.

### 10.5 Openprovider Integration

For domains registered through ITBengal (via Openprovider), DNS records are managed automatically:

- A records auto-configured on deployment
- AAAA records for IPv6 support
- MX records for email (if configured)
- Nameservers set to ITBengal/Openprovider nameservers

---

## 11. Build System — Framework-Specific Builders

### 11.1 Next.js Builder

| Setting | Value |
|---|---|
| Detection | `next.config.js`, `next.config.ts`, `next.config.mjs` |
| Build command | `npm run build` |
| Output | `.next` directory |
| Runtime | Node.js 20 (SSR) |
| Standalone mode | `output: 'standalone'` injected if not present |
| Port | `3000` (configurable via `PORT` env) |

**Dockerfile strategy:** Three-stage build (deps → build → runtime). Uses Next.js standalone output for minimal runtime image. Static assets served via `_next/static` copy.

**Environment variables:**
- `NEXT_PUBLIC_*` — injected at build time (baked into client bundle)
- All others — available at runtime via `process.env`

**Nginx reverse proxy config for static assets:**

```nginx
location /_next/static {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 365d;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### 11.2 React (CRA / Vite) Builder

| Setting | Value |
|---|---|
| Detection (CRA) | `react-scripts` in package.json dependencies |
| Detection (Vite) | `vite.config.*` with `@vitejs/plugin-react` |
| Build command | `npm run build` |
| Output (CRA) | `build` |
| Output (Vite) | `dist` |
| Runtime | Nginx (static files) |

**Nginx SPA configuration:**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 11.3 Vue.js Builder

| Setting | Value |
|---|---|
| Detection (CLI) | `vue.config.js` or `@vue/cli-service` in deps |
| Detection (Vite) | `vite.config.*` with `@vitejs/plugin-vue` |
| Build command | `npm run build` |
| Output | `dist` |
| Runtime | Nginx (static files) |

### 11.4 Angular Builder

| Setting | Value |
|---|---|
| Detection | `angular.json` |
| Build command | `npm run build -- --configuration production` |
| Output | `dist/{project-name}/browser` (Angular 17+) |
| Runtime | Nginx (static files) |

### 11.5 Svelte / SvelteKit Builder

| Setting | Value |
|---|---|
| Detection | `svelte.config.js` |
| Build command | `npm run build` |
| Output (SvelteKit) | `build` |
| Runtime | Node.js (SSR) or Nginx (static with `@sveltejs/adapter-static`) |

Adapter detection: If `@sveltejs/adapter-static` is found in dependencies, serve as static. Otherwise, treat as SSR Node.js application.

### 11.6 Astro Builder

| Setting | Value |
|---|---|
| Detection | `astro.config.mjs` |
| Build command | `npm run build` |
| Output | `dist` |
| Runtime | Depends on output mode |

Astro output mode detection:
- `output: 'static'` → Nginx
- `output: 'server'` or `output: 'hybrid'` → Node.js

### 11.7 Vite (Generic) Builder

| Setting | Value |
|---|---|
| Detection | `vite.config.*` without framework-specific plugins |
| Build command | `npm run build` |
| Output | `dist` |
| Runtime | Nginx (static files) |

### 11.8 Static HTML Builder

| Setting | Value |
|---|---|
| Detection | `index.html` at root, no `package.json` |
| Build command | None |
| Output | Entire project directory |
| Runtime | Nginx (static files) |

### 11.9 Custom Build Command Override

Users can override any default by configuring the project:

| Field | Override |
|---|---|
| `build_command` | Custom build command (e.g., `npm run build:prod`) |
| `install_command` | Custom install command (e.g., `pnpm install --frozen-lockfile`) |
| `output_directory` | Custom output directory |
| `node_version` | Node.js version (`18`, `20`, `22`) |
| `root_directory` | Subdirectory containing the app (monorepo support) |

---

## 12. Deployment Queue System (BullMQ)

### 12.1 Queue Architecture

```mermaid
graph TB
    API["Express.js API"] -->|Add Job| Redis[(Redis)]

    subgraph "BullMQ Queues"
        BQ["build-queue"]
        DQ["deploy-queue"]
        SQ["ssl-queue"]
        CQ["cleanup-queue"]
        NQ["notification-queue"]
        HQ["health-check-queue"]
    end

    Redis --> BQ
    Redis --> DQ
    Redis --> SQ
    Redis --> CQ
    Redis --> NQ
    Redis --> HQ

    subgraph "Workers"
        BW["Build Workers x4"]
        DW["Deploy Workers x4"]
        SW["SSL Workers x2"]
        CW["Cleanup Workers x2"]
        NW["Notification Workers x2"]
        HW["Health Workers x2"]
    end

    BQ --> BW
    DQ --> DW
    SQ --> SW
    CQ --> CW
    NQ --> NW
    HQ --> HW

    subgraph "Dead Letter Queues"
        BDLQ["build-dlq"]
        DDLQ["deploy-dlq"]
        SDLQ["ssl-dlq"]
    end

    BW -->|Failed after retries| BDLQ
    DW -->|Failed after retries| DDLQ
    SW -->|Failed after retries| SDLQ
```

### 12.2 Queue Configuration

| Queue | Purpose | Concurrency | Max Retries | Backoff | TTL |
|---|---|---|---|---|---|
| `build-queue` | Source clone + build | 4 | 2 | Exponential (30s, 60s) | 30 min |
| `deploy-queue` | Container creation + routing | 4 | 3 | Exponential (10s, 30s, 90s) | 15 min |
| `ssl-queue` | SSL certificate provisioning | 2 | 5 | Fixed (60s) | 30 min |
| `cleanup-queue` | Old image/container removal | 2 | 3 | Fixed (30s) | 10 min |
| `notification-queue` | Email/SMS/push notifications | 4 | 3 | Exponential (5s, 15s, 45s) | 5 min |
| `health-check-queue` | Periodic health checks | 2 | 1 | None | 2 min |

### 12.3 Priority Levels

| Plan | Priority Value | Description |
|---|---|---|
| Enterprise | 1 (highest) | Processed immediately |
| Business | 2 | High priority |
| Professional | 3 | Normal priority |
| Basic | 4 | Standard priority |
| Starter | 5 (lowest) | Best effort |

Priority is set on the BullMQ job:

```javascript
await buildQueue.add('build', jobData, {
  priority: getPriorityForPlan(plan.tier),
  attempts: 2,
  backoff: { type: 'exponential', delay: 30000 },
  removeOnComplete: { age: 86400, count: 1000 },
  removeOnFail: { age: 604800 },
});
```

### 12.4 Job Data Schema

```json
{
  "jobId": "job_a1b2c3d4",
  "deploymentId": "dep_e5f6g7h8",
  "applicationId": "app_i9j0k1l2",
  "projectId": "prj_m3n4o5p6",
  "organizationId": "org_q7r8s9t0",
  "userId": "usr_u1v2w3x4",
  "source": {
    "type": "git",
    "provider": "github",
    "repoUrl": "https://github.com/acme/my-app.git",
    "branch": "main",
    "commitSha": "abc1234def5678",
    "accessToken": "encrypted:..."
  },
  "build": {
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "installCommand": "npm ci",
    "outputDirectory": ".next",
    "nodeVersion": "20",
    "rootDirectory": ".",
    "environmentVariables": {
      "NEXT_PUBLIC_API_URL": "https://api.example.com",
      "DATABASE_URL": "encrypted:..."
    }
  },
  "deploy": {
    "targetNodeId": "node_y5z6a7b8",
    "cpuLimit": "1.0",
    "memoryLimit": "1073741824",
    "port": 3000,
    "domain": "my-app-a1b2.itbengal.app",
    "customDomain": "example.com"
  },
  "plan": {
    "tier": "professional",
    "priority": 3
  },
  "metadata": {
    "triggeredBy": "git_push",
    "retryCount": 0,
    "createdAt": "2026-07-04T10:00:00Z"
  }
}
```

### 12.5 Dead Letter Queue Handling

Jobs that exhaust all retries are moved to the corresponding dead letter queue:

1. **Automatic alert** — Notification sent to admin and user.
2. **Manual inspection** — Admin can view failed job data in the admin dashboard.
3. **Manual retry** — Admin can re-enqueue failed jobs with modifications.
4. **Expiry** — DLQ jobs are retained for 30 days, then purged.

### 12.6 Rate Limiting per Plan

| Plan | Deployments / Hour | Deployments / Day | Concurrent Builds |
|---|---|---|---|
| Starter | 5 | 20 | 1 |
| Basic | 10 | 50 | 1 |
| Professional | 20 | 100 | 2 |
| Business | 50 | 200 | 3 |
| Enterprise | Unlimited | Unlimited | 5 |

Rate limiting is enforced at the API layer using Redis sliding window counters before jobs are enqueued.

---

## 13. Node Selection Algorithm

### 13.1 Algorithm Flowchart

```mermaid
flowchart TD
    A[Deployment Request] --> B[Filter: Node Type Match]
    B --> C[Filter: Node Status = active]
    C --> D[Filter: Has Capacity]
    D --> E{Eligible Nodes > 0?}
    E -->|No| F[Queue: Wait for Capacity]
    E -->|Yes| G[Score Each Node]
    G --> H[Weight: Available CPU - 30%]
    G --> I[Weight: Available RAM - 25%]
    G --> J[Weight: Container Count - 15%]
    G --> K[Weight: Disk I/O - 10%]
    G --> L[Weight: Network BW - 10%]
    G --> M[Weight: Health Score - 10%]
    H & I & J & K & L & M --> N[Compute Weighted Score]
    N --> O[Select Highest Score]
    O --> P[Assign Deployment to Node]
```

### 13.2 Scoring Formula

```
node_score = (cpu_available_pct × 0.30)
            + (ram_available_pct × 0.25)
            + (container_headroom_pct × 0.15)
            + (disk_io_available_pct × 0.10)
            + (network_bw_available_pct × 0.10)
            + (health_score × 0.10)
```

Where:
- `cpu_available_pct` = `(total_cpu - used_cpu) / total_cpu × 100`
- `ram_available_pct` = `(total_memory - used_memory) / total_memory × 100`
- `container_headroom_pct` = `(max_containers - container_count) / max_containers × 100`
- `health_score` = `0–100` based on uptime, error rate, response time

### 13.3 Node Registration and Heartbeat

| Parameter | Value |
|---|---|
| Heartbeat interval | 30 seconds |
| Heartbeat timeout | 90 seconds (3 missed = offline) |
| Registration endpoint | `POST /api/internal/nodes/register` |
| Heartbeat endpoint | `POST /api/internal/nodes/heartbeat` |
| Heartbeat payload | CPU, RAM, disk, container count, Docker status |

**Heartbeat Protocol:**

```mermaid
sequenceDiagram
    participant Node as Hosting Node
    participant API as Platform API
    participant DB as PostgreSQL

    loop Every 30 seconds
        Node->>API: POST /api/internal/nodes/heartbeat
        Note over Node,API: Payload: cpu_used, mem_used,<br/>disk_used, container_count,<br/>docker_version, uptime
        API->>DB: UPDATE server_nodes SET ... WHERE id = nodeId
        API->>Node: 200 OK
    end

    Note over API: If 3 heartbeats missed (90s):
    API->>DB: UPDATE server_nodes SET status = 'offline'
    API->>API: Trigger failover for affected containers
```

### 13.4 Capacity Thresholds

| Resource | Warning Threshold | Critical Threshold | Action at Critical |
|---|---|---|---|
| CPU usage | 70% | 90% | Stop accepting new deployments |
| Memory usage | 75% | 90% | Stop accepting new deployments |
| Disk usage | 70% | 85% | Alert + cleanup old images |
| Container count | 80% of max | 95% of max | Stop accepting new deployments |

---

## 14. Deployment Scheduling

### 14.1 Trigger Types

| Trigger | Source | Behavior |
|---|---|---|
| **Git push** | Webhook from provider | Automatic — if `auto_deploy` enabled and branch matches |
| **Manual** | Dashboard button or API call | Immediate — uses current branch HEAD |
| **Scheduled** | Cron expression (future) | Queued — executes at specified time |
| **Rollback** | Dashboard or API | Immediate — re-activates previous deployment |
| **API** | External API call | Immediate — same as manual |

### 14.2 Deployment Locking

Only one deployment can be in progress per application at a time.

```
Lock key: deployment:lock:{application_id}
Lock TTL: 30 minutes (auto-release safety net)
Lock storage: Redis
```

If a deployment is already in progress:
- **Git push triggers:** Queued. The latest push replaces any previously queued push (coalescing).
- **Manual triggers:** Rejected with error message "Deployment already in progress."
- **Rollback triggers:** Allowed — cancels current deployment first.

### 14.3 Deployment Coalescing

When multiple git pushes arrive while a build is in progress:

1. First push → starts building.
2. Second push → queued.
3. Third push → replaces second push in queue (only latest commit matters).
4. First build completes → dequeues and starts building from third push's commit.

This prevents wasted build resources on intermediate commits.

---

## 15. Rollback Mechanism

### 15.1 Version Retention Policy

| Plan | Versions Retained | Retention Period |
|---|---|---|
| Starter | 3 | 7 days |
| Basic | 5 | 14 days |
| Professional | 10 | 30 days |
| Business | 20 | 60 days |
| Enterprise | 50 | 90 days |

### 15.2 Rollback Process

```mermaid
sequenceDiagram
    participant User
    participant API as ITBengal API
    participant DB as PostgreSQL
    participant Node as Hosting Node
    participant Traefik

    User->>API: POST /api/v1/apps/{id}/rollback/{deploymentId}
    API->>DB: Verify target deployment exists & image available
    API->>DB: Create new deployment record (type: rollback)
    API->>Node: Pull existing image (already cached)
    Node->>Node: Create new container from old image
    Node->>Node: Inject current env vars (not snapshot)
    Node->>Node: Health check new container
    Node->>Traefik: Update routing to new container
    Node->>Node: Drain old container
    Node->>Node: Stop old container
    API->>DB: Mark rollback deployment as live
    API->>DB: Mark previous deployment as rolled_back
    API->>User: Rollback complete
```

### 15.3 What Is Preserved in a Rollback

| Component | Preserved | Source |
|---|---|---|
| Docker image | Yes | Image registry |
| Application code | Yes | Baked into image |
| Build output | Yes | Baked into image |
| Environment variables | **No** — uses current values | PostgreSQL (live) |
| Custom domain config | Yes | Traefik labels |
| SSL certificates | Yes | Traefik ACME |
| Deployment metadata | Yes | PostgreSQL record |

### 15.4 Automatic Rollback

Automatic rollback is triggered when:

1. New deployment passes build but fails health checks after all retries.
2. A `previous_stable_deployment_id` exists and its image is available.
3. The auto-rollback flag is enabled for the project (default: `true`).

The system:
1. Stops the unhealthy new container.
2. Starts a container from the last known healthy image.
3. Restores Traefik routing.
4. Marks the failed deployment as `failed` and the restored one as `live`.
5. Sends notification to user about auto-rollback.

---

## 16. Environment Variable Management

### 16.1 Build-Time vs Runtime Variables

| Category | Injected When | Available Where | Example |
|---|---|---|---|
| **Build-time** | During `docker build` (as `ARG`/`ENV`) | Client-side bundles (baked in) | `NEXT_PUBLIC_API_URL`, `VITE_APP_TITLE` |
| **Runtime** | At container start (as `ENV`) | Server-side code only | `DATABASE_URL`, `API_SECRET_KEY` |
| **System** | Always injected | Both (framework-dependent) | `PORT`, `NODE_ENV`, `HOSTNAME` |

### 16.2 Variable Scoping

| Scope | Applies To | Precedence |
|---|---|---|
| Project-level | All environments | Lowest |
| Environment-level (`production`) | Production deployments only | Overrides project-level |
| Environment-level (`preview`) | Preview deployments only | Overrides project-level |
| Environment-level (`development`) | Development/local only | Overrides project-level |

### 16.3 System-Injected Variables

| Variable | Value | Description |
|---|---|---|
| `PORT` | `3000` (configurable) | Port the app should listen on |
| `NODE_ENV` | `production` | Always `production` in deployed containers |
| `HOSTNAME` | Container hostname | Docker container ID |
| `ITBENGAL_APP_ID` | Application UUID | ITBengal application identifier |
| `ITBENGAL_DEPLOYMENT_ID` | Deployment UUID | Current deployment identifier |
| `ITBENGAL_REGION` | Node region | Server region code |
| `ITBENGAL_URL` | Platform subdomain URL | Auto-assigned URL |

### 16.4 Encryption

- All environment variable values are encrypted at rest using **AES-256-GCM**.
- Encryption key is stored in a separate key management file, not in the database.
- Variables are decrypted only at injection time (build or container start).
- Sensitive variables (marked `is_secret`) are masked in build logs: `DATABASE_URL=****`.

### 16.5 Build-Time Variable Injection

For frameworks that need build-time variables (Next.js `NEXT_PUBLIC_*`, Vite `VITE_*`):

```dockerfile
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ANALYTICS_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ANALYTICS_ID=$NEXT_PUBLIC_ANALYTICS_ID
RUN npm run build
```

The deployment engine:
1. Reads all env vars for the project/environment.
2. Identifies build-time variables by prefix (`NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`).
3. Passes them as Docker build args.
4. Remaining vars are passed as runtime `ENV` in the final stage or at `docker run`.

---

## 17. Build Log Streaming

### 17.1 Architecture

```mermaid
sequenceDiagram
    participant Browser as User Browser
    participant API as API Server
    participant Redis as Redis PubSub
    participant Worker as Build Worker
    participant Container as Build Container

    Browser->>API: WS /api/v1/deployments/{id}/logs/stream
    API->>API: Authenticate WebSocket
    API->>Redis: SUBSCRIBE deployment:{id}:logs

    loop Build Execution
        Container->>Worker: stdout/stderr line
        Worker->>Redis: PUBLISH deployment:{id}:logs {line}
        Redis->>API: Message received
        API->>Browser: WS frame: log line
        Worker->>Worker: Append to log file
    end

    Worker->>Redis: PUBLISH deployment:{id}:logs {status: "complete"}
    Redis->>API: Message received
    API->>Browser: WS frame: build complete
    API->>Browser: Close WS connection
```

### 17.2 Log Format

Each log line is a JSON object:

```json
{
  "timestamp": "2026-07-04T10:30:15.123Z",
  "level": "info",
  "stage": "build",
  "line": 42,
  "message": "✓ Compiled successfully in 3.2s",
  "stream": "stdout"
}
```

### 17.3 Log Levels

| Level | Color (Dashboard) | Use |
|---|---|---|
| `debug` | Gray | Verbose build output |
| `info` | White | Standard output |
| `warn` | Yellow | Warnings |
| `error` | Red | Errors |
| `system` | Blue | ITBengal system messages (stage transitions) |

### 17.4 Log Retention by Plan

| Plan | Real-time Streaming | Persisted Logs | Retention |
|---|---|---|---|
| Starter | Yes | Last 3 deployments | 7 days |
| Basic | Yes | Last 5 deployments | 14 days |
| Professional | Yes | Last 10 deployments | 30 days |
| Business | Yes | Last 20 deployments | 60 days |
| Enterprise | Yes | All deployments | 90 days |

### 17.5 Log Storage

- **Real-time:** Redis Pub/Sub channels (ephemeral).
- **Persistent:** Log files stored at `/data/logs/deployments/{deployment_id}/build.log`.
- **Indexed:** Key metadata stored in PostgreSQL for search/filter.

---

## 18. Deployment History & Audit

### 18.1 Deployment Status Transitions

```mermaid
stateDiagram-v2
    [*] --> queued: trigger received
    queued --> building: worker picks up
    building --> deploying: build successful
    building --> failed: build error
    deploying --> live: health checks pass
    deploying --> failed: health checks fail
    live --> superseded: new deployment goes live
    live --> rolled_back: rollback initiated
    queued --> cancelled: user cancels
    building --> cancelled: user cancels
    failed --> [*]
    superseded --> [*]
    rolled_back --> [*]
    cancelled --> [*]
```

### 18.2 Deployment Record — Captured Metadata

| Field | Description |
|---|---|
| `id` | Unique deployment UUID |
| `application_id` | FK to application |
| `project_id` | FK to project |
| `triggered_by` | User who triggered (or system) |
| `trigger_type` | `git_push`, `manual`, `rollback`, `scheduled`, `api` |
| `git_commit_sha` | Full commit SHA |
| `git_commit_message` | Commit message |
| `git_branch` | Branch name |
| `source_type` | `git` or `zip` |
| `status` | Current status enum |
| `build_duration_ms` | Time spent building |
| `deploy_duration_ms` | Time spent deploying |
| `image_tag` | Docker image tag |
| `container_id` | Docker container ID |
| `build_logs_url` | URL to build logs |
| `deploy_logs_url` | URL to deploy logs |
| `error_message` | Error message if failed |
| `error_code` | Structured error code |
| `metadata` | JSONB — framework, node version, sizes |
| `environment_snapshot` | JSONB — env vars used (encrypted) |
| `rollback_from_id` | FK to deployment this rolled back from |
| `created_at` | Timestamp — queued |
| `started_at` | Timestamp — build started |
| `completed_at` | Timestamp — final status reached |

### 18.3 Deployment Analytics

The platform tracks and displays:

| Metric | Description |
|---|---|
| Average build time | Per project, per framework |
| Deployment success rate | Percentage of successful deployments |
| Mean time to deploy | From trigger to live |
| Deployments per day | Per project, per organization |
| Build cache hit rate | Percentage of cached dependency installs |
| Rollback frequency | Auto + manual rollbacks |

---

## 19. Zero-Downtime Deployment Strategy

### 19.1 Blue-Green Approach

ITBengal uses a **blue-green** deployment strategy at the container level:

```mermaid
sequenceDiagram
    participant Traefik
    participant Blue as Container v1 (Blue - Current)
    participant Green as Container v2 (Green - New)
    participant Client as Client Traffic

    Note over Blue: Serving live traffic
    Client->>Traefik: Request
    Traefik->>Blue: Route to v1

    Note over Green: New deployment starts
    Green->>Green: Container created
    Green->>Green: Health checks pass

    Note over Traefik: Routing update
    Traefik->>Green: Route new requests to v2
    Note over Blue: Connection draining (30s)
    Client->>Traefik: New request
    Traefik->>Green: Route to v2

    Note over Blue: Drain complete
    Blue->>Blue: SIGTERM → graceful shutdown
    Blue->>Blue: Container stopped & removed
```

### 19.2 Procedure

1. **New container created** with deployment-specific name: `{app_slug}-{deployment_id}`.
2. **Health checks pass** on the new container.
3. **Traefik labels updated** — new container gets the app's routing labels.
4. **Old container labels removed** — Traefik stops routing new requests to it.
5. **Drain period** — 30 seconds for existing connections to complete.
6. **SIGTERM sent** — application receives graceful shutdown signal.
7. **Grace period** — 10 seconds for cleanup.
8. **SIGKILL** — if still running after grace period.
9. **Container removed**.

### 19.3 Connection Draining Configuration

| Parameter | Value |
|---|---|
| Drain timeout | 30 seconds |
| Graceful shutdown signal | `SIGTERM` |
| Shutdown grace period | 10 seconds |
| Force kill signal | `SIGKILL` |

### 19.4 Failure During Deployment

If the new container fails health checks:
1. New container is stopped and removed.
2. Old container retains its Traefik labels — **no traffic disruption**.
3. Deployment marked as `failed`.
4. Auto-rollback not needed because the old container was never removed.

---

## 20. Preview Deployments (Future)

### 20.1 Concept

Preview deployments create temporary, isolated instances for pull/merge requests.

### 20.2 Planned Architecture

| Feature | Design |
|---|---|
| **Trigger** | PR opened/updated on GitHub/GitLab/Bitbucket |
| **URL** | `{pr_number}-{app_slug}.preview.itbengal.app` |
| **Lifecycle** | Created on PR open, updated on PR push, destroyed on PR merge/close |
| **Isolation** | Separate container with own environment variables |
| **SSL** | Covered by `*.preview.itbengal.app` wildcard cert |
| **Resources** | Reduced limits (Starter-tier equivalent) |
| **Cleanup** | Automatic after PR close + 1 hour grace period |
| **Comment** | Bot posts preview URL as PR comment |

### 20.3 GitHub Integration Flow (Planned)

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant API as ITBengal API
    participant Worker as Deploy Worker

    Dev->>GH: Open Pull Request
    GH->>API: Webhook: pull_request.opened
    API->>Worker: Enqueue preview build
    Worker->>Worker: Clone PR branch
    Worker->>Worker: Build & deploy to preview
    Worker->>API: Preview URL ready
    API->>GH: POST comment with preview URL
    API->>GH: Update commit status: success

    Dev->>GH: Push to PR branch
    GH->>API: Webhook: pull_request.synchronize
    API->>Worker: Enqueue preview update
    Worker->>Worker: Rebuild & redeploy preview

    Dev->>GH: Merge PR
    GH->>API: Webhook: pull_request.closed
    API->>Worker: Enqueue preview cleanup
    Worker->>Worker: Stop container, remove image
```

---

## 21. WordPress Deployment

### 21.1 WordPress Deployment Pipeline

WordPress uses a completely separate deployment pipeline from React hosting.

```mermaid
flowchart TD
    A[User Creates WordPress Site] --> B[Select Plan]
    B --> C[Select Node via Algorithm]
    C --> D[Provision MariaDB Instance]
    D --> E[Create Database & User]
    E --> F[Build WordPress Container]
    F --> G[Generate wp-config.php]
    G --> H[Run wp-cli core install]
    H --> I[Configure PHP-FPM]
    I --> J[Configure Nginx]
    J --> K[Create Container with Volumes]
    K --> L[Start Container]
    L --> M[Health Check: /wp-login.php]
    M --> N{Healthy?}
    N -->|Yes| O[Configure Traefik Routing]
    N -->|No| P[Retry / Fail]
    O --> Q[Provision SSL]
    Q --> R[Mark Site Active]
    R --> S[Send Credentials to User]
```

### 21.2 WordPress Container Stack

Each WordPress site consists of two containers:

| Container | Image | Purpose |
|---|---|---|
| WordPress + PHP-FPM + Nginx | Custom `itbengal/wordpress:{version}` | Application runtime |
| MariaDB | `mariadb:10.11` | Database |

### 21.3 WordPress Dockerfile

```dockerfile
FROM php:8.2-fpm-alpine AS base

# Install extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    freetype-dev \
    icu-dev \
    libzip-dev \
    oniguruma-dev && \
    docker-php-ext-configure gd \
        --with-freetype --with-jpeg --with-webp && \
    docker-php-ext-install -j$(nproc) \
        gd mysqli pdo_pdo_mysql opcache \
        intl zip mbstring exif bcmath

# Install WP-CLI
RUN curl -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && \
    chmod +x /usr/local/bin/wp

# Download WordPress
RUN curl -o /tmp/wordpress.tar.gz https://wordpress.org/latest.tar.gz && \
    tar -xzf /tmp/wordpress.tar.gz -C /var/www/ && \
    rm /tmp/wordpress.tar.gz && \
    chown -R www-data:www-data /var/www/wordpress

COPY nginx-wp.conf /etc/nginx/http.d/default.conf
COPY php-fpm.conf /usr/local/etc/php-fpm.d/www.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY php.ini /usr/local/etc/php/php.ini

WORKDIR /var/www/wordpress
EXPOSE 80

HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost/wp-login.php || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

### 21.4 wp-config.php Generation

The deployment engine generates `wp-config.php` with:

```php
<?php
define('DB_NAME',     '%%DB_NAME%%');
define('DB_USER',     '%%DB_USER%%');
define('DB_PASSWORD', '%%DB_PASSWORD%%');
define('DB_HOST',     '%%DB_HOST%%:%%DB_PORT%%');
define('DB_CHARSET',  'utf8mb4');
define('DB_COLLATE',  '');

// Security keys — generated per site
define('AUTH_KEY',         '%%AUTH_KEY%%');
define('SECURE_AUTH_KEY',  '%%SECURE_AUTH_KEY%%');
define('LOGGED_IN_KEY',    '%%LOGGED_IN_KEY%%');
define('NONCE_KEY',        '%%NONCE_KEY%%');
define('AUTH_SALT',        '%%AUTH_SALT%%');
define('SECURE_AUTH_SALT', '%%SECURE_AUTH_SALT%%');
define('LOGGED_IN_SALT',   '%%LOGGED_IN_SALT%%');
define('NONCE_SALT',       '%%NONCE_SALT%%');

$table_prefix = 'wp_';
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('DISALLOW_FILE_EDIT', true);
define('WP_AUTO_UPDATE_CORE', 'minor');
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');

// Force HTTPS
define('FORCE_SSL_ADMIN', true);
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
}

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}
require_once ABSPATH . 'wp-settings.php';
```

Security keys are generated using cryptographically secure random strings (64 characters each).

### 21.5 MariaDB Provisioning

Each WordPress site gets an isolated MariaDB database:

```sql
CREATE DATABASE `wp_${site_id}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wp_${site_id}'@'%' IDENTIFIED BY '${generated_password}';
GRANT ALL PRIVILEGES ON `wp_${site_id}`.* TO 'wp_${site_id}'@'%';
FLUSH PRIVILEGES;
```

| Configuration | Value |
|---|---|
| MariaDB version | 10.11 LTS |
| Character set | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |
| Max connections per site | 50 |
| InnoDB buffer pool | Scaled by plan tier |
| Automated backups | Daily (retention based on plan) |

### 21.6 WordPress Auto-Install

After the container is running and MariaDB is ready:

```bash
wp core install \
  --url="${SITE_URL}" \
  --title="${SITE_TITLE}" \
  --admin_user="${ADMIN_USER}" \
  --admin_password="${ADMIN_PASSWORD}" \
  --admin_email="${ADMIN_EMAIL}" \
  --skip-email \
  --allow-root

wp option update permalink_structure '/%postname%/' --allow-root
wp plugin delete hello akismet --allow-root
wp theme activate twentytwentyfour --allow-root
```

### 21.7 WordPress File Permissions

```bash
find /var/www/wordpress -type d -exec chmod 755 {} \;
find /var/www/wordpress -type f -exec chmod 644 {} \;
chmod 400 /var/www/wordpress/wp-config.php
chown -R www-data:www-data /var/www/wordpress
```

### 21.8 WordPress Deployment Sequence

```mermaid
sequenceDiagram
    participant User
    participant API as ITBengal API
    participant Worker as Deploy Worker
    participant Node as WP Node
    participant MariaDB as MariaDB
    participant LE as Let's Encrypt

    User->>API: Create WordPress site
    API->>API: Validate plan & quotas
    API->>Worker: Enqueue WP deployment

    Worker->>Node: Select target node
    Worker->>MariaDB: Create database & user
    Worker->>Worker: Generate wp-config.php
    Worker->>Worker: Generate security keys

    Worker->>Node: docker create wordpress container
    Worker->>Node: docker create mariadb container
    Worker->>Node: docker start mariadb
    Worker->>Worker: Wait for MariaDB ready (TCP check)
    Worker->>Node: docker start wordpress
    Worker->>Node: Execute wp-cli core install
    Worker->>Node: Set file permissions
    Worker->>Node: Health check /wp-login.php

    Node->>LE: Request SSL certificate
    LE->>Node: Issue certificate

    Worker->>API: Update site status: active
    API->>User: Send credentials email
```

---

## 22. Resource Allocation Summary

### 22.1 React Hosting — Complete Resource Matrix

| Resource | Starter | Basic | Professional | Business | Enterprise |
|---|---|---|---|---|---|
| CPU (cores) | 0.25 | 0.5 | 1.0 | 2.0 | 4.0 |
| Memory | 256 MB | 512 MB | 1 GB | 2 GB | 4 GB |
| Storage | 1 GB | 5 GB | 10 GB | 25 GB | 50 GB |
| Bandwidth | 10 GB/mo | 50 GB/mo | 200 GB/mo | 500 GB/mo | 1 TB/mo |
| Build minutes | 100/mo | 300/mo | 1,000/mo | 3,000/mo | Unlimited |
| Concurrent builds | 1 | 1 | 2 | 3 | 5 |
| Deployments/day | 20 | 50 | 100 | 200 | Unlimited |
| Image retention | 3 versions | 5 versions | 10 versions | 20 versions | 50 versions |
| Log retention | 7 days | 14 days | 30 days | 60 days | 90 days |
| Build timeout | 10 min | 15 min | 20 min | 30 min | 45 min |

### 22.2 WordPress Hosting — Complete Resource Matrix

| Resource | Starter | Basic | Professional | Business | Enterprise |
|---|---|---|---|---|---|
| CPU (cores) | 0.5 | 1.0 | 2.0 | 3.0 | 4.0 |
| Memory | 512 MB | 1 GB | 2 GB | 4 GB | 8 GB |
| Storage | 5 GB | 10 GB | 25 GB | 50 GB | 100 GB |
| Bandwidth | 25 GB/mo | 100 GB/mo | 300 GB/mo | 500 GB/mo | 1 TB/mo |
| PHP workers | 2 | 4 | 8 | 12 | 20 |
| MariaDB memory | 128 MB | 256 MB | 512 MB | 1 GB | 2 GB |
| Backup retention | 3 days | 7 days | 14 days | 30 days | 60 days |
| Daily backups | 1 | 1 | 2 | 4 | 6 |
| Staging sites | 0 | 0 | 1 | 2 | 5 |

### 22.3 Resource Monitoring Thresholds

| Metric | Warning | Critical | Action |
|---|---|---|---|
| CPU sustained > threshold | 80% for 5 min | 95% for 1 min | Alert user, suggest upgrade |
| Memory > threshold | 85% | 95% | Alert user, OOM risk |
| Storage > threshold | 80% | 90% | Alert user, disable uploads |
| Bandwidth > plan limit | 80% of quota | 100% of quota | Alert → throttle (soft) |

### 22.4 Burst Capacity

| Plan | CPU Burst | Memory Burst | Duration |
|---|---|---|---|
| Starter | None | None | — |
| Basic | 2× for 30s | None | — |
| Professional | 2× for 60s | 1.5× for 30s | — |
| Business | 2× for 120s | 1.5× for 60s | — |
| Enterprise | 3× for 300s | 2× for 120s | — |

---

## 23. Deployment Failure Handling

### 23.1 Failure Categories

| Category | Error Code | Cause | Automated Response |
|---|---|---|---|
| **Source error** | `SRC_001` | Git clone failed (auth) | Retry 1×, notify user |
| **Source error** | `SRC_002` | Git clone failed (not found) | Fail immediately, notify user |
| **Source error** | `SRC_003` | ZIP extraction failed | Fail immediately, notify user |
| **Build error** | `BUILD_001` | Dependency install failed | Retry 1×, clear cache, retry |
| **Build error** | `BUILD_002` | Build command failed | Fail, send logs to user |
| **Build error** | `BUILD_003` | Build timeout | Fail, suggest plan upgrade |
| **Build error** | `BUILD_004` | Out of memory during build | Fail, suggest plan upgrade |
| **Docker error** | `DOCKER_001` | Image build failed | Retry 1× |
| **Docker error** | `DOCKER_002` | Registry push failed | Retry 2× |
| **Deploy error** | `DEPLOY_001` | Container creation failed | Retry 1× |
| **Deploy error** | `DEPLOY_002` | Health check failed | Retry 3×, auto-rollback |
| **Deploy error** | `DEPLOY_003` | Traefik routing failed | Retry 2×, alert admin |
| **SSL error** | `SSL_001` | Certificate provisioning failed | Retry 5× (1 min apart) |
| **SSL error** | `SSL_002` | DNS verification failed | Wait + retry, notify user |
| **Resource error** | `RES_001` | No available nodes | Queue, alert admin |
| **Resource error** | `RES_002` | Quota exceeded | Fail, suggest upgrade |

### 23.2 Notification Flow on Failure

```mermaid
flowchart TD
    A[Deployment Failed] --> B{Error Category}
    B -->|User-fixable| C[In-app notification + email to user]
    B -->|Platform issue| D[In-app notification to user + Slack alert to ops]
    B -->|Resource limit| E[In-app notification + upgrade suggestion]
    C --> F[Log to audit trail]
    D --> F
    E --> F
    D --> G[Create internal incident if repeated]
```

### 23.3 Retry Logic Summary

| Stage | Max Retries | Backoff Strategy | Timeout per Attempt |
|---|---|---|---|
| Git clone | 2 | Exponential (5s, 15s) | 120s |
| Dependency install | 1 (with cache clear) | Immediate | 600s |
| Build command | 0 (no auto-retry) | — | Plan-dependent |
| Docker image build | 1 | Immediate | 300s |
| Registry push | 2 | Fixed (10s) | 120s |
| Container creation | 1 | Immediate | 30s |
| Health check | 3 | Fixed (10s) | 30s per check |
| SSL provisioning | 5 | Fixed (60s) | 120s per attempt |

### 23.4 Incident Escalation Matrix

| Condition | Escalation |
|---|---|
| Single deployment failure | User notification only |
| 3+ failures for same app in 1 hour | User notification + ops alert |
| 5+ failures across different apps in 15 min | Ops alert + incident created |
| Node unreachable | Automatic failover + ops alert + incident |
| All nodes at capacity | Ops critical alert + freeze new deployments |
| SSL renewal failures for > 24 hours | Ops urgent alert + manual intervention |

---

## Appendix A — Nginx Configuration Templates

### A.1 SPA (React/Vue/Angular)

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Health check
    location /health {
        access_log off;
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml+rss application/atom+xml image/svg+xml;
}
```

### A.2 WordPress (PHP-FPM)

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/wordpress;
    index index.php index.html;

    client_max_body_size 64M;

    location /health {
        access_log off;
        try_files /wp-login.php =503;
    }

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
    }

    # Deny access to sensitive files
    location ~ /\.(ht|git|svn) {
        deny all;
    }

    location = /wp-config.php {
        deny all;
    }

    location ~* /(?:uploads|files)/.*\.php$ {
        deny all;
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml+rss image/svg+xml;
}
```

---

## Appendix B — Deployment Engine Configuration Reference

### B.1 Engine Configuration (YAML)

```yaml
# /etc/itbengal/deployment-engine.yml
engine:
  version: "1.0.0"

build:
  max_concurrency: 4
  default_timeout: 900         # 15 minutes
  cache_dir: /data/cache
  logs_dir: /data/logs/builds
  node_versions: ["18", "20", "22"]
  default_node_version: "20"

deploy:
  drain_timeout: 30            # seconds
  shutdown_grace_period: 10    # seconds
  health_check_interval: 30
  health_check_timeout: 5
  health_check_retries: 3
  health_check_start_period: 30

registry:
  host: registry.itbengal.internal
  port: 5000
  gc_schedule: "0 3 * * 0"     # Sunday 3 AM

queue:
  redis_url: redis://redis:6379
  prefix: itbengal

  build:
    concurrency: 4
    max_retries: 2
    backoff_type: exponential
    backoff_delay: 30000

  deploy:
    concurrency: 4
    max_retries: 3
    backoff_type: exponential
    backoff_delay: 10000

  ssl:
    concurrency: 2
    max_retries: 5
    backoff_type: fixed
    backoff_delay: 60000

  cleanup:
    concurrency: 2
    max_retries: 3
    backoff_type: fixed
    backoff_delay: 30000

node_selection:
  weights:
    cpu: 0.30
    memory: 0.25
    containers: 0.15
    disk_io: 0.10
    network: 0.10
    health: 0.10
  heartbeat_interval: 30
  heartbeat_timeout: 90
  capacity_threshold:
    warning_cpu: 70
    critical_cpu: 90
    warning_memory: 75
    critical_memory: 90
    warning_disk: 70
    critical_disk: 85

traefik:
  acme_email: ssl@itbengal.com
  dashboard_enabled: true
  dashboard_port: 8080

wordpress:
  mariadb_version: "10.11"
  php_version: "8.2"
  default_wp_version: "latest"
  max_upload_size: "64M"
```

---

*Document generated for ITBengal Engineering Team — July 2026*
*This document is part of the ITBengal Platform Engineering Specification series.*
