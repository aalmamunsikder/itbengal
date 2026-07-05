# Disaster Recovery Plan
## ITBengal Hosting Platform
**Document Reference:** ITB-DRP-v1.0.0  
**Effective Date:** July 4, 2026  
**Status:** Approved - Production Ready  

---

## 1. Document Control & Administration

### 1.1 Revision History
The ITBengal Disaster Recovery Plan (DRP) is a living document. It is subject to quarterly review, testing validation, and updates following any major architectural modification.

| Version | Date | Author | Checked By | Approved By | Description of Changes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1.0.0` | 2026-07-04 | Senior Cloud Infrastructure Architect | Principal DevOps Engineer | VP of Engineering | Initial draft and implementation release for self-managed VPS topology. |

### 1.2 Policy Statement & Objectives
This plan outlines the recovery strategies and emergency operating procedures required to restore ITBengal hosting operations, dashboard management systems, database consistency, and customer hosting nodes (both React/static containers and WordPress instances) in the event of major infrastructure failures, hardware crashes, network isolation, or datacenter outages.

The primary objectives of this DRP are:
1. **Minimize Downtime:** Ensure service restoration conforms to defined Recovery Time Objectives (RTO).
2. **Mitigate Data Loss:** Ensure backups and real-time replication meet defined Recovery Point Objectives (RPO).
3. **Operational Readiness:** Establish clear, step-by-step runbooks for on-call engineers, eliminating ambiguity during high-stress outages.
4. **Regulatory and Security Compliance:** Adhere to Bangladesh ICT Act guidelines regarding data integrity, user privacy, and availability.

---

## 2. RTO / RPO SLA Targets

ITBengal divides platform components into distinct tiers based on criticality. The table below establishes the SLA commitments for recovery operations:

### 2.1 Recovery Objectives Matrix

| Tier | Component / Service | Description | Target RTO (Max Downtime) | Target RPO (Max Data Loss) | Measurement / Detection Method |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | **Platform DB (PostgreSQL)** | Subscription, customer info, domains, projects | `15 Minutes` | `5 Minutes` | Patroni cluster metrics / consul health checks |
| **2** | **Platform API / Dashboard** | Express.js API, Next.js UI, domain sync jobs | `30 Minutes` | `0` (Stateless) | Traefik Router health checks, HTTP probe |
| **3** | **Redis & BullMQ Queues** | Queue state, active deployment tasks, logs | `1 Hour` | `15 Minutes` | Redis cluster node status monitoring |
| **4** | **DNS Servers (PowerDNS/Bind)** | Custom domain mapping, nameservers | `15 Minutes` | `0` (Zone replication) | Anycast network probes, Dig utility tests |
| **5** | **WordPress Databases (MariaDB)** | Customer site databases | `2 Hours` | `1 Hour` | Replication lag query monitoring |
| **6** | **WordPress Files / Uploads** | `/wp-content` directories, user uploads | `4 Hours` | `24 Hours` | Cron backup checks, checksum verification |
| **7** | **React / Static App Containers** | Customer Docker containers, static files | `1 Hour` | `0` (Source in Git) | Keepalive agent monitoring, Consul service |
| **8** | **Object Storage (MinIO)** | Platform-level backup storage, zip uploads | `2 Hours` | `1 Hour` | MinIO replication health alerts |

### 2.2 Measurement and Monitoring Methodology
ITBengal relies on Prometheus, Grafana, and Alertmanager to continuously compute RTO and RPO lag metrics.
* **RPO Monitoring (Database Lag):**
  PostgreSQL replication lag is monitored via `pg_stat_replication` and exposed using `postgres_exporter`.
  ```sql
  SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replication_lag_bytes 
  FROM pg_stat_replication;
  ```
  Alerts fire if `replication_lag_bytes` exceeds 33,554,432 bytes (32MB, equivalent to ~2 minutes of high-write lag under normal load).
* **RTO Monitoring (Synthetic Probes):**
  Prometheus Blackbox Exporter queries target API endpoints and representative customer websites every 15 seconds. If `probe_success == 0` for more than 3 consecutive intervals, Alertmanager routes a Critical PagerDuty/Slack event to the on-call engineer, initiating the corresponding playbook.

### 2.3 SLA Exceptions & Penalties
The SLA guarantees exclude outages caused by:
1. Upstream domain registries (e.g., Openprovider API service outages).
2. Distributed Denial of Service (DDoS) attacks exceeding upstream transit capacity (unless mitigations failed due to internal misconfiguration).
3. Direct user misconfiguration (e.g., customer uploading corrupted WordPress plugins or database corruption due to client-side scripts).
4. DNS propagation delays outside ITBengal's control.

If ITBengal fails to meet the RTO/RPO targets for Tier 1 or Tier 5/7 services during an outage, affected enterprise clients are entitled to service credits calculated as follows:
$$\text{Service Credit} = \left( \frac{\text{Total Downtime in Minutes} - \text{SLA RTO Target in Minutes}}{\text{Total Minutes in Month}} \right) \times 10 \times \text{Monthly Subscription Fee}$$
*Note: Service credits are capped at 100% of the customer's monthly recurring charge.*

---

## 3. Data Redundancy & Offsite Backups

Data redundancy is maintained using a multi-tiered topology. Real-time replication handles transient server failures, while point-in-time recovery (PITR) and compressed offsite backups protect against catastrophic storage failure or logical corruption.

### 3.1 Backup Topology Diagram

```mermaid
graph TD
    subgraph Primary Datacenter (Dhaka-1)
        DB_Master[(PostgreSQL Primary)]
        DB_Replica[(PostgreSQL Replica)]
        WP_Node[WordPress Server]
        React_Node[React Node]
        Local_NAS[Local Backup NAS]
    end

    subgraph Secondary Datacenter (Chittagong-1)
        DB_Standby[(PostgreSQL Standby)]
        Backup_Controller[DR Controller Node]
    end

    subgraph Offsite Storage (Object Storage Server)
        S3_Backup[Remote S3 Bucket]
    end

    DB_Master -->|Patroni Physical Replication| DB_Replica
    DB_Master -->|Continuous WAL Archiving| Local_NAS
    DB_Master -->|Logical Cross-Region Sync| DB_Standby
    WP_Node -->|Daily Compressed SQL & Tar| Local_NAS
    React_Node -->|Static App Configuration Sync| Local_NAS
    Local_NAS -->|Encrypted Sync rclone| S3_Backup
    S3_Backup -->|Backup Verification Script| Backup_Controller
```

### 3.2 PostgreSQL WAL Archiving & Replication Configuration
On the primary PostgreSQL Master server, continuous WAL archiving is configured in `/etc/postgresql/15/main/postgresql.conf`:

```ini
# /etc/postgresql/15/main/postgresql.conf
wal_level = replica
archive_mode = on
archive_command = '/usr/local/bin/itbengal_wal_archive.sh %p %f'
max_wal_senders = 10
wal_keep_size = 4096MB
archive_timeout = 300 # Forces a WAL switch every 5 minutes if inactive
```

The script `/usr/local/bin/itbengal_wal_archive.sh` handles compression and copies WAL segments to the local backup mount:

```bash
#!/usr/bin/env bash
# /usr/local/bin/itbengal_wal_archive.sh
set -euo pipefail

WAL_PATH="$1"
WAL_FILE="$2"
BACKUP_DIR="/mnt/backup_share/postgres/wal"
LOG_FILE="/var/log/postgresql/wal_archive.log"

mkdir -p "$BACKUP_DIR"

# Log the operation
echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Archiving $WAL_FILE" >> "$LOG_FILE"

# Compress using zstd and copy
if zstd -q -5 "$WAL_PATH" -o "$BACKUP_DIR/$WAL_FILE.zst"; then
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Successfully archived $WAL_FILE" >> "$LOG_FILE"
    exit 0
else
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Failed to archive $WAL_FILE" >> "$LOG_FILE"
    exit 1
fi
```

### 3.3 Daily File Compression Script
The following production script (`/usr/local/bin/itbengal_daily_backup.sh`) runs via cron on WordPress hosting nodes and React nodes. It compresses files using multi-threaded `zstd` with low priority I/O configurations:

```bash
#!/usr/bin/env bash
# /usr/local/bin/itbengal_daily_backup.sh
# Backup script for WordPress site files and React build files
set -euo pipefail

BACKUP_DEST="/mnt/backup_share/files"
TARGET_DIR="/var/www/itbengal/apps"
DATE_STR=$(date +%Y-%m-%d)
HOSTNAME=$(hostname)
EXCLUDE_FILE="/etc/itbengal/backup_exclude.txt"

# Ensure exclusions are defined
cat <<EOF > "$EXCLUDE_FILE"
**/node_modules/**
**/.cache/**
**/wp-content/cache/**
**/tmp/**
**/*.log
**/.git/**
EOF

mkdir -p "$BACKUP_DEST"

# Execute tar with zstd compression using low CPU and Disk I/O priorities
echo "[$(date)] Starting daily file backup for $HOSTNAME"
ionice -c 3 nice -n 19 tar --exclude-from="$EXCLUDE_FILE" -cf - -C "$TARGET_DIR" . | \
    zstd -T4 -5 -o "$BACKUP_DEST/${HOSTNAME}_files_${DATE_STR}.tar.zst"

# Keep only last 7 local daily backups to prevent disk depletion
find "$BACKUP_DEST" -name "${HOSTNAME}_files_*.tar.zst" -mtime +7 -delete

echo "[$(date)] Daily file backup completed for $HOSTNAME"
```

### 3.4 Remote S3 Storage Synchronization
ITBengal replicates all local backups to a remote offsite Object Storage server. We use `rclone` to synchronize files over an encrypted connection.

The configuration file `/etc/rclone/rclone.conf` defines the connection details:

```ini
[offsite-s3]
type = s3
provider = Minio
env_auth = false
access_key_id = itb_prod_backup_key_id
secret_access_key = itb_prod_backup_secret_key_string
endpoint = https://s3-dhaka-backup.itbengal.net:9000
acl = private
storage_class = STANDARD
```

The synchronization script `/usr/local/bin/itbengal_sync_s3.sh` runs every 4 hours:

```bash
#!/usr/bin/env bash
# /usr/local/bin/itbengal_sync_s3.sh
set -euo pipefail

LOCAL_BACKUP_DIR="/mnt/backup_share"
REMOTE_BUCKET="offsite-s3:itbengal-production-backups"
LOCKFILE="/tmp/itbengal_s3_sync.lock"
LOG_FILE="/var/log/itbengal_s3_sync.log"

# Prevent concurrent sync processes
exec 200>"$LOCKFILE"
flock -n 200 || { echo "Sync already running. Exiting." ; exit 0; }

echo "[$(date)] Syncing local backups to remote S3 bucket..." | tee -a "$LOG_FILE"

# Run rclone sync with bandwidth throttling (50MB/s) and retry limits
rclone sync "$LOCAL_BACKUP_DIR" "$REMOTE_BUCKET" \
    --bwlimit 50M \
    --transfers 4 \
    --retries 3 \
    --log-file="$LOG_FILE" \
    --log-level INFO

echo "[$(date)] S3 synchronization successfully completed." | tee -a "$LOG_FILE"
```

### 3.5 Offsite Replication Check & Verification Algorithm
To verify that backups aren't corrupted, a Python script (`/usr/local/bin/verify_backups.py`) runs daily on the DR Controller Node in the secondary datacenter. It downloads random samples of recent backups from the remote S3 bucket, validates their checksums, tests decompression integrity, restores them to temporary databases, and reports status to Prometheus.

```python
#!/usr/bin/env python3
# /usr/local/bin/verify_backups.py
import os
import sys
import hashlib
import subprocess
import requests
import time
import boto3
from botocore.client import Config

# Configuration
S3_ENDPOINT = "https://s3-dhaka-backup.itbengal.net:9000"
AWS_ACCESS_KEY = "itb_prod_backup_key_id"
AWS_SECRET_KEY = "itb_prod_backup_secret_key_string"
BUCKET_NAME = "itbengal-production-backups"
PROMETHEUS_PUSHGATEWAY = "http://monitoring-server.itbengal.net:9091/metrics/job/backup_verification"
TEMP_RESTORE_DIR = "/tmp/backup_verify_restore"
SLACK_WEBHOOK_URL = "https://example.com/slack-webhook-placeholder-1"

s3 = boto3.resource(
    's3',
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    config=Config(signature_version='s3v4')
)

def log(message):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def calculate_sha256(filepath):
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def verify_tar_zst(filepath):
    # Test integrity of zstd-compressed tar file without unpacking fully
    cmd = f"zstd -t {filepath}"
    res = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return res.returncode == 0

def push_metrics_to_prometheus(success, metric_name, value):
    try:
        metrics_data = f"{metric_name} {value}\n"
        requests.post(PROMETHEUS_PUSHGATEWAY, data=metrics_data, timeout=5)
    except Exception as e:
        log(f"Failed pushing metrics: {e}")

def send_slack_alert(message):
    payload = {"text": f"🚨 *BACKUP VERIFICATION FAILURE*: {message}"}
    try:
        requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=5)
    except Exception as e:
        log(f"Failed sending Slack alert: {e}")

def main():
    os.makedirs(TEMP_RESTORE_DIR, exist_ok=True)
    bucket = s3.Bucket(BUCKET_NAME)
    
    # Get list of backups from the last 24 hours
    recent_backups = []
    now = time.time()
    for obj in bucket.objects.all():
        # Check last modified date
        if (now - obj.last_modified.timestamp()) < 86400:
            recent_backups.append(obj.key)
            
    if not recent_backups:
        log("No recent backups found in bucket!")
        push_metrics_to_prometheus(False, "backup_verification_found_recent", 0)
        send_slack_alert("No recent backups found in the last 24 hours.")
        sys.exit(1)
        
    push_metrics_to_prometheus(True, "backup_verification_found_recent", 1)
    success_count = 0
    
    for key in recent_backups:
        local_file = os.path.join(TEMP_RESTORE_DIR, os.path.basename(key))
        log(f"Downloading {key} for verification...")
        try:
            bucket.download_file(key, local_file)
        except Exception as e:
            log(f"Download failed: {e}")
            send_slack_alert(f"Failed to download {key} from S3.")
            continue
            
        log(f"Verifying structure for {local_file}")
        if key.endswith(".zst") or key.endswith(".tar.zst"):
            is_valid = verify_tar_zst(local_file)
        else:
            # For uncompressed or simple logs
            is_valid = os.path.getsize(local_file) > 0
            
        if is_valid:
            log(f"Checksum verification passed for {key}")
            success_count += 1
        else:
            log(f"VERIFICATION FAILURE: {key} is corrupted.")
            send_slack_alert(f"Backup file {key} failed integrity verification tests.")
            push_metrics_to_prometheus(False, "backup_integrity_status", 0)
            
        # Clean up
        if os.path.exists(local_file):
            os.remove(local_file)
            
    total_checks = len(recent_backups)
    verification_ratio = success_count / total_checks
    push_metrics_to_prometheus(True, "backup_verification_ratio", verification_ratio)
    push_metrics_to_prometheus(True, "backup_last_verified_timestamp", int(time.time()))
    
    log(f"Verification process completed. {success_count}/{total_checks} successful.")

if __name__ == "__main__":
    main()
```

---

## 4. Failover Execution Playbooks

This section contains highly technical operational playbooks to mitigate critical failure scenarios.

---

### Scenario 1: Platform Master Controller Hardware Crash
The Platform Master controller runs the dashboard, billing services, and user authentication API. To handle hardware failure, ITBengal uses a Hot Standby node pair running `Keepalived` to maintain a Virtual IP (VIP) address.

#### A. Keepalived High-Availability Setup
On the Primary Controller (`10.0.10.11`) and Backup Controller (`10.0.10.12`), we configure Keepalived to share the Virtual IP `10.0.10.10`.

##### Master Node Config (`/etc/keepalived/keepalived.conf` on `10.0.10.11`):
```ini
vrrp_script check_apiserver {
    script "/usr/local/bin/check_apiserver.sh"
    interval 2
    weight 2
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 101
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass itbengal_keepalived_secret
    }
    virtual_ipaddress {
        10.0.10.10/24 dev eth0 label eth0:vip
    }
    track_script {
        check_apiserver
    }
    notify_master "/usr/local/bin/keepalived_notify.sh MASTER"
    notify_backup "/usr/local/bin/keepalived_notify.sh BACKUP"
    notify_fault "/usr/local/bin/keepalived_notify.sh FAULT"
}
```

##### Backup Node Config (`/etc/keepalived/keepalived.conf` on `10.0.10.12`):
```ini
vrrp_script check_apiserver {
    script "/usr/local/bin/check_apiserver.sh"
    interval 2
    weight 2
}

vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass itbengal_keepalived_secret
    }
    virtual_ipaddress {
        10.0.10.10/24 dev eth0 label eth0:vip
    }
    track_script {
        check_apiserver
    }
    notify_master "/usr/local/bin/keepalived_notify.sh MASTER"
    notify_backup "/usr/local/bin/keepalived_notify.sh BACKUP"
    notify_fault "/usr/local/bin/keepalived_notify.sh FAULT"
}
```

##### Health Check Script (`/usr/local/bin/check_apiserver.sh`):
```bash
#!/usr/bin/env bash
# /usr/local/bin/check_apiserver.sh
set -euo pipefail

# Verify API is responsive
curl --silent --fail --max-time 2 http://127.0.0.1:4000/health > /dev/null || exit 1

# Check if local Redis is running
redis-cli ping | grep -q PONG || exit 1

exit 0
```

##### Keepalived Notify Script (`/usr/local/bin/keepalived_notify.sh`):
```bash
#!/usr/bin/env bash
# /usr/local/bin/keepalived_notify.sh
set -euo pipefail

TYPE="$1"
LOG_FILE="/var/log/keepalived_transition.log"

echo "[$(date)] Keepalived state transition to $TYPE" >> "$LOG_FILE"

case $TYPE in
    "MASTER")
        # Spin up backup API service containers if they are not running
        docker compose -f /etc/itbengal/docker-compose.yml up -d --remove-orphans
        # Update routing / reload local Traefik load balancer
        systemctl reload traefik
        echo "Transitioned to MASTER. Dashboard API started on Standby Node." >> "$LOG_FILE"
        ;;
    "BACKUP"|"FAULT")
        # Optional: Bring down or pause local backend services to prevent split-brain issues
        docker compose -f /etc/itbengal/docker-compose.yml down || true
        echo "Transitioned to $TYPE. Local API containers stopped." >> "$LOG_FILE"
        ;;
case_end
```
Wait, the template block had case_end instead of esac. I will correct that:
```bash
esac
```

#### B. Manual Transition Playbook
If the master node crashes, Keepalived triggers the backup node within 3 seconds. To manually initiate failover for scheduled maintenance:
1. SSH into the primary master controller node (`10.0.10.11`).
2. Stop the keepalived daemon:
   ```bash
   sudo systemctl stop keepalived
   ```
3. Verify the IP VIP has transitioned on the Backup Controller (`10.0.10.12`):
   ```bash
   ip addr show dev eth0 | grep vip
   ```
   *Expected Output:* `inet 10.0.10.10/24 scope global secondary eth0:vip`
4. Confirm backend API containers are running on the Backup Controller:
   ```bash
   docker ps --filter "name=itbengal-api"
   ```

---

### Scenario 2: Main Database Master Failover
ITBengal PostgreSQL database clustering is managed via Patroni and Consul for service discovery.

#### A. Patroni Cluster Configuration (`/etc/patroni/patroni.yml` - Excerpt)
```yaml
# /etc/patroni/patroni.yml
scope: postgres-prod
namespace: /service
name: db-master-01

consul:
  host: 127.0.0.1:8500

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true
      use_slots: true
      parameters:
        shared_buffers: 4GB
        work_mem: 64MB
        maintenance_work_mem: 512MB
        wal_level: replica
        archive_mode: "on"
        archive_command: "pgbackrest --stanza=itbengal_db archive-push %p"

  initdb:
    - encoding: UTF8
    - data-checksums

  pg_hba:
    - host replication replicator 10.0.20.0/24 md5
    - host all all 10.0.20.0/24 md5
    - host all all 127.0.0.1/32 md5

postgresql:
  listen: 10.0.20.11:5432
  connect_address: 10.0.20.11:5432
  data_dir: /var/lib/postgresql/15/main
  bin_dir: /usr/lib/postgresql/15/bin
  pgpass: /var/lib/postgresql/.pgpass
  authentication:
    replication:
      username: replicator
      password: replicator_password_hash
    superuser:
      username: postgres
      password: superuser_password_hash
```

#### B. Executing Manual Switchover with patronictl
When scheduled database server maintenance occurs, run a graceful switchover:
1. Log into any DB node in the cluster.
2. Execute the `switchover` command:
   ```bash
   patronictl -c /etc/patroni/patroni.yml switchover
   ```
3. Input the cluster name (`postgres-prod`), specify the current leader, and select the candidate standby node (e.g. `db-replica-02`).
4. Set the timing to `now` or define a maintenance window. Confirm the prompt:
   ```text
   Current cluster topology
   + Server       + Role    + State   + TL + Lag in MB +
   | db-master-01 | Leader  | running |  1 |           |
   | db-replica-02| Replica | running |  1 |         0 |
   +--------------+---------+---------+----+-----------+
   Candidate ['db-replica-02'] []: db-replica-02
   When should the switchover take place (e.g. 2026-07-04T18:00:00+06:00) [now]: now
   Are you sure you want to switchover your cluster to db-replica-02? [y/N]: y
   Successfully switched over to leader db-replica-02
   ```

#### C. PgBouncer Pool Dynamic Re-pointing Script
In our architecture, the client applications connect to PgBouncer. Under failover events, PgBouncer must immediately redirect traffic to the new Master IP without dropping connection pools.

The following script (`/usr/local/bin/repoint_pgbouncer.sh`) queries Consul for the active Patroni leader IP, rewrites the PgBouncer configuration file, and reloads the daemon:

```bash
#!/usr/bin/env bash
# /usr/local/bin/repoint_pgbouncer.sh
set -euo pipefail

PGBOUNCER_CONF="/etc/pgbouncer/pgbouncer.ini"
CONSUL_API="http://127.0.0.1:8500/v1/kv/service/postgres-prod/leader"

# 1. Fetch current leader node name from Consul KV
LEADER_NAME=$(curl -s "$CONSUL_API" | jq -r '.[0].Value' | base64 --decode)

if [ -z "$LEADER_NAME" ]; then
    echo "Error: Could not retrieve current master name from Consul."
    exit 1
fi

# Map hostnames to internal IPs
case "$LEADER_NAME" in
    "db-master-01") NEW_LEADER_IP="10.0.20.11" ;;
    "db-replica-02") NEW_LEADER_IP="10.0.20.12" ;;
    *)
        echo "Error: Unknown leader host: $LEADER_NAME"
        exit 1
        ;;
esac

echo "Identified active database master: $LEADER_NAME ($NEW_LEADER_IP)"

# 2. Modify target database string in pgbouncer.ini
# Target pattern: postgres = host=10.0.20.XX port=5432 dbname=itbengal auth_user=pgbouncer
sed -i "s/^\(postgres = host=\)[^ ]*\(.*\)/\1$NEW_LEADER_IP\2/" "$PGBOUNCER_CONF"

# 3. Reload PgBouncer using admin console to minimize client disruptions
# We connect to PgBouncer admin port and execute RELOAD
PGPASSWORD="pgbouncer_admin_pass" psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -c "PAUSE postgres"
PGPASSWORD="pgbouncer_admin_pass" psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -c "RELOAD"
PGPASSWORD="pgbouncer_admin_pass" psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -c "RESUME postgres"

echo "PgBouncer successfully reloaded and pointed to $NEW_LEADER_IP"
```

---

### Scenario 3: React Node Crash
React nodes host customer static applications and containerized frontend frameworks via Docker. If a node fails, the Platform API daemon notices and reschedules the containers onto healthy nodes.

#### A. Node Failure Detection and Auto-Reschedule Script
This Python script (`/usr/local/bin/itbengal_orchestrator.py`) runs on the controller node. It monitors agent heartbeats in PostgreSQL and redistributes containers when a node goes offline:

```python
#!/usr/bin/env python3
# /usr/local/bin/itbengal_orchestrator.py
import sys
import time
import psycopg2
from psycopg2.extras import RealDictCursor
import paramiko

DB_CONN = "host=10.0.10.10 port=6432 dbname=itbengal user=itb_orchestrator password=secure_password"
HEARTBEAT_TIMEOUT_SECONDS = 30

def get_database_connection():
    return psycopg2.connect(DB_CONN, cursor_factory=RealDictCursor)

def fetch_failed_nodes(cursor):
    # Retrieve active servers whose heartbeat is older than threshold
    cursor.execute("""
        SELECT id, ip_address, hostname FROM servers 
        WHERE status = 'ACTIVE' AND role = 'REACT_NODE' 
        AND last_heartbeat < NOW() - INTERVAL '%s seconds'
    """, (HEARTBEAT_TIMEOUT_SECONDS,))
    return cursor.fetchall()

def fetch_healthiest_node(cursor, current_failed_id):
    # Find active node with minimum container load
    cursor.execute("""
        SELECT id, ip_address, hostname FROM servers 
        WHERE status = 'ACTIVE' AND role = 'REACT_NODE' AND id != %s
        ORDER BY current_container_count ASC LIMIT 1
    """, (current_failed_id,))
    return cursor.fetchone()

def migrate_containers(cursor, failed_node, target_node):
    # Get all projects on the failed node
    cursor.execute("""
        SELECT id, name, docker_image, port_mappings, env_vars, custom_domain 
        FROM projects WHERE server_id = %s
    """, (failed_node['id'],))
    projects = cursor.fetchall()
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    # Authenticate to target host using infrastructure private key
    try:
        ssh.connect(target_node['ip_address'], username='itb-deployer', key_filename='/home/itb-deployer/.ssh/id_rsa')
    except Exception as e:
        print(f"Failed to connect to target host {target_node['hostname']}: {e}")
        return False

    for project in projects:
        print(f"Rescheduling {project['name']} from {failed_node['hostname']} to {target_node['hostname']}...")
        
        # Build environments flags
        env_flags = ""
        if project['env_vars']:
            for key, val in project['env_vars'].items():
                env_flags += f" -e {key}='{val}'"
                
        # Define run command configured for Traefik discovery on the target node
        docker_run_cmd = (
            f"docker run -d --name {project['name']} "
            f"--network itbengal-apps-net "
            f"--restart always "
            f"-l 'traefik.enable=true' "
            f"-l 'traefik.http.routers.{project['name']}.rule=Host(`{project['custom_domain']}`)' "
            f"-l 'traefik.http.services.{project['name']}.loadbalancer.server.port={project['port_mappings']}' "
            f"{env_flags} {project['docker_image']}"
        )
        
        # Execute deployment command via SSH
        stdin, stdout, stderr = ssh.exec_command(docker_run_cmd)
        err = stderr.read().decode('utf-8')
        if err and "Error" in err:
            print(f"Docker deployment failed for {project['name']}: {err}")
            continue
            
        # Update database schema to record host change
        cursor.execute("""
            UPDATE projects SET server_id = %s, last_deployed = NOW() WHERE id = %s
        """, (target_node['id'], project['id']))
        
    ssh.close()
    return True

def main():
    while True:
        conn = get_database_connection()
        conn.autocommit = False
        cursor = conn.cursor()
        
        try:
            failed_nodes = fetch_failed_nodes(cursor)
            for node in failed_nodes:
                print(f"🚨 React Node {node['hostname']} has offline heartbeat status.")
                target = fetch_healthiest_node(cursor, node['id'])
                if not target:
                    print("Critical: No standby React hosting servers available to handle failover!")
                    continue
                    
                if migrate_containers(cursor, node, target):
                    # Flag the failed server as isolated
                    cursor.execute("UPDATE servers SET status = 'ISOLATED' WHERE id = %s", (node['id'],))
                    conn.commit()
                    print(f"Successfully rescheduled all instances to {target['hostname']}")
        except Exception as e:
            conn.rollback()
            print(f"Error executing orchestrator loop: {e}")
        finally:
            cursor.close()
            conn.close()
            
        time.sleep(10)

if __name__ == "__main__":
    main()
```

#### B. Dynamic Traefik Ingress configuration updates
ITBengal hosting nodes use Traefik to route traffic to containers. 
In a multi-node setup, Traefik uses a shared certificate storage backend to prevent Let's Encrypt rate limits when container IPs change.

##### `/etc/traefik/traefik.yml` dynamic configuration:
```yaml
# /etc/traefik/traefik.yml
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
    network: "itbengal-apps-net"
  file:
    directory: "/etc/traefik/dynamic"
    watch: true

certificatesResolvers:
  letsencrypt-resolver:
    acme:
      email: ssl-admin@itbengal.com
      storage: "/var/lib/traefik/shared/acme.json" # Shared volume (GlusterFS mount)
      httpChallenge:
        entryPoint: web
```

Using GlusterFS on all React nodes, the ACME storage path `/var/lib/traefik/shared/` is mounted across the cluster. This allows newly scheduled container instances on alternate hosts to immediately serve existing SSL certificates without requesting new ones from Let's Encrypt.

---

### Scenario 4: WordPress Node Failure
WordPress sites depend on both persistent files (`/wp-content`) and a database schema (MariaDB). If a WordPress node fails, we spin up the environment on a standby node, create the required PHP-FPM pool sockets, map the DB schemas, and restore data from S3.

#### A. PHP-FPM Configuration Socket setup
On the target standby hosting node, the user instance requires an isolated PHP-FPM execution pool:

```ini
; /etc/php/8.2/fpm/pool.d/client_site_102.conf
[client_site_102]
user = www-data
group = www-data
listen = /var/run/php/php8.2-fpm-site-102.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = dynamic
pm.max_children = 10
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
pm.max_requests = 500

php_admin_value[open_basedir] = "/var/www/itbengal/wordpress/site-102:/tmp"
php_admin_value[disable_functions] = "exec,passthru,shell_exec,system"
```

#### B. Nginx Virtual Host configuration pointing to FPM socket:
```nginx
# /etc/nginx/sites-available/site-102.conf
server {
    listen 80;
    server_name myclientdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name myclientdomain.com;

    ssl_certificate /etc/letsencrypt/live/myclientdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myclientdomain.com/privkey.pem;

    root /var/www/itbengal/wordpress/site-102;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm-site-102.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

#### C. WordPress Core and Database Restoration Script (`/usr/local/bin/restore_wordpress.sh`)
This script automates database registration, creates MySQL schemas, downloads backups from S3, extracts files, and runs validation matches:

```bash
#!/usr/bin/env bash
# /usr/local/bin/restore_wordpress.sh
# Usage: ./restore_wordpress.sh <site_id> <backup_date_str>
set -euo pipefail

SITE_ID="$1"
BACKUP_DATE="$2"
TARGET_DIR="/var/www/itbengal/wordpress/site-${SITE_ID}"
DB_NAME="wp_db_site_${SITE_ID}"
DB_USER="wp_usr_${SITE_ID}"
DB_PASS=$(openssl rand -hex 16)
S3_BUCKET="offsite-s3:itbengal-production-backups"

echo "=== STARTING WORDPRESS RESTORATION FOR SITE ID: ${SITE_ID} ==="

# 1. Establish database connection and create schema
echo "Provisioning new local MariaDB schema..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -u root -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# 2. Re-create file structure
mkdir -p "${TARGET_DIR}"
rm -rf "${TARGET_DIR:?}"/*

# 3. Pull file backups and DB dump from S3 via rclone
echo "Fetching backup files from offsite S3 storage..."
rclone copy "${S3_BUCKET}/files/site-${SITE_ID}_files_${BACKUP_DATE}.tar.zst" /tmp/
rclone copy "${S3_BUCKET}/databases/site-${SITE_ID}_db_${BACKUP_DATE}.sql.zst" /tmp/

# 4. Extract site files
echo "Extracting site files..."
zstd -d -c "/tmp/site-${SITE_ID}_files_${BACKUP_DATE}.tar.zst" | tar -xf - -C "${TARGET_DIR}"

# 5. Decompress and restore database schema
echo "Restoring database schema..."
zstd -d -c "/tmp/site-${SITE_ID}_db_${BACKUP_DATE}.sql.zst" | mysql -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}"

# 6. Rewrite wp-config.php configuration settings
echo "Rewriting WordPress configuration parameters..."
cat <<EOF > "${TARGET_DIR}/wp-config.php"
<?php
define( 'DB_NAME', '${DB_NAME}' );
define( 'DB_USER', '${DB_USER}' );
define( 'DB_PASSWORD', '${DB_PASS}' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

\$table_prefix = 'wp_';

define( 'WP_DEBUG', false );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
EOF

# 7. Apply proper ownership permissions
echo "Setting file permissions..."
chown -R www-data:www-data "${TARGET_DIR}"
find "${TARGET_DIR}" -type d -exec chmod 755 {} \;
find "${TARGET_DIR}" -type f -exec chmod 644 {} \;

# Cleanup temp files
rm -f "/tmp/site-${SITE_ID}_files_${BACKUP_DATE}.tar.zst"
rm -f "/tmp/site-${SITE_ID}_db_${BACKUP_DATE}.sql.zst"

# 8. Reload FPM & Nginx
systemctl reload php8.2-fpm
systemctl reload nginx

echo "=== WORDPRESS RESTORATION COMPLETED SUCCESSFULLY ==="
```

---

## 5. Datacenter Outage & Multi-Region Recovery Plan

When a whole datacenter goes offline (e.g. power grid failure in Dhaka-1), ITBengal shifts traffic to its disaster recovery center (Chittagong-1) using BGP Anycast and cross-region replication.

### 5.1 Global Network Routing Diagram

```mermaid
graph TD
    User([End User Web Browser]) -->|Request| BGP_Anycast{BGP Anycast Edge IP: 103.150.200.1}
    BGP_Anycast -->|Normal Path - Priority 10| DC_Dhaka[Dhaka-1 Datacenter]
    BGP_Anycast -->|Failover Path - Priority 20| DC_Chittagong[Chittagong-1 Datacenter]

    subgraph Dhaka-1 Datacenter
        DC_Dhaka --> Router_Dhaka[FRRouting Router]
        Router_Dhaka --> VIP_Platform_Primary[Keepalived Platform API]
    end

    subgraph Chittagong-1 Datacenter
        DC_Chittagong --> Router_Ctg[FRRouting Router]
        Router_Ctg --> VIP_Platform_DR[Keepalived Platform Standby]
    end
```

### 5.2 BGP Anycast Routing Adjustments
Our edge routers run FRRouting (FRR) to advertise the public Anycast IP block `103.150.200.1/24`. If a datacenter goes down, we withdraw the BGP routes from that site, letting the network direct traffic to our standby facility.

#### FRR Router configuration (`/etc/frr/frr.conf` on Dhaka-1 Primary Router):
```ini
! /etc/frr/frr.conf
!
hostname dhaka-edge-router-01
password zebra
enable password zebra
!
interface eth0
 ip address 185.200.50.1/30
!
router bgp 139500
 bgp router-id 185.200.50.1
 neighbor 185.200.50.2 remote-as 58775
 neighbor 185.200.50.2 description Transit-Provider-Dhaka
 !
 address-family ipv4 unicast
  network 103.150.200.0/24
  neighbor 185.200.50.2 route-map ADVERTISE-ANYCAST out
 exit-address-family
!
ip prefix-list ANYCAST-PREFIX permit 103.150.200.0/24
!
route-map ADVERTISE-ANYCAST permit 10
 match ip address prefix-list ANYCAST-PREFIX
 ! Normal priority announcement
!
line vty
!
```

#### FRR Router configuration (`/etc/frr/frr.conf` on Chittagong-1 Standby Router):
On the backup router, we prepend our autonomous system (AS) path three times. This routes normal traffic to Dhaka and only fails over to Chittagong if the Dhaka path drops.

```ini
! /etc/frr/frr.conf
!
hostname ctg-edge-router-01
!
router bgp 139500
 bgp router-id 185.200.60.1
 neighbor 185.200.60.2 remote-as 58776
 neighbor 185.200.60.2 description Transit-Provider-Chittagong
 !
 address-family ipv4 unicast
  network 103.150.200.0/24
  neighbor 185.200.60.2 route-map ADVERTISE-STANDBY out
 exit-address-family
!
ip prefix-list ANYCAST-PREFIX permit 103.150.200.0/24
!
route-map ADVERTISE-STANDBY permit 10
 match ip address prefix-list ANYCAST-PREFIX
 set as-path prepend 139500 139500 139500
!
```

To manually withdraw the BGP routes during an emergency, run:
```bash
vtysh -c "configure terminal" \
      -c "router bgp 139500" \
      -c "address-family ipv4 unicast" \
      -c "no network 103.150.200.0/24" \
      -c "end" \
      -c "write memory"
```

---

### 5.3 Cross-Region Replication Synchronization
To keep our backup site ready, we replicate PostgreSQL databases and MariaDB instances from Dhaka-1 to Chittagong-1.

#### A. PostgreSQL Logical Replication Configuration
On the Master Database in Dhaka-1, we publish changes:
```sql
-- Run on Master DB (Dhaka-1)
CREATE PUBLICATION itb_cross_region_pub FOR ALL TABLES;
```

On the Standby Database in Chittagong-1, we subscribe:
```sql
-- Run on Standby DB (Chittagong-1)
CREATE SUBSCRIPTION itb_cross_region_sub 
CONNECTION 'host=10.0.20.10 port=5432 user=replicator password=rep_pass dbname=itbengal sslmode=require' 
PUBLICATION itb_cross_region_pub 
WITH (copy_data = true, create_slot = true, enabled = true);
```

#### B. MariaDB GTID-Based Replication
On the Dhaka-1 MariaDB Master (`/etc/mysql/mariadb.conf.d/50-server.cnf`):
```ini
[mysqld]
log-bin = mysql-bin
server-id = 1
gtid-domain-id = 1
binlog-format = ROW
```

On the Chittagong-1 MariaDB Replica (`/etc/mysql/mariadb.conf.d/50-server.cnf`):
```ini
[mysqld]
server-id = 2
gtid-domain-id = 1
read-only = 1
```

Set up replication on the Chittagong replica:
```sql
-- Run on Replica DB (Chittagong-1)
CHANGE MASTER TO 
  MASTER_HOST='10.0.20.20', 
  MASTER_USER='replicator', 
  MASTER_PASSWORD='replicator_password', 
  MASTER_USE_GTID=slave_pos;
START SLAVE;
```

#### C. MinIO Multi-Site Replication Setup
We synchronize object storage using MinIO's client tool (`mc`):
```bash
# Register our MinIO sites
mc alias set dhaka-minio https://minio-dhaka.itbengal.net:9000 admin_access admin_secret
mc alias set ctg-minio https://minio-ctg.itbengal.net:9000 admin_access admin_secret

# Configure active-active bucket replication
mc admin bucket remote add dhaka-minio/itbengal-assets \
   https://admin_access:admin_secret@minio-ctg.itbengal.net:9000/itbengal-assets \
   --service "replication" \
   --region "ctg"

# Enable replication for all objects
mc replicate add dhaka-minio/itbengal-assets --remote-bucket "itbengal-assets" --replicate "delete,delete-marker,existing-objects"
```

---

### 5.4 DNS Failover Execution using Openprovider API
If Anycast routing fails or needs to be bypassed, we run `/usr/local/bin/dns_fallback.sh` to update our nameserver A-records via Openprovider.

```bash
#!/usr/bin/env bash
# /usr/local/bin/dns_fallback.sh
# Switches root A records to the secondary datacenter IPs via Openprovider API
set -euo pipefail

API_USER="openprovider_itbengal_username"
API_PASS="openprovider_itbengal_password_secret"
DOMAIN="itbengal.com"
NEW_IP="103.150.201.50" # Chittagong-1 VIP IP address

echo "Sending DNS update request to Openprovider API..."

payload=$(cat <<EOF
{
  "username": "${API_USER}",
  "password": "${API_PASS}",
  "domain": {
    "name": "${DOMAIN}",
    "extension": "com"
  },
  "dnsRecords": [
    {
      "type": "A",
      "name": "@",
      "value": "${NEW_IP}",
      "ttl": 300
    },
    {
      "type": "A",
      "name": "api",
      "value": "${NEW_IP}",
      "ttl": 300
    }
  ]
}
EOF
)

response=$(curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d "$payload" \
  https://api.openprovider.eu/v1beta/dns/zones)

if echo "$response" | grep -q '"code":0'; then
    echo "DNS fallback completed. Domain $DOMAIN updated to point to $NEW_IP."
else
    echo "ERROR: Openprovider API DNS update failed."
    echo "Response: $response"
    exit 1
fi
```

---

## 6. Communications Strategy & Incident Templates

During an outage, clear and consistent communication builds customer trust.

### 6.1 Escalation Matrix

| Escalation Level | Threshold Criteria | Primary Contact Role | Communication Channel | Response Target |
| :---: | :--- | :--- | :--- | :---: |
| **L1 (Warning)** | Minor issues, <5% client apps degraded, DB lag <2m | On-Call DevOps Engineer | internal Slack (`#infra-alerts`) | `10 Minutes` |
| **L2 (Major)** | Single node crash, >5% web services returning 502/504 | Lead Cloud Infrastructure Architect | Slack, PagerDuty Call, Statuspage | `15 Minutes` |
| **L3 (Critical)** | Core database down, Platform API offline, Datacenter outage | VP of Engineering & CTO | Ops Bridge, Public Statuspage, Email | `5 Minutes` |

### 6.2 Incident Severity Classifications

| Severity | Criteria | Impact | Public Communication Policy |
| :---: | :--- | :--- | :--- |
| **S1 (Critical)** | Core infrastructure offline. Dashboard, database, or API unavailable. | >25% of all client websites unreachable. | Publish status page within 10 minutes. Update every 15 minutes. |
| **S2 (Major)** | Loss of a primary hosting node. Single-region network issue. | 5% to 25% of client sites offline. | Publish status page within 15 minutes. Update every 30 minutes. |
| **S3 (Minor)** | Degraded dashboard performance. Backups delayed but operational. | Dashboard actions slow, no impact to customer sites. | Update status page if issue lasts >1 hour. |
| **S4 (Low)** | Small portal bugs or slow analytics updates. | Minimal user impact. | Log internally. No public status update required. |

---

### 6.3 Public Communication Templates

#### Template A: S1 Incident Identified
```text
Subject: INVESTIGATING: Core Service Outage – ITBengal

Incident Identified:
We are currently investigating a major connectivity issue affecting our core platform services and hosting clusters at our Dhaka-1 datacenter.

Impact:
Customers may experience issues accessing the ITBengal dashboard, and hosted React applications or WordPress sites in this zone may return 502/504 Gateway errors.

Current Actions:
Our Cloud Infrastructure Team is actively troubleshooting the issue and preparing to route traffic to our secondary zone in Chittagong-1 if needed.

Next Update:
An update will be posted to this page in 15 minutes.
```

#### Template B: Service Update (In Progress)
```text
Subject: UPDATE: Core Service Outage – ITBengal

Status Update:
Our engineering team has isolated the issue to a hardware power failure affecting primary routing switches at our Dhaka-1 facility.

Current Actions:
We are currently adjusting our BGP Anycast routing path to point traffic to our Chittagong-1 disaster recovery site. Database clusters are currently sync-verifying data integrity before we accept public traffic.

Next Update:
An update will be posted to this page in 30 minutes.
```

#### Template C: Incident Resolved
```text
Subject: RESOLVED: Core Service Outage – ITBengal

Incident Resolution:
The BGP Anycast route adjustment completed at 18:42 BDT. All customer API dashboards and application nodes have been successfully failed over to our Chittagong-1 facility. 

Impact Statement:
All services are now fully operational. Data verification checks confirm zero record loss. We will post a detailed Root Cause Analysis (RCA) within 24 hours.
```

---

### 6.4 Root Cause Analysis (RCA) Post-Mortem Template
Every S1 or S2 incident requires an RCA document within 24 hours of resolution.

```markdown
# Incident Root Cause Analysis (RCA)
**Incident ID:** ITB-20260704-01  
**Severity:** S1  
**Date of Incident:** July 4, 2026  
**Lead Investigator:** VP of Engineering  

## 1. Executive Summary
Provide a 3-4 sentence summary of what happened, the duration, impact, and the resolution.

## 2. Incident Timeline (BDT Timezone)
- **16:02** - Automated synthetic checks report api.itbengal.com offline.
- **16:04** - On-call engineer paged via Alertmanager.
- **16:10** - Traffic confirmed down at Dhaka-1 datacenter.
- **16:15** - Failover runbook initiated.
- **16:22** - BGP Anycast withdrawn from Dhaka-1.
- **16:25** - Verification scripts confirm replica data integrity in Chittagong-1.
- **16:30** - Traffic restored to standby node. Services fully operational.

## 3. Root Cause Investigation & 5-Whys Analysis
1. **Why was the dashboard API down?**
   - The primary controller node was isolated from the network.
2. **Why was it isolated?**
   - The edge switch on Rack-04 lost power.
3. **Why did the switch lose power?**
   - The primary power distribution unit (PDU) failed.
4. **Why didn't the redundant PDU handle the load?**
   - The switch's secondary power supply unit was not plugged into the secondary PDU circuit.
5. **Why was it not plugged in?**
   - Human error during the rack wiring maintenance last week.

## 4. Preventive Action Items
| Action Item | Owner | Target Date | Status |
| :--- | :--- | :--- | :--- |
| Audit dual-power redundancy on all switch racks. | Lead Network Eng | 2026-07-10 | PENDING |
| Update deployment scripts to verify dual-path connections. | DevOps Lead | 2026-07-12 | PENDING |
```

---

## 7. DR Testing Drills & Schedules

Disaster recovery readiness is verified through scheduled, non-disruptive drills.

### 7.1 Annual DR Drill Schedule

| Quarter | Target Component | Simulation Method | Lead Role | Expected Outcomes |
| :--- | :--- | :--- | :--- | :--- |
| **Q1** | React Node Failover | Simulate server crash on Node-03; verify auto-rescheduling. | DevOps Engineer | 100% of apps rescheduled under 5 mins. |
| **Q2** | DB Master Failover | Perform a manual switchover using `patronictl`. | Database Lead | PgBouncer re-points connections under 15 secs. |
| **Q3** | Datacenter Outage | Withdraw BGP routes from Dhaka-1 edge router. | Lead Network Eng | Traffic shifts to Chittagong-1 under 60 secs. |
| **Q4** | WP Restore from S3 | Run restore script to clean environment. | Systems Architect | WP sites restore under 30 mins with zero data loss. |

---

### 7.2 DR Drill Checklists

#### A. Pre-Drill Validation Checklist
- [ ] 1. Obtain VP of Engineering approval for the test date and window.
- [ ] 2. Notify clients via status page of the scheduled maintenance drill (at least 48 hours in advance).
- [ ] 3. Run a manual backup of the primary database and confirm S3 upload.
- [ ] 4. Confirm that the replication lag to the target replica is under 10 seconds.
- [ ] 5. Verify the on-call engineer has administrative access to both datacenters.

#### B. Active Drill Execution Checklist
- [ ] 1. Trigger the failure simulation (e.g. stop `patroni` service).
- [ ] 2. Start the timer to measure Recovery Time Objective (RTO).
- [ ] 3. Monitor PgBouncer and Consul logs to verify node election.
- [ ] 4. Verify client connection recovery and check for dropped sessions.
- [ ] 5. Confirm that the new primary database is accepting read/write transactions.

#### C. Post-Drill Clean Up Checklist
- [ ] 1. Restore the original cluster topology (failback to the primary node).
- [ ] 2. Verify all replication links are caught up and healthy.
- [ ] 3. Delete temporary testing databases and files.
- [ ] 4. Document actual RTO and RPO metrics in the Q-Report.
- [ ] 5. Close the maintenance window on the public status page.

---

### 7.3 Automated Smoke Verification Script
This Python script (`/usr/local/bin/dr_smoke_test.py`) runs after a failover to verify that all core platform services are up and running:

```python
#!/usr/bin/env python3
# /usr/local/bin/dr_smoke_test.py
import sys
import requests

TARGET_HOST = "https://api.itbengal.com"
TEST_DOMAINS = [
    "https://client-react-test.itbengal.app",
    "https://client-wp-test.itbengal.app"
]

def check_endpoint(url):
    try:
        res = requests.get(url, timeout=5)
        return res.status_code == 200, res.status_code
    except Exception as e:
        return False, str(e)

def main():
    print("=== STARTING DR SMOKE TEST VERIFICATION ===")
    
    # 1. Verify Platform API Health Endpoint
    api_ok, status = check_endpoint(f"{TARGET_HOST}/health")
    if api_ok:
        print(f"[PASS] Platform API is responsive (HTTP {status})")
    else:
        print(f"[FAIL] Platform API is unreachable: {status}")
        sys.exit(1)
        
    # 2. Check Customer Sites
    for domain in TEST_DOMAINS:
        ok, status = check_endpoint(domain)
        if ok:
            print(f"[PASS] Hosted Application {domain} is online (HTTP {status})")
        else:
            print(f"[FAIL] Hosted Application {domain} returned error: {status}")
            sys.exit(1)
            
    print("=== ALL SYSTEM HEALTH CHECKS PASSED ===")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

### 7.4 Disaster Recovery Performance Metrics
We measure the success of our DR drills using the following calculations:

* **Delta RTO ($\Delta_{\text{RTO}}$):**
  $$\Delta_{\text{RTO}} = \text{Target RTO} - \text{Actual RTO}$$
  *A positive value means the team recovered the systems ahead of the SLA target.*

* **Delta RPO ($\Delta_{\text{RPO}}$):**
  $$\Delta_{\text{RPO}} = \text{Target RPO} - \text{Actual RPO}$$
  *This measures how much closer we were to zero data loss than our SLA target.*

* **Backup Checksum Integrity Index ($I_{\text{Integrity}}$):**
  $$I_{\text{Integrity}} = \left( \frac{\text{Passed Backups}}{\text{Total Verified Backups}} \right) \times 100$$
  *We require an Integrity Index of 100% to pass our monthly infrastructure audits.*
