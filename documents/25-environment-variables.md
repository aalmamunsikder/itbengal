# ITBengal — Environment Variables Reference

> **Version:** 1.0.0
> **Date:** 2026-07-04
> **Status:** Approved
> **Classification:** Internal — Confidential

| Role | Author |
|---|---|
| Senior Technical Writer | ITBengal Documentation Team |
| Senior Software Architect | ITBengal Engineering Team |
| Senior Security Engineer | ITBengal Security Team |
| Senior DevOps Lead | ITBengal Infrastructure Team |

---

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1.0 | 2026-06-05 | Engineering Team | Initial outline of service variables. |
| 0.5.0 | 2026-06-20 | Security Team | Added AES-256-GCM customer env var encryption specs. |
| 0.9.0 | 2026-07-01 | DevOps Team | Added Traefik, monitoring, Let's Encrypt configs and templates. |
| 1.0.0 | 2026-07-04 | Architecture Team | Final review and official release. |

---

## Table of Contents

1. [Introduction and Core Principles](#1-introduction-and-core-principles)
   - 1.1 [Scope and Purpose](#11-scope-and-purpose)
   - 1.2 [Configuration Isolation (12-Factor App)](#12-configuration-isolation-12-factor-app)
   - 1.3 [Environment Types and Target Mapping](#13-environment-types-and-target-mapping)
   - 1.4 [Boot-Time Validation and Fail-Fast Strategy](#14-boot-time-validation-and-fail-fast-strategy)
2. [Service-by-Service Environment Variables Reference](#2-service-by-service-environment-variables-reference)
   - 2.1 [Platform Core API (apps/api)](#21-platform-core-api-appsapi)
   - 2.2 [Next.js Customer Dashboard (apps/dashboard)](#22-nextjs-customer-dashboard-appsdashboard)
   - 2.3 [Next.js Administrative Portal (apps/admin)](#23-nextjs-administrative-portal-appsadmin)
   - 2.4 [React Deployment Agent (services/deployment-engine)](#24-react-deployment-agent-servicesdeployment-engine)
   - 2.5 [Managed WordPress Node Agent (services/wordpress-manager)](#25-managed-wordpress-node-agent-serviceswordpress-manager)
   - 2.6 [System Infrastructure Configurations](#26-system-infrastructure-configurations)
3. [Production .env.example Templates](#3-production-envexample-templates)
   - 3.1 [Platform Core API (.env.example)](#31-platform-core-api-envexample)
   - 3.2 [Next.js Customer Dashboard (.env.example)](#32-nextjs-customer-dashboard-envexample)
   - 3.3 [Next.js Administrative Portal (.env.example)](#33-nextjs-administrative-portal-envexample)
   - 3.4 [React Deployment Agent (.env.example)](#34-react-deployment-agent-envexample)
   - 3.5 [Managed WordPress Node Agent (.env.example)](#35-managed-wordpress-node-agent-envexample)
   - 3.6 [Traefik Reverse Proxy Configuration (.env.example)](#36-traefik-reverse-proxy-configuration-envexample)
   - 3.7 [Monitoring Stack Configuration (.env.example)](#37-monitoring-stack-configuration-envexample)
4. [Secrets Management & Encryption Architecture](#4-secrets-management--encryption-architecture)
   - 4.1 [Customer Environment Variables Database Security](#41-customer-environment-variables-database-security)
   - 4.2 [Cryptographic Key Derivation Flow (AES-256-GCM + HKDF)](#42-cryptographic-key-derivation-flow-aes-256-gcm--hkdf)
   - 4.3 [Node.js Encryption & Decryption Implementations](#43-nodejs-encryption--decryption-implementations)
   - 4.4 [Architectural Sequence Flowchart](#44-architectural-sequence-flowchart)
   - 4.5 [Secrets in Git, Pre-Commit Hooks & CI/CD Pipelines](#45-secrets-in-git-pre-commit-hooks--cicd-pipelines)
   - 4.6 [OpenID Connect (OIDC) Federated Identity Exchanges](#46-openid-connect-oidc-federated-identity-exchanges)
5. [Secrets Rotation Procedures & Drills](#5-secrets-rotation-procedures--drills)
   - 5.1 [Rotation Frequency Matrices](#51-rotation-frequency-matrices)
   - 5.2 [Phase-by-Phase Rotation Execution Playbook](#52-phase-by-phase-rotation-execution-playbook)

---

## 1. Introduction and Core Principles

### 1.1 Scope and Purpose
This document provides a single source of truth for all environment variables utilized across the ITBengal Hosting Platform. It defines the parameters necessary to initialize, run, and scale platform services. This includes database URLs, external domain registrar API configurations, cellular billing systems, client dashboard addresses, deployment engine nodes, and security encryption keys. Developers, system operators, and DevOps engineers must use this document to maintain consistency across local, staging, and production environments.

### 1.2 Configuration Isolation (12-Factor App)
ITBengal strictly adheres to **Factor III (Config)** of the 12-Factor App methodology. Configuration—which encompasses everything that varies between deployments (such as database credentials, payment keys, and external API hostnames)—is strictly separated from application source code. 

- **No Code Modifying Configuration**: Code must not contain hardcoded credentials, IP addresses, or environment-specific toggles.
- **Dynamic Configuration Injection**: All configurations are injected via environment variables at runtime. This allows the same container build or application bundle to deploy seamlessly across development, testing, staging, and production networks without recompilation.

### 1.3 Environment Types and Target Mapping
The platform operates under four distinct deployment tiers, each defined by the `NODE_ENV` context:
1. **Development (`development`)**: Local machine developer environments. Features verbose debugging, mock payment processing, local sandbox APIs, and unsecured non-SSL channels.
2. **Preview (`preview`)**: Ephemeral hosting branches used for testing feature updates. These utilize production-like sandbox configs but point to non-production database targets.
3. **Staging (`staging`)**: Pre-release verification tier matching production parameters. These share database instances with other testing tools and use production-grade payment sandboxes.
4. **Production (`production`)**: Live user environment. Requires high availability, encrypted secrets, SSL validation, strict firewall constraints, and real payment transactions.

Customer-configured environment variables are targeted using the `target` field in the database, allowing variables to be injected specifically for `production`, `preview`, `development`, or `all` environments, as defined in [`documents/09-database-design.md`](file:///e:/itbengal/documents/09-database-design.md#L910-L931).

### 1.4 Boot-Time Validation and Fail-Fast Strategy
To avoid silent application failures, unexpected null pointers, or invalid connection timeouts during operations, all ITBengal services implement **Boot-Time Schema Validation** using **Zod**. 

During application initialization, the system parses all process environment variables against a predefined schema. If a required environment variable is missing, or if a variable's value violates type constraints (e.g., a port number is outside the `1-65535` range, or `DATABASE_URL` is an invalid URI format), the application prints a structured error message to stdout and exits with status code `1` immediately. This prevents the application from starting in an unhealthy or semi-configured state.

---

## 2. Service-by-Service Environment Variables Reference

### 2.1 Platform Core API (`apps/api`)

The Platform Core API backend is built using Express.js. It reads system parameters, establishes database pools, maintains Redis connection bindings, validates authentication tokens, communicates with Openprovider, and authenticates payment gateways.

#### 2.1.1 System Runtime & Network Settings

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `NODE_ENV` | Sets the runtime environment for Express and logging components. | `development`, `staging`, `production` | `development` | Yes | No |
| `PORT` | Local TCP port the API service binds to. | `1` to `65535` | `5000` | No | No |
| `API_PREFIX` | Base URI routing prefix for REST resource paths. | Path starting with `/` | `/api/v1` | No | No |
| `CORS_ORIGINS` | Comma-separated list of origins permitted to call this API. | Valid URL list | `http://localhost:3000` | Yes | No |
| `LOG_LEVEL` | Logging verbosity for system console and Winston logs. | `debug`, `info`, `warn`, `error` | `info` | No | No |
| `TRUST_PROXY` | Configures Express proxy headers validation (needed behind Traefik). | `true`, `false`, `loopback`, CIDR | `false` | No | No |
| `SHUTDOWN_TIMEOUT_MS` | Max time allowed for requests to drain before force-closing. | Positive integer | `10000` | No | No |

#### 2.1.2 PostgreSQL Database Configurations

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `DATABASE_URL` | Primary PostgreSQL connection string with admin credentials. | `postgresql://[u]:[p]@[h]:[port]/[db]` | None | Yes | **Yes** |
| `DATABASE_POOL_MIN` | Minimum persistent database connections in PG pool. | Positive integer | `2` | No | No |
| `DATABASE_POOL_MAX` | Maximum concurrent database connections allowed. | Positive integer | `20` | No | No |
| `DATABASE_TIMEOUT_MS`| Timeout limit for establishing a new DB connection. | Positive integer | `30000` | No | No |
| `DATABASE_SSL` | Forces SSL connection encryption for remote databases. | `true`, `false` | `true` | No | No |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Enables verification of the DB server CA certificate. | `true`, `false` | `true` | No | No |

#### 2.1.3 Redis Cache & BullMQ Queue Infrastructure

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `REDIS_URL` | Connection URL for cache storage and BullMQ workers. | `redis://[:pass]@[host]:[port]/[db]` | `redis://localhost:6379/0` | Yes | **Yes** |
| `REDIS_PASSWORD` | Fallback direct password string if not provided in URL. | String | None | No | **Yes** |
| `REDIS_HOST` | Fallback hostname connection key. | Hostname or IP | `localhost` | No | No |
| `REDIS_PORT` | Fallback port connection key. | `1` to `65535` | `6379` | No | No |
| `REDIS_DB` | Target logical database index. | `0` to `15` | `0` | No | No |
| `BULLMQ_CONCURRENCY` | Number of parallel jobs a single worker node will pull. | Positive integer | `5` | No | No |
| `BULLMQ_REMOVE_ON_COMPLETE` | Auto-deletes metadata for completed build jobs. | `true`, `false` | `true` | No | No |
| `BULLMQ_REMOVE_ON_FAIL` | Auto-deletes failed job metadata from Redis. | `true`, `false` | `false` | No | No |

#### 2.1.4 JWT Signatures & Token Auth Settings

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `JWT_SECRET` | Secret key used to sign HS256 User Access JWTs. | Strong string (min 32 chars) | None | Yes | **Yes** |
| `JWT_REFRESH_SECRET` | Secret key used to sign User Refresh JWTs. | Strong string (min 32 chars) | None | Yes | **Yes** |
| `JWT_ACCESS_EXPIRATION` | Duration an Access token remains valid. | Format: `15m`, `1h`, etc. | `15m` | No | No |
| `JWT_REFRESH_EXPIRATION` | Duration a Refresh token remains valid. | Format: `7d`, `30d`, etc. | `7d` | No | No |
| `JWT_ISSUER` | System token issuer payload verification tag. | Domain/string | `itbengal-api` | No | No |
| `JWT_AUDIENCE` | System token target audience verification tag. | Domain/string | `itbengal-app` | No | No |
| `ENCRYPTION_KEY` | Master AES key used to derive organizational environment keys. | 64-character Hex string | None | Yes | **Yes** |

#### 2.1.5 Openprovider Domain Registry Integration

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `OPENPROVIDER_USERNAME` | Authentication username for the Openprovider domain registrar. | String | None | Yes | No |
| `OPENPROVIDER_PASSWORD` | Password for the Openprovider registrar portal API. | String | None | Yes | **Yes** |
| `OPENPROVIDER_API_URL` | Base endpoint URL for registrar operations. | Valid HTTPS URL | `https://api.openprovider.eu` | No | No |
| `OPENPROVIDER_IS_TEST` | Flag to route operations to Openprovider Sandbox instead. | `true`, `false` | `false` | No | No |
| `OPENPROVIDER_TIMEOUT_MS`| Timeout limit for domain availability checks. | Positive integer | `10000` | No | No |

#### 2.1.6 Payment Gateways & Merchant Credentials

##### bKash checkout parameters:
| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `BKASH_API_URL` | Base API target for bKash checkout transactions. | Valid HTTPS URL | Sandbox URL | Yes | No |
| `BKASH_APP_KEY` | Public credential identifying the ITBengal client application. | String | None | Yes | **Yes** |
| `BKASH_APP_SECRET` | Secret token verifying ITBengal client app registration. | String | None | Yes | **Yes** |
| `BKASH_USERNAME` | Merchant API username assigned by bKash. | String | None | Yes | **Yes** |
| `BKASH_PASSWORD` | Merchant API password assigned by bKash. | String | None | Yes | **Yes** |
| `BKASH_CALLBACK_URL` | Redirection webhook endpoint for completed bKash payments. | Valid HTTPS URL | None | Yes | No |

##### Nagad credentials:
| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `NAGAD_API_URL` | Base API target for Nagad transaction validation. | Valid HTTPS URL | Sandbox URL | Yes | No |
| `NAGAD_MERCHANT_ID` | Unique merchant account identifier issued by Nagad. | String | None | Yes | **Yes** |
| `NAGAD_MERCHANT_PRIVATE_KEY` | Absolute path to the PEM private key for signing requests. | Path string | None | Yes | **Yes** |
| `NAGAD_PUBLIC_KEY` | Absolute path to the Nagad public certificate for verification. | Path string | None | Yes | **Yes** |
| `NAGAD_CALLBACK_URL` | Callback webhook target validation URL. | Valid HTTPS URL | None | Yes | No |

##### Rocket parameters:
| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `ROCKET_API_URL` | Base API endpoint for DBBL Rocket merchant accounts. | Valid HTTPS URL | None | Yes | No |
| `ROCKET_MERCHANT_ID` | Merchant account number assigned by DBBL. | String | None | Yes | **Yes** |
| `ROCKET_SECRET_KEY` | Private cryptographic hash key for verifying transaction IDs. | String | None | Yes | **Yes** |
| `ROCKET_CALLBACK_URL` | Redirection destination for completed checkout flows. | Valid HTTPS URL | None | Yes | No |

##### Stripe merchant keys:
| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `STRIPE_PUBLISHABLE_KEY` | Public client token for Stripe Elements payment layouts. | `pk_live_...` or `pk_test_...`| None | Yes | No |
| `STRIPE_SECRET_KEY` | Private merchant key used to execute charges via Stripe API. | `sk_live_...` or `sk_test_...`| None | Yes | **Yes** |
| `STRIPE_WEBHOOK_SECRET` | Secret token used to verify Stripe webhook signatures. | `whsec_...` | None | Yes | **Yes** |
| `STRIPE_CURRENCY` | Default currency setting passed to payment objects. | `bdt`, `usd`, `eur` | `bdt` | No | No |

##### PayPal parameters:
| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `PAYPAL_CLIENT_ID` | Public identifier for the ITBengal business app account. | String | None | Yes | No |
| `PAYPAL_CLIENT_SECRET` | Secret token for PayPal authentication processes. | String | None | Yes | **Yes** |
| `PAYPAL_MODE` | Runtime environment target switch for PayPal transactions. | `sandbox`, `live` | `sandbox` | No | No |
| `PAYPAL_WEBHOOK_ID` | ID for validating webhook events sent by PayPal. | String | None | Yes | **Yes** |

#### 2.1.7 SMTP Transactional Mail Configuration

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `SMTP_HOST` | Hostname of the mail server (e.g. Mailgun, SendGrid, local postfix).| Hostname or IP | None | Yes | No |
| `SMTP_PORT` | Port number to establish connection to the SMTP server. | `25`, `465`, `587` | `587` | Yes | No |
| `SMTP_USER` | Authenticated email address/username. | String | None | Yes | **Yes** |
| `SMTP_PASS` | Authenticated account password. | String | None | Yes | **Yes** |
| `SMTP_SECURE` | Enables strict SSL/TLS handshake. If false, uses STARTTLS. | `true`, `false` | `false` | No | No |
| `SMTP_FROM_EMAIL` | Sender address visible on transactional emails. | Valid email address | `noreply@itbengal.com` | Yes | No |
| `SMTP_FROM_NAME` | Sender display name visible on system notifications. | String | `ITBengal Hosting` | No | No |

#### 2.1.8 Static and Object Storage Settings

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `STORAGE_PROVIDER` | Backend engine used to store platform images and logs. | `local`, `s3` | `local` | Yes | No |
| `STORAGE_LOCAL_PATH` | Host system folder destination if local storage provider is used.| Absolute file path | `/var/lib/itbengal/storage` | No | No |
| `S3_ENDPOINT` | API endpoint for S3-compatible object storage. | Valid HTTPS URL | None | No | No |
| `S3_BUCKET` | Target bucket destination for asset backups and logs. | String | None | No | No |
| `S3_ACCESS_KEY` | Authentication access key identifier for S3 API. | String | None | No | **Yes** |
| `S3_SECRET_KEY` | Authentication secret key signature for S3 API. | String | None | No | **Yes** |
| `S3_REGION` | Target physical location region key. | AWS/S3 compatible region | `us-east-1` | No | No |

---

### 2.2 Next.js Customer Dashboard (`apps/dashboard`)

The customer-facing application is built on Next.js. Values prefixed with `NEXT_PUBLIC_` are read during build time and embedded directly into client-side JS bundles. Non-prefixed values are available only to server-side rendering API calls.

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `PORT` | Local TCP port the Next.js production server listens on. | `1` to `65535` | `3000` | No | No |
| `NODE_ENV` | Sets runtime context. In production, optimizes component tree. | `development`, `production` | `development` | Yes | No |
| `NEXT_PUBLIC_API_URL` | Public endpoint client-side scripts query for REST API calls. | Valid HTTPS URL | `http://localhost:5000/api/v1` | Yes | No |
| `NEXT_PUBLIC_WS_URL` | WebSocket host gateway used to stream build logs. | `ws://` or `wss://` URL | `ws://localhost:5000` | Yes | No |
| `NEXT_PUBLIC_APP_NAME` | Portal title brand text displayed in the header. | String | `ITBengal` | No | No |
| `NEXTAUTH_SECRET` | Cryptographic secret used to encrypt NextAuth session cookies. | Strong string (min 32 chars) | None | Yes | **Yes** |
| `NEXTAUTH_URL` | The absolute base URL of the customer dashboard portal. | Valid HTTP/HTTPS URL | `http://localhost:3000` | Yes | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side public integration key. | `pk_live_...` or `pk_test_...`| None | Yes | No |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Display target for client-side help links. | Valid email | `support@itbengal.com` | No | No |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Toggles dashboard visitor tracking scripts on the client. | `true`, `false` | `false` | No | No |

---

### 2.3 Next.js Administrative Portal (`apps/admin`)

The admin portal provides cluster health views, billing controls, and manual override switches. It utilizes build-time settings similar to the customer dashboard.

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `PORT` | Local port the administrative Next.js server binds to. | `1` to `65535` | `3001` | No | No |
| `NODE_ENV` | Running node environment setting. | `development`, `production` | `development` | Yes | No |
| `NEXT_PUBLIC_API_URL` | Admin client-side target URL for platform API requests. | Valid HTTPS URL | `http://localhost:5000/api/v1` | Yes | No |
| `NEXT_PUBLIC_WS_URL` | WebSocket gateway for system analytics. | `ws://` or `wss://` URL | `ws://localhost:5000` | Yes | No |
| `NEXT_PUBLIC_APP_NAME` | Brand text used in the admin interface layout. | String | `ITBengal Admin` | No | No |
| `NEXTAUTH_SECRET` | Cryptographic key used to encrypt NextAuth session cookies. | Strong string (min 32 chars) | None | Yes | **Yes** |
| `NEXTAUTH_URL` | The absolute canonical base URL of the administrative portal. | Valid HTTP/HTTPS URL | `http://localhost:3001` | Yes | No |
| `NEXT_PUBLIC_ADMIN_ROLE_NAME` | Validation constraint confirming internal role hierarchy. | String | `SuperAdmin` | No | No |

---

### 2.4 React Deployment Agent (`services/deployment-engine`)

The deployment engine runs as an agent on React hosting nodes. It pulls tasks from the BullMQ queue, clones source repositories, executes Docker builds, and configures Traefik router targets.

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `NODE_ENV` | Node execution environment mapping. | `development`, `production` | `production` | Yes | No |
| `PORT` | Internal server port for health check responses. | `1` to `65535` | `6001` | No | No |
| `API_URL` | Master Platform API location for build status updates. | Valid HTTPS URL | None | Yes | No |
| `API_SECRET` | Shared secret key for authenticating node status updates. | String | None | Yes | **Yes** |
| `DOCKER_SOCKET` | Local unix socket path used to control Docker daemon. | Path string | `/var/run/docker.sock`| Yes | No |
| `DOCKER_HOST` | Optional TCP address to access Docker daemon remotely. | `tcp://[host]:[port]` | None | No | No |
| `BUILD_TIMEOUT_MIN` | Time limit for repository clone and container compilation. | Positive integer | `10` | No | No |
| `MAX_CONCURRENT_BUILDS` | Maximum parallel container builds allowed on this node. | Positive integer | `4` | No | No |
| `WORKSPACE_DIR` | Absolute target folder used to store temporary repositories. | Absolute directory path | `/var/lib/itbengal/workspace` | Yes | No |
| `REGISTRY_HOST` | Local Docker registry address to push built images to. | Hostname or IP | `registry.itbengal.internal` | Yes | No |
| `REGISTRY_USER` | Authenticated username for the local Docker registry. | String | None | Yes | **Yes** |
| `REGISTRY_PASSWORD` | Authenticated password for the local Docker registry. | String | None | Yes | **Yes** |
| `CLEANUP_INTERVAL_MIN` | Time interval for image/volume garbage collection routines. | Positive integer | `60` | No | No |
| `PRUNE_IMAGES_DAYS` | Age threshold for deleting old untagged container builds. | Positive integer | `7` | No | No |

---

### 2.5 Managed WordPress Node Agent (`services/wordpress-manager`)

The WordPress agent runs on WordPress node servers. It manages MariaDB instances, deploys core files, runs backups, and executes local malware scans.

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `NODE_ENV` | Node runtime environment context. | `development`, `production` | `production` | Yes | No |
| `PORT` | Local health check listener port. | `1` to `65535` | `6002` | No | No |
| `API_URL` | Platform API callback URL for status reports. | Valid HTTPS URL | None | Yes | No |
| `API_SECRET` | Shared secret token to verify payload sources. | String | None | Yes | **Yes** |
| `WP_CORE_PATH` | File path containing cached WordPress core installations. | Absolute directory path | `/var/lib/itbengal/wordpress/core` | Yes | No |
| `WP_BACKUP_PATH` | File path containing backup tarball archives. | Absolute directory path | `/var/lib/itbengal/wordpress/backups` | Yes | No |
| `MARIADB_HOST` | Host IP address of the node database engine instance. | Hostname or IP | `localhost` | Yes | No |
| `MARIADB_PORT` | Port number of the node database engine. | `1` to `65535` | `3306` | No | No |
| `MARIADB_ROOT_PASSWORD`| Admin password used to create custom client database users. | String | None | Yes | **Yes** |
| `PHPMYADMIN_PORT` | Web access port routing to phpMyAdmin panel (if run). | `1` to `65535` | `8080` | No | No |
| `PHP_VERSION_DEFAULT` | System default version used when creating new WP instances. | `8.0`, `8.1`, `8.2`, `8.3` | `8.2` | No | No |
| `WP_CLI_PATH` | Location of the executable `wp` binary. | Absolute file path | `/usr/local/bin/wp` | Yes | No |
| `MALWARE_SCAN_PATH` | Local system scanning binary path (ClamAV target). | Absolute file path | `/usr/bin/clamscan` | Yes | No |
| `STAGING_SUBNET` | IP subnet block isolated for local staging hosts. | Valid CIDR subnet block | `10.200.0.0/16` | Yes | No |

---

### 2.6 System Infrastructure Configurations

These variables configure edge routers, reverse proxies, SSL certificate resolvers, and monitoring scrapers.

#### 2.6.1 Traefik Reverse Proxy & Edge Router Settings

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `TRAEFIK_DASHBOARD_USER` | Authenticated username for Traefik dashboard. | String | `admin` | Yes | No |
| `TRAEFIK_DASHBOARD_PASSWORD_HASH` | Hashed password (htpasswd format, double-dollar signs must be escaped as `$$`). | Strong hash string | None | Yes | **Yes** |
| `TRAEFIK_API_BASIC_AUTH` | Full basic auth string configuration for routing APIs. | `user:hash` string format | None | Yes | **Yes** |

#### 2.6.2 Let's Encrypt SSL Certificates ACME Resolver

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `LETSENCRYPT_EMAIL` | Registration email for SSL renewal notifications. | Valid email address | `ssl@itbengal.com` | Yes | No |
| `LETSENCRYPT_RESOLVER_NAME` | ACME resolver name config in Traefik. | String | `http-resolver` | No | No |
| `LETSENCRYPT_STAGING` | Enables Let's Encrypt staging servers to avoid rate limits. | `true`, `false` | `false` | No | No |

#### 2.6.3 Prometheus, Grafana, Loki Monitoring Credentials

| Variable Name | Description & Operational Impact | Allowed Values | Default | Required | Sensitive |
|---|---|---|---|:---:|:---:|
| `PROMETHEUS_USER` | Basic Auth user name required for metric targets. | String | `metrics_scraper` | Yes | No |
| `PROMETHEUS_PASSWORD_HASH` | Hashed password used to protect Prometheus metrics endpoints. | String | None | Yes | **Yes** |
| `GRAFANA_ADMIN_USER` | Admin username for the Grafana visualization dashboard. | String | `admin` | Yes | No |
| `GRAFANA_ADMIN_PASSWORD` | Admin password for the Grafana visualization dashboard. | String | None | Yes | **Yes** |
| `LOKI_USER` | Basic Auth user name required for Loki log ingestion. | String | `loki_admin` | Yes | No |
| `LOKI_PASSWORD` | Basic Auth password required for Loki log ingestion. | String | None | Yes | **Yes** |

---

## 3. Production .env.example Templates

The following templates represent complete, production-grade configurations for all ITBengal services. They contain realistic mock values and structural comments to ensure zero ambiguity during deployment.

### 3.1 Platform Core API (`apps/api`)

Save this template to [`apps/api/.env.example`](file:///e:/itbengal/apps/api/.env.example):

```ini
# ==============================================================================
# ITBENGAL SYSTEM CONFIGURATIONS
# ==============================================================================
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1
CORS_ORIGINS=https://dashboard.itbengal.com,https://admin.itbengal.com
LOG_LEVEL=info
TRUST_PROXY=true
SHUTDOWN_TIMEOUT_MS=15000

# ==============================================================================
# PRIMARY DATABASE BINDINGS
# ==============================================================================
DATABASE_URL=postgresql://itbengal_db_user:U8r9Xw#qZa@db-primary.itbengal.internal:5432/itbengal_prod?sslmode=require
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=30
DATABASE_TIMEOUT_MS=20000
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# ==============================================================================
# CACHE AND QUEUE (REDIS & BULLMQ)
# ==============================================================================
REDIS_URL=redis://:w2e8Y!q@redis-master.itbengal.internal:6379/0
REDIS_PASSWORD=w2e8Y!q
REDIS_HOST=redis-master.itbengal.internal
REDIS_PORT=6379
REDIS_DB=0
BULLMQ_CONCURRENCY=10
BULLMQ_REMOVE_ON_COMPLETE=true
BULLMQ_REMOVE_ON_FAIL=false

# ==============================================================================
# SYSTEM JWT SIGNING SECRETS
# ==============================================================================
JWT_SECRET=8e2b8612cae0172e2930a2f7c082728f117c49bc802fcfb6ab2d38ff120dbef8
JWT_REFRESH_SECRET=b63c7849e7b29a28c30f4e41258d4a938cde48fb901e82ef478cf39db92d2fb4
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=https://api.itbengal.com
JWT_AUDIENCE=https://dashboard.itbengal.com

# ==============================================================================
# SYSTEM DATA ENCRYPTION KEYS
# ==============================================================================
# Master encryption key (32 bytes hex) used to encrypt customer environment variables at rest.
ENCRYPTION_KEY=c39ea3027b47b2c01828f73bcf56a73c18274d8fb8cf6efbe32d18471bc39ea3

# ==============================================================================
# OPENPROVIDER API GATEWAY
# ==============================================================================
OPENPROVIDER_USERNAME=itbengal_ops
OPENPROVIDER_PASSWORD=M3x_92_kLw_QoP
OPENPROVIDER_API_URL=https://api.openprovider.eu
OPENPROVIDER_IS_TEST=false
OPENPROVIDER_TIMEOUT_MS=15000

# ==============================================================================
# payment GATEWAY CREDENTIALS (BANGLADESH LOCAL)
# ==============================================================================
# bKash Checkout Credentials
BKASH_API_URL=https://checkout.pay.b2b.bkashkey.com/v1.2.0-beta
BKASH_APP_KEY=bkash_app_key_prod_9028302
BKASH_APP_SECRET=bkash_app_secret_prod_098129038091823908
BKASH_USERNAME=itbengal_bkash_merchant
BKASH_PASSWORD=bkash_password_secure_90182
BKASH_CALLBACK_URL=https://api.itbengal.com/api/v1/billing/callback/bkash

# Nagad Credentials
NAGAD_API_URL=https://api.nagad.org.bd:9001/checkout
NAGAD_MERCHANT_ID=672019283
NAGAD_MERCHANT_PRIVATE_KEY=/etc/itbengal/secrets/keys/nagad_merchant_private.pem
NAGAD_PUBLIC_KEY=/etc/itbengal/secrets/keys/nagad_public_cert.pem
NAGAD_CALLBACK_URL=https://api.itbengal.com/api/v1/billing/callback/nagad

# Rocket Credentials (DBBL)
ROCKET_API_URL=https://payment.dutchbanglabank.com/rocket/api
ROCKET_MERCHANT_ID=908123901
ROCKET_SECRET_KEY=rocket_secret_prod_key_778120
ROCKET_CALLBACK_URL=https://api.itbengal.com/api/v1/billing/callback/rocket

# ==============================================================================
# PAYMENT GATEWAY CREDENTIALS (INTERNATIONAL)
# ==============================================================================
# Stripe Credentials
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_StripeSigningSecretForWebhooks99201
STRIPE_CURRENCY=bdt

# PayPal Credentials
PAYPAL_CLIENT_ID=paypal_client_id_live_80912
PAYPAL_CLIENT_SECRET=paypal_client_secret_live_09182039801239
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=WH-PAYPAL-WEBHOOK-VALIDATION-ID-881920

# ==============================================================================
# SMTP TRANSACTIONAL MAIL
# ==============================================================================
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.itbengal.com
SMTP_PASS=mailgun_prod_password_9920138
SMTP_SECURE=false
SMTP_FROM_EMAIL=billing@itbengal.com
SMTP_FROM_NAME=ITBengal Billing

# ==============================================================================
# PLATFORM STATIC FILE STORAGE
# ==============================================================================
STORAGE_PROVIDER=s3
STORAGE_LOCAL_PATH=/var/lib/itbengal/storage
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_BUCKET=itbengal-platform-assets
S3_ACCESS_KEY=DO00AWSKEY90128
S3_SECRET_KEY=DO00AWSSECRET9012823812903820938
S3_REGION=sgp1
```

### 3.2 Next.js Customer Dashboard (`apps/dashboard`)

Save this template to [`apps/dashboard/.env.example`](file:///e:/itbengal/apps/dashboard/.env.example):

```ini
# ==============================================================================
# RUNTIME AND NODE PARAMETERS
# ==============================================================================
PORT=3000
NODE_ENV=production

# ==============================================================================
# CLIENT-SIDE API GATEWAY PATHS (EXPOSED TO BROWSER)
# ==============================================================================
NEXT_PUBLIC_API_URL=https://api.itbengal.com/api/v1
NEXT_PUBLIC_WS_URL=wss://api.itbengal.com
NEXT_PUBLIC_APP_NAME=ITBengal Hosting

# ==============================================================================
# CUSTOMER AUTHENTICATION (NEXTAUTH CONFIGURATION)
# ==============================================================================
# 32-byte secret used to sign session cookies.
NEXTAUTH_SECRET=f98129038209382093810293810293810293812903820938e3a2c
NEXTAUTH_URL=https://dashboard.itbengal.com

# ==============================================================================
# CLIENT-SIDE THIRD-PARTY CONFIGURATIONS
# ==============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51P8zITBengalPlatformKey
NEXT_PUBLIC_SUPPORT_EMAIL=support@itbengal.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 3.3 Next.js Administrative Portal (`apps/admin`)

Save this template to [`apps/admin/.env.example`](file:///e:/itbengal/apps/admin/.env.example):

```ini
# ==============================================================================
# RUNTIME AND NODE PARAMETERS
# ==============================================================================
PORT=3001
NODE_ENV=production

# ==============================================================================
# CLIENT-SIDE API GATEWAY PATHS (EXPOSED TO BROWSER)
# ==============================================================================
NEXT_PUBLIC_API_URL=https://api.itbengal.com/api/v1
NEXT_PUBLIC_WS_URL=wss://api.itbengal.com
NEXT_PUBLIC_APP_NAME=ITBengal Admin Portal

# ==============================================================================
# ADMIN AUTHENTICATION (NEXTAUTH CONFIGURATION)
# ==============================================================================
# 32-byte secret used to sign admin session cookies.
NEXTAUTH_SECRET=b810293810293812903820938e3a2c8192038102938129038a8
NEXTAUTH_URL=https://admin.itbengal.com

# ==============================================================================
# SYSTEM LEVEL VALIDATIONS
# ==============================================================================
NEXT_PUBLIC_ADMIN_ROLE_NAME=SuperAdmin
```

### 3.4 React Deployment Agent (`services/deployment-engine`)

Save this template to [`services/deployment-engine/.env.example`](file:///e:/itbengal/services/deployment-engine/.env.example):

```ini
# ==============================================================================
# DEPLOYMENT ENGINE AGENT RUNTIME
# ==============================================================================
NODE_ENV=production
PORT=6001

# ==============================================================================
# API BINDINGS (NODE-TO-MASTER AUTHENTICATION)
# ==============================================================================
API_URL=https://api.itbengal.com/api/v1
API_SECRET=node_auth_secret_token_8871239018239082

# ==============================================================================
# RUNTIME VIRTUALIZATION & DOCKER SOCKETS
# ==============================================================================
DOCKER_SOCKET=/var/run/docker.sock
# DOCKER_HOST=tcp://127.0.0.1:2375

# ==============================================================================
# BUILD ISOLATION LIMITERS
# ==============================================================================
BUILD_TIMEOUT_MIN=15
MAX_CONCURRENT_BUILDS=4
WORKSPACE_DIR=/var/lib/itbengal/workspace

# ==============================================================================
# INTERNAL DOCKER REGISTRY
# ==============================================================================
REGISTRY_HOST=registry.itbengal.internal
REGISTRY_USER=react_node_agent_west
REGISTRY_PASSWORD=secure_registry_agent_password_0019

# ==============================================================================
# AUTOMATIC MAINTENANCE CRONS
# ==============================================================================
CLEANUP_INTERVAL_MIN=120
PRUNE_IMAGES_DAYS=3
```

### 3.5 Managed WordPress Node Agent (`services/wordpress-manager`)

Save this template to [`services/wordpress-manager/.env.example`](file:///e:/itbengal/services/wordpress-manager/.env.example):

```ini
# ==============================================================================
# WORDPRESS AGENT RUNTIME
# ==============================================================================
NODE_ENV=production
PORT=6002

# ==============================================================================
# API BINDINGS (NODE-TO-MASTER AUTHENTICATION)
# ==============================================================================
API_URL=https://api.itbengal.com/api/v1
API_SECRET=node_auth_secret_token_wp_901823901823

# ==============================================================================
# SYSTEM WORDPRESS FILE STORAGE PATHS
# ==============================================================================
WP_CORE_PATH=/var/lib/itbengal/wordpress/core
WP_BACKUP_PATH=/var/lib/itbengal/wordpress/backups
WP_CLI_PATH=/usr/local/bin/wp

# ==============================================================================
# LOCAL DATABASE ENGINE CONFIGURATIONS
# ==============================================================================
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_ROOT_PASSWORD=maria_root_password_secure_901823

# ==============================================================================
# UTILITY AND ROUTING PARAMETERS
# ==============================================================================
PHPMYADMIN_PORT=8080
PHP_VERSION_DEFAULT=8.2
MALWARE_SCAN_PATH=/usr/bin/clamscan
STAGING_SUBNET=10.200.0.0/16
```

### 3.6 Traefik Reverse Proxy Configuration (`.env.example`)

Save this template to `infrastructure/traefik/.env`:

```ini
# ==============================================================================
# EDGE ROUTER SYSTEM BINDINGS
# ==============================================================================
LETSENCRYPT_EMAIL=ssl-admin@itbengal.com
LETSENCRYPT_RESOLVER_NAME=http-resolver
LETSENCRYPT_STAGING=false

# ==============================================================================
# TRAEFIK DASHBOARD ACCESS CONTROL
# ==============================================================================
TRAEFIK_DASHBOARD_USER=admin
# Hashed password generated using: echo $(htpasswd -nB admin)
# Note: In docker-compose, dollar signs must be escaped as $$ to prevent env parsing issues.
TRAEFIK_DASHBOARD_PASSWORD_HASH=$$2y$$05$$u9b.ZJv1o2U3o3JtYf2Jheo9L3lJp5J1qQ2p2qZJdJ1V3.lJwOyeC
TRAEFIK_API_BASIC_AUTH=admin:$$2y$$05$$u9b.ZJv1o2U3o3JtYf2Jheo9L3lJp5J1qQ2p2qZJdJ1V3.lJwOyeC
```

### 3.7 Monitoring Stack Configuration (`.env.example`)

Save this template to `infrastructure/monitoring/.env`:

```ini
# ==============================================================================
# PROMETHEUS METRIC SCRAPER BINDINGS
# ==============================================================================
PROMETHEUS_USER=metrics_scraper
# Hashed password protecting endpoint: basic auth enabled.
PROMETHEUS_PASSWORD_HASH=$$2y$$05$$e3q98d931h409v1204d8h102v389u4798u19082v10389v
# ==============================================================================
# GRAFANA VISUALIZATION CONTROLLER
# ==============================================================================
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=grafana_secure_admin_password_901823

# ==============================================================================
# LOKI LOG INGESTION INTERFACE
# ==============================================================================
LOKI_USER=loki_admin
LOKI_PASSWORD=loki_secure_password_887123
```

---

## 4. Secrets Management & Encryption Architecture

### 4.1 Customer Environment Variables Database Security
Customer environment variables—which include database URLs, application keys, external integration tokens, and service credentials—are stored in the `environment_variables` table, as specified in [`documents/09-database-design.md`](file:///e:/itbengal/documents/09-database-design.md#L910-L931). 

To prevent unauthorized access in the event of database leaks or SQL injection compromises, these values are **never stored in plaintext**. Instead, they are encrypted before writing to disk and decrypted only in memory within the Platform Core API before injection into deployment tasks.

### 4.2 Cryptographic Key Derivation Flow (AES-256-GCM + HKDF)
ITBengal implements **AES-256-GCM** (Galois/Counter Mode) encryption. This provides both data confidentiality and authenticity verification. 

#### Multi-Tenant Key Derivation
To prevent a compromised key from exposing variables across other users, keys are isolated per organization. 
1. **Master Encryption Key**: The master key (`ENCRYPTION_KEY`) is stored securely on the API server file system (`/etc/itbengal/secrets/env-encryption-key`) with `0600` permissions.
2. **Organization Salt**: Each organization record in the database contains a unique, random 32-byte hexadecimal string (`org_salt`).
3. **Derived Key**: When encrypting or decrypting variables for a project, the system derives an organization-specific key using the HMAC-based Key Derivation Function (**HKDF-SHA256**), combining the master key, organization salt, and a unique contextual info label.

#### Cipher Output Formatting
The encrypted string stored in the database's `encrypted_value` field uses a structured string format:
```text
{version}:{iv_base64}:{ciphertext_base64}:{tag_base64}
```
Where:
- `version` represents the encryption version (`v1`), enabling future algorithm migration.
- `iv_base64` is the randomly generated 12-byte initialization vector (IV/nonce), encoded in Base64.
- `ciphertext_base64` is the encrypted payload, encoded in Base64.
- `tag_base64` is the 16-byte GCM authentication tag, ensuring integrity and detecting tampering, encoded in Base64.

### 4.3 Node.js Encryption & Decryption Implementations

The following TypeScript code illustrates the cryptographic implementation utilized by the Platform Core API to secure and retrieve customer environment variables.

```typescript
import crypto from 'crypto';

interface EncryptedPayload {
  version: string;
  iv: string;
  ciphertext: string;
  tag: string;
}

/**
 * Derives a tenant-specific encryption key using HKDF-SHA256.
 * @param masterKey - The system master key (32 bytes Buffer)
 * @param orgId - Unique ID of the target organization
 * @returns 32-byte derived key Buffer
 */
export function deriveOrgKey(masterKey: Buffer, orgId: string): Buffer {
  const info = Buffer.from(`org-env-key-derivation:${orgId}`, 'utf8');
  const salt = Buffer.alloc(0); // HKDF salt is optional but can be set to org_salt
  return crypto.hkdfSync('sha256', masterKey, salt, info, 32);
}

/**
 * Encrypts plaintext using AES-256-GCM with a derived key.
 * @param plaintext - The raw environment variable value
 * @param derivedKey - 32-byte tenant key
 * @returns Serialized format {version}:{iv}:{ciphertext}:{tag}
 */
export function encryptEnvValue(plaintext: string, derivedKey: Buffer): string {
  // GCM standard recommends a 12-byte IV/nonce
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  
  const tag = cipher.getAuthTag().toString('base64');
  const ivBase64 = iv.toString('base64');
  const version = 'v1';
  
  return `${version}:${ivBase64}:${ciphertext}:${tag}`;
}

/**
 * Decrypts a serialized payload using AES-256-GCM with a derived key.
 * @param serializedPayload - The formatted database string
 * @param derivedKey - 32-byte tenant key
 * @returns Original plaintext string
 */
export function decryptEnvValue(serializedPayload: string, derivedKey: Buffer): string {
  const parts = serializedPayload.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid serialized encryption payload structure.');
  }
  
  const [version, ivBase64, ciphertext, tagBase64] = parts;
  if (version !== 'v1') {
    throw new Error(`Unsupported encryption payload version: ${version}`);
  }
  
  const iv = Buffer.from(ivBase64, 'base64');
  const tag = Buffer.from(tagBase64, 'base64');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 4.4 Architectural Sequence Flowchart

The diagram below details the sequence of key derivation, database storage, and secure injection during application execution.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Owner / Admin
    participant API as Platform Core API (apps/api)
    participant DB as PostgreSQL
    participant Worker as React Deployment Agent

    Note over Client, API: Phase A: Saving Variables
    Client->>API: Post variables (e.g. key: "SECRET_TOKEN", value: "secret123")
    Note over API: Load Master Key from /etc/itbengal/secrets/env-encryption-key
    API->>API: deriveOrgKey(MasterKey, orgId)
    API->>API: encryptEnvValue("secret123", DerivedKey)
    API->>DB: INSERT into environment_variables (key, encrypted_value, target)
    DB-->>API: ACK (Saved encrypted)
    API-->>Client: Success (Exposes only key, masked value)

    Note over API, Worker: Phase B: Deploying App Container
    Worker->>API: Fetching active variables for build task (Auth: Node Secret)
    Note over API: Read encrypted values from PostgreSQL
    API->>DB: SELECT key, encrypted_value FROM environment_variables WHERE project_id = id
    DB-->>API: Returns encrypted data rows
    API->>API: deriveOrgKey(MasterKey, orgId)
    API->>API: decryptEnvValue(encrypted_value, DerivedKey)
    API-->>Worker: Sends decrypted key-value pairs (via TLS tunnel)
    Note over Worker: Inject decrypted variables directly into memory<br/>of Docker build process.<br/>Never write variables to agent disk!
```

### 4.5 Secrets in Git, Pre-Commit Hooks & CI/CD Pipelines
ITBengal enforces a strict zero-leak policy to guarantee no secrets enter git repositories.

#### Pre-Commit Security Checks
All developer workspaces are equipped with **Gitleaks** and **TruffleHog** via pre-commit frameworks.
- **Local Pre-commit Hook**: Configured via `.pre-commit-config.yaml`.
- **Automatic Block**: Any attempt to commit `.env` configurations or values matching high-entropy strings (AWS keys, Stripe keys, generic private keys) blocks the commit operation immediately.
- **Shared Repository Scan**: A centralized GitHub Action executes a Gitleaks scan on every pull request. If a secret signature is detected, the run is terminated, and alert logs are sent to the Security operations center.

#### Secrets Management in CI/CD (GitHub Actions / GitLab CI)
- **Zero Local Keys in Files**: All deployment pipelines run without persistent config files inside source trees.
- **Repository Secrets**: Environment configs are mapped inside GitHub/GitLab settings under **Actions Secrets**. These secrets are injected as runtime variables to build agents only during active execution.
- **Environment Protection**: Secrets are grouped under environment barriers (e.g., `production`, `staging`). These groups require manual approval from a Senior DevOps Lead before repository variables are exposed to run processes.

### 4.6 OpenID Connect (OIDC) Federated Identity Exchanges
To prevent the storage of long-lived infrastructure credentials (such as master VPS keys, domain registrar credentials, or backup server storage keys) inside CI/CD settings, ITBengal utilizes **OpenID Connect (OIDC)** federated trust exchanges.

- **Trust Establishment**: The target cloud or physical runner trust authority is configured to accept identity tokens issued by the GitHub Actions / GitLab CI platform.
- **Short-Lived Token Exchange**: When a pipeline runs, the runner requests a temporary, cryptographically signed OIDC token from the git platform.
- **Role Assumption**: The runner presents this token to the ITBengal Platform Identity provider, exchanging it for a temporary, 1-hour access token scoped strictly to the execution task.
- **No Static Keys**: This eliminates static admin credentials, limiting exposure windows to the duration of the deployment run.

---

## 5. Secrets Rotation Procedures & Drills

### 5.1 Rotation Frequency Matrices
To mitigate the impact of unnoticed credential leaks, the platform enforces mandatory rotation schedules.

| Secret Classification | Target Service / Component | Rotation Frequency | Responsible Role | Enforcement mechanism |
|---|---|---|---|---|
| **JWT Access/Refresh Keys** | Platform Core API | Every 90 Days | Security Engineer | Automated via Kubernetes / Vault cron |
| **System Master Key** | Platform Core API (`apps/api`) | Every 180 Days | DevOps Lead / Admin | Manual cluster runbook |
| **Database Passwords** | PostgreSQL Core | Every 90 Days | Database Architect | Automated cluster update |
| **Node Agent Secrets** | React / WP Node Agents | Every 90 Days | DevOps Lead | Master API config update |
| **Let's Encrypt Account**| Edge Traefik Routing | Every 365 Days | DevOps Engineer | Automated ACME configuration renewal |
| **Payment Gateway API Keys**| Payment Integrations | Every 180 Days (or on compromise) | Finance / Security | Provider dashboard + System environment update |
| **Registrar Credentials** | Openprovider Integration | Every 180 Days | Security Engineer | Registrar dashboard + System environment update |
| **SMTP Mail Passwords** | Core Mailing | Every 180 Days | System Operator | Mail provider dashboard + Env update |
| **Backup Storage Keys** | Object Storage Space | Every 180 Days | DevOps Engineer | S3 Provider + Cron job credentials rotation |

---

### 5.2 Phase-by-Phase Rotation Execution Playbook

This runbook outlines the steps for a zero-downtime rotation of system secrets, such as changing database passwords or master encryption keys.

#### Phase 1: Key Generation & Staging (Dual-Key Support)
To avoid service interruption during secret changes, services must support both old and new credentials temporarily.

1. **Generate the New Secret**:
   Generate a high-entropy string using the system cryptographically secure random number generator:
   ```bash
   openssl rand -hex 32 > /etc/itbengal/secrets/new_db_password
   chmod 0600 /etc/itbengal/secrets/new_db_password
   ```
2. **Apply Secondary Secret in Target Service**:
   Configure the database server to accept connections using both the old password and the new password. For PostgreSQL, this is achieved by adding a secondary role mapping or maintaining a secondary hash configuration.

#### Phase 2: Configuration Updates
1. **Update API Secrets in Key Vault / System Configuration**:
   Update the secret value in the key manager (e.g., HashiCorp Vault or `/etc/itbengal/secrets/db-password`).
2. **Inject New Environment Variable**:
   Set the system environment variables across the deployment targets to reference the new secret. Ensure that the database connection string uses the new password (`new_db_password`).

#### Phase 3: Rolling Deployments
1. **Trigger Graceful Service Reloads**:
   Execute a rolling restart of all Platform Core API container instances or PM2 processes. This ensures that new instances boot using the new database credentials while old instances drain active requests using the old credentials.
   ```bash
   # If running under Docker Compose orchestration:
   docker compose up --detach --build --no-deps api
   
   # If running under PM2 in VPS environments:
   pm2 trigger itbengal-api reload
   ```
2. **Monitor Startup Health**:
   Verify that booting containers pass Zod environment validation checks and establish DB pools successfully.

#### Phase 4: Verification & Smoke Testing
1. **Execute Integration Diagnostics**:
   Run automated API checks to confirm that user registrations, domain lookups, and transaction updates are processing normally.
2. **Examine Error Rate Logs**:
   Monitor the Grafana dashboards for a spike in database connection errors or authentication failures.
   ```bash
   # Check Loki logs for API authorization failures:
   logcli query '{app="itbengal-api"} |= "auth" |= "error"' --limit 50
   ```

#### Phase 5: Clean Up & Deprecation
1. **Revoke the Old Secret**:
   Once all services are running on the new secret, remove the old password from the database server configuration.
2. **Purge Legacy Environment References**:
   Delete old backups of configuration templates containing old keys and confirm that only the rotated credentials remain active.

---

> **End of Specification**  
> For implementation details, coordinate with the security operations center or reference [`documents/12-security-specification.md`](file:///e:/itbengal/documents/12-security-specification.md).
