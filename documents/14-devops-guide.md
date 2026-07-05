# ITBengal — DevOps Guide

> **Version:** 1.0
> **Date:** July 2026
> **Classification:** Confidential
> **Owner:** DevOps Engineering Team

---

## Table of Contents

1. [CI/CD Pipeline Design](#1-cicd-pipeline-design)
2. [Docker Build Workflows](#2-docker-build-workflows)
3. [Image Registry Management](#3-image-registry-management)
4. [Infrastructure as Code](#4-infrastructure-as-code)
5. [Server Hardening Procedures](#5-server-hardening-procedures)
6. [Automated Testing in Pipeline](#6-automated-testing-in-pipeline)
7. [Environment Management](#7-environment-management)
8. [Secrets Management](#8-secrets-management)
9. [Deployment Strategies](#9-deployment-strategies)
10. [Monitoring Integration in Pipeline](#10-monitoring-integration-in-pipeline)
11. [Pipeline Security](#11-pipeline-security)

---

## 1. CI/CD Pipeline Design

### 1.1 Architecture Overview

All CI/CD pipelines run on GitHub Actions. The architecture follows a trunk-based development model with environment promotion through branches.

```mermaid
flowchart LR
    DEV["Developer"] -->|push/PR| GH["GitHub Repository"]
    GH -->|trigger| GA["GitHub Actions"]
    GA -->|lint| LINT["ESLint / Prettier"]
    GA -->|test| TEST["Jest / Playwright"]
    GA -->|build| BUILD["Docker Build"]
    BUILD -->|push| REG["ghcr.io Registry"]
    REG -->|deploy staging| STG["Staging Server"]
    REG -->|deploy production| PROD["Production Servers"]
    PROD --> PS["Platform Server"]
    PROD --> RN["React Nodes"]
    PROD --> WN["WordPress Nodes"]
```

### 1.2 Branch Strategy

| Branch | Purpose | Deploys To | Protection |
|--------|---------|-----------|------------|
| `main` | Production-ready code | Production servers | Required reviews, passing CI, no force push |
| `staging` | Pre-production validation | Staging server | Required reviews, passing CI |
| `develop` | Integration branch | Development server | Passing CI |
| `feature/*` | Feature development | Preview (optional) | None |
| `hotfix/*` | Emergency production fixes | Production (fast-track) | 1 review minimum |

### 1.3 Pipeline Stages

Every workflow follows four sequential stages:

```mermaid
flowchart LR
    L["🔍 Lint"] --> T["🧪 Test"] --> B["🏗️ Build"] --> D["🚀 Deploy"]
    L -->|"~1 min"| L
    T -->|"~3 min"| T
    B -->|"~4 min"| B
    D -->|"~2 min"| D
```

#### Pipeline Stage Duration Targets

| Stage | Target Duration | Max Allowed | Tools |
|-------|----------------|-------------|-------|
| Lint | < 1 min | 2 min | ESLint, Prettier, TypeScript compiler |
| Test | < 3 min | 5 min | Jest (unit), Supertest (integration) |
| Build | < 4 min | 8 min | Docker BuildKit, multi-stage |
| Deploy | < 2 min | 5 min | SSH + Docker Compose pull/up |
| **Total** | **< 10 min** | **20 min** | — |

### 1.4 Workflow: Platform API (Express.js)

```yaml
# .github/workflows/platform-api.yml
name: Platform API CI/CD

on:
  push:
    branches: [main, staging, develop]
    paths:
      - 'apps/api/**'
      - 'packages/shared/**'
  pull_request:
    branches: [main, staging]
    paths:
      - 'apps/api/**'
      - 'packages/shared/**'

concurrency:
  group: api-${{ github.ref }}
  cancel-in-progress: true

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: itbengal/platform-api

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint --workspace=apps/api
      - run: npx tsc --noEmit --project apps/api/tsconfig.json

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: itbengal_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci --workspace=apps/api
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/itbengal_test
          REDIS_URL: redis://localhost:6379
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-api
          path: apps/api/coverage/

  build:
    name: Build & Push Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_ENV=production

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/staging'
    environment: staging
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/itbengal
            docker compose pull api
            docker compose up -d api
            sleep 10
            curl -sf http://localhost:3001/health || exit 1

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/itbengal
            # Blue-green deployment
            ./scripts/deploy-blue-green.sh api ${{ github.sha }}
```

### 1.5 Workflow: Platform Dashboard (Next.js)

```yaml
# .github/workflows/platform-dashboard.yml
name: Platform Dashboard CI/CD

on:
  push:
    branches: [main, staging, develop]
    paths:
      - 'apps/dashboard/**'
      - 'packages/ui/**'
  pull_request:
    branches: [main, staging]
    paths:
      - 'apps/dashboard/**'
      - 'packages/ui/**'

concurrency:
  group: dashboard-${{ github.ref }}
  cancel-in-progress: true

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: itbengal/platform-dashboard

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint --workspace=apps/dashboard
      - run: npx tsc --noEmit --project apps/dashboard/tsconfig.json

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci --workspace=apps/dashboard
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-dashboard
          path: apps/dashboard/coverage/

  build:
    name: Build & Push Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/dashboard/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NEXT_PUBLIC_API_URL=${{ vars.API_URL }}

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/staging'
    environment: staging
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/itbengal
            docker compose pull dashboard
            docker compose up -d dashboard
            sleep 15
            curl -sf http://localhost:3000/api/health || exit 1

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/itbengal
            ./scripts/deploy-blue-green.sh dashboard ${{ github.sha }}
```

### 1.6 Additional Workflows

| Workflow | Trigger | Services |
|----------|---------|----------|
| `node-agent.yml` | Push to `apps/node-agent/**` | React Hosting Node Agent |
| `wordpress-agent.yml` | Push to `apps/wp-agent/**` | WordPress Hosting Node Agent |
| `shared-packages.yml` | Push to `packages/**` | Triggers dependent service builds |
| `e2e-tests.yml` | Nightly cron + manual | Full E2E test suite |
| `security-scan.yml` | Weekly cron + PR | Trivy, OWASP ZAP |
| `image-cleanup.yml` | Weekly cron | Prune old images from registry |

---

## 2. Docker Build Workflows

### 2.1 Multi-Stage Dockerfile — Express.js API

```dockerfile
# apps/api/Dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --production=false

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# Prune dev dependencies
RUN npm prune --production

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S api -u 1001 -G nodejs

WORKDIR /app

COPY --from=builder --chown=api:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/apps/api/package.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

USER api

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
```

### 2.2 Multi-Stage Dockerfile — Next.js Dashboard

```dockerfile
# apps/dashboard/Dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/ui/package.json ./packages/ui/

RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build --workspace=packages/ui
RUN npm run build --workspace=apps/dashboard

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

COPY --from=builder /app/apps/dashboard/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./.next/static

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

USER nextjs

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### 2.3 Image Tagging Strategy

| Tag Format | Example | When Used |
|-----------|---------|-----------|
| `<git-sha>` | `a1b2c3d` | Every build — immutable reference |
| `<branch>` | `main`, `staging` | Latest build from branch |
| `v<semver>` | `v1.2.3` | Release tags |
| `latest` | `latest` | Latest production release only |

### 2.4 Layer Caching Strategy

- **BuildKit** is enabled by default via `docker/setup-buildx-action`
- **GitHub Actions cache** is used with `cache-from: type=gha` and `cache-to: type=gha,mode=max`
- Dependencies layer is cached separately from source code via multi-stage pattern
- `.dockerignore` excludes `node_modules`, `.git`, test files, documentation

### 2.5 Security Scanning

```yaml
# Integrated into build job
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'  # Fail build on CRITICAL/HIGH
```

---

## 3. Image Registry Management

### 3.1 Registry: GitHub Container Registry

All Docker images are stored in GitHub Container Registry (`ghcr.io`).

**Naming Convention:**

```
ghcr.io/itbengal/<service>:<tag>
```

| Image | Full Name |
|-------|-----------|
| Platform API | `ghcr.io/itbengal/platform-api` |
| Platform Dashboard | `ghcr.io/itbengal/platform-dashboard` |
| Node Agent | `ghcr.io/itbengal/node-agent` |
| WordPress Agent | `ghcr.io/itbengal/wordpress-agent` |
| Customer React App | `ghcr.io/itbengal/sites/<site-id>` |

### 3.2 Image Promotion Flow

| Environment | Source Tag | Promotion Action |
|-------------|-----------|-----------------|
| Development | `develop` | Auto on push to `develop` |
| Staging | `staging` | Auto on push to `staging` |
| Production | `v*` / `main` | Manual approval + push to `main` |

### 3.3 Image Cleanup Policy

```yaml
# .github/workflows/image-cleanup.yml
name: Cleanup Old Images
on:
  schedule:
    - cron: '0 3 * * 0'  # Weekly Sunday 3 AM
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/delete-package-versions@v5
        with:
          package-name: 'platform-api'
          package-type: 'container'
          min-versions-to-keep: 10
          delete-only-untagged-versions: true
```

---

## 4. Infrastructure as Code

### 4.1 Ansible Project Structure

```
infrastructure/
├── ansible.cfg
├── inventory/
│   ├── production/
│   │   ├── hosts.yml
│   │   └── group_vars/
│   │       ├── all.yml
│   │       ├── platform.yml
│   │       ├── react_nodes.yml
│   │       └── wordpress_nodes.yml
│   └── staging/
│       ├── hosts.yml
│       └── group_vars/
│           └── all.yml
├── playbooks/
│   ├── site.yml              # Master playbook
│   ├── platform-server.yml
│   ├── react-node.yml
│   ├── wordpress-node.yml
│   └── monitoring-server.yml
├── roles/
│   ├── common/               # Base OS setup, users, SSH, firewall
│   ├── docker/               # Docker & Docker Compose installation
│   ├── platform-server/      # Platform services deployment
│   ├── react-node/           # React hosting node setup
│   ├── wordpress-node/       # WordPress hosting node setup
│   └── monitoring/           # Prometheus, Grafana, Loki
└── vault/
    └── secrets.yml           # Ansible Vault encrypted secrets
```

### 4.2 Inventory Example

```yaml
# inventory/production/hosts.yml
all:
  children:
    platform:
      hosts:
        platform-01:
          ansible_host: 103.xxx.xxx.10
          ansible_user: deploy
    react_nodes:
      hosts:
        react-01:
          ansible_host: 103.xxx.xxx.20
          ansible_user: deploy
          node_id: rn-01
        react-02:
          ansible_host: 103.xxx.xxx.21
          ansible_user: deploy
          node_id: rn-02
    wordpress_nodes:
      hosts:
        wordpress-01:
          ansible_host: 103.xxx.xxx.30
          ansible_user: deploy
          node_id: wn-01
```

### 4.3 Provisioning Flow

```mermaid
flowchart TD
    START["New Server Provisioned"] --> OS["Role: common"]
    OS -->|"SSH hardening, UFW, users, \n unattended-upgrades"| DOCKER["Role: docker"]
    DOCKER -->|"Docker CE, Docker Compose, \n log driver config"| DECIDE{Server Type?}
    DECIDE -->|Platform| PLATFORM["Role: platform-server"]
    DECIDE -->|React Node| REACT["Role: react-node"]
    DECIDE -->|WordPress Node| WP["Role: wordpress-node"]
    PLATFORM --> MONITOR["Role: monitoring"]
    REACT --> REGISTER["Register with Platform API"]
    WP --> REGISTER
    REGISTER --> VERIFY["Health Check & Smoke Test"]
    VERIFY --> DONE["Server Ready"]
```

### 4.4 Example Playbook: Provision React Node

```yaml
# playbooks/react-node.yml
---
- name: Provision React Hosting Node
  hosts: react_nodes
  become: true
  vars_files:
    - ../vault/secrets.yml

  roles:
    - role: common
      tags: [common]
    - role: docker
      tags: [docker]
    - role: react-node
      tags: [react-node]

  post_tasks:
    - name: Register node with platform
      uri:
        url: "{{ platform_api_url }}/api/v1/admin/nodes"
        method: POST
        headers:
          Authorization: "Bearer {{ platform_admin_token }}"
        body_format: json
        body:
          nodeId: "{{ node_id }}"
          type: react
          hostname: "{{ ansible_hostname }}"
          ipAddress: "{{ ansible_host }}"
          capacity:
            maxContainers: 50
            maxCpu: "{{ ansible_processor_vcpus }}"
            maxMemoryMb: "{{ ansible_memtotal_mb }}"
        status_code: 201
      tags: [register]

    - name: Verify node health
      uri:
        url: "http://{{ ansible_host }}:9100/metrics"
        status_code: 200
      tags: [verify]
```

### 4.5 Ansible Vault

All secrets are encrypted with Ansible Vault:

```bash
# Encrypt secrets file
ansible-vault encrypt vault/secrets.yml

# Edit encrypted secrets
ansible-vault edit vault/secrets.yml

# Run playbook with vault
ansible-playbook playbooks/react-node.yml --ask-vault-pass
```

---

## 5. Server Hardening Procedures

### 5.1 SSH Hardening

Applied by the `common` Ansible role to all servers:

```ini
# /etc/ssh/sshd_config (managed by Ansible)
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
PermitEmptyPasswords no
Protocol 2
AllowUsers deploy
```

### 5.2 Fail2ban Configuration

```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
banaction = ufw

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
```

### 5.3 UFW Firewall Rules

#### Platform Server

| Rule | Port | Protocol | Source | Purpose |
|------|------|----------|-------|---------|
| Allow | 2222 | TCP | Admin IPs | SSH |
| Allow | 80 | TCP | Any | HTTP (redirect to HTTPS) |
| Allow | 443 | TCP | Any | HTTPS (Traefik) |
| Allow | 9090 | TCP | Internal network | Prometheus |
| Allow | 3100 | TCP | Internal network | Loki |
| Deny | All | All | Any | Default deny |

#### React Hosting Node

| Rule | Port | Protocol | Source | Purpose |
|------|------|----------|-------|---------|
| Allow | 2222 | TCP | Admin IPs | SSH |
| Allow | 80 | TCP | Any | HTTP |
| Allow | 443 | TCP | Any | HTTPS (Traefik) |
| Allow | 9100 | TCP | Platform Server | Node Exporter |
| Allow | 8080 | TCP | Platform Server | cAdvisor |
| Deny | All | All | Any | Default deny |

#### WordPress Hosting Node

| Rule | Port | Protocol | Source | Purpose |
|------|------|----------|-------|---------|
| Allow | 2222 | TCP | Admin IPs | SSH |
| Allow | 80 | TCP | Any | HTTP |
| Allow | 443 | TCP | Any | HTTPS (Nginx) |
| Allow | 9100 | TCP | Platform Server | Node Exporter |
| Deny | All | All | Any | Default deny |

### 5.4 Unattended Upgrades

```ini
# /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "ops@itbengal.com";
```

### 5.5 Kernel Hardening

```ini
# /etc/sysctl.d/99-itbengal-hardening.conf
# Network security
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2

# IPv6 disable (if not used)
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1

# File system
fs.suid_dumpable = 0
fs.protected_hardlinks = 1
fs.protected_symlinks = 1

# Kernel
kernel.randomize_va_space = 2
kernel.sysrq = 0
```

### 5.6 CIS Benchmark Compliance Checklist

| # | Control | Status | Method |
|---|---------|--------|--------|
| 1 | Filesystem: Disable unused filesystems (cramfs, freevxfs, jffs2) | ✅ | `common` role |
| 2 | SSH: Protocol 2 only | ✅ | sshd_config |
| 3 | SSH: Key-based auth only | ✅ | sshd_config |
| 4 | SSH: Root login disabled | ✅ | sshd_config |
| 5 | Firewall: UFW enabled, default deny | ✅ | `common` role |
| 6 | Time sync: NTP/chrony configured | ✅ | `common` role |
| 7 | Logging: rsyslog active | ✅ | Default Ubuntu |
| 8 | auditd: Installed and running | ✅ | `common` role |
| 9 | Password: Complexity requirements | ✅ | PAM config |
| 10 | Permissions: /etc/passwd 644 | ✅ | `common` role |
| 11 | Kernel: Address randomization | ✅ | sysctl |
| 12 | Unattended security updates | ✅ | apt config |
| 13 | Fail2ban: Active for SSH | ✅ | `common` role |
| 14 | No unnecessary services | ✅ | Minimal install |
| 15 | Docker: User namespace remapping | ⬜ | Future |

---

## 6. Automated Testing in Pipeline

### 6.1 Testing Matrix

| Test Type | Tool | Pipeline Stage | Threshold | Runs On |
|-----------|------|---------------|-----------|---------|
| Unit Tests | Jest | `test` | 80% coverage | Every push/PR |
| Integration Tests | Supertest + Jest | `test` | All passing | Every push/PR |
| E2E Tests | Playwright | Post-deploy (staging) | All passing | Staging deploys |
| API Contract Tests | Pact | `test` | All passing | PR to main/staging |
| Load Tests | k6 | Post-deploy (staging) | p99 < 2s | Weekly + staging |
| Security Tests | OWASP ZAP | Scheduled | No HIGH/CRITICAL | Weekly + PR |
| Migration Tests | Custom | `test` | All migrations up/down | PR to main/staging |
| Lint/Type Check | ESLint + TypeScript | `lint` | Zero errors | Every push/PR |

### 6.2 Coverage Requirements

- **Minimum overall coverage:** 80%
- **New code coverage:** 90% (enforced via GitHub Action comment)
- **Critical paths (auth, billing, deployment):** 95%
- Coverage reports are uploaded as artifacts and commented on PRs

### 6.3 Database Migration Testing

Every PR that modifies migrations is tested with:

1. **Up migration** on a fresh database
2. **Down migration** to verify reversibility
3. **Re-up migration** to verify idempotency
4. **Seed data** run after migration to verify schema compatibility

```yaml
- name: Test database migrations
  run: |
    npm run db:migrate:up --workspace=apps/api
    npm run db:migrate:down --workspace=apps/api
    npm run db:migrate:up --workspace=apps/api
    npm run db:seed --workspace=apps/api
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/itbengal_test
```

---

## 7. Environment Management

### 7.1 Environment Comparison Matrix

| Attribute | Development | Staging | Production |
|-----------|------------|---------|------------|
| **URL** | `dev.itbengal.local` | `staging.itbengal.com` | `itbengal.com` |
| **Server** | Developer machine | Single VPS | Multi-server cluster |
| **CPU/RAM** | Local Docker | 2 vCPU / 4 GB | 4+ vCPU / 8+ GB |
| **Database** | Docker PostgreSQL | Docker PostgreSQL | Docker PostgreSQL (tuned) |
| **Data** | Seed data | Anonymized prod subset | Real customer data |
| **SSL** | Self-signed / mkcert | Let's Encrypt (staging CA) | Let's Encrypt (production) |
| **Deployment** | `docker compose up` | Auto on push to `staging` | Manual approval + auto |
| **Monitoring** | Local only | Full stack (Prometheus/Grafana) | Full stack + alerting |
| **Backups** | None | Daily | Continuous WAL + daily full |
| **Debug logging** | Verbose | Verbose | Info + Error only |
| **Feature flags** | All enabled | Selective | Graduated rollout |

### 7.2 Docker Compose Overrides

```yaml
# docker-compose.override.yml (Development only — not committed)
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: deps  # Stop at deps stage for hot-reload
    volumes:
      - ./apps/api/src:/app/apps/api/src
    command: npm run dev --workspace=apps/api
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
```

### 7.3 Feature Flags

Feature flags are stored in PostgreSQL and cached in Redis. The API provides:

- `GET /api/v1/features` — list all flags
- `PUT /api/v1/admin/features/:name` — toggle/configure a flag

Flags support percentage rollout, user-group targeting, and environment scoping.

---

## 8. Secrets Management

### 8.1 GitHub Actions Secrets Organization

Secrets are organized at three levels:

1. **Organization secrets** — shared across all repos (registry credentials)
2. **Repository secrets** — repo-specific (SSH keys, API tokens)
3. **Environment secrets** — per-environment (database URLs, API keys)

### 8.2 Secrets Inventory

| Secret Name | Scope | Rotation | Owner |
|-------------|-------|----------|-------|
| `DEPLOY_SSH_KEY` | Repository | 90 days | DevOps |
| `GITHUB_TOKEN` | Auto | Auto | GitHub |
| `DATABASE_URL` | Environment | 90 days | DevOps |
| `REDIS_URL` | Environment | 90 days | DevOps |
| `JWT_SECRET` | Environment | 180 days | Security |
| `ENCRYPTION_KEY` | Environment | 365 days | Security |
| `OPENPROVIDER_USERNAME` | Repository | 365 days | Product |
| `OPENPROVIDER_PASSWORD` | Repository | 90 days | Product |
| `STRIPE_SECRET_KEY` | Environment | 365 days | Finance |
| `BKASH_API_KEY` | Environment | 365 days | Finance |
| `SMTP_PASSWORD` | Repository | 180 days | DevOps |
| `GRAFANA_ADMIN_PASSWORD` | Environment | 90 days | DevOps |
| `STAGING_HOST` | Environment | Static | DevOps |
| `PRODUCTION_HOST` | Environment | Static | DevOps |

### 8.3 Runtime Secrets Injection

Secrets are injected into Docker containers via environment variables defined in `.env` files on each server:

```bash
# /opt/itbengal/.env (managed by Ansible, mode 0600, owner deploy)
DATABASE_URL=postgresql://itbengal:${DB_PASSWORD}@postgres:5432/itbengal
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
```

### 8.4 Secret Rotation Procedure

1. Generate new secret value
2. Update in GitHub Actions Secrets and Ansible Vault
3. Deploy to staging, verify
4. Deploy to production during maintenance window
5. Verify all services healthy
6. Update rotation log

---

## 9. Deployment Strategies

### 9.1 Blue-Green Deployment (Platform Server)

Used for the Platform API and Dashboard to achieve zero-downtime deployments.

```mermaid
sequenceDiagram
    participant CI as GitHub Actions
    participant TR as Traefik
    participant BL as Blue (Current)
    participant GR as Green (New)

    CI->>GR: Deploy new version
    CI->>GR: Run health checks
    GR-->>CI: Health OK
    CI->>TR: Switch routing to Green
    TR->>GR: Route all traffic
    Note over BL: Drain connections (30s)
    CI->>BL: Stop old version
    Note over GR: Green is now production
```

**Deployment Script:**

```bash
#!/bin/bash
# scripts/deploy-blue-green.sh
SERVICE=$1
IMAGE_TAG=$2
CURRENT=$(docker compose ps --format json | jq -r ".[] | select(.Service==\"${SERVICE}\") | .Name")

# Pull new image
docker compose pull "$SERVICE"

# Start new container alongside old
docker compose up -d --no-deps --scale "$SERVICE=2" "$SERVICE"

# Wait for health check
sleep 15
NEW_CONTAINER=$(docker compose ps --format json | jq -r ".[] | select(.Service==\"${SERVICE}\" and .Name!=\"${CURRENT}\") | .Name")
docker inspect --format='{{.State.Health.Status}}' "$NEW_CONTAINER" | grep -q "healthy"

if [ $? -eq 0 ]; then
    # Stop old container
    docker stop "$CURRENT"
    docker rm "$CURRENT"
    echo "✅ Deployment successful: $SERVICE:$IMAGE_TAG"
else
    # Rollback
    docker stop "$NEW_CONTAINER"
    docker rm "$NEW_CONTAINER"
    echo "❌ Deployment failed, rolled back"
    exit 1
fi
```

### 9.2 Rolling Deployment (Hosting Nodes)

Used for Node Agent updates across multiple hosting nodes.

```mermaid
sequenceDiagram
    participant CI as GitHub Actions
    participant N1 as Node 1
    participant N2 as Node 2
    participant N3 as Node 3

    CI->>N1: Update agent, health check
    N1-->>CI: Healthy ✅
    CI->>N2: Update agent, health check
    N2-->>CI: Healthy ✅
    CI->>N3: Update agent, health check
    N3-->>CI: Healthy ✅
    Note over CI: All nodes updated
```

**Process:**

1. Update one node at a time
2. Wait for health check to pass (60s timeout)
3. If health check fails, rollback that node and halt
4. Proceed to next node only after previous is healthy
5. Maximum 1 node down at any time

### 9.3 Canary Deployment

For high-risk changes:

1. Deploy to a single production node (canary)
2. Route 10% of traffic to canary
3. Monitor error rate and latency for 30 minutes
4. If metrics are within baseline, proceed to full rollout
5. If metrics degrade, rollback canary immediately

### 9.4 Rollback Procedures

| Strategy | Rollback Method | Time |
|----------|----------------|------|
| Blue-Green | Switch Traefik back to old container | < 30s |
| Rolling | Re-deploy previous image tag to affected nodes | < 5 min |
| Canary | Remove canary container, restore routing | < 30s |
| Database | Run migration down script (if safe) or restore backup | 5-30 min |

---

## 10. Monitoring Integration in Pipeline

### 10.1 Deployment Annotations in Grafana

Every deployment creates a Grafana annotation for correlation:

```bash
# Post-deployment annotation
curl -s -X POST "https://grafana.itbengal.com/api/annotations" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"dashboardUID\": \"platform-overview\",
    \"text\": \"Deployed ${SERVICE} v${VERSION}\",
    \"tags\": [\"deployment\", \"${SERVICE}\", \"${ENVIRONMENT}\"],
    \"time\": $(date +%s)000
  }"
```

### 10.2 Post-Deployment Health Check

```bash
#!/bin/bash
# scripts/post-deploy-verify.sh
SERVICE=$1
MAX_RETRIES=10
RETRY_INTERVAL=5

for i in $(seq 1 $MAX_RETRIES); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/health")
    if [ "$STATUS" == "200" ]; then
        echo "✅ Health check passed for $SERVICE (attempt $i)"
        exit 0
    fi
    echo "⏳ Health check attempt $i/$MAX_RETRIES failed (HTTP $STATUS)"
    sleep $RETRY_INTERVAL
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
```

### 10.3 Automated Rollback Triggers

After deployment, the pipeline monitors for 5 minutes:

- **Error rate** > 5% → automatic rollback
- **P99 latency** > 5s → automatic rollback
- **Health check failure** → automatic rollback

### 10.4 Pipeline Metrics

Pipeline execution metrics are collected and sent to Prometheus:

- `cicd_pipeline_duration_seconds` — total pipeline duration
- `cicd_build_duration_seconds` — Docker build time
- `cicd_test_duration_seconds` — test suite runtime
- `cicd_deployment_total` — deployment count by status (success/failure)

---

## 11. Pipeline Security

### 11.1 Security Scanning Integration

| Tool | Purpose | Stage | Blocking |
|------|---------|-------|----------|
| Trivy | Container image vulnerabilities | Build | CRITICAL/HIGH |
| npm audit | Dependency vulnerabilities | Test | CRITICAL |
| ESLint security plugin | Static code analysis | Lint | All findings |
| OWASP ZAP | Dynamic application testing | Weekly/staging | HIGH/CRITICAL |
| Snyk | License compliance + vulns | Weekly | Policy violations |

### 11.2 Dependency Vulnerability Scanning

```yaml
- name: Audit npm dependencies
  run: |
    npm audit --audit-level=critical
    npx better-npm-audit audit --level critical
```

### 11.3 Signed Commits

- All commits to `main` and `staging` must be GPG-signed
- Branch protection rule: "Require signed commits" enabled
- CI verifies commit signatures before proceeding

### 11.4 Supply Chain Security Checklist

- [ ] All GitHub Actions pinned to SHA (not tags)
- [ ] Dependabot enabled for all dependency types
- [ ] Docker base images pinned to digest
- [ ] npm lockfile (`package-lock.json`) committed and used with `npm ci`
- [ ] GitHub Actions permissions set to minimum required
- [ ] CODEOWNERS file enforced for security-sensitive paths
- [ ] Secret scanning enabled on repository
- [ ] Branch protection rules enforced on `main` and `staging`

---

*End of DevOps Guide — Document version 1.0*
