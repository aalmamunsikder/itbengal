# ITBengal Hosting Platform: Production Monitoring, Logging, and SLA Guide

This document defines the complete production monitoring, logging, alerting, and Service Level Agreement (SLA) architecture for the ITBengal hosting platform. Designed for horizontal scaling across self-managed bare-metal and VPS infrastructure, this system provides 360-degree visibility into physical hosts, application containers, databases, and financial transactions.

---

## 1. Monitoring Stack Architecture

ITBengal utilizes the **LGTM Stack** (Loki, Grafana, Telemetry/Prometheus, and Mimir/Grafana-Telemetry-agents) coupled with high-performance log forwarding. This stack is deployed in a hybrid topology: agents (Node Exporter, cAdvisor, Promtail, Vector) run on every React and WordPress hosting node, while central processing (Prometheus, Loki, Grafana, Alertmanager) runs on a dedicated **Monitoring Platform Server**.

### 1.1 Architectural Topology

The diagram below illustrates the ingestion paths for metrics and logs across the ITBengal fleet:

```mermaid
graph TD
    subgraph "React Node Fleet (1 to N)"
        HostMetricsReact[Node Exporter: Port 9100]
        ContainerMetricsReact[cAdvisor: Port 8080]
        AppLogsReact[Docker App Logs]
        VectorAgentReact[Vector Log Agent]
    end

    subgraph "WordPress Node Fleet (1 to N)"
        HostMetricsWP[Node Exporter: Port 9100]
        MariaDBExporter[MySQLd Exporter: Port 9104]
        PHPFPMExporter[PHP-FPM Exporter: Port 9253]
        WPLogs[Nginx & PHP-FPM Logs]
        PromtailAgentWP[Promtail Log Agent]
    end

    subgraph "Platform Control Plane Server"
        APIExporter[Node.js Client: Port 5000]
        PgExporter[Postgres Exporter: Port 9187]
        RedisExporter[Redis Exporter: Port 9121]
        BullMQExporter[BullMQ Queue Metrics]
    end

    subgraph "Dedicated Monitoring & Management Server"
        PrometheusServer[Prometheus Engine: Port 9090]
        LokiServer[Loki Aggregator: Port 3100]
        GrafanaServer[Grafana UI: Port 3000]
        AlertmanagerServer[Alertmanager: Port 9093]
    end

    %% Metrics Shipping
    HostMetricsReact -->|Pull / HTTP| PrometheusServer
    ContainerMetricsReact -->|Pull / HTTP| PrometheusServer
    HostMetricsWP -->|Pull / HTTP| PrometheusServer
    MariaDBExporter -->|Pull / HTTP| PrometheusServer
    PHPFPMExporter -->|Pull / HTTP| PrometheusServer
    APIExporter -->|Pull / HTTP| PrometheusServer
    PgExporter -->|Pull / HTTP| PrometheusServer
    RedisExporter -->|Pull / HTTP| PrometheusServer
    BullMQExporter -->|Pull / HTTP| PrometheusServer

    %% Logs Shipping
    AppLogsReact -->|Read Socket| VectorAgentReact
    VectorAgentReact -->|Push / HTTP / JSON| LokiServer
    WPLogs -->|Tail Files| PromtailAgentWP
    PromtailAgentWP -->|Push / HTTP / Protobuf| LokiServer

    %% Dashboarding & Alerting
    PrometheusServer -->|Query / PromQL| GrafanaServer
    LokiServer -->|Query / LogQL| GrafanaServer
    PrometheusServer -->|Push Alerts| AlertmanagerServer
    AlertmanagerServer -->|Webhooks / SMS| ITBengalNotification[bKash/SMS/Slack/OpsGenie]
```

### 1.2 Central Monitoring Stack Deployment (`docker-compose.monitoring.yml`)

The following Compose file deploys the centralized monitoring infrastructure on the Dedicated Monitoring Server. It configures Prometheus, Loki, Grafana, and Alertmanager with strict resource limits, persistence, and secure networking.

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: itbengal-prometheus
    restart: always
    volumes:
      - /etc/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - /etc/prometheus/rules:/etc/prometheus/rules:ro
      - /etc/prometheus/alertmanager.yml:/etc/prometheus/alertmanager.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--storage.tsdb.retention.size=150GB'
      - '--web.enable-lifecycle'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.console.libs=/usr/share/prometheus/console_libraries'
    ports:
      - "9090:9090"
    networks:
      - itbengal-monitoring
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8GB
        reservations:
          cpus: '2.0'
          memory: 4GB

  loki:
    image: grafana/loki:2.8.2
    container_name: itbengal-loki
    restart: always
    ports:
      - "3100:3100"
    volumes:
      - /etc/loki/loki-config.yml:/etc/loki/local-config.yaml:ro
      - loki-data:/data
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - itbengal-monitoring
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 12GB
        reservations:
          cpus: '2.0'
          memory: 6GB

  grafana:
    image: grafana/grafana:10.0.1
    container_name: itbengal-grafana
    restart: always
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=ITBengalAdminSecure2026!
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_USERS_DEFAULT_THEME=dark
      - GF_SERVER_ROOT_URL=https://monitor.itbengal.com
      - GF_SMTP_ENABLED=true
      - GF_SMTP_HOST=smtp.mailgun.org:587
      - GF_SMTP_USER=postmaster@itbengal.com
      - GF_SMTP_PASSWORD=mailgun_smtp_password_secret
      - GF_SMTP_FROM_ADDRESS=noreply@itbengal.com
      - GF_SMTP_FROM_NAME="ITBengal Monitoring"
    volumes:
      - /var/lib/grafana:/var/lib/grafana
      - /etc/grafana/provisioning:/etc/grafana/provisioning:ro
    networks:
      - itbengal-monitoring
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4GB

  alertmanager:
    image: prom/alertmanager:v0.25.0
    container_name: itbengal-alertmanager
    restart: always
    ports:
      - "9093:9093"
    volumes:
      - /etc/prometheus/alertmanager.yml:/etc/prometheus/alertmanager.yml:ro
    command:
      - '--config.file=/etc/prometheus/alertmanager.yml'
      - '--storage.path=/alertmanager'
    networks:
      - itbengal-monitoring
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1GB

networks:
  itbengal-monitoring:
    name: itbengal-monitoring
    driver: bridge

volumes:
  prometheus-data:
    driver: local
  loki-data:
    driver: local
```

---

## 2. Prometheus Core Configurations & Metrics

Prometheus operates as the centralized time-series metrics database. The platform implements static service definition dynamic metrics retrieval using file-based discovery configs to support adding horizontal VPS servers seamlessly without restart.

### 2.1 Complete Production Prometheus Configuration (`/etc/prometheus/prometheus.yml`)

```yaml
global:
  scrape_interval: 10s
  evaluation_interval: 10s
  scrape_timeout: 9s
  external_labels:
    environment: production
    datacenter: dhaka-main

rule_files:
  - "/etc/prometheus/rules/system_rules.yml"
  - "/etc/prometheus/rules/container_rules.yml"
  - "/etc/prometheus/rules/database_rules.yml"
  - "/etc/prometheus/rules/business_rules.yml"

alerting:
  alertmanagers:
    - scheme: http
      static_configs:
        - targets:
            - 'alertmanager:9093'

scrape_configs:
  # ----------------------------------------------------
  # 1. Platform Server Node (Express API, BullMQ)
  # ----------------------------------------------------
  - job_name: 'platform-api'
    scheme: https
    metrics_path: '/v1/metrics'
    tls_config:
      ca_file: /etc/ssl/certs/itbengal_internal_ca.crt
      insecure_skip_verify: false
    basic_auth:
      username: 'itbengal_prometheus_agent'
      password: 'API_Metrics_SuperSecretPassword2026'
    static_configs:
      - targets: ['api.itbengal.com:443']
        labels:
          role: platform-control-plane

  # ----------------------------------------------------
  # 2. Database Tier: PostgreSQL Cluster
  # ----------------------------------------------------
  - job_name: 'postgres-nodes'
    metrics_path: '/metrics'
    static_configs:
      - targets:
          - 'db-primary.itbengal.internal:9187'
          - 'db-replica-01.itbengal.internal:9187'
        labels:
          tier: database
          engine: postgresql

  # ----------------------------------------------------
  # 3. Database Tier: Redis Caches
  # ----------------------------------------------------
  - job_name: 'redis-nodes'
    metrics_path: '/metrics'
    static_configs:
      - targets:
          - 'redis-cache-01.itbengal.internal:9121'
          - 'redis-session-01.itbengal.internal:9121'
        labels:
          tier: cache
          engine: redis

  # ----------------------------------------------------
  # 4. React Hosting VPS Nodes (cAdvisor + Host Node Exporter)
  # ----------------------------------------------------
  - job_name: 'react-node-exporter'
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/react_nodes_node_exporter.json'
        refresh_interval: 1m
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        regex: '([^:]+)(:\d+)?'
        replacement: '$1'

  - job_name: 'react-node-cadvisor'
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/react_nodes_cadvisor.json'
        refresh_interval: 1m
    metric_relabel_configs:
      # Filter metrics to control index size
      - source_labels: [__name__]
        regex: '(container_cpu_usage_seconds_total|container_memory_working_set_bytes|container_network_receive_bytes_total|container_network_transmit_bytes_total|container_fs_usage_bytes|container_fs_limit_bytes)'
        action: keep

  # ----------------------------------------------------
  # 5. WordPress Hosting VPS Nodes
  # ----------------------------------------------------
  - job_name: 'wordpress-node-exporter'
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/wordpress_nodes_node_exporter.json'
        refresh_interval: 1m

  - job_name: 'wordpress-nodes-mysql'
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/wordpress_nodes_mysqld.json'
        refresh_interval: 1m

  - job_name: 'wordpress-nodes-phpfpm'
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/wordpress_nodes_phpfpm.json'
        refresh_interval: 1m
```

### 2.2 Dynamic Target Definitions (JSON Files for `file_sd_configs`)

The Platform API automatically manages the JSON target files on the Monitoring Node when new VPS nodes are provisioned.

#### `/etc/prometheus/targets/react_nodes_node_exporter.json`
```json
[
  {
    "targets": [
      "react-vps-01.itbengal.internal:9100",
      "react-vps-02.itbengal.internal:9100",
      "react-vps-03.itbengal.internal:9100"
    ],
    "labels": {
      "tier": "hosting-vps",
      "type": "react",
      "region": "dhaka"
    }
  }
]
```

#### `/etc/prometheus/targets/react_nodes_cadvisor.json`
```json
[
  {
    "targets": [
      "react-vps-01.itbengal.internal:8080",
      "react-vps-02.itbengal.internal:8080",
      "react-vps-03.itbengal.internal:8080"
    ],
    "labels": {
      "tier": "hosting-vps",
      "type": "react",
      "region": "dhaka"
    }
  }
]
```

#### `/etc/prometheus/targets/wordpress_nodes_node_exporter.json`
```json
[
  {
    "targets": [
      "wp-vps-01.itbengal.internal:9100",
      "wp-vps-02.itbengal.internal:9100"
    ],
    "labels": {
      "tier": "hosting-vps",
      "type": "wordpress",
      "region": "dhaka"
    }
  }
]
```

#### `/etc/prometheus/targets/wordpress_nodes_mysqld.json`
```json
[
  {
    "targets": [
      "wp-vps-01.itbengal.internal:9104",
      "wp-vps-02.itbengal.internal:9104"
    ],
    "labels": {
      "tier": "database-mariadb",
      "type": "wordpress",
      "region": "dhaka"
    }
  }
]
```

#### `/etc/prometheus/targets/wordpress_nodes_phpfpm.json`
```json
[
  {
    "targets": [
      "wp-vps-01.itbengal.internal:9253",
      "wp-vps-02.itbengal.internal:9253"
    ],
    "labels": {
      "tier": "runtime-phpfpm",
      "type": "wordpress",
      "region": "dhaka"
    }
  }
]
```

### 2.3 Metric Dictionary & PromQL Specifications

To run and monitor the platform, specific hardware metrics and custom-coded business metrics are evaluated:

| Metric Name | Type | Exporter/Source | Description / Key Labels | PromQL Query Example |
| :--- | :--- | :--- | :--- | :--- |
| **CPU Utilization** | Gauge | Node Exporter | Percentage of CPU execution capacity in use by host. | `100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` |
| **RAM Available** | Gauge | Node Exporter | Bytes of system memory remaining available for use. | `node_memory_MemAvailable_bytes` |
| **Storage Usage %** | Gauge | Node Exporter | Disk space consumption percentage on root volume. | `(node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100` |
| **Network RX/TX** | Counter | Node Exporter | Network interface traffic inbound/outbound in bytes. | **RX:** `sum by (instance) (rate(node_network_receive_bytes_total[5m]))`<br>**TX:** `sum by (instance) (rate(node_network_transmit_bytes_total[5m]))` |
| **Disk IOPS** | Counter | Node Exporter | Read/Write operations completed on disk block devices. | `rate(node_disk_reads_completed_total[5m]) + rate(node_disk_writes_completed_total[5m])` |
| **Deployment Count** | Counter | Platform API | Cumulative counter of site deployments executed. Labeled by: `runtime` (react, static, nextjs), `status` (success, failed). | `sum(rate(itbengal_deployments_total[24h])) by (runtime, status)` |
| **Average Build Duration**| Histogram| Platform Worker | Histogram measuring container compilation time. Labeled by: `runtime`, `node_id`. | `sum(rate(itbengal_build_duration_seconds_sum[1h])) / sum(rate(itbengal_build_duration_seconds_count[1h]))` |
| **Active Containers** | Gauge | cAdvisor | Running Docker application container count. Labeled by: `runtime`, `vps_node`. | `count(container_last_seen{container_label_com_docker_compose_service=""}) by (vps_node)` |
| **Active WordPress DB Queries** | Gauge | MySQL Exporter | Concurrent SQL statements currently running on MariaDB nodes. | `mysql_global_status_threads_running` |
| **MFS Payment Latency** | Histogram| Platform API | Gateway API round-trip request time (bKash, Nagad, Rocket). Labeled by: `provider`, `method`, `status`. | `histogram_quantile(0.95, sum(rate(itbengal_mfs_payment_latency_seconds_bucket[5m])) by (le, provider))` |

---

## 3. Alerting Rules & Thresholds

ITBengal defines alerts within two distinct severity layers:
* **Warning**: Needs attention during working hours. Does not trigger out-of-hours phone calls but posts to Slack/OpsGenie channels.
* **Critical**: Threatens uptime or security. Triggers on-call engineer alarms (SMS, OpsGenie phone call, PagerDuty integration).

### 3.1 Host and Infrastructure Alerts (`/etc/prometheus/rules/system_rules.yml`)

```yaml
groups:
  - name: host_infrastructure_alerts
    rules:
      # Host Availability
      - alert: HostUnreachable
        expr: up == 0
        for: 1m
        labels:
          severity: critical
          tier: infrastructure
        annotations:
          summary: "Host {{ $labels.instance }} is down"
          description: "Prometheus scraping for instance {{ $labels.instance }} has failed for over 1 minute."

      # CPU Exhaustion
      - alert: HostHighCpuUsageWarning
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 10m
        labels:
          severity: warning
          tier: infrastructure
        annotations:
          summary: "High CPU utilization on {{ $labels.instance }}"
          description: "CPU usage on {{ $labels.instance }} is currently {{ $value | printf \"%.2f\" }}%."

      - alert: HostHighCpuUsageCritical
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 95
        for: 5m
        labels:
          severity: critical
          tier: infrastructure
        annotations:
          summary: "CRITICAL: High CPU exhaustion on {{ $labels.instance }}"
          description: "CPU usage on {{ $labels.instance }} has exceeded 95% for 5 continuous minutes."

      # RAM Pressure
      - alert: HostMemoryPressureWarning
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 15
        for: 5m
        labels:
          severity: warning
          tier: infrastructure
        annotations:
          summary: "Host memory pressure on {{ $labels.instance }}"
          description: "Available RAM on {{ $labels.instance }} is under 15% ({{ $value | printf \"%.2f\" }}% remaining)."

      - alert: HostMemoryPressureCritical
        expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 5
        for: 2m
        labels:
          severity: critical
          tier: infrastructure
        annotations:
          summary: "CRITICAL: Out of Memory imminent on {{ $labels.instance }}"
          description: "Available RAM on {{ $labels.instance }} is under 5% ({{ $value | printf \"%.2f\" }}% remaining)."

      # Storage Exhaustion
      - alert: DiskUtilizationWarning
        expr: (node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100 > 80
        for: 5m
        labels:
          severity: warning
          tier: infrastructure
        annotations:
          summary: "Disk utilization warning on {{ $labels.instance }}"
          description: "Root disk utilization on {{ $labels.instance }} is at {{ $value | printf \"%.2f\" }}%."

      - alert: DiskUtilizationCritical
        expr: (node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100 > 92
        for: 2m
        labels:
          severity: critical
          tier: infrastructure
        annotations:
          summary: "CRITICAL: Disk capacity exhausted on {{ $labels.instance }}"
          description: "Root disk space on {{ $labels.instance }} has exceeded 92% utilization ({{ $value | printf \"%.2f\" }}% used)."

      # Disk IOPS Exhaustion
      - alert: HighDiskIOPS
        expr: rate(node_disk_reads_completed_total{device="sda"}[5m]) + rate(node_disk_writes_completed_total{device="sda"}[5m]) > 8000
        for: 10m
        labels:
          severity: warning
          tier: infrastructure
        annotations:
          summary: "High IOPS on disk sda for {{ $labels.instance }}"
          description: "SDA Disk on {{ $labels.instance }} has exceeded 8000 IOPS for over 10 minutes."
```

### 3.2 Container and Runtime Alerts (`/etc/prometheus/rules/container_rules.yml`)

```yaml
groups:
  - name: docker_container_alerts
    rules:
      # Container Restart Loop
      - alert: ContainerRestartLoop
        expr: count_values("restarts", rate(container_last_seen{container_label_com_docker_compose_service=""}[5m])) > 10
        for: 5m
        labels:
          severity: critical
          tier: container
        annotations:
          summary: "Container restart loop detected"
          description: "Container name {{ $labels.name }} on node {{ $labels.vps_node }} is cycling restarts frequently."

      # Failed Container Exits
      - alert: ContainerExitedWithErrorCode
        expr: container_tasks_state{state="stopped"} > 0
        for: 5m
        labels:
          severity: warning
          tier: container
        annotations:
          summary: "Container stopped with error"
          description: "Container {{ $labels.name }} on node {{ $labels.instance }} has stopped or crashed."

      # Let's Encrypt Verification Failure
      - alert: LetsEncryptLoopFailure
        expr: itbengal_ssl_validation_loop_failed_total > 0
        for: 1m
        labels:
          severity: warning
          tier: platform
        annotations:
          summary: "Let's Encrypt renewal loop failure"
          description: "SSL validation loop is failing domain authentication for user domain: {{ $labels.domain }}."

      # Certificate Expiration Tracker
      - alert: SSLCertificateExpirationWarning
        expr: (itbengal_ssl_certificate_expiry_timestamp_seconds - time()) / 86400 <= 30
        for: 1h
        labels:
          severity: warning
          tier: security
        annotations:
          summary: "SSL Certificate expiring soon"
          description: "SSL Certificate for domain {{ $labels.domain }} expires in {{ $value | printf \"%.1f\" }} days."

      - alert: SSLCertificateExpirationCritical
        expr: (itbengal_ssl_certificate_expiry_timestamp_seconds - time()) / 86400 <= 7
        for: 5m
        labels:
          severity: critical
          tier: security
        annotations:
          summary: "CRITICAL: SSL Certificate expiring in less than 7 days"
          description: "SSL certificate for {{ $labels.domain }} expires in {{ $value | printf \"%.1f\" }} days. Emergency intervention required."
```

### 3.3 Platform & Custom Business Alerts (`/etc/prometheus/rules/business_rules.yml`)

```yaml
groups:
  - name: platform_business_alerts
    rules:
      # MFS Gateway Failure/Latency
      - alert: MfsGatewayHighLatency
        expr: histogram_quantile(0.95, sum(rate(itbengal_mfs_payment_latency_seconds_bucket[5m])) by (le, provider)) > 5.0
        for: 3m
        labels:
          severity: warning
          tier: billing
        annotations:
          summary: "High latency on payment gateway {{ $labels.provider }}"
          description: "95th percentile latency of payments via {{ $labels.provider }} is currently {{ $value | printf \"%.2f\" }}s (threshold: 5s)."

      - alert: MfsGatewayErrors
        expr: sum(rate(itbengal_mfs_payments_failed_total[5m])) by (provider) / sum(rate(itbengal_mfs_payments_attempted_total[5m])) by (provider) * 100 > 15
        for: 2m
        labels:
          severity: critical
          tier: billing
        annotations:
          summary: "Payment API failures on {{ $labels.provider }}"
          description: "{{ $labels.provider }} payment failures exceeded 15% (current: {{ $value | printf \"%.2f\" }}%)."

      # WordPress Database Performance Issues
      - alert: WordPressMariaDbHighActiveQueries
        expr: mysql_global_status_threads_running > 80
        for: 5m
        labels:
          severity: warning
          tier: database
        annotations:
          summary: "High active queries on WordPress DB node {{ $labels.instance }}"
          description: "Active SQL threads on DB node {{ $labels.instance }} exceeded 80 for 5 minutes."
```

### 3.4 Production Alertmanager Configurations (`/etc/prometheus/alertmanager.yml`)

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.mailgun.org:587'
  smtp_from: 'alertmanager@itbengal.com'
  smtp_auth_username: 'postmaster@itbengal.com'
  smtp_auth_password: 'mailgun_smtp_password_secret'
  smtp_require_tls: true

templates:
  - '/etc/prometheus/alertmanager/templates/*.tmpl'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-itbengal-ops'
  routes:
    # Route Database and Infrastructure Critical alerts directly to On-Call SMS & PagerDuty
    - match_re:
        severity: critical
      receiver: 'opsgenie-oncall-voice'
      continue: true

    - match:
        tier: billing
      receiver: 'slack-billing-alerts'

    - match:
        severity: warning
      receiver: 'slack-itbengal-ops'

receivers:
  - name: 'slack-itbengal-ops'
    slack_configs:
      - channel: '#ops-alerts'
        api_url: 'https://example.com/slack-webhook-placeholder-1'
        send_resolved: true
        title: '[{{ .Status | toUpper }}] {{ .CommonLabels.alertname }}'
        text: >-
          *Severity:* `{{ .CommonLabels.severity }}`
          *Description:* {{ .CommonAnnotations.description }}
          *Metrics:*
          {{ range .Alerts }}
            - *Instance:* `{{ .Labels.instance }}` -> *Value:* `{{ .LatestValue }}`
          {{ end }}

  - name: 'slack-billing-alerts'
    slack_configs:
      - channel: '#billing-metrics'
        api_url: 'https://example.com/slack-webhook-placeholder-2'
        send_resolved: true
        title: 'Billing Engine Alert - {{ .CommonLabels.alertname }}'
        text: "*Alert Detail:* {{ .CommonAnnotations.description }}"

  - name: 'opsgenie-oncall-voice'
    webhook_configs:
      - url: 'https://api.opsgenie.com/v1/json/prometheus?apiKey=opsgenie-itbengal-production-key'
        send_resolved: true
```

---

## 4. Grafana Dashboards Blueprints

The following specifications define the layout, data source queries, structures, and visual panel mappings for Grafana. All dashboard instances use standard PromQL and LogQL variables.

### 4.1 Global Dashboard Variables

The following variables are defined at the dashboard scope to enable cross-tier filtering:
* `$environment`: Labels based filter (`production`, `staging`). Query: `label_values(up, environment)`
* `$node_type`: Node selector (`react`, `wordpress`, `platform`). Query: `label_values(node_uname_info, type)`
* `$instance`: Physical host server selector. Query: `label_values(up{type="$node_type"}, instance)`
* `$container`: Active Docker container filter. Query: `label_values(container_last_seen, name)`

---

### 4.2 Blueprint 1: Platform Fleet Overview Dashboard

Provides a high-level summary of resources, hosting nodes, active sites, system health, and bandwidth metrics.

#### Panel Grid Layout Configuration

```
+---------------------------------------------------------------------------------------+
|  Panel 1: Host System Uptime Status       |  Panel 2: Global Compute Allocation Gauge |
|  Type: Stat Panel                         |  Type: Bar Gauge                         |
|  Query: count(up == 1) / count(up) * 100  |  Query: CPU, Memory, & Disk utilization  |
+---------------------------------------------------------------------------------------+
|  Panel 3: Fleet Network Throughput (RX/TX Line Graph)                                 |
|  Type: Time Series Graph                                                              |
|  Query RX: sum(rate(node_network_receive_bytes_total[5m])) by (instance)              |
|  Query TX: sum(rate(node_network_transmit_bytes_total[5m])) by (instance)             |
+---------------------------------------------------------------------------------------+
|  Panel 4: Disk IOPS & Latency Tracking    |  Panel 5: Host Health Grid                |
|  Type: Time Series Graph                  |  Type: State Timeline                     |
|  Query: rate(node_disk_read_time_ms...)   |  Query: up{job=~".*exporter"}            |
+---------------------------------------------------------------------------------------+
```

#### Panel Query & Visualization Specifications

1. **Host System Uptime Status Panel**:
   * **Visualization**: Stat Panel
   * **Query**: `sum(up{job="react-node-exporter"})` (Displaying total online nodes vs offline).
   * **Thresholds**: Green > 0.95, Orange 0.90 to 0.95, Red < 0.90.
   * **Unit**: count (servers).

2. **Global Compute Allocation Gauge**:
   * **Visualization**: Gauge
   * **Queries**:
     * *CPU Capacity Used*: `avg(100 - (rate(node_cpu_seconds_total{mode="idle"}[5m]) * 100))`
     * *RAM Allocation*: `avg((node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100)`
     * *Disk Filled Space*: `avg((node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100)`
   * **Display Settings**: Vertical Bar Gauge, limits 0-100%. Thresholds: 70% (yellow), 85% (orange), 92% (red).

3. **Fleet Network Throughput**:
   * **Visualization**: Time Series Line Graph
   * **Queries**:
     * *Inbound*: `sum(rate(node_network_receive_bytes_total{device=~"eth.*|ens.*"}[5m])) by (instance)`
     * *Outbound*: `sum(rate(node_network_transmit_bytes_total{device=~"eth.*|ens.*"}[5m])) by (instance)`
   * **Unit**: bytes/sec (B/s), auto-scaled to MB/s or GB/s.

4. **Disk IOPS & Read/Write Rates**:
   * **Visualization**: Time Series Graph
   * **Queries**:
     * *Read IOPS*: `sum(rate(node_disk_reads_completed_total[1m])) by (instance)`
     * *Write IOPS*: `sum(rate(node_disk_writes_completed_total[1m])) by (instance)`
   * **Unit**: iops.

---

### 4.3 Blueprint 2: React Nodes Health Dashboard

Designed to monitor the performance of customer React, Next.js, and static site containers isolated under Docker CGroups.

#### Panel Grid Layout Configuration

```
+---------------------------------------------------------------------------------------+
|  Panel 1: Running Application Containers  |  Panel 2: Container Memory Limit Violators|
|  Type: Stat Panel                         |  Type: Bar Gauge                         |
|  Query: sum(container_tasks)              |  Query: working_set / memory_limit       |
+---------------------------------------------------------------------------------------+
|  Panel 3: CPU Usage per App Container (Top 10 Stacked)                                |
|  Type: Time Series Graph                                                              |
|  Query: rate(container_cpu_usage_seconds_total{name!=""}[5m])                         |
+---------------------------------------------------------------------------------------+
|  Panel 4: Container Network I/O (RX/TX)   |  Panel 5: Container Local I/O Wait       |
|  Type: Time Series Graph                  |  Type: Heatmap                           |
|  Query: rate(container_network_receive...) |  Query: rate(container_fs_reads_total)   |
+---------------------------------------------------------------------------------------+
```

#### Panel Query & Visualization Specifications

1. **Running Application Containers**:
   * **Visualization**: Stat Panel
   * **Query**: `count(container_last_seen{container_label_itbengal_app="true"})`
   * **Description**: Tracks the actual count of production React/Next applications running on selected server nodes.

2. **Container Memory Limit Violators (OOM Risks)**:
   * **Visualization**: Bar Gauge (Sorted Descending)
   * **Query**: `container_memory_working_set_bytes{container_label_itbengal_app="true"} / container_spec_memory_limit_bytes{container_label_itbengal_app="true"} * 100`
   * **Description**: Identifies containers closest to their container limits.
   * **Thresholds**: 80% (warning), 95% (critical).

3. **CPU Usage per Application Container (Top 10)**:
   * **Visualization**: Time Series Graph (Legend formatted as `{{name}} - {{instance}}`)
   * **Query**: `topk(10, sum by(name, instance) (rate(container_cpu_usage_seconds_total{container_label_itbengal_app="true"}[5m]) * 100))`
   * **Unit**: percent (%).

4. **Container Network I/O**:
   * **Visualization**: Time Series Graph (split axes)
   * **Queries**:
     * *Inbound*: `sum(rate(container_network_receive_bytes_total{name=~"$container"}[5m])) by (name)`
     * *Outbound*: `sum(rate(container_network_transmit_bytes_total{name=~"$container"}[5m])) by (name)`
   * **Unit**: Bytes/sec.

---

### 4.4 Blueprint 3: WordPress Sites Performance Dashboard

Monitors the managed WordPress runtime, including Nginx web engines, PHP-FPM execution pools, and backend MariaDB databases.

#### Panel Grid Layout Configuration

```
+---------------------------------------------------------------------------------------+
|  Panel 1: PHP-FPM Active Processes        |  Panel 2: Slow SQL Queries Monitor       |
|  Type: Gauge Panel                        |  Type: Table List                        |
|  Query: phpfpm_active_processes           |  Query: rate(mysql_slow_queries_total)   |
+---------------------------------------------------------------------------------------+
|  Panel 3: Nginx Request Log Analyzer (LogQL Status Breakdown)                         |
|  Type: Bar Chart / Time Series Stacked                                                |
|  Query: sum(count_over_time({job="nginx-access"} | json [5m])) by (status)            |
+---------------------------------------------------------------------------------------+
|  Panel 4: MariaDB Buffer Pool Cache Hit % |  Panel 5: PHP OPcache Memory Status      |
|  Type: Gauge Panel                        |  Type: Stat Panel                        |
|  Query: Buffer Pool Hit Calculations      |  Query: phpfpm_opcache_free_bytes        |
+---------------------------------------------------------------------------------------+
```

#### Panel Query & Visualization Specifications

1. **PHP-FPM Active Processes**:
   * **Visualization**: Stat Panel
   * **Query**: `sum(phpfpm_active_processes{instance=~"$instance"})`
   * **Thresholds**: 50 (warning), 150 (critical). Indicates standard worker exhaustion.

2. **Slow SQL Queries Monitor**:
   * **Visualization**: Table
   * **Query**: `sum by (instance) (rate(mysql_global_status_slow_queries[5m]))`
   * **Columns**: Instance Host, Queries/Sec. High query rates point to unindexed customer databases.

3. **Nginx HTTP Response Status Codes Breakdown**:
   * **Visualization**: Time Series Stacked Graph
   * **LogQL Query**:
     ```logql
     sum by (status) (
       count_over_time(
         {job="wordpress-nginx-access"}
         | json
         | __error__=""
         [5m]
       )
     )
     ```
   * **Legend**: Status code (`2xx`, `3xx`, `4xx`, `5xx`).
   * **Color Coding**: 2xx (green), 3xx (blue), 4xx (orange), 5xx (red).

4. **MariaDB Buffer Pool Cache Hit Ratio**:
   * **Visualization**: Gauge
   * **Query**:
     ```promql
     (1 - (mysql_global_status_innodb_buffer_pool_reads / mysql_global_status_innodb_buffer_pool_read_requests)) * 100
     ```
   * **Unit**: percent (%). Ideal range: > 98%.

---

### 4.5 Blueprint 4: Billing & Financial Transactions Audit Dashboard

A secure, read-only dashboard designed for technical administrators to monitor financial operations and detect payment gateway failures in real-time.

#### Panel Grid Layout Configuration

```
+---------------------------------------------------------------------------------------+
|  Panel 1: bKash/Nagad Success Rate        |  Panel 2: Active Subscriptions Value      |
|  Type: Stat / Gauge Panel                 |  Type: Stat Panel                        |
|  Query: Success Latency / Errors ratio    |  Query: sum(itbengal_mrr_bdt)            |
+---------------------------------------------------------------------------------------+
|  Panel 3: MFS Payment Request Latencies (bKash vs Nagad vs Rocket)                    |
|  Type: Heatmap / Latency Bucket                                                       |
|  Query: histogram_quantile(0.95, sum(rate(latency_seconds_bucket[5m])) by (le, provider))|
+---------------------------------------------------------------------------------------+
|  Panel 4: Failed Unpaid Invoice Accumulation  |  Panel 5: BullMQ Billing Queue Lag   |
|  Type: Bar Chart                          |  Type: Stat Panel                        |
|  Query: sum(itbengal_unpaid_invoices_bdt) |  Query: bullmq_queue_delayed_jobs        |
+---------------------------------------------------------------------------------------+
```

#### Panel Query & Visualization Specifications

1. **bKash & Nagad Success Rates**:
   * **Visualization**: Stat Panel
   * **Query**: `sum(rate(itbengal_mfs_payments_success_total[5m])) by (provider) / sum(rate(itbengal_mfs_payments_attempted_total[5m])) by (provider) * 100`
   * **Unit**: percent (%).
   * **Thresholds**: Green > 95%, Yellow 85-95%, Red < 85%.

2. **MFS Payment Request Latencies (95th Percentile)**:
   * **Visualization**: Time Series Graph
   * **Query**: `histogram_quantile(0.95, sum(rate(itbengal_mfs_payment_latency_seconds_bucket[5m])) by (le, provider))`
   * **Unit**: seconds (s).

3. **BullMQ Billing Queue Delay**:
   * **Visualization**: Time Series
   * **Query**: `bullmq_queue_delayed_jobs{queue="billing-execution"}`
   * **Description**: Tracks jobs delayed in queue. Persistent growth points to issues in invoice generation processes.

---

## 5. Loki Log Aggregation & Promtail/Vector Pipeline

The ITBengal platform relies on Loki for log storage and indexing. Loki uses metadata labels to organize logs without indexing the full message text, keeping storage costs low.

### 5.1 Loki Configuration (`/etc/loki/loki-config.yml`)

This configuration uses local filesystem storage with a 30-day retention policy and disables unstructured, schema-less logs.

```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096
  log_level: info

common:
  instance_addr: 127.0.0.1
  path_prefix: /data/loki
  storage:
    filesystem:
      chunks_directory: /data/loki/chunks
      rules_directory: /data/loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

limits_config:
  reject_old_samples: true
  reject_old_samples_max_age: 168h
  creation_grace_period: 10m
  enforce_metric_name: false
  max_entries_limit_per_query: 5000
  retention_period: 720h  # 30 days retention

schema_config:
  configs:
    - from: 2026-01-01
      store: tsdb
      object_store: filesystem
      schema: v12
      index:
        prefix: index_
        period: 24h

retention:
  enabled: true
  evaluation_interval: 2h
  shrinkage_enabled: true
```

---

### 5.2 Promtail Agent Configuration (`/etc/promtail/promtail-config.yml`)

Promtail runs on all WordPress nodes. It tails access, error, and system logs, extracts labels, and pushes them to Loki.

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

clients:
  - url: http://monitor-server.itbengal.internal:3100/loki/api/v1/push
    tenant_id: wordpress-tier
    backoff_config:
      max_period: 5m
      max_retries: 10
      min_period: 500ms

positions:
  filename: /tmp/positions.yaml

scrape_configs:
  # 1. Nginx Logs
  - job_name: nginx-access-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: wordpress-nginx-access
          vps_node: wp-node-01
          __path__: /var/log/nginx/*access.log

    pipeline_stages:
      # Parse Nginx logs and extract status codes
      - regex:
          expression: '^(?P<client_ip>\S+) \S+ \S+ \[(?P<timestamp>[^\]]+)\] "(?P<method>\S+) (?P<request>\S+) (?P<protocol>[^"]+)" (?P<status>\d+) (?P<bytes_sent>\d+) "(?P<referrer>[^"]*)" "(?P<user_agent>[^"]*)"'
      - labels:
          status:
          method:

  # 2. PHP-FPM Error Logs
  - job_name: phpfpm-error-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: phpfpm-errors
          vps_node: wp-node-01
          __path__: /var/log/phpfpm/*.log

    pipeline_stages:
      - multiline:
          firstline: '^\[\d{2}-\w{3}-\d{4} \d{2}:\d{2}:\d{2}\]'
          max_wait_time: 3s
      - regex:
          expression: '^\[(?P<timestamp>[^\]]+)\] (?P<level>\S+): (?P<message>.*)$'
      - labels:
          level:
```

---

### 5.3 Vector Log Router Configuration (`/etc/vector/vector.toml`)

Vector runs on React nodes. It parses stdout logs from the Docker socket, filters out sensitive data, and pushes them to Loki.

```toml
[sources.docker_logs]
type = "docker_logs"
exclude_containers = ["itbengal-prometheus", "itbengal-loki", "itbengal-grafana"]

[transforms.filter_app_logs]
type = "filter"
inputs = ["docker_logs"]
condition = '.label."com.docker.compose.project" == "itbengal-apps" || .label."com.itbengal.managed" == "true"'

# Scrub sensitive parameters like passwords and tokens
[transforms.scrub_sensitive_data]
type = "remap"
inputs = ["filter_app_logs"]
source = """
# Strip Authorization headers
if exists(.message) {
  .message = replace(.message, r'([aA]uthorization|[bB]earer)\\s*[:=]\\s*\"?[a-zA-Z0-9_\\-\\.\\+\\/\\=]+\"?', "${1}: [REDACTED]")
  .message = replace(.message, r'([pP]assword|[sS]ecret)\\s*[:=]\\s*\"?[^\",\\n]+\"?', "${1}: [REDACTED]")
  .message = replace(.message, r'([bBkK]ash|[nN]agad)\\s*[aA]pi[kK]ey\\s*[:=]\\s*\"?[^\",\\n]+\"?', "ApiKey: [REDACTED]")
}
"""

[transforms.structure_log_fields]
type = "remap"
inputs = ["scrub_sensitive_data"]
source = """
.vps_node = "react-node-01"
.application_id = .label."com.itbengal.app_id"
.deployment_id = .label."com.itbengal.deployment_id"
.customer_id = .label."com.itbengal.customer_id"
.raw_container_name = .container_name
"""

[sinks.loki_endpoint]
type = "loki"
inputs = ["structure_log_fields"]
endpoint = "http://monitor-server.itbengal.internal:3100"
tenant_id = "react-tier"
labels.job = "react-app-containers"
labels.vps_node = "{{ vps_node }}"
labels.app_id = "{{ application_id }}"
labels.deployment_id = "{{ deployment_id }}"
labels.customer_id = "{{ customer_id }}"
encoding.codec = "json"
```

---

### 5.4 Structured JSON Logging Guidelines

To ensure logs are easily searchable, the Platform API and all custom internal services must output logs to `stdout` as single-line JSON.

#### Required Fields Schema

```json
{
  "timestamp": "ISO-8601 string (e.g., 2026-07-04T17:16:18.000Z)",
  "level": "debug | info | warn | error | fatal",
  "service": "Name of the sub-service (e.g., billing-worker, deployment-engine)",
  "traceId": "W3C traceparent compatible correlation ID",
  "message": "Human readable action statement",
  "context": {
    "key": "value"
  },
  "error": {
    "message": "Standard JavaScript or platform error message",
    "stack": "Trace string"
  }
}
```

#### Node.js / Express Implementation Example (Winston Logger)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'billing-engine' },
  transports: [
    new winston.transports.Console()
  ]
});

// Example Usage
logger.info('Processing subscription renewal payment', {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  context: {
    customerId: 'cust_882910',
    invoiceId: 'inv_2026_09918',
    amount: 1500.00,
    currency: 'BDT',
    provider: 'bkash'
  }
});
```

---

## 6. SLA Monitoring & Uptime Engineering

ITBengal commits to a **99.9% uptime** SLA target. This target is tracked using external checks that monitor core service endpoints.

### 6.1 Uptime Target Definitions

* **Core Platform API**: 99.9% availability.
* **Customer React Deployments**: 99.9% availability.
* **Customer Managed WordPress Deployments**: 99.9% availability.
* **Payment Gateways Processing (bKash/Nagad)**: 99.5% availability.

### 6.2 SLA Calculation Formula

The monthly uptime percentage is calculated using the following formula:

$$SLA\% = \frac{TotalMinutes_{Month} - DowntimeMinutes_{Month}}{TotalMinutes_{Month}} \times 100$$

#### Downtime Criteria

Downtime is defined as any period where two or more probing systems, executing HTTP/2 requests every 10 seconds, receive a response status code outside the `2xx` or `3xx` range for more than 3 consecutive minutes. Planned maintenance windows are excluded from downtime calculations if customers are notified 48 hours in advance.

---

### 6.3 Complete HTTP/2 SLA Monitoring Script (`/opt/itbengal/sla-checker/index.js`)

This Node.js script uses the native HTTP/2 protocol to check endpoints, logs SLA results to a PostgreSQL database, and exposes Prometheus metrics.

```javascript
/**
 * ITBengal Production SLA Probe & Metrics Exposer
 * Location: /opt/itbengal/sla-checker/index.js
 */

const http2 = require('http2');
const http = require('http');
const { Client } = require('pg');

// Configuration
const PROBE_INTERVAL_MS = 10000; // 10 seconds
const PROMETHEUS_PORT = 9199;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://sla_agent:SecureSlaPass2026@db-primary.itbengal.internal:5432/itbengal_prod';

// Monitoring Targets
const TARGETS = [
  { name: 'platform_api', url: 'https://api.itbengal.com', path: '/v1/health' },
  { name: 'customer_dashboard', url: 'https://dash.itbengal.com', path: '/' },
  { name: 'wordpress_gateway', url: 'https://wp-ingress.itbengal.com', path: '/healthz' },
  { name: 'react_gateway', url: 'https://react-ingress.itbengal.com', path: '/healthz' }
];

// In-Memory SLA Telemetry Store
const metricsStore = {};
TARGETS.forEach(target => {
  metricsStore[target.name] = {
    totalChecks: 0,
    successfulChecks: 0,
    lastStatus: 0,
    lastLatencyMs: 0,
    consecutiveFailures: 0
  };
});

// Connect to Database
const pgClient = new Client({ connectionString: DATABASE_URL });
pgClient.connect().then(() => {
  console.log('Connected to ITBengal Database for SLA logging');
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

/**
 * Execute HTTP/2 Ping Check
 */
function probeTarget(target) {
  const startTime = process.hrtime();
  const parsedUrl = new URL(target.url);

  return new Promise((resolve) => {
    let responded = false;

    const client = http2.connect(target.url, {
      settings: { enablePush: false },
      timeout: 5000
    });

    client.on('error', (err) => {
      if (!responded) {
        responded = true;
        resolve({ status: 0, latencyMs: 0, error: err.message });
      }
      client.close();
    });

    client.on('timeout', () => {
      if (!responded) {
        responded = true;
        resolve({ status: 0, latencyMs: 5000, error: 'TIMEOUT' });
      }
      client.close();
    });

    const req = client.request({
      [http2.constants.HTTP2_HEADER_SCHEME]: 'https',
      [http2.constants.HTTP2_HEADER_METHOD]: http2.constants.HTTP2_METHOD_GET,
      [http2.constants.HTTP2_HEADER_PATH]: target.path,
      [http2.constants.HTTP2_HEADER_AUTHORITY]: parsedUrl.host,
      'user-agent': 'ITBengal-SLA-Probe/1.0.0'
    });

    req.on('response', (headers) => {
      const diff = process.hrtime(startTime);
      const latencyMs = Math.round((diff[0] * 1000) + (diff[1] / 1000000));
      const status = parseInt(headers[':status'], 10);

      if (!responded) {
        responded = true;
        resolve({ status, latencyMs, error: null });
      }
      client.close();
    });

    req.end();
  });
}

/**
 * Run Check Loop
 */
async function runLoop() {
  for (const target of TARGETS) {
    const res = await probeTarget(target);
    const m = metricsStore[target.name];

    m.totalChecks++;
    m.lastStatus = res.status;
    m.lastLatencyMs = res.latencyMs;

    const isSuccess = res.status >= 200 && res.status < 400;

    if (isSuccess) {
      m.successfulChecks++;
      m.consecutiveFailures = 0;
    } else {
      m.consecutiveFailures++;
    }

    // Write failures and anomalies directly to database
    if (!isSuccess || res.latencyMs > 3000) {
      try {
        await pgClient.query(
          `INSERT INTO sla_anomalies (target_name, status_code, latency_ms, error_message, checked_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [target.name, res.status, res.latencyMs, res.error || 'BAD_STATUS']
        );
      } catch (dbErr) {
        console.error('Failed to log anomaly to database:', dbErr);
      }
    }

    // Update aggregated daily SLA rates in database
    if (m.totalChecks % 6 === 0) { // Every minute (since interval is 10s)
      const uptimePercentage = (m.successfulChecks / m.totalChecks) * 100;
      try {
        await pgClient.query(
          `INSERT INTO sla_aggregates (target_name, uptime_ratio, checked_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (target_name, date_trunc('day', checked_at))
           DO UPDATE SET uptime_ratio = EXCLUDED.uptime_ratio`,
          [target.name, uptimePercentage]
        );
      } catch (dbErr) {
        console.error('Failed to log SLA aggregation:', dbErr);
      }
    }
  }
}

// Start Probe Loop
setInterval(runLoop, PROBE_INTERVAL_MS);

/**
 * Expose Metrics to Prometheus
 */
http.createServer((req, res) => {
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    let output = '';

    for (const [name, data] of Object.entries(metricsStore)) {
      output += `# HELP itbengal_sla_probe_status Status of SLA probe (1 = UP, 0 = DOWN)\n`;
      output += `# TYPE itbengal_sla_probe_status gauge\n`;
      const isUp = (data.lastStatus >= 200 && data.lastStatus < 400) ? 1 : 0;
      output += `itbengal_sla_probe_status{target="${name}"} ${isUp}\n\n`;

      output += `# HELP itbengal_sla_probe_latency_ms Last response latency of SLA probe in ms\n`;
      output += `# TYPE itbengal_sla_probe_latency_ms gauge\n`;
      output += `itbengal_sla_probe_latency_ms{target="${name}"} ${data.lastLatencyMs}\n\n`;

      output += `# HELP itbengal_sla_probe_total_checks_total Cumulative SLA probe checks run\n`;
      output += `# TYPE itbengal_sla_probe_total_checks_total counter\n`;
      output += `itbengal_sla_probe_total_checks_total{target="${name}"} ${data.totalChecks}\n\n`;

      output += `# HELP itbengal_sla_probe_success_checks_total Cumulative successful SLA probe checks\n`;
      output += `# TYPE itbengal_sla_probe_success_checks_total counter\n`;
      output += `itbengal_sla_probe_success_checks_total{target="${name}"} ${data.successfulChecks}\n\n`;

      output += `# HELP itbengal_sla_probe_consecutive_failures Current consecutive failures count\n`;
      output += `# TYPE itbengal_sla_probe_consecutive_failures gauge\n`;
      output += `itbengal_sla_probe_consecutive_failures{target="${name}"} ${data.consecutiveFailures}\n\n`;
    }

    res.end(output);
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(PROMETHEUS_PORT, () => {
  console.log(`Prometheus metrics endpoint listening on port ${PROMETHEUS_PORT}`);
});
```

---

### 6.4 Operations Runbook for SLA Breaches

When an alert notifies the on-call engineer of an SLA violation, the engineer should follow this runbook.

```
+-----------------------------------------------------------------------------------+
|                            SLA VIOLATION ON-CALL RUNBOOK                          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
                         +---------------------------------+
                         |  Step 1: Validate Alert Scope   |
                         |  - Check Alertmanager for scale |
                         |  - Check status of SLA probe     |
                         +---------------------------------+
                                          |
                                          +-----------------------------------------+
                                          |                                         |
                                          v [Single Node Breach]                    v [Multi-Node / Global Breach]
                          +-------------------------------+         +--------------------------------+
                          | Step 2A: Isolate Node         |         | Step 2B: Check Core Network    |
                          | - Check Host Node metrics     |         | - Test gateway ping paths      |
                          | - Run: systemctl status docker|         | - Check Traefik routers status |
                          +-------------------------------+         +--------------------------------+
                                          |                                         |
                                          v                                         v
                          +-------------------------------+         +--------------------------------+
                          | Step 3A: Restart Service      |         | Step 3B: Database Failover     |
                          | - Run: docker compose restart |         | - Check PG replica lag         |
                          | - Verify logs via Loki/Vector |         | - Run failover script if dead  |
                          +-------------------------------+         +--------------------------------+
                                          |                                         |
                                          v                                         v
                         +-----------------------------------------------------------+
                         | Step 4: Write Post-Mortem incident report in Dashboard    |
                         | - Calculate SLA outage duration and affected accounts.    |
                         +-----------------------------------------------------------+
```

1. **Step 1: Verify the Scope of the Alert**:
   * Log into the Monitoring Dashboard. Determine if the breach affects a single customer site, a single hosting server (React node or WordPress node), or the entire platform control plane.
   * Verify the HTTP/2 SLA probe metrics. If the probe is reporting failures but user sites are responsive, check the SLA probe server's network connection.

2. **Step 2: Service Recovery Procedures**:
   * **React Node Failure**: SSH into the affected host server. Check Docker system health. Run `docker system prune -f` if local volumes are exhausted. Restart the Traefik edge router if routes are failing.
   * **WordPress Node Failure**: Run `systemctl status php8.2-fpm` and `systemctl status mariadb`. Check the PHP-FPM execution pool limit status. If standard mysql pool threads are locked, run `SHOW PROCESSLIST` to identify and terminate unindexed queries.
   * **Database Failover**: If the primary PostgreSQL instance is unreachable, confirm replication status on replicas. Execute the database promotion script: `touch /tmp/postgresql.trigger.5432` on the target standby node to promote it to primary. Update the API connection endpoints via DNS.

3. **Step 3: Customer Notification & Status Updates**:
   * If downtime exceeds 10 minutes, post a notice on the public ITBengal Status page.
   * Once resolved, calculate the total outage duration. Update the database record in `sla_anomalies` to document the root cause and mitigation steps.
