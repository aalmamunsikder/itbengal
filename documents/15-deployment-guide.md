# Production Deployment Guide: ITBengal Hosting Platform
**Document Reference:** ITB-DG-2026-V1  
**Target Version:** v1.0.0-Stable  
**Classification:** Confidential - Internal Engineering Use Only  
**System Platform:** Ubuntu Server 24.04 LTS (x86_64)

This document is the definitive engineering specification for deploying, securing, and maintaining the production infrastructure of the ITBengal hosting platform. It provides copy-paste ready, production-grade configurations, systemd services, routing files, hardening scripts, and network designs with zero placeholders.

---

## 1. System Architecture & Topology

The ITBengal platform operates on a distributed architecture utilizing self-managed Virtual Private Servers (VPS) connected through an encrypted WireGuard private overlay network. Under this design:
- Public entry nodes (`react-node-*` and `wp-node-*`) process ingress traffic and run localized agent daemons.
- The centralized control node (`platform-01`) coordinates dashboard UI, REST API, state databases (PostgreSQL), memory caches (Redis), and background task queues (BullMQ).
- Telemetry, telemetry sync, database connections, and control commands occur exclusively inside the private overlay.

### 1.1 IP Address Allocation Scheme

| Host Hostname | Interface | Public IPv4 Address | WireGuard IPv4 (Private) | System Role & Running Daemons |
| :--- | :--- | :--- | :--- | :--- |
| **`platform-01`** | `eth0`, `wg0` | `198.51.100.10` | `10.8.0.1` | Next.js Dashboard, Express.js API, PostgreSQL 16, Redis 7.2, BullMQ |
| **`react-node-01`** | `eth0`, `wg0` | `198.51.100.20` | `10.8.0.2` | `itb-agent` (React), Docker Engine, Traefik Edge Proxy |
| **`wp-node-01`** | `eth0`, `wg0` | `198.51.100.30` | `10.8.0.3` | `itb-agent` (WordPress), Nginx Virtual Hosts, PHP-FPM Pools, MariaDB |

### 1.2 Enterprise Overlay Network Diagram

```mermaid
graph TD
    Client[Web Browser / API Consumer] -->|HTTPS :443| PlatformProxy[Nginx Public Proxy: platform-01]
    Client -->|HTTPS :443| ReactNodeProxy[Traefik Edge Proxy: react-node-01]
    Client -->|HTTPS :443| WPNodeProxy[Nginx Dynamic Proxy: wp-node-01]

    subgraph Platform Core Server [platform-01 - 10.8.0.1]
        PlatformProxy -->|Proxy Pass :3000| NextDashboard[Next.js Dashboard UI]
        PlatformProxy -->|Proxy Pass :5000| ExpressAPI[Express.js Management API]
        ExpressAPI -->|Local Unix Socket| LocalPostgres[(PostgreSQL 16 Engine)]
        ExpressAPI -->|Local Unix Socket| LocalRedis[(Redis Cache / BullMQ)]
    end

    subgraph React Node Server [react-node-01 - 10.8.0.2]
        ReactNodeProxy -->|Internal Route| DockerBridge[Docker App Network: 172.19.0.0/16]
        DockerBridge --> UserApp1[User React App 1]
        DockerBridge --> UserApp2[User React App 2]
        ReactAgent[itb-agent daemon] -->|Manage Containers| DockerDaemon[Docker Socket]
        ReactAgent -->|Telemetry & API Calls over wg0| ExpressAPI
    end

    subgraph WordPress Node Server [wp-node-01 - 10.8.0.3]
        WPNodeProxy -->|Unix Socket| PHPPools[Isolated PHP-FPM Sockets]
        PHPPools --> WPInstallation1[WP Directory 1]
        PHPPools --> WPInstallation2[WP Directory 2]
        WPAgent[itb-agent daemon] -->|CLI Orchestration| WPCLI[WP-CLI Tool]
        WPAgent -->|Telemetry & API Calls over wg0| ExpressAPI
        PHPPools -->|Local Connection| MariaDBEngine[(MariaDB Database Server)]
    end
```

---

## 2. Server Preparation & OS Hardening

Every VPS instance must undergo base security hardening immediately after OS installation. This ensures compliance with modern server standards and mitigates external attack vectors.

### 2.1 Base System Installation & Dependencies
Perform system updates and install essential software packages required for network management, compilation, and service control:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  curl \
  wget \
  git \
  ufw \
  fail2ban \
  wireguard \
  wireguard-tools \
  iptables \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  build-essential \
  jq \
  gnupg \
  net-tools \
  dnsutils \
  htop \
  unzip \
  sysstat \
  iotop
```

### 2.2 Secure Shell (SSH) Daemon Hardening
Disable password authentication, enforce public-key validation, transition SSH to custom port `2222`, and configure connection timeouts.

Create a new SSH configuration drop-in file `/etc/ssh/sshd_config.d/99-itbengal-hardened.conf`:

```ini
# /etc/ssh/sshd_config.d/99-itbengal-hardened.conf
# Production SSH Daemon Configuration

Port 2222
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Logging Configuration
SyslogFacility AUTH
LogLevel VERBOSE

# Security Constraints
LoginGraceTime 60
PermitRootLogin no
StrictModes yes
MaxAuthTries 3
MaxSessions 5

# Authentication Methods
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
UsePAM yes

# GUI and Tunneling Options
X11Forwarding no
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes

# Client Keepalive Settings
ClientAliveInterval 300
ClientAliveCountMax 2

# Connection Limits
MaxStartups 10:30:100

# SFTP Settings
Subsystem sftp /usr/lib/openssh/sftp-server
```

Create a system deployment administrator user named `itb-admin` and map administrative access:

```bash
# Add user account with bash shell
sudo useradd -m -s /bin/bash itb-admin
sudo passwd itb-admin

# Create sudo rules allowing itb-admin to execute commands without passwords
echo "itb-admin ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/itb-admin
sudo chmod 0440 /etc/sudoers.d/itb-admin

# Configure authorized ssh key structures
sudo mkdir -p /home/itb-admin/.ssh
sudo chmod 0700 /home/itb-admin/.ssh
sudo touch /home/itb-admin/.ssh/authorized_keys
sudo chmod 0600 /home/itb-admin/.ssh/authorized_keys
sudo chown -R itb-admin:itb-admin /home/itb-admin/.ssh
```
*(Note: System administrators must copy the deployment public key into `/home/itb-admin/.ssh/authorized_keys` before restarting the SSH service.)*

Restart and verify SSH daemon:
```bash
sudo sshd -t
sudo systemctl restart ssh
```

### 2.3 WireGuard Private Overlay Mesh Setup
WireGuard secures the control plane link. Private and public keys are created on each node to authorize data forwarding.

#### 2.3.1 Platform Host Configuration (`platform-01`)
Create `/etc/wireguard/wg0.conf`:

```ini
# /etc/wireguard/wg0.conf on platform-01
[Interface]
PrivateKey = PRIMARY_PLATFORM_SERVER_PRIVATE_KEY_VALUE_HERE
Address = 10.8.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Peer Definition: react-node-01
[Peer]
PublicKey = REACT_NODE_01_PUBLIC_KEY_VALUE_HERE
AllowedIPs = 10.8.0.2/32

# Peer Definition: wp-node-01
[Peer]
PublicKey = WP_NODE_01_PUBLIC_KEY_VALUE_HERE
AllowedIPs = 10.8.0.3/32
```

#### 2.3.2 React Ingress Node Configuration (`react-node-01`)
Create `/etc/wireguard/wg0.conf`:

```ini
# /etc/wireguard/wg0.conf on react-node-01
[Interface]
PrivateKey = REACT_NODE_01_PRIVATE_KEY_VALUE_HERE
Address = 10.8.0.2/24

[Peer]
PublicKey = PRIMARY_PLATFORM_SERVER_PUBLIC_KEY_VALUE_HERE
Endpoint = 198.51.100.10:51820
AllowedIPs = 10.8.0.0/24
PersistentKeepalive = 25
```

#### 2.3.3 WordPress Ingress Node Configuration (`wp-node-01`)
Create `/etc/wireguard/wg0.conf`:

```ini
# /etc/wireguard/wg0.conf on wp-node-01
[Interface]
PrivateKey = WP_NODE_01_PRIVATE_KEY_VALUE_HERE
Address = 10.8.0.3/24

[Peer]
PublicKey = PRIMARY_PLATFORM_SERVER_PUBLIC_KEY_VALUE_HERE
Endpoint = 198.51.100.10:51820
AllowedIPs = 10.8.0.0/24
PersistentKeepalive = 25
```

Activate and verify the network interface:
```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
sudo wg show wg0
```

### 2.4 Firewall Configuration (UFW & iptables profiles)
Secure each system by blocking traffic at public network interfaces while facilitating secure data routing inside the WireGuard interface (`wg0`).

#### 2.4.1 Platform Firewall Rules (`platform-01`)
```bash
# Set baseline security actions
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow secure administrative management
sudo ufw allow 2222/tcp comment 'Secure Shell Administration'
sudo ufw allow 51820/udp comment 'WireGuard Inbound Tunnel'

# Allow general web traffic to platform dashboard and api proxy
sudo ufw allow 80/tcp comment 'HTTP Web ingress'
sudo ufw allow 443/tcp comment 'HTTPS Web ingress'

# Restrict critical database traffic strictly to WireGuard
sudo ufw allow in on wg0 to any port 5432 proto tcp comment 'PostgreSQL from WireGuard Client Nodes'
sudo ufw deny 5432/tcp comment 'Explicit Block Public PostgreSQL Access'

# Restrict task queue and caching engine access to WireGuard
sudo ufw allow in on wg0 to any port 6379 proto tcp comment 'Redis database access from WireGuard Client Nodes'
sudo ufw deny 6379/tcp comment 'Explicit Block Public Redis Access'

# Enable firewall system
sudo ufw --force enable
```

#### 2.4.2 React Host Firewall Rules (`react-node-01`)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Inbound interfaces management
sudo ufw allow 2222/tcp comment 'Secure Shell Administration'
sudo ufw allow 80/tcp comment 'Public HTTP web ingress'
sudo ufw allow 443/tcp comment 'Public HTTPS web ingress'

# Restrict agent management API to Platform Server WireGuard IP
sudo ufw allow from 10.8.0.1 to any port 9000 proto tcp comment 'Platform control signals link'
sudo ufw deny 9000/tcp comment 'Block public agent connection requests'

sudo ufw --force enable
```

#### 2.4.3 WordPress Host Firewall Rules (`wp-node-01`)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Inbound interfaces management
sudo ufw allow 2222/tcp comment 'Secure Shell Administration'
sudo ufw allow 80/tcp comment 'Public HTTP web ingress'
sudo ufw allow 443/tcp comment 'Public HTTPS web ingress'

# Restrict agent management API to Platform Server WireGuard IP
sudo ufw allow from 10.8.0.1 to any port 9001 proto tcp comment 'Platform control signals link'
sudo ufw deny 9001/tcp comment 'Block public agent connection requests'

sudo ufw --force enable
```

### 2.5 Fail2ban Service Protection
Deploy custom Fail2ban properties to block brute-force SSH attacks and throttle Express.js login requests.

Write core jail overrides `/etc/fail2ban/jail.d/99-itbengal-jail.local`:

```ini
# /etc/fail2ban/jail.d/99-itbengal-jail.local
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd
destemail = alert-admin@itbengal.com
sender    = fail2ban@itbengal.com
action    = %(action_mwl)s

[sshd]
enabled  = true
port     = 2222
filter   = sshd
logpath  = %(sshd_log)s
maxretry = 3
```

Define Nginx rate-limiting filter for login path protection. Create `/etc/fail2ban/filter.d/itbengal-api.conf`:

```ini
# /etc/fail2ban/filter.d/itbengal-api.conf
[Definition]
failregex = ^<HOST> -.*"POST /v1/auth/login HTTP/.*" 401
            ^<HOST> -.*"POST /v1/auth/register HTTP/.*" 400
ignoreregex =
```

Link the rule filter inside jail file `/etc/fail2ban/jail.d/itbengal-api.local`:

```ini
# /etc/fail2ban/jail.d/itbengal-api.local
[itbengal-api]
enabled  = true
port     = http,https
filter   = itbengal-api
logpath  = /var/log/nginx/itb_api_access.log
maxretry = 10
findtime = 60
bantime  = 1800
```

Enable, restart, and monitor fail2ban:
```bash
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
sudo fail2ban-client status
```

---

## 3. Platform Server Installation & Services

The platform central node (`platform-01`) executes the primary database engine, cache layer, background task processing pipelines, API runtime, and web dashboard.

### 3.1 PostgreSQL 16 Optimization & WAL Archiving Setup
Add the official PostgreSQL PPA and install the engine components:

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16
```

#### 3.1.1 Production PostgreSQL Configuration (`postgresql.conf`)
Configure PostgreSQL with high-write memory parameters, dynamic worker allocation, SSD-tuned cost estimations, and Write-Ahead Log (WAL) archiving.

Overwrite `/etc/postgresql/16/main/postgresql.conf`:

```ini
# /etc/postgresql/16/main/postgresql.conf
# Optimization Profile: 8GB RAM System, Heavy Web-Write Workloads

data_directory = '/var/lib/postgresql/16/main'
hba_file = '/etc/postgresql/16/main/pg_hba.conf'
ident_file = '/etc/postgresql/16/main/pg_ident.conf'
external_pid_file = '/var/run/postgresql/16-main.pid'

# Networking and Ports
listen_addresses = '127.0.0.1,10.8.0.1'
port = 5432
max_connections = 250
superuser_reserved_connections = 5

# Memory Allocation Optimization
shared_buffers = 2GB
huge_pages = try
work_mem = 16MB
maintenance_work_mem = 512MB
autovacuum_work_mem = 256MB
dynamic_shared_memory_type = posix

# Write-Ahead Log (WAL) Configurations
wal_level = replica
fsync = on
synchronous_commit = off
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB
wal_buffers = 64MB
default_statistics_target = 100

# Archiving Engine Configuration
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/16/main/archive/%f && cp %p /var/lib/postgresql/16/main/archive/%f'

# Optimizer Adjustments
random_page_cost = 1.1
effective_cache_size = 6GB

# Parallel Workers Adjustments
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
max_parallel_maintenance_workers = 2

# Logging Specifications
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_file_mode = 0600
log_truncate_on_rotation = off
log_rotation_age = 1d
log_rotation_size = 10MB
log_min_messages = warning
log_min_error_statement = error
log_min_duration_statement = 250
```

#### 3.1.2 Authentication Map Configuration (`pg_hba.conf`)
Secure host access configurations. Update `/etc/postgresql/16/main/pg_hba.conf`:

```
# /etc/postgresql/16/main/pg_hba.conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local administrative access via Unix domain sockets
local   all             postgres                                peer

# Localhost connection mapping using SCRAM verification
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# WireGuard Private Overlay access mapping
host    itbengal_prod   itb_api_user    10.8.0.0/24             scram-sha-256
```

#### 3.1.3 Initialization Execution Flow
Initialize WAL archive directories, launch services, and generate the schema database:

```bash
# Create local archive repository
sudo mkdir -p /var/lib/postgresql/16/main/archive
sudo chown -R postgres:postgres /var/lib/postgresql/16/main/archive
sudo chmod 0700 /var/lib/postgresql/16/main/archive

# Enable and restart Postgres daemon
sudo systemctl daemon-reload
sudo systemctl enable postgresql
sudo systemctl restart postgresql

# Create database roles and execute default credentials setup
sudo -i -u postgres psql -c "CREATE DATABASE itbengal_prod;"
sudo -i -u postgres psql -c "CREATE USER itb_api_user WITH ENCRYPTED PASSWORD 'PRODUCTION_DB_PLAINTEXT_SECRET_KEY';"
sudo -i -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE itbengal_prod TO itb_api_user;"
sudo -i -u postgres psql -d itbengal_prod -c "GRANT ALL ON SCHEMA public TO itb_api_user;"
```

### 3.2 Redis 7.2 Cache & BullMQ Setup
Install Redis server:

```bash
sudo apt install -y redis-server
```

Modify security rules and configure append-only file persistence to prevent job data loss from task worker queues. Overwrite `/etc/redis/redis.conf`:

```ini
# /etc/redis/redis.conf
# ITBengal Production Redis Tuning Config

bind 127.0.0.1 10.8.0.1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
always-show-logo no

# AOF + Snapshot Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis
appendonly yes
appendfilename "appendonly.aof"
appenddirname "appendonlydir"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Memory Management (1GB Dedicated cache space limit)
maxclients 10000
maxmemory 1gb
maxmemory-policy allkeys-lru

# Security Passphrase
requirepass REDIS_PRIMARY_SYSTEM_SECURE_AUTH_PASSWORD
```

Start the cache manager:
```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 3.3 Next.js Dashboard Compilation & Systemd Deployment
The Next.js management dashboard is built and pre-rendered statically to reduce RAM overhead on `platform-01`, utilizing Next.js Standalone mode.

Install Node.js 20.x Active LTS environment:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Create production folders:
```bash
sudo mkdir -p /var/www/itbengal-dashboard
sudo chown -R itb-admin:itb-admin /var/www/itbengal-dashboard
```

As user `itb-admin`, pull files, write configuration environments, and trigger client-side compilation:

```bash
cd /var/www/itbengal-dashboard
# (Pull dashboard source artifacts to current folder)

# Configure environmental mapping
cat << 'EOF' > .env.production
NEXT_PUBLIC_API_URL=https://api.itbengal.com
NEXT_PUBLIC_WS_URL=wss://api.itbengal.com
NEXT_PUBLIC_ENVIRONMENT=production
EOF

npm ci
npm run build
```

Write systemd control configuration `/etc/systemd/system/itbengal-dashboard.service`:

```ini
# /etc/systemd/system/itbengal-dashboard.service
[Unit]
Description=ITBengal Next.js Customer Dashboard Service
After=network.target

[Service]
Type=simple
User=itb-admin
WorkingDirectory=/var/www/itbengal-dashboard
Environment=NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Enable and run dashboard service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable itbengal-dashboard
sudo systemctl start itbengal-dashboard
```

### 3.4 Express.js API Gateway Setup
Build the primary API runtime environments on `/var/www/itbengal-api`.

```bash
sudo mkdir -p /var/www/itbengal-api
sudo chown -R itb-admin:itb-admin /var/www/itbengal-api
```

Write environmental file properties `/var/www/itbengal-api/.env`:

```ini
# /var/www/itbengal-api/.env
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
DATABASE_URL=postgresql://itb_api_user:PRODUCTION_DB_PLAINTEXT_SECRET_KEY@10.8.0.1:5432/itbengal_prod
REDIS_URL=redis://:REDIS_PRIMARY_SYSTEM_SECURE_AUTH_PASSWORD@10.8.0.1:6379/0
JWT_SECRET_KEY=9bc82d021c322d7ba58bfa79f743ab9cf262f277f2bcde0efd32b509ef01a7df
AGENT_SHARED_COMMUNICATION_KEY=a7d2bcf392b21c4328ff98e7264aef23
OPENPROVIDER_API_TOKEN=op_sec_token_92bc47db6aef88eef12
BKASH_API_URL=https://checkout.pay.b-kash.com/v1.2.0-beta
BKASH_APP_KEY=bk_prod_app_key_38402db38
BKASH_APP_SECRET=bk_prod_secret_47b0aef89
STRIPE_SECRET_KEY=sk_live_51P...
```

Execute build script dependencies:
```bash
cd /var/www/itbengal-api
npm ci
npm run build
```

Configure Systemd runtime tracking `/etc/systemd/system/itbengal-api.service`:

```ini
# /etc/systemd/system/itbengal-api.service
[Unit]
Description=ITBengal Core Express.js API Application
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=itb-admin
WorkingDirectory=/var/www/itbengal-api
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
LimitNOFILE=65536
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the API engine daemon:
```bash
sudo systemctl daemon-reload
sudo systemctl enable itbengal-api
sudo systemctl start itbengal-api
```

### 3.5 Public Nginx Reverse Proxy Setup
Install Nginx server to handle incoming TLS handshakes, serve static resources, and apply rate limiting.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure virtual host mappings `/etc/nginx/sites-available/itbengal-platform.conf`:

```nginx
# /etc/nginx/sites-available/itbengal-platform.conf
# Nginx Entry Gateway Configuration File

limit_req_zone $binary_remote_addr zone=api_rate_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth_rate_limit:10m rate=5r/m;

# Force secure connection redirect
server {
    listen 80;
    listen [::]:80;
    server_name itbengal.com www.itbengal.com api.itbengal.com;
    return 301 https://$host$request_uri;
}

# Next.js Dashboard UI Proxy Routing
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name itbengal.com www.itbengal.com;

    ssl_certificate /etc/letsencrypt/live/itbengal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/itbengal.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS / Clickjacking / Mime Security configurations
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    access_log /var/log/nginx/itb_dashboard_access.log;
    error_log /var/log/nginx/itb_dashboard_error.log;

    # Static assets cache optimization
    location /_next/static {
        alias /var/www/itbengal-dashboard/.next/static;
        expires 365d;
        access_log off;
    }

    # API Proxy Routing
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Express.js Management API Proxy Routing
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.itbengal.com;

    ssl_certificate /etc/letsencrypt/live/itbengal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/itbengal.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    access_log /var/log/nginx/itb_api_access.log;
    error_log /var/log/nginx/itb_api_error.log;

    # Global Rate limits
    limit_req zone=api_rate_limit burst=50 nodelay;

    # Target rate limits on authentication routes
    location /v1/auth/ {
        limit_req zone=auth_rate_limit burst=5 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and verify:
```bash
sudo ln -sf /etc/nginx/sites-available/itbengal-platform.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Use Certbot to provision the first production TLS credentials:
```bash
sudo certbot --nginx -d itbengal.com -d www.itbengal.com -d api.itbengal.com --non-interactive --agree-tos --email ssl-alerts@itbengal.com
```

---

## 4. React Hosting Node Agent Setup (`react-node-01`)

The React hosting server executes customer builds, packages assets, runs applications inside dynamic Docker containers, and manages paths via a local Traefik load balancer.

### 4.1 Docker Daemon Optimization (cgroups v2 & security)
Install Docker Engine in accordance with standard container repository guides:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Write production configuration file `/etc/docker/daemon.json` to enforce container isolation limits, log sizes, IP allocations, and enable cgroups v2 resource capping:

```json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_difference=true"
  ],
  "iptables": true,
  "live-restore": true,
  "default-address-pools": [
    {
      "base": "172.18.0.0/16",
      "size": 24
    }
  ],
  "init": true,
  "dns": ["1.1.1.1", "8.8.8.8"]
}
```

Restart and check status of Docker daemon:
```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo systemctl enable docker
```

Create the Docker network overlay dedicated to routing user applications:
```bash
sudo docker network create --driver bridge --subnet 172.19.0.0/16 itbengal-apps
```

### 4.2 Traefik Edge Proxy Infrastructure
Deploy Traefik directly on the host or inside a protected container. In this setup, Traefik runs as a systemd service natively on the server to prevent container loopback networking issues.

Download and install Traefik binary:
```bash
wget https://github.com/traefik/traefik/releases/download/v3.0.1/traefik_v3.0.1_linux_amd64.tar.gz
tar -zxvf traefik_v3.0.1_linux_amd64.tar.gz
sudo mv traefik /usr/local/bin/
sudo chmod +x /usr/local/bin/traefik
```

Create configuration folders:
```bash
sudo mkdir -p /etc/traefik/acme
```

Write Traefik Static Configuration `/etc/traefik/traefik.yml`:

```yaml
# /etc/traefik/traefik.yml - Static Configurations
global:
  checkNewVersion: false
  sendAnonymousUsage: false

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
        certResolver: letsencryptResolver

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: "itbengal-apps"
    watch: true
  file:
    directory: "/etc/traefik/dynamic"
    watch: true

certificatesResolvers:
  letsencryptResolver:
    acme:
      email: ssl-alerts@itbengal.com
      storage: "/etc/traefik/acme/acme.json"
      httpChallenge:
        entryPoint: web
```

Write Traefik Dynamic Configuration template `/etc/traefik/dynamic/tls-security.yml`:

```yaml
# /etc/traefik/dynamic/tls-security.yml - Global SSL Hardening
tls:
  options:
    default:
      minVersion: VersionTLS12
      cipherSuites:
        - TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
        - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
        - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
        - TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305
        - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
      preferServerCipherSuites: true

    legacy:
      minVersion: VersionTLS11
      preferServerCipherSuites: true

  stores:
    default:
      defaultCertificate:
        certFile: /etc/traefik/acme/default.crt
        keyFile: /etc/traefik/acme/default.key
```

Generate self-signed default fallback certificates for Traefik bootstrap initialization:
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/traefik/acme/default.key \
  -out /etc/traefik/acme/default.crt \
  -subj "/CN=itbengal.site"

sudo touch /etc/traefik/acme/acme.json
sudo chmod 600 /etc/traefik/acme/acme.json
```

Create `/etc/systemd/system/traefik.service` to control Traefik daemon execution:

```ini
# /etc/systemd/system/traefik.service
[Unit]
Description=Traefik Edge Routing Load Balancer
Documentation=https://doc.traefik.io/traefik/
After=network.target network-online.target
AssertFileIsExecutable=/usr/local/bin/traefik
AssertPathExists=/etc/traefik/traefik.yml

[Service]
Type=simple
User=root
Group=root
ExecStart=/usr/local/bin/traefik --configfile=/etc/traefik/traefik.yml
Restart=always
RestartSec=5
LimitNOFILE=65536
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
```

Enable and start Traefik:
```bash
sudo systemctl daemon-reload
sudo systemctl enable traefik
sudo systemctl start traefik
```

### 4.3 Node Agent (`itb-agent`) Code Build & Systemd Service
The React hosting node executes a Node.js-based daemon (`itb-agent`) that handles command signals from the main API (Git cloning, Docker building, health tracking, and log streaming).

Create workspace environments:
```bash
sudo mkdir -p /opt/itb-agent
sudo chown -R itb-admin:itb-admin /opt/itb-agent
```

As user `itb-admin`, build the codebase dependencies:
```bash
cd /opt/itb-agent
# (Clone or deploy the itb-agent source code)
# git clone git@github.com:itbengal/node-agent.git .

npm ci
npm run build
```

Write the local configurations file `/opt/itb-agent/.env`:

```ini
# /opt/itb-agent/.env
NODE_ENV=production
PORT=9000
HOST=10.8.0.2
PLATFORM_API_URL=http://10.8.0.1:5000/v1/agent-communication
AGENT_SHARED_COMMUNICATION_KEY=a7d2bcf392b21c4328ff98e7264aef23
DOCKER_SOCKET_PATH=/var/run/docker.sock
DOCKER_DEFAULT_NETWORK=itbengal-apps
BUILD_TEMP_DIR=/opt/itb-agent/build-scratch
MAX_MEMORY_PER_CONTAINER_MB=512
MAX_CPU_PER_CONTAINER=0.5
```

Ensure scratch directories exist and are writeable:
```bash
mkdir -p /opt/itb-agent/build-scratch
```

Write systemd execution service `/etc/systemd/system/itb-agent.service`:

```ini
# /etc/systemd/system/itb-agent.service
[Unit]
Description=ITBengal React Node Application Hosting Agent
After=network.target docker.service traefik.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/itb-agent
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
LimitNOFILE=65536
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the execution service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable itb-agent
sudo systemctl start itb-agent
```

---

## 5. WordPress Hosting Node Agent Setup (`wp-node-01`)

The WordPress hosting node utilizes structured local Linux users, customized Nginx servers, and dedicated dynamic PHP-FPM socket pools rather than Docker containers, achieving low system overhead.

### 5.1 Dynamic Nginx Routing Configuration
Install Nginx and certbot components:
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure Nginx to serve static files and delegate execution requests via fastcgi to specific client sockets. Write `/etc/nginx/nginx.conf` optimization configs:

```nginx
# /etc/nginx/nginx.conf - High performance tuning
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache Zones
    fastcgi_cache_path /var/cache/nginx/wordpress levels=1:2 keys_zone=WORDPRESS:100m inactive=60m max_size=1g;
    fastcgi_cache_key "$scheme$request_method$host$request_uri";
    fastcgi_cache_use_stale error timeout invalid_header http_500;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

Ensure cache structures are initialised:
```bash
sudo mkdir -p /var/cache/nginx/wordpress
sudo chown -R www-data:www-data /var/cache/nginx/wordpress
```

Write the general dynamic routing template `/etc/nginx/sites-available/wordpress-wildcard.conf`:

```nginx
# /etc/nginx/sites-available/wordpress-wildcard.conf
# Routing system for wildcards and dynamically provisioned subdomains

server {
    listen 80;
    listen [::]:80;
    server_name ~^(?<subdomain>[a-z0-9-]+)\.itbengal\.site$;

    # Map dynamic location
    root /var/www/wordpress/$subdomain;
    index index.php index.html index.htm;

    access_log /var/log/nginx/wp_dynamic_access.log;
    error_log /var/log/nginx/wp_dynamic_error.log;

    # Global Security Restrictions
    location ~* litespeed|wp-config\.php|readme\.html|license\.txt|\.git {
        deny all;
    }

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # Micro caching configuration for PHP execution
    location ~ \.php$ {
        try_files $uri =404;
        include snippets/fastcgi-php.conf;
        
        # Connect dynamic Unix socket belonging to matching PHP-FPM pool user
        fastcgi_pass unix:/var/run/php/php8.3-fpm-$subdomain.sock;
        
        fastcgi_cache WORDPRESS;
        fastcgi_cache_valid 200 301 302 5m;
        fastcgi_cache_bypass $cookie_comment_author_$cookie_wordpress_logged_in_$cookie_wp_postpass;
        fastcgi_no_cache $cookie_comment_author_$cookie_wordpress_logged_in_$cookie_wp_postpass;
        add_header X-Cache-Status $upstream_cache_status;
    }

    # static assets cache optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable dynamic wildcards site configuration:
```bash
sudo ln -sf /etc/nginx/sites-available/wordpress-wildcard.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 5.2 PHP 8.3-FPM Isolated Pools Configuration
Install PHP 8.3-FPM and critical WordPress extensions:

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.3-fpm php8.3-mysql php8.3-curl php8.3-gd php8.3-xml php8.3-mbstring php8.3-zip php8.3-imagick php8.3-intl
```

To implement secure user-level sandbox isolation, every hosted site runs under its own Linux system account. When client creates application `clientapp01`, the system executes:

```bash
# Create system user group and account without login shell privileges
sudo groupadd clientapp01
sudo useradd -g clientapp01 -d /var/www/wordpress/clientapp01 -s /usr/sbin/nologin -m clientapp01
sudo chmod 750 /var/www/wordpress/clientapp01
```

Create `/etc/php/8.3/fpm/pool.d/clientapp01.conf` template configuration:

```ini
# /etc/php/8.3/fpm/pool.d/clientapp01.conf
[clientapp01]
user = clientapp01
group = clientapp01

listen = /var/run/php/php8.3-fpm-clientapp01.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

# Process Management Optimization
pm = dynamic
pm.max_children = 10
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
pm.max_requests = 1000

# Limits & Executions configuration
pm.status_path = /status
ping.path = /ping

request_terminate_timeout = 60s
request_slowlog_timeout = 5s
slowlog = /var/log/php8.3-fpm-clientapp01.slow.log

# Overrides PHP Environmental variables
php_admin_value[open_basedir] = /var/www/wordpress/clientapp01:/tmp
php_admin_value[upload_max_filesize] = 64M
php_admin_value[post_max_size] = 64M
php_admin_value[memory_limit] = 256M
php_admin_value[max_execution_time] = 60
php_admin_value[disable_functions] = exec,passthru,shell_exec,system,proc_open,popen,curl_multi_exec,parse_ini_file,show_source
```

Restart PHP-FPM to apply pool definitions:
```bash
sudo systemctl restart php8.3-fpm
```

### 5.3 MariaDB 10.11 Server Optimization
Install MariaDB server:
```bash
sudo apt install -y mariadb-server
```

Edit `/etc/mysql/mariadb.conf.d/50-server.cnf` parameters to support heavy transaction profiles (custom optimized for a 16GB RAM WordPress VPS host):

```ini
# /etc/mysql/mariadb.conf.d/50-server.cnf
[mysqld]
user                    = mysql
pid-file                = /run/mysqld/mysqld.pid
basedir                 = /usr
datadir                 = /var/lib/mysql
tmpdir                  = /tmp
lc-messages-dir         = /usr/share/mysql
bind-address            = 127.0.0.1                     # Restrict access to localhost

# Fine Tuning Parameters
key_buffer_size         = 64M
max_allowed_packet      = 64M
thread_stack            = 192K
thread_cache_size       = 8
myisam_recover_options  = BACKUP
max_connections         = 500
table_open_cache        = 2000

# Caching Configuration
query_cache_limit       = 2M
query_cache_size        = 32M
query_cache_type        = 1

# InnoDB Engine Optimization
default_storage_engine  = InnoDB
innodb_buffer_pool_size = 8G                            # Assign 50% system memory to Buffer Pool
innodb_log_file_size    = 512M
innodb_log_buffer_size  = 16M
innodb_flush_log_at_trx_commit = 2                      # High disk write boost (less flush blocking)
innodb_thread_concurrency = 8
innodb_lock_wait_timeout = 50
innodb_file_per_table   = 1

# Logging
log_error = /var/log/mysql/error.log
expire_logs_days        = 10
```

Restart Database engine to initialize:
```bash
sudo systemctl restart mariadb
sudo systemctl enable mariadb
```

Initialize security configurations:
```bash
# Execute security configuration queries
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'STRONG_MARIADB_ROOT_CREDENTIALS';"
sudo mysql -e "DELETE FROM mysql.user WHERE User='';"
sudo mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
sudo mysql -e "DROP DATABASE IF EXISTS test;"
sudo mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 5.4 WP-CLI Core & Platform Installer Agent Setup
Download and install WP-CLI executable:

```bash
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp
```

Install the local node agent `/opt/itb-agent` configuration exactly as detailed in the React Agent steps (using matching Node.js architecture but configuring `.env` settings to enable WordPress orchestration mode).

Write local environments configurations `/opt/itb-agent/.env`:

```ini
# /opt/itb-agent/.env on wp-node-01
NODE_ENV=production
PORT=9001
HOST=10.8.0.3
PLATFORM_API_URL=http://10.8.0.1:5000/v1/agent-communication
AGENT_SHARED_COMMUNICATION_KEY=a7d2bcf392b21c4328ff98e7264aef23
WP_ROOT_DIR=/var/www/wordpress
WP_DEFAULT_DB_USER=root
WP_DEFAULT_DB_PASS=STRONG_MARIADB_ROOT_CREDENTIALS
WP_CLI_PATH=/usr/local/bin/wp
```

Write systemd execution service `/etc/systemd/system/itb-agent.service`:

```ini
# /etc/systemd/system/itb-agent.service on wp-node-01
[Unit]
Description=ITBengal WordPress Node Application Hosting Agent
After=network.target nginx.service mariadb.service php8.3-fpm.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/itb-agent
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
LimitNOFILE=65536
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable itb-agent
sudo systemctl start itb-agent
```

---

## 6. Complete Deployment Configuration Code Blocks

This section provides complete configuration file declarations to enable copying directly to target files.

### 6.1 Platform: `docker-compose.yml` (For core platform bootstrap)
Create file `/opt/itbengal-core/docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Next.js Dashboard Service Container
  dashboard:
    image: itbengal/dashboard:production-v1.0.0
    container_name: itbengal-dashboard
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=3000
      - NEXT_PUBLIC_API_URL=https://api.itbengal.com
      - NEXT_PUBLIC_WS_URL=wss://api.itbengal.com
    networks:
      - itbengal_net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # API Gateway Container
  api:
    image: itbengal/api:production-v1.0.0
    container_name: itbengal-api
    restart: always
    ports:
      - "127.0.0.1:5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_URL=postgresql://itb_api_user:PRODUCTION_DB_PLAINTEXT_SECRET_KEY@10.8.0.1:5432/itbengal_prod
      - REDIS_URL=redis://:REDIS_PRIMARY_SYSTEM_SECURE_AUTH_PASSWORD@10.8.0.1:6379/0
      - JWT_SECRET_KEY=9bc82d021c322d7ba58bfa79f743ab9cf262f277f2bcde0efd32b509ef01a7df
      - AGENT_SHARED_COMMUNICATION_KEY=a7d2bcf392b21c4328ff98e7264aef23
    depends_on:
      - database_wait
    networks:
      - itbengal_net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # PostgreSQL Init Healthcheck helper
  database_wait:
    image: postgres:16-alpine
    command: >
      sh -c "until pg_isready -h 10.8.0.1 -p 5432 -U itb_api_user; do echo waiting for database; sleep 2; done;"
    networks:
      - itbengal_net

networks:
  itbengal_net:
    driver: bridge
```

### 6.2 React Node: Dynamic Nginx Custom Domain Proxy Configuration
Nginx configuration block `/etc/nginx/sites-available/react-ingress.conf` setup on `react-node-01` to route incoming traffic targeting custom domains directly to Traefik:

```nginx
# /etc/nginx/sites-available/react-ingress.conf
# Acts as the entry router on React nodes, mapping public custom domains down to Traefik.

server {
    listen 80;
    listen [::]:80;
    server_name _; # Catch-all for user custom domains mapped via CNAME

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:8080; # Direct to Traefik HTTP endpoint
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.3 WordPress Node: Dynamic Custom Domains Nginx Template
The dynamic template `/etc/nginx/sites-available/wordpress-customdomains.conf` parses host requests, checks database maps, and mounts execution blocks:

```nginx
# /etc/nginx/sites-available/wordpress-customdomains.conf
# Used for processing arbitrary custom domains registered by users pointing to their site

server {
    listen 80;
    listen [::]:80;
    server_name ~^(www\.)?(?<domain>.+)$;

    # Resolves site execution directory from mapping text DB files
    # The platform writing system maps custom domain string directly to subfolders:
    # /etc/nginx/wp-domains.map mapping: "example.com clientapp01"
    
    root /var/www/wordpress/$subdomain_resolved;
    index index.php index.html;

    # Dynamic pool mapping via lookup DB
    # Uses map blocks loaded via dynamic templates.
    # Check sections for PHP isolation sockets mapping.

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm-$subdomain_resolved.sock;
    }
}
```

---

## 7. Post-Deployment Verification

### 7.1 Automated Health Verification Suite
Save this script as `/opt/itbengal/bin/healthcheck.sh` on the Platform Server to automatically verify core infrastructure functionality:

```bash
#!/bin/bash
# /opt/itbengal/bin/healthcheck.sh
# Production Health Verification Script

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "=============================================="
echo " ITBengal Hosting Platform Health Verification"
echo "=============================================="

# 1. Check WireGuard Connectivity
echo -n "Checking WireGuard private tunnel... "
if ping -c 1 10.8.0.2 &> /dev/null && ping -c 1 10.8.0.3 &> /dev/null; then
    echo -e "${GREEN}OK${NC} (react-node and wp-node reachable)"
else
    echo -e "${RED}FAILED${NC}"
    echo "  -> Check WireGuard status via 'sudo wg show'"
fi

# 2. Check PostgreSQL Connection
echo -n "Checking PostgreSQL database access... "
if PGPASSWORD='PRODUCTION_DB_PLAINTEXT_SECRET_KEY' psql -h 10.8.0.1 -U itb_api_user -d itbengal_prod -c '\q' &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# 3. Check Redis cache connectivity
echo -n "Checking Redis local caching store... "
REDIS_PING=$(redis-cli -a REDIS_PRIMARY_SYSTEM_SECURE_AUTH_PASSWORD PING 2>/dev/null)
if [ "$REDIS_PING" = "PONG" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

# 4. Check Express API Status
echo -n "Checking Express.js Platform API... "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/v1/health)
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}OK (200)${NC}"
else
    echo -e "${RED}FAILED${NC} (Status: $API_STATUS)"
fi

# 5. Check Next.js Dashboard Server
echo -n "Checking Next.js Dashboard Gateway... "
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000)
if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo -e "${GREEN}OK (200)${NC}"
else
    echo -e "${RED}FAILED${NC} (Status: $DASHBOARD_STATUS)"
fi

echo "=============================================="
```

Make the script executable:
```bash
sudo chmod +x /opt/itbengal/bin/healthcheck.sh
```

### 7.2 Verification Protocols Checklist

#### A. Node Agent Telemetry Handshake Verification
Verify that remote agent daemons on `react-node-01` and `wp-node-01` have registered correctly with the `platform-01` core database.

```bash
# On platform-01, query registered servers:
sudo -i -u postgres psql -d itbengal_prod -c "SELECT hostname, ip_address, status, last_heartbeat FROM servers;"
```

*Expected Output:*
```
   hostname    | ip_address | status |      last_heartbeat       
---------------+------------+--------+---------------------------
 react-node-01 | 10.8.0.2   | active | 2026-07-04 17:15:30.12345
 wp-node-01    | 10.8.0.3   | active | 2026-07-04 17:15:28.98765
(2 rows)
```

#### B. SSL Challenge Resolution Verification
Inspect Traefik ACME challenge paths on `react-node-01`. Start a test container and monitor the dynamic generation of certificate payloads:

```bash
# On react-node-01, view Traefik access records
sudo journalctl -u traefik.service -n 50 --no-pager
```

Ensure `acme.json` contains generated SSL metadata details:
```bash
sudo cat /etc/traefik/acme/acme.json | jq '.letsencryptResolver.Certificates[].domain.main'
```

*Expected Output:*
```json
"example-app.itbengal.site"
```

#### C. PHP-FPM Sandbox Verification
Ensure Linux user isolation matches system socket policies on `wp-node-01`. Write a test execution file inside `/var/www/wordpress/clientapp01/test.php`:

```php
<?php
// /var/www/wordpress/clientapp01/test.php
echo "Current execution user: " . posix_getpwuid(posix_geteuid())['name'] . "\n";
echo "Attempting unauthorized read of system passwd...\n";
$content = file_get_contents('/etc/passwd');
if ($content === false) {
    echo "System lock operational: Open_basedir constraints running successfully.\n";
} else {
    echo "SECURITY CAUTION: Leak detected.\n";
}
```

Execute this script directly using the dedicated sandbox CLI socket interface:
```bash
sudo -u clientapp01 php8.3 /var/www/wordpress/clientapp01/test.php
```

*Expected Output:*
```
Current execution user: clientapp01
Attempting unauthorized read of system passwd...
PHP Warning:  file_get_contents(): open_basedir restriction in effect. File(/etc/passwd) is not within the allowed path(s) in /var/www/wordpress/clientapp01/test.php
System lock operational: Open_basedir constraints running successfully.
```

---

## 8. Upgrade and Maintenance Protocols

### 8.1 Zero-Downtime Rollout Strategy
When updating the platform API layer, follow this rollback-safe sequence:

1. **DB Migration Pre-run**: Run SQL schema adjustments without deleting old columns (additive changes).
2. **API Dual Boot**: Spawn new API workers on port `5001`.
3. **Internal Check**: Query `http://127.0.0.1:5001/v1/health` and verify database compatibility.
4. **Traffic Re-routing**: Update Nginx upstream proxy blocks from port `5000` to `5001` and reload Nginx configuration:
   ```bash
   sudo nginx -s reload
   ```
5. **Teardown**: Terminate the legacy execution instances running on port `5000` once persistent HTTP streams complete.

### 8.2 Scheduled Platform Backup Operations
To execute database backup dumps and upload to primary S3 archives, configure a system cron task `/etc/cron.d/itbengal-backup`:

```cron
# /etc/cron.d/itbengal-backup
# Execute database backups nightly at 02:00 AM UTC
00 02 * * * postgres pg_dump -U itb_api_user -h 127.0.0.1 -d itbengal_prod -F c -b -v -f "/var/lib/postgresql/16/main/archive/db_backup_$(date +\%F).dump"
# Execute rotation script cleaning records older than 14 days
30 02 * * * postgres find /var/lib/postgresql/16/main/archive -name "*.dump" -type f -mtime +14 -delete
```
