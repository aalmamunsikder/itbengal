# ITBengal — Infrastructure Design

| Field          | Value                                        |
|----------------|----------------------------------------------|
| **Document**   | 07 — Infrastructure Design                   |
| **Version**    | 1.0                                          |
| **Date**       | 2026-07-04                                   |
| **Status**     | Approved                                     |
| **Classification** | Internal — Engineering / DevOps          |

### Authors

| Role                      | Responsibility                                 |
|---------------------------|------------------------------------------------|
| Senior Cloud Architect    | VPS layout, networking, scaling topology        |
| Senior DevOps Engineer    | Docker, Traefik, Nginx, CI/CD, provisioning     |
| Senior Security Engineer  | Firewalls, VPN, SSH hardening, container isolation |
| Senior Database Architect | PostgreSQL & MariaDB configuration, backups      |

---

## Table of Contents

1. [VPS Infrastructure Layout](#1-vps-infrastructure-layout)
2. [Platform Server Configuration](#2-platform-server-configuration)
3. [React Hosting Server Configuration](#3-react-hosting-server-configuration)
4. [WordPress Hosting Server Configuration](#4-wordpress-hosting-server-configuration)
5. [Networking](#5-networking)
6. [Load Balancing with Traefik](#6-load-balancing-with-traefik)
7. [SSL/TLS with Let's Encrypt](#7-ssltls-with-lets-encrypt)
8. [Docker & Docker Compose Configurations](#8-docker--docker-compose-configurations)
9. [Storage Architecture](#9-storage-architecture)
10. [Backup Infrastructure](#10-backup-infrastructure)
11. [Network Security](#11-network-security)
12. [Server Provisioning Procedures](#12-server-provisioning-procedures)

---

## 1. VPS Infrastructure Layout

### 1.1 Infrastructure Topology

```mermaid
graph TB
    subgraph Internet
        USERS[Users / Browsers]
        DNS_EXT[External DNS<br/>Cloudflare / Registrar]
    end

    subgraph PrivateNetwork["Private Network (10.0.0.0/16)"]
        subgraph PlatformServer["Platform Server — 10.0.1.1"]
            direction TB
            T_P[Traefik :80/:443]
            D_P[Next.js Dashboard :3000]
            A_P[Express.js API :4000]
            WS_P[WebSocket :4001]
            PG[(PostgreSQL :5432)]
            RD[(Redis :6379)]
            BQ_P[BullMQ Workers]
            PROM[Prometheus :9090]
            GRAF[Grafana :3001]
            LOKI[Loki :3100]
        end

        subgraph ReactNode1["React Node 1 — 10.0.2.1"]
            direction TB
            T_R1[Traefik :80/:443]
            AG_R1[Node Agent :5000]
            C1_R1[Container 1]
            C2_R1[Container 2]
            CN_R1[Container N]
        end

        subgraph ReactNode2["React Node 2 — 10.0.2.2 (Future)"]
            direction TB
            T_R2[Traefik :80/:443]
            AG_R2[Node Agent :5000]
        end

        subgraph WPNode1["WordPress Node 1 — 10.0.3.1"]
            direction TB
            NG_W1[Nginx :80/:443]
            AG_W1[Node Agent :5001]
            PHP_W1[PHP-FPM Pools]
            MDB_W1[(MariaDB :3306)]
            RD_W1[(Redis :6380)]
        end

        subgraph WPNode2["WordPress Node 2 — 10.0.3.2 (Future)"]
            direction TB
            NG_W2[Nginx :80/:443]
            AG_W2[Node Agent :5001]
        end
    end

    USERS -->|HTTPS| T_P
    USERS -->|HTTPS| T_R1
    USERS -->|HTTPS| NG_W1
    DNS_EXT -->|A Record| T_R1
    DNS_EXT -->|A Record| NG_W1
    DNS_EXT -->|A Record| T_P

    T_P --> D_P
    T_P --> A_P
    A_P -->|VPN| AG_R1
    A_P -->|VPN| AG_W1
    PROM -->|scrape| AG_R1
    PROM -->|scrape| AG_W1
```

### 1.2 Server Role Summary

| Server            | IP (Private)  | Public IP | Specs (Minimum)            | Role |
|-------------------|---------------|-----------|----------------------------|------|
| Platform Server   | 10.0.1.1      | Yes       | 4 vCPU, 8 GB RAM, 100 GB SSD | Dashboard, API, DB, Redis, Monitoring |
| React Node 1      | 10.0.2.1      | Yes       | 4 vCPU, 8 GB RAM, 200 GB SSD | Customer app containers |
| React Node 2+     | 10.0.2.N      | Yes       | 4 vCPU, 8 GB RAM, 200 GB SSD | Scaled hosting nodes |
| WordPress Node 1  | 10.0.3.1      | Yes       | 4 vCPU, 8 GB RAM, 200 GB SSD | WordPress sites |
| WordPress Node 2+ | 10.0.3.N      | Yes       | 4 vCPU, 8 GB RAM, 200 GB SSD | Scaled WP nodes |

### 1.3 Operating System

All servers run **Ubuntu 22.04 LTS (Jammy Jellyfish)**.

**Rationale:** Ubuntu LTS provides 5 years of security updates, has the largest Docker ecosystem, and is the most common VPS OS offered by hosting providers. LTS versions ensure stability in production.

---

## 2. Platform Server Configuration

### 2.1 Base System Setup

```bash
# Update system
apt update && apt upgrade -y

# Install essentials
apt install -y curl git wget unzip htop iotop net-tools \
  ufw fail2ban wireguard software-properties-common

# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# Install Docker Compose v2
apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

### 2.2 Docker Compose Configuration

```yaml
# /opt/itbengal/platform/docker-compose.yml
version: "3.9"

services:
  # ─── Traefik Reverse Proxy ──────────────────────────────
  traefik:
    image: traefik:v3.1
    container_name: itb-traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=ssl@itbengal.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--metrics.prometheus=true"
      - "--accesslog=true"
      - "--accesslog.filepath=/var/log/traefik/access.log"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certs:/letsencrypt
      - traefik-logs:/var/log/traefik
    networks:
      - frontend
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.itbengal.com`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$apr1$$..."

  # ─── Next.js Dashboard ─────────────────────────────────
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    container_name: itb-dashboard
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.itbengal.com
      - NEXT_PUBLIC_WS_URL=wss://api.itbengal.com/ws
    networks:
      - frontend
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`app.itbengal.com`)"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.services.dashboard.loadbalancer.server.port=3000"
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G

  # ─── Express.js API ────────────────────────────────────
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: itb-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=4000
      - DATABASE_URL=postgresql://itbengal:${DB_PASSWORD}@postgres:5432/itbengal
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - OPENPROVIDER_API_URL=https://api.openprovider.eu/v1beta
      - OPENPROVIDER_USERNAME=${OP_USERNAME}
      - OPENPROVIDER_PASSWORD=${OP_PASSWORD}
      - BKASH_APP_KEY=${BKASH_APP_KEY}
      - BKASH_APP_SECRET=${BKASH_APP_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - frontend
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.itbengal.com`)"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=4000"
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G

  # ─── BullMQ Workers ────────────────────────────────────
  workers:
    build:
      context: ./api
      dockerfile: Dockerfile.worker
    container_name: itb-workers
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://itbengal:${DB_PASSWORD}@postgres:5432/itbengal
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - backend
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G

  # ─── PostgreSQL ─────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: itb-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=itbengal
      - POSTGRES_USER=itbengal
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ./config/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
      - pg-backups:/backups
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U itbengal"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 2G
    command: postgres -c config_file=/etc/postgresql/postgresql.conf

  # ─── Redis ─────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: itb-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
      - ./config/redis/redis.conf:/usr/local/etc/redis/redis.conf
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 1G
    command: redis-server /usr/local/etc/redis/redis.conf

  # ─── Prometheus ─────────────────────────────────────────
  prometheus:
    image: prom/prometheus:v2.53.0
    container_name: itb-prometheus
    restart: unless-stopped
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./config/prometheus/alerts.yml:/etc/prometheus/alerts.yml
      - prom-data:/prometheus
    networks:
      - backend
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M

  # ─── Grafana ────────────────────────────────────────────
  grafana:
    image: grafana/grafana:11.1.0
    container_name: itb-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_SERVER_ROOT_URL=https://monitoring.itbengal.com
    volumes:
      - grafana-data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - frontend
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`monitoring.itbengal.com`)"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M

  # ─── Loki ───────────────────────────────────────────────
  loki:
    image: grafana/loki:3.1.0
    container_name: itb-loki
    restart: unless-stopped
    volumes:
      - ./config/loki/loki.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
    networks:
      - backend
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true

volumes:
  pg-data:
  pg-backups:
  redis-data:
  traefik-certs:
  traefik-logs:
  prom-data:
  grafana-data:
  loki-data:
```

### 2.3 Resource Allocation

| Service      | CPU Limit | Memory Limit | Disk Allocation | Notes |
|--------------|-----------|-------------|-----------------|-------|
| Traefik      | 0.5 vCPU  | 256 MB      | 1 GB (certs)    | Low resource; reverse proxy only |
| Dashboard    | 1.0 vCPU  | 1 GB        | 500 MB          | Next.js SSR |
| API          | 2.0 vCPU  | 2 GB        | 500 MB          | Main application logic |
| Workers      | 2.0 vCPU  | 2 GB        | 2 GB (build cache) | CPU-intensive builds |
| PostgreSQL   | 1.5 vCPU  | 2 GB        | 50 GB           | Primary data store |
| Redis        | 0.5 vCPU  | 1 GB        | 5 GB            | Cache + queues |
| Prometheus   | 0.5 vCPU  | 512 MB      | 20 GB           | 15-day retention |
| Grafana      | 0.5 vCPU  | 512 MB      | 5 GB            | Dashboards |
| Loki         | 0.5 vCPU  | 512 MB      | 20 GB           | Log storage |
| **Total**    | **9 vCPU** | **9.3 GB** | **~104 GB**    | Fits on 4 vCPU / 8 GB with overcommit |

### 2.4 PostgreSQL Configuration

```ini
# /opt/itbengal/platform/config/postgres/postgresql.conf

# Connection Settings
listen_addresses = '*'
max_connections = 200
superuser_reserved_connections = 3

# Memory
shared_buffers = 512MB
effective_cache_size = 1536MB
work_mem = 4MB
maintenance_work_mem = 128MB

# WAL
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_statement = 'ddl'

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 60
```

### 2.5 Redis Configuration

```ini
# /opt/itbengal/platform/config/redis/redis.conf

bind 0.0.0.0
port 6379
requirepass ${REDIS_PASSWORD}

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 300
```

### 2.6 Environment Variables

```bash
# /opt/itbengal/platform/.env

# ─── Database ────────────────────────────────────
DB_PASSWORD=<strong-random-password>

# ─── Redis ────────────────────────────────────────
REDIS_PASSWORD=<strong-random-password>

# ─── JWT ──────────────────────────────────────────
JWT_SECRET=<random-256-bit-key>
JWT_REFRESH_SECRET=<random-256-bit-key>

# ─── Openprovider ─────────────────────────────────
OP_USERNAME=<openprovider-username>
OP_PASSWORD=<openprovider-password>

# ─── bKash ────────────────────────────────────────
BKASH_APP_KEY=<bkash-app-key>
BKASH_APP_SECRET=<bkash-app-secret>
BKASH_USERNAME=<bkash-username>
BKASH_PASSWORD=<bkash-password>

# ─── Stripe ──────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── Email ────────────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_...

# ─── Grafana ──────────────────────────────────────
GRAFANA_PASSWORD=<grafana-admin-password>
```

---

## 3. React Hosting Server Configuration

### 3.1 Architecture Overview

```mermaid
graph TB
    subgraph ReactHostingNode["React Hosting Node"]
        direction TB
        TRF[Traefik v3<br/>Reverse Proxy + SSL]
        AGENT[Node Agent<br/>Express.js :5000]
        REG[Local Docker Registry]

        subgraph CustomerContainers["Customer Containers"]
            C1[app-1.itbengal.com<br/>Next.js App]
            C2[app-2.itbengal.com<br/>React SPA]
            C3[custom-domain.com<br/>Vue App]
            CN[...<br/>Container N]
        end

        subgraph DockerNetworks["Isolated Docker Networks"]
            N1[net-customer-1]
            N2[net-customer-2]
            N3[net-customer-3]
        end
    end

    INTERNET[Internet] -->|:80/:443| TRF
    TRF --> C1
    TRF --> C2
    TRF --> C3
    TRF --> CN
    C1 -.->|isolated| N1
    C2 -.->|isolated| N2
    C3 -.->|isolated| N3
    PLATFORM[Platform API] -->|VPN :5000| AGENT
    AGENT -->|Docker API| C1
    AGENT -->|Docker API| C2
    AGENT -->|Docker API| REG
```

### 3.2 Traefik Configuration (Static)

```yaml
# /opt/itbengal/react-node/traefik/traefik.yml

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

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-public
    watch: true
  file:
    directory: "/etc/traefik/dynamic"
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: ssl@itbengal.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

metrics:
  prometheus:
    entryPoint: metrics
    addEntryPointsLabels: true
    addServicesLabels: true

accessLog:
  filePath: "/var/log/traefik/access.log"
  bufferingSize: 100

log:
  level: INFO
```

### 3.3 Traefik Dynamic Configuration (Middleware)

```yaml
# /opt/itbengal/react-node/traefik/dynamic/middlewares.yml

http:
  middlewares:
    security-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: true
        contentTypeNosniff: true
        frameDeny: true
        browserXssFilter: true
        referrerPolicy: "strict-origin-when-cross-origin"

    rate-limit:
      rateLimit:
        average: 100
        burst: 200
        period: 1m

    compress:
      compress:
        excludedContentTypes:
          - "text/event-stream"
```

### 3.4 Build Pipeline

```mermaid
graph TD
    A[API: Deployment Request] --> B[Node Agent: Receive Job]
    B --> C{Source Type}
    C -->|Git| D[git clone --depth 1<br/>specific branch/commit]
    C -->|ZIP| E[Extract ZIP to<br/>/tmp/builds/{id}]
    D --> F[Read package.json<br/>Detect Framework]
    E --> F
    F --> G[Generate Dockerfile<br/>Multi-stage build]
    G --> H["docker build -t<br/>itb-{projectId}:{deployId}"]
    H --> I{Build OK?}
    I -->|No| J[Stream error logs<br/>Cleanup build dir<br/>Report failure]
    I -->|Yes| K[Tag image in<br/>local registry]
    K --> L["docker run with:<br/>--cpus, --memory<br/>--network, labels"]
    L --> M[Traefik auto-discovers<br/>via Docker labels]
    M --> N[Let's Encrypt<br/>issues SSL cert]
    N --> O[Health check:<br/>GET / → 200]
    O -->|Fail x3| P[Remove container<br/>Report failure]
    O -->|Pass| Q[Mark deployment LIVE<br/>Stop old container]
    Q --> R[Report to Platform API<br/>Notify user]
```

### 3.5 Container Docker Labels (per deployment)

```yaml
# Applied programmatically by Node Agent when starting a container
labels:
  - "traefik.enable=true"
  # HTTP Router
  - "traefik.http.routers.app-${PROJECT_ID}.rule=Host(`${SUBDOMAIN}.itbengal.com`) || Host(`${CUSTOM_DOMAIN}`)"
  - "traefik.http.routers.app-${PROJECT_ID}.entrypoints=websecure"
  - "traefik.http.routers.app-${PROJECT_ID}.tls.certresolver=letsencrypt"
  - "traefik.http.routers.app-${PROJECT_ID}.middlewares=security-headers@file,compress@file"
  # Service
  - "traefik.http.services.app-${PROJECT_ID}.loadbalancer.server.port=${APP_PORT}"
  # Health Check
  - "traefik.http.services.app-${PROJECT_ID}.loadbalancer.healthcheck.path=/"
  - "traefik.http.services.app-${PROJECT_ID}.loadbalancer.healthcheck.interval=30s"
  - "traefik.http.services.app-${PROJECT_ID}.loadbalancer.healthcheck.timeout=5s"
```

### 3.6 Resource Limits per Container (by Plan)

| Plan         | CPU Limit  | Memory Limit | Disk Limit | Max Containers |
|--------------|------------|-------------|------------|----------------|
| Starter      | 0.25 vCPU  | 256 MB      | 1 GB       | 1              |
| Basic        | 0.5 vCPU   | 512 MB      | 5 GB       | 3              |
| Professional | 1.0 vCPU   | 1 GB        | 10 GB      | 10             |
| Business     | 2.0 vCPU   | 2 GB        | 25 GB      | 25             |
| Enterprise   | 4.0 vCPU   | 4 GB        | 50 GB      | Unlimited      |

### 3.7 Storage Layout

```
/opt/itbengal/react-node/
├── traefik/
│   ├── traefik.yml              # Static config
│   ├── dynamic/                 # Dynamic configs
│   │   └── middlewares.yml
│   ├── acme.json                # Let's Encrypt certs
│   └── logs/
│       └── access.log
├── agent/
│   ├── src/                     # Node Agent source
│   ├── Dockerfile
│   └── config.yml               # Node registration config
├── builds/
│   └── {deploymentId}/          # Temporary build directories
├── images/
│   └── registry/                # Local Docker image storage
├── deployments/
│   └── {projectId}/
│       └── {deploymentId}/
│           ├── Dockerfile
│           ├── .env
│           └── docker-compose.yml
└── logs/
    └── {projectId}/
        └── {deploymentId}.log
```

### 3.8 Node Agent Service

The Node Agent is a lightweight Express.js service running on each hosting node. It exposes a REST API over the WireGuard VPN for the Platform Server to manage deployments.

**Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Node health check (CPU, RAM, disk, containers) |
| `/deploy` | POST | Trigger deployment (clone, build, start) |
| `/containers` | GET | List running containers |
| `/containers/:id` | DELETE | Stop and remove container |
| `/containers/:id/restart` | POST | Restart container |
| `/containers/:id/logs` | GET | Stream container logs |
| `/metrics` | GET | Prometheus metrics endpoint |

### 3.9 Docker Compose — React Node

```yaml
# /opt/itbengal/react-node/docker-compose.yml
version: "3.9"

services:
  traefik:
    image: traefik:v3.1
    container_name: itb-react-traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - ./traefik/dynamic:/etc/traefik/dynamic:ro
      - ./traefik/acme.json:/letsencrypt/acme.json
      - ./traefik/logs:/var/log/traefik
    networks:
      - traefik-public
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M

  node-agent:
    build:
      context: ./agent
      dockerfile: Dockerfile
    container_name: itb-node-agent
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PLATFORM_API_URL=http://10.0.1.1:4000
      - NODE_ID=${NODE_ID}
      - NODE_SECRET=${NODE_SECRET}
      - NODE_TYPE=react
    ports:
      - "10.0.2.1:5000:5000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./builds:/builds
      - ./deployments:/deployments
      - ./logs:/logs
    networks:
      - traefik-public
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M

networks:
  traefik-public:
    driver: bridge
```

---

## 4. WordPress Hosting Server Configuration

### 4.1 Architecture

```mermaid
graph TB
    subgraph WPNode["WordPress Hosting Node"]
        direction TB
        NG[Nginx<br/>Web Server + SSL]
        AGENT[Node Agent<br/>Express.js :5001]

        subgraph SiteIsolation["Per-Site Isolation"]
            subgraph Site1["Site: shop.example.com"]
                PHP1[PHP-FPM Pool<br/>www-shop]
                FS1["/var/www/sites/shop/"]
            end
            subgraph Site2["Site: blog.example.com"]
                PHP2[PHP-FPM Pool<br/>www-blog]
                FS2["/var/www/sites/blog/"]
            end
        end

        MDB[(MariaDB 10.11<br/>Per-site databases)]
        RDS[(Redis<br/>Object Cache)]
        CLAM[ClamAV<br/>Malware Scanner]
        CERT[Certbot<br/>Let's Encrypt]
        WPCLI[WP-CLI]
    end

    INTERNET[Internet] -->|:80/:443| NG
    NG --> PHP1
    NG --> PHP2
    PHP1 --> MDB
    PHP2 --> MDB
    PHP1 --> RDS
    PHP2 --> RDS
    PLATFORM[Platform API] -->|VPN :5001| AGENT
    AGENT --> WPCLI
    AGENT --> CLAM
    AGENT --> CERT
    AGENT --> MDB
```

### 4.2 Nginx Virtual Host Template

```nginx
# /etc/nginx/sites-available/{site_slug}.conf

server {
    listen 80;
    server_name {domain} www.{domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name {domain} www.{domain};

    root /var/www/sites/{site_slug}/public_html;
    index index.php index.html;

    # SSL (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/{domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 256;

    # WordPress Permalinks
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm-{site_slug}.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Block sensitive files
    location ~ /\. { deny all; }
    location ~ /wp-config\.php { deny all; }
    location ~ /xmlrpc\.php { deny all; }

    # Upload size
    client_max_body_size 64M;

    access_log /var/log/nginx/{site_slug}-access.log;
    error_log /var/log/nginx/{site_slug}-error.log;
}
```

### 4.3 PHP-FPM Pool Template

```ini
; /etc/php/8.2/fpm/pool.d/{site_slug}.conf

[{site_slug}]
user = www-{site_slug}
group = www-{site_slug}
listen = /run/php/php8.2-fpm-{site_slug}.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = dynamic
pm.max_children = 10
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
pm.max_requests = 500
pm.process_idle_timeout = 10s

php_admin_value[open_basedir] = /var/www/sites/{site_slug}/:/tmp/
php_admin_value[upload_max_filesize] = 64M
php_admin_value[post_max_size] = 64M
php_admin_value[memory_limit] = 256M
php_admin_value[max_execution_time] = 300
php_admin_value[max_input_time] = 300
php_admin_value[error_log] = /var/log/php/{site_slug}-error.log
php_admin_flag[log_errors] = on
php_admin_value[session.save_handler] = redis
php_admin_value[session.save_path] = "tcp://127.0.0.1:6380?database={site_redis_db}"

security.limit_extensions = .php
```

### 4.4 MariaDB Configuration

```ini
# /etc/mysql/mariadb.conf.d/99-itbengal.cnf

[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
max_connections = 200
tmp_table_size = 64M
max_heap_table_size = 64M
query_cache_type = 0
query_cache_size = 0
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
binlog_format = ROW
expire_logs_days = 7
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

### 4.5 WordPress Site File Structure

```
/var/www/sites/{site_slug}/
├── public_html/          # WordPress installation
│   ├── wp-admin/
│   ├── wp-content/
│   │   ├── plugins/
│   │   ├── themes/
│   │   ├── uploads/
│   │   └── cache/
│   ├── wp-includes/
│   ├── wp-config.php
│   └── index.php
├── backups/              # Site-specific backups
│   ├── daily/
│   ├── weekly/
│   └── on-demand/
├── logs/                 # PHP error logs
├── staging/              # Staging copy (when active)
└── tmp/                  # Temporary files
```

---

## 5. Networking

### 5.1 Private Network Architecture

```mermaid
graph TB
    subgraph PublicInternet["Public Internet"]
        USERS[Users]
        DNS[DNS Providers]
    end

    subgraph VPN["WireGuard VPN Mesh (10.0.0.0/16)"]
        PS["Platform Server<br/>10.0.1.1<br/>Public: 103.x.x.1"]
        RN1["React Node 1<br/>10.0.2.1<br/>Public: 103.x.x.2"]
        RN2["React Node 2<br/>10.0.2.2<br/>Public: 103.x.x.3"]
        WN1["WP Node 1<br/>10.0.3.1<br/>Public: 103.x.x.4"]
        WN2["WP Node 2<br/>10.0.3.2<br/>Public: 103.x.x.5"]
    end

    USERS -->|HTTPS :443| PS
    USERS -->|HTTPS :443| RN1
    USERS -->|HTTPS :443| WN1

    PS <-->|VPN| RN1
    PS <-->|VPN| RN2
    PS <-->|VPN| WN1
    PS <-->|VPN| WN2
    RN1 <-->|VPN| RN2
    WN1 <-->|VPN| WN2
```

### 5.2 WireGuard VPN Configuration

**Platform Server (wg0.conf):**

```ini
[Interface]
Address = 10.0.1.1/16
ListenPort = 51820
PrivateKey = <platform-private-key>
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# React Node 1
[Peer]
PublicKey = <react-node-1-public-key>
AllowedIPs = 10.0.2.1/32
Endpoint = 103.x.x.2:51820
PersistentKeepalive = 25

# WordPress Node 1
[Peer]
PublicKey = <wp-node-1-public-key>
AllowedIPs = 10.0.3.1/32
Endpoint = 103.x.x.4:51820
PersistentKeepalive = 25
```

**React Node 1 (wg0.conf):**

```ini
[Interface]
Address = 10.0.2.1/16
ListenPort = 51820
PrivateKey = <react-node-1-private-key>

[Peer]
PublicKey = <platform-public-key>
AllowedIPs = 10.0.0.0/16
Endpoint = 103.x.x.1:51820
PersistentKeepalive = 25
```

### 5.3 Firewall Rules (UFW)

#### Platform Server

| Rule | Port | Source | Action | Purpose |
|------|------|--------|--------|---------|
| 1 | 22 (SSH) | Admin IPs only | Allow | SSH access |
| 2 | 80, 443 | 0.0.0.0/0 | Allow | HTTP/HTTPS (Traefik) |
| 3 | 51820/udp | Node IPs | Allow | WireGuard VPN |
| 4 | 5432 | 10.0.0.0/16 | Allow | PostgreSQL (VPN only) |
| 5 | 6379 | 10.0.0.0/16 | Allow | Redis (VPN only) |
| 6 | 9090 | 10.0.0.0/16 | Allow | Prometheus (VPN only) |
| 7 | * | * | Deny | Default deny |

#### React Hosting Node

| Rule | Port | Source | Action | Purpose |
|------|------|--------|--------|---------|
| 1 | 22 (SSH) | Admin IPs only | Allow | SSH access |
| 2 | 80, 443 | 0.0.0.0/0 | Allow | Customer traffic (Traefik) |
| 3 | 51820/udp | Platform IP | Allow | WireGuard VPN |
| 4 | 5000 | 10.0.1.1 | Allow | Node Agent (VPN only) |
| 5 | * | * | Deny | Default deny |

#### WordPress Hosting Node

| Rule | Port | Source | Action | Purpose |
|------|------|--------|--------|---------|
| 1 | 22 (SSH) | Admin IPs only | Allow | SSH access |
| 2 | 80, 443 | 0.0.0.0/0 | Allow | Customer traffic (Nginx) |
| 3 | 51820/udp | Platform IP | Allow | WireGuard VPN |
| 4 | 5001 | 10.0.1.1 | Allow | Node Agent (VPN only) |
| 5 | 3306 | 127.0.0.1 | Allow | MariaDB (localhost only) |
| 6 | * | * | Deny | Default deny |

### 5.4 DNS Architecture

```mermaid
sequenceDiagram
    participant User
    participant DNS as DNS Resolver
    participant CF as Cloudflare / Registrar
    participant RN as React Node
    participant WN as WordPress Node

    Note over User, WN: Subdomain Resolution (app.itbengal.com)
    User->>DNS: Resolve app-xyz.itbengal.com
    DNS->>CF: Query A record
    CF-->>DNS: A → 103.x.x.2 (React Node 1)
    DNS-->>User: 103.x.x.2
    User->>RN: HTTPS request

    Note over User, WN: Custom Domain Resolution
    User->>DNS: Resolve myapp.example.com
    DNS->>CF: Query CNAME
    CF-->>DNS: CNAME → proxy.itbengal.com
    DNS->>CF: Query A for proxy.itbengal.com
    CF-->>DNS: A → 103.x.x.2
    DNS-->>User: 103.x.x.2
    User->>RN: HTTPS request
```

### 5.5 Port Mapping Summary

| Port | Protocol | Service | Exposure |
|------|----------|---------|----------|
| 22 | TCP | SSH | Admin IPs only |
| 80 | TCP | HTTP → HTTPS redirect | Public |
| 443 | TCP | HTTPS (Traefik/Nginx) | Public |
| 3000 | TCP | Next.js Dashboard | Internal (via Traefik) |
| 3001 | TCP | Grafana | Internal (via Traefik) |
| 3100 | TCP | Loki | Internal |
| 3306 | TCP | MariaDB | Localhost / VPN |
| 4000 | TCP | Express.js API | Internal (via Traefik) |
| 4001 | TCP | WebSocket Server | Internal (via Traefik) |
| 5000 | TCP | React Node Agent | VPN only |
| 5001 | TCP | WordPress Node Agent | VPN only |
| 5432 | TCP | PostgreSQL | VPN only |
| 6379 | TCP | Redis (Platform) | VPN only |
| 6380 | TCP | Redis (WordPress cache) | Localhost |
| 9090 | TCP | Prometheus | VPN only |
| 51820 | UDP | WireGuard | Peer IPs |

---

## 6. Load Balancing with Traefik

### 6.1 Architecture on React Hosting Servers

```mermaid
graph LR
    subgraph TraefikLB["Traefik Load Balancer"]
        EP_80[Entrypoint :80]
        EP_443[Entrypoint :443]
        MW1[Middleware:<br/>HTTPS Redirect]
        MW2[Middleware:<br/>Security Headers]
        MW3[Middleware:<br/>Rate Limit]
        MW4[Middleware:<br/>Compress]
        ROUTER[Router Layer<br/>Host-based routing]
    end

    EP_80 --> MW1 --> EP_443
    EP_443 --> MW2 --> MW3 --> MW4 --> ROUTER

    ROUTER -->|app-1.itbengal.com| S1[Service: app-1<br/>Container :3000]
    ROUTER -->|app-2.itbengal.com| S2[Service: app-2<br/>Container :3000]
    ROUTER -->|custom.example.com| S3[Service: app-3<br/>Container :8080]
```

### 6.2 Service Discovery via Docker Labels

Traefik automatically discovers services via Docker labels. When the Node Agent starts a new customer container with the appropriate labels, Traefik immediately routes traffic to it — zero manual configuration needed.

**Rationale:** This eliminates the need for a configuration file per deployment. Adding or removing deployments is instant and atomic. Traefik watches the Docker socket for container events.

### 6.3 Middleware Chain

| Order | Middleware | Purpose | Configuration |
|-------|-----------|---------|---------------|
| 1 | HTTPS Redirect | Force TLS on all traffic | `web → websecure` |
| 2 | Security Headers | HSTS, X-Frame-Options, etc. | See security headers config |
| 3 | Rate Limit | Prevent abuse per IP | 100 req/min avg, 200 burst |
| 4 | Compress | Gzip response bodies | Exclude `text/event-stream` |
| 5 | Retry | Retry on 502/503 | 3 attempts |

### 6.4 Health Check Configuration

```yaml
# Traefik health check for each service
healthCheck:
  path: "/"
  interval: "30s"
  timeout: "5s"
  scheme: "http"
```

### 6.5 Sticky Sessions (for SSR Apps)

For Next.js and other SSR applications that may store session state:

```yaml
labels:
  - "traefik.http.services.app-${ID}.loadbalancer.sticky.cookie=true"
  - "traefik.http.services.app-${ID}.loadbalancer.sticky.cookie.name=itb_affinity"
  - "traefik.http.services.app-${ID}.loadbalancer.sticky.cookie.httpOnly=true"
  - "traefik.http.services.app-${ID}.loadbalancer.sticky.cookie.secure=true"
```

**Rationale:** Only enabled for SSR apps that require session affinity. Static sites and SPAs do not need sticky sessions.

---

## 7. SSL/TLS with Let's Encrypt

### 7.1 Certificate Generation Flow

```mermaid
sequenceDiagram
    participant App as Customer App
    participant TRF as Traefik
    participant LE as Let's Encrypt

    Note over App, LE: New Deployment with Custom Domain
    App->>TRF: Container starts with<br/>Host(`example.com`) label
    TRF->>TRF: Detect new domain<br/>No certificate found
    TRF->>LE: Request certificate<br/>(HTTP-01 challenge)
    LE-->>TRF: Challenge token
    TRF->>TRF: Serve challenge at<br/>/.well-known/acme-challenge/{token}
    LE->>TRF: Verify challenge<br/>HTTP GET to domain
    TRF-->>LE: Valid response
    LE-->>TRF: Issue certificate<br/>(fullchain + key)
    TRF->>TRF: Store in acme.json
    TRF->>TRF: Enable HTTPS
    Note over TRF: Auto-renewal 30 days<br/>before expiry
```

### 7.2 Challenge Type Comparison

| Feature | HTTP-01 | DNS-01 |
|---------|---------|--------|
| **Mechanism** | Serve file on `/.well-known/acme-challenge/` | Create `_acme-challenge` TXT DNS record |
| **Port Required** | 80 (HTTP) | None |
| **Wildcard Support** | No | Yes |
| **DNS Provider Integration** | Not needed | Required |
| **Automation** | Fully automatic via Traefik | Requires DNS API integration |
| **Used For** | React hosting (per-domain) | Wildcard `*.itbengal.com` (platform) |

**Decision:** Use HTTP-01 for customer domains (simpler, works with any domain) and DNS-01 for the platform wildcard certificate (`*.itbengal.com`).

### 7.3 Certificate Storage

```
# React Nodes: Traefik stores all certs in one file
/opt/itbengal/react-node/traefik/acme.json    # chmod 600

# WordPress Nodes: Certbot stores per-domain
/etc/letsencrypt/live/{domain}/
├── fullchain.pem
├── privkey.pem
├── cert.pem
└── chain.pem
```

### 7.4 Auto-Renewal

| Component | Tool | Method | Schedule |
|-----------|------|--------|----------|
| React hosting | Traefik | Built-in ACME renewal | Automatic (30 days before expiry) |
| WordPress hosting | Certbot | Certbot renew cron | `0 3,15 * * *` (twice daily) |
| Platform services | Traefik | Built-in ACME renewal | Automatic |

### 7.5 Certificate Monitoring

Prometheus alert rule for expiring certificates:

```yaml
# alerts.yml
- alert: SSLCertExpiringSoon
  expr: (probe_ssl_earliest_cert_expiry - time()) / 86400 < 14
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "SSL cert for {{ $labels.instance }} expires in {{ $value }} days"
```

---

## 8. Docker & Docker Compose Configurations

> **Note:** Complete Docker Compose files for the Platform Server and React Node are provided in Sections 2.2 and 3.9 respectively. This section covers supplementary Docker configurations.

### 8.1 Docker Network Architecture

```mermaid
graph TB
    subgraph PlatformServer["Platform Server Networks"]
        FE_NET[frontend<br/>bridge]
        BE_NET[backend<br/>bridge, internal]
        FE_NET --- TRF_P[Traefik]
        FE_NET --- DASH[Dashboard]
        FE_NET --- GRAF[Grafana]
        BE_NET --- DASH
        BE_NET --- API[API]
        BE_NET --- PG[PostgreSQL]
        BE_NET --- RD[Redis]
        BE_NET --- BQ[Workers]
        BE_NET --- PROM[Prometheus]
        BE_NET --- LOKI[Loki]
    end

    subgraph ReactNode["React Node Networks"]
        PUB_NET[traefik-public<br/>bridge]
        PUB_NET --- TRF_R[Traefik]
        PUB_NET --- AGENT[Node Agent]
        ISO1[net-customer-1<br/>isolated] --- C1[Container 1]
        ISO2[net-customer-2<br/>isolated] --- C2[Container 2]
        PUB_NET --- C1
        PUB_NET --- C2
    end
```

**Design Decision:** The `backend` network on the Platform Server is marked `internal: true`, meaning containers on it cannot reach the public internet. This ensures PostgreSQL and Redis are never accidentally exposed. Only the `frontend` network has outbound access.

### 8.2 Docker Resource Constraints

```yaml
# Standard resource constraint pattern
deploy:
  resources:
    limits:
      cpus: "${CPU_LIMIT}"
      memory: "${MEM_LIMIT}"
    reservations:
      cpus: "${CPU_RESERVE}"
      memory: "${MEM_RESERVE}"
```

### 8.3 Docker Security Defaults

```yaml
# Applied to all customer containers on React nodes
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE
read_only: true
tmpfs:
  - /tmp:size=100M
user: "1000:1000"
```

---

## 9. Storage Architecture

### 9.1 Platform Server Storage Layout

```
/opt/itbengal/platform/
├── docker-compose.yml
├── .env
├── dashboard/               # Next.js source
├── api/                     # Express.js source
├── config/
│   ├── postgres/
│   │   └── postgresql.conf
│   ├── redis/
│   │   └── redis.conf
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── alerts.yml
│   ├── grafana/
│   │   └── provisioning/
│   │       ├── datasources/
│   │       └── dashboards/
│   └── loki/
│       └── loki.yml
└── scripts/
    ├── backup.sh
    ├── restore.sh
    └── health-check.sh

Docker Volumes:
  pg-data       → /var/lib/docker/volumes/pg-data/        (~50 GB)
  pg-backups    → /var/lib/docker/volumes/pg-backups/      (~20 GB)
  redis-data    → /var/lib/docker/volumes/redis-data/      (~5 GB)
  prom-data     → /var/lib/docker/volumes/prom-data/       (~20 GB)
  grafana-data  → /var/lib/docker/volumes/grafana-data/    (~5 GB)
  loki-data     → /var/lib/docker/volumes/loki-data/       (~20 GB)
  traefik-certs → /var/lib/docker/volumes/traefik-certs/   (~1 GB)
```

### 9.2 Retention Policies

| Data Type | Retention | Storage Location | Cleanup Method |
|-----------|-----------|------------------|----------------|
| PostgreSQL data | Indefinite | pg-data volume | Manual archival |
| PostgreSQL backups | 30 days | pg-backups volume | Cron: delete older than 30d |
| PostgreSQL WAL | 7 days | pg-backups/wal | pg archival config |
| Redis snapshots | 7 days | redis-data volume | Redis config |
| Prometheus metrics | 15 days | prom-data volume | `--storage.tsdb.retention.time=15d` |
| Loki logs | 30 days | loki-data volume | Loki retention config |
| Traefik access logs | 14 days | traefik-logs volume | Logrotate |
| Deployment build logs | 90 days | /logs | Cleanup cron job |
| Docker images (old) | 7 days | Docker storage | `docker image prune` cron |
| WordPress backups (daily) | 7 days | /backups/daily | Cron: rotate |
| WordPress backups (weekly) | 30 days | /backups/weekly | Cron: rotate |

---

## 10. Backup Infrastructure

### 10.1 Backup Strategy Overview

```mermaid
graph TB
    subgraph Sources["Backup Sources"]
        PG[PostgreSQL<br/>Platform DB]
        MDB[MariaDB<br/>WordPress DBs]
        FILES[WordPress Files<br/>/var/www/sites/]
        DEPLOY[Deployment Artifacts<br/>Docker images]
        CONFIG[Configuration<br/>All servers]
    end

    subgraph Local["Local Backup"]
        PG_BK[pg_dump + WAL<br/>pg-backups volume]
        MDB_BK[mysqldump + binlog<br/>/backups/mysql/]
        FILE_BK[tar + gzip<br/>/backups/files/]
        DEPLOY_BK[Docker save<br/>/backups/images/]
    end

    subgraph Remote["Remote Backup (Future)"]
        BACKUP_SRV[Dedicated Backup Server<br/>rsync over SSH]
        OFFSITE[Offsite Storage<br/>Different DC]
    end

    PG --> PG_BK
    MDB --> MDB_BK
    FILES --> FILE_BK
    DEPLOY --> DEPLOY_BK
    PG_BK --> BACKUP_SRV
    MDB_BK --> BACKUP_SRV
    FILE_BK --> BACKUP_SRV
    BACKUP_SRV --> OFFSITE
```

### 10.2 Backup Schedule

| Backup Type | Source | Method | Schedule | Retention | Storage |
|-------------|--------|--------|----------|-----------|---------|
| PostgreSQL full | Platform Server | `pg_dump --format=custom` | Daily 02:00 UTC | 30 days | pg-backups volume |
| PostgreSQL WAL | Platform Server | Continuous WAL archiving | Continuous | 7 days | pg-backups/wal |
| MariaDB full | WordPress Nodes | `mysqldump --all-databases` | Daily 02:30 UTC | 30 days | /backups/mysql/ |
| MariaDB binlog | WordPress Nodes | Binary log retention | Continuous | 7 days | MariaDB data dir |
| WordPress files | WordPress Nodes | `tar czf` per site | Daily 03:00 UTC | Daily: 7d, Weekly: 30d |  /backups/files/ |
| Config files | All servers | `tar czf /opt/itbengal/` | Daily 04:00 UTC | 30 days | /backups/config/ |
| Docker images | React Nodes | `docker save` | On deployment | Last 5 versions | /backups/images/ |
| Remote sync | All | `rsync --delete` | Daily 05:00 UTC | 14 days | Backup Server |

### 10.3 PostgreSQL Backup Script

```bash
#!/bin/bash
# /opt/itbengal/platform/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="itbengal_${DATE}.dump"

# Create backup
docker exec itb-postgres pg_dump \
  -U itbengal \
  -d itbengal \
  --format=custom \
  --compress=9 \
  --file=/backups/${FILENAME}

# Verify backup
docker exec itb-postgres pg_restore \
  --list /backups/${FILENAME} > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup successful: ${FILENAME}"
else
  echo "[$(date)] Backup verification FAILED: ${FILENAME}" >&2
  exit 1
fi

# Cleanup old backups (> 30 days)
find ${BACKUP_DIR} -name "*.dump" -mtime +30 -delete
echo "[$(date)] Cleanup completed"
```

### 10.4 WordPress Site Backup Script

```bash
#!/bin/bash
# /opt/itbengal/wp-node/scripts/backup-site.sh

SITE_SLUG=$1
BACKUP_TYPE=$2  # daily | weekly | on-demand
DATE=$(date +%Y-%m-%d_%H-%M-%S)
SITE_DIR="/var/www/sites/${SITE_SLUG}"
BACKUP_DIR="${SITE_DIR}/backups/${BACKUP_TYPE}"

mkdir -p ${BACKUP_DIR}

# Backup database
mysqldump \
  --user=wp_${SITE_SLUG} \
  --password="${DB_PASS}" \
  --single-transaction \
  --routines \
  --triggers \
  wp_${SITE_SLUG} | gzip > ${BACKUP_DIR}/db_${DATE}.sql.gz

# Backup files
tar czf ${BACKUP_DIR}/files_${DATE}.tar.gz \
  -C ${SITE_DIR} \
  --exclude='backups' \
  --exclude='staging' \
  --exclude='tmp' \
  public_html/

echo "[$(date)] Backup completed: ${SITE_SLUG} (${BACKUP_TYPE})"
```

### 10.5 Restoration Procedures

#### PostgreSQL Restore

```bash
# Stop API and workers
docker compose stop api workers

# Restore from backup
docker exec -i itb-postgres pg_restore \
  -U itbengal \
  -d itbengal \
  --clean \
  --if-exists \
  /backups/itbengal_2026-07-04_02-00-00.dump

# Restart services
docker compose start api workers
```

#### WordPress Site Restore

```bash
# Restore database
gunzip < /backups/daily/db_2026-07-04.sql.gz | mysql -u wp_shop -p wp_shop

# Restore files
tar xzf /backups/daily/files_2026-07-04.tar.gz -C /var/www/sites/shop/

# Fix permissions
chown -R www-shop:www-shop /var/www/sites/shop/public_html/
chmod -R 755 /var/www/sites/shop/public_html/
chmod 640 /var/www/sites/shop/public_html/wp-config.php

# Clear cache
wp cache flush --path=/var/www/sites/shop/public_html
systemctl restart php8.2-fpm
```

---

## 11. Network Security

### 11.1 Security Layers

```mermaid
graph TB
    subgraph Layer1["Layer 1: Edge"]
        FW[UFW Firewall]
        DDOS[DDoS Mitigation]
    end

    subgraph Layer2["Layer 2: Transport"]
        TLS[TLS 1.2/1.3]
        VPN[WireGuard VPN]
    end

    subgraph Layer3["Layer 3: Application"]
        RATE[Rate Limiting]
        HEADERS[Security Headers]
        AUTH[JWT Authentication]
    end

    subgraph Layer4["Layer 4: Container"]
        NETISO[Network Isolation]
        CAPS[Dropped Capabilities]
        RO[Read-Only Filesystem]
        NOPRI[No New Privileges]
    end

    subgraph Layer5["Layer 5: Data"]
        ENC[Encryption at Rest]
        SECRETS[Secrets Management]
    end

    Layer1 --> Layer2 --> Layer3 --> Layer4 --> Layer5
```

### 11.2 SSH Hardening

```bash
# /etc/ssh/sshd_config modifications

Port 2222                          # Non-standard port
PermitRootLogin no                 # Disable root login
PasswordAuthentication no          # Key-only authentication
PubkeyAuthentication yes           # Enable public key auth
MaxAuthTries 3                     # Limit auth attempts
LoginGraceTime 30                  # 30 second login timeout
AllowUsers deploy                  # Whitelist specific users
ClientAliveInterval 300            # 5 min keepalive
ClientAliveCountMax 2              # Disconnect after 2 missed keepalives
X11Forwarding no                   # Disable X11
AllowTcpForwarding no              # Disable TCP forwarding
Protocol 2                         # SSH protocol 2 only
```

### 11.3 Fail2Ban Configuration

```ini
# /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[traefik-auth]
enabled = true
filter = traefik-auth
logpath = /opt/itbengal/react-node/traefik/logs/access.log
maxretry = 10
bantime = 3600
```

### 11.4 DDoS Mitigation

| Layer | Mitigation | Implementation |
|-------|-----------|----------------|
| Network | SYN flood protection | `sysctl` kernel parameters |
| Network | Connection rate limiting | UFW + iptables rules |
| Application | Request rate limiting | Traefik rate-limit middleware |
| Application | IP-based throttling | Express.js rate limiter + Redis |
| DNS | DNS amplification | Disable open resolver |

**Kernel Parameters:**

```bash
# /etc/sysctl.d/99-itbengal-security.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.tcp_timestamps = 0
```

### 11.5 Container Network Isolation

Each customer container on React hosting nodes is placed in its own Docker network. Containers cannot communicate with each other — only with Traefik (for inbound traffic).

```bash
# Create isolated network per customer
docker network create \
  --driver bridge \
  --internal \
  --subnet 172.20.{customer_id}.0/24 \
  net-customer-{customer_id}
```

---

## 12. Server Provisioning Procedures

### 12.1 New React Hosting Node Checklist

| # | Step | Command / Action | Verify |
|---|------|-----------------|--------|
| 1 | Install Ubuntu 22.04 LTS | VPS provider console | `lsb_release -a` |
| 2 | Update system | `apt update && apt upgrade -y` | No errors |
| 3 | Create deploy user | `adduser deploy && usermod -aG sudo deploy` | SSH as deploy |
| 4 | Harden SSH | Edit `/etc/ssh/sshd_config` (port 2222, key-only) | SSH on port 2222 |
| 5 | Install UFW | `apt install ufw` | `ufw status` |
| 6 | Configure firewall | Allow 2222, 80, 443, 51820 | `ufw status verbose` |
| 7 | Install WireGuard | `apt install wireguard` | `wg show` |
| 8 | Configure VPN | Create wg0.conf, add peer on Platform | `ping 10.0.1.1` |
| 9 | Install Docker | `curl -fsSL https://get.docker.com \| sh` | `docker --version` |
| 10 | Install Fail2Ban | `apt install fail2ban` | `fail2ban-client status` |
| 11 | Clone deployment configs | `git clone` from config repo | Files exist |
| 12 | Configure Node Agent | Set NODE_ID, NODE_SECRET in .env | Agent config valid |
| 13 | Start Traefik + Agent | `docker compose up -d` | `docker ps` |
| 14 | Register node with Platform | `curl POST /api/v1/admin/nodes/register` | Node appears in admin |
| 15 | Run health check | `curl http://10.0.2.N:5000/health` | 200 OK |
| 16 | Deploy test container | Trigger test deployment from Platform | Container running |
| 17 | Verify SSL | Access test domain via HTTPS | Valid certificate |

### 12.2 New WordPress Hosting Node Checklist

| # | Step | Command / Action | Verify |
|---|------|-----------------|--------|
| 1 | Install Ubuntu 22.04 LTS | VPS provider console | `lsb_release -a` |
| 2 | Update system | `apt update && apt upgrade -y` | No errors |
| 3 | Create deploy user | `adduser deploy` | SSH as deploy |
| 4 | Harden SSH | Port 2222, key-only, Fail2Ban | SSH on port 2222 |
| 5 | Install UFW + firewall rules | Allow 2222, 80, 443, 51820 | `ufw status` |
| 6 | Install WireGuard + configure | Add VPN peer | `ping 10.0.1.1` |
| 7 | Install Nginx | `apt install nginx` | `nginx -v` |
| 8 | Install PHP 8.2 + extensions | `apt install php8.2-fpm php8.2-mysql php8.2-redis ...` | `php -v` |
| 9 | Install MariaDB 10.11 | `apt install mariadb-server` | `mysql --version` |
| 10 | Secure MariaDB | `mysql_secure_installation` | Root password set |
| 11 | Install Redis | `apt install redis-server` (port 6380) | `redis-cli -p 6380 ping` |
| 12 | Install WP-CLI | Download phar, move to `/usr/local/bin/` | `wp --info` |
| 13 | Install ClamAV | `apt install clamav clamav-daemon` | `clamscan --version` |
| 14 | Install Certbot | `apt install certbot python3-certbot-nginx` | `certbot --version` |
| 15 | Install Node Agent | Clone + build | Agent running on :5001 |
| 16 | Register node with Platform | API call to register WP node | Node in admin dashboard |
| 17 | Create test WordPress site | Trigger from Platform | Site accessible |
| 18 | Verify SSL | Check HTTPS for test site | Valid cert |
| 19 | Run malware scan test | `clamscan /var/www/sites/test/` | Scan completes |

### 12.3 Platform Server Provisioning Checklist

| # | Step | Command / Action | Verify |
|---|------|-----------------|--------|
| 1 | Install Ubuntu 22.04 LTS | VPS provider | `lsb_release -a` |
| 2 | System update + essentials | `apt update && apt upgrade -y && apt install ...` | No errors |
| 3 | Harden SSH + Fail2Ban | Port 2222, key-only auth | SSH on 2222 |
| 4 | Configure UFW | Allow 2222, 80, 443, 51820 | `ufw status` |
| 5 | Install Docker + Compose | Docker official script | `docker compose version` |
| 6 | Install WireGuard | `apt install wireguard` | `wg show` |
| 7 | Clone platform repository | `git clone` to `/opt/itbengal/platform/` | Files present |
| 8 | Configure .env | Set all secrets and credentials | `.env` valid |
| 9 | Start all services | `docker compose up -d` | All containers running |
| 10 | Run database migrations | `docker exec itb-api npm run db:migrate` | Migrations pass |
| 11 | Create admin user | `docker exec itb-api npm run create-admin` | Admin can login |
| 12 | Verify Dashboard | Access `https://app.itbengal.com` | Page loads |
| 13 | Verify API | `curl https://api.itbengal.com/api/v1/health` | 200 OK |
| 14 | Verify Grafana | Access `https://monitoring.itbengal.com` | Login works |
| 15 | Configure Prometheus targets | Add node agents to prometheus.yml | Targets UP |
| 16 | Import Grafana dashboards | Upload JSON dashboard files | Dashboards visible |
| 17 | Test backup script | Run `/opt/itbengal/platform/scripts/backup.sh` | Backup file created |
| 18 | Setup cron jobs | Backup, cleanup, monitoring crons | `crontab -l` |

### 12.4 Automation Approach

For MVP, provisioning is manual with checklists. As the platform grows:

| Phase | Approach | Tools |
|-------|---------|-------|
| MVP (1-3 servers) | Manual with checklists | Bash scripts, checklists above |
| Growth (4-10 servers) | Semi-automated scripts | Bash + Ansible playbooks |
| Scale (10+ servers) | Fully automated | Ansible + custom provisioning API |

**Rationale:** Full automation (e.g., Terraform, Ansible) adds complexity that isn't justified for 3 initial servers. Checklists ensure nothing is missed. Automation is introduced incrementally as the number of servers grows.

---

*End of Document — 07 Infrastructure Design*
