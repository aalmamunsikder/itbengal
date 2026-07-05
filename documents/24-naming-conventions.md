# Naming Conventions and Architectural Coding Standards
**Document Reference**: ITB-STD-024  
**Version**: 1.0.0  
**Target Subsystems**: Monorepo Frontend, Backend Services, Database Schemas, Docker Containerization, Ansible Infrastructure, Git Operations  
**Classification**: Engineering Specification

---

## Executive Summary & Design Philosophy

This document defines the strict, non-negotiable naming conventions and architectural coding standards for the ITBengal Hosting Platform. The platform combines the simplified hosting models of modern platforms with raw VPS deployment orchestration. Due to the high complexity of managing multi-tenant containers, custom DNS zones, automated backup operations, and multi-node routing networks on bare virtual private servers, strict structural consistency is paramount.

Consistency across our Next.js dashboards, Express.js backend microservices, PostgreSQL tables, MariaDB instances, and Ansible orchestrations allows for:
1.  **Reduced Cognitive Load**: Engineers can move between frontend UI work, API construction, database migrations, and provisioning scripts without having to re-learn naming semantics.
2.  **Deterministic Automation**: Automated CI/CD build scripts, health-monitoring pipelines, and log parsers rely on name prefixing rules to auto-discover containers, databases, and metrics targets.
3.  **Static Analysis & Linting Enforcement**: Strict rules can be automatically enforced at the pre-commit stage and during pull request checks.

Any pull request containing naming structures that violate this specification will be blocked automatically.

---

## 1. Architectural Coding Conventions (TypeScript & React)

Our application layer is built using a TypeScript monorepo containing a Next.js client dashboard, Express.js API services, and shared packages.

### 1.1 File and Directory Naming Conventions

All filesystem paths in the ITBengal repository must follow these rules based on their function:

*   **React Components**: Always use **PascalCase** (e.g., `DeploymentLogsCard.tsx`, `SidebarNavigation.tsx`).
*   **Hooks**: Always use **camelCase** prefixed with `use` (e.g., `useDeploymentStats.ts`, `useSocketSubscription.ts`).
*   **Utilities, Helper Functions, and Services**: Always use **camelCase** (e.g., `formatCurrency.ts`, `apiClient.ts`, `calculateDiskSpace.ts`).
*   **Static Assets**: Always use lowercase **kebab-case** (e.g., `brand-logo-dark.svg`, `default-user-avatar.png`, `empty-state-search.svg`).
*   **Routes (Next.js App Router)**: Always use lowercase **kebab-case** for directories, and standard Next.js file extensions (e.g., `app/(dashboard)/project/[projectId]/deployments/page.tsx`).
*   **Configuration Files**: Always use lowercase **kebab-case** or standard dotfiles naming (e.g., `tailwind.config.js`, `tsconfig.json`, `jest.config.ts`, `.eslintrc.json`).
*   **Test Files**: Test files must reside alongside the source file they target. Suffix the source file name with `.test` or `.spec` matching the source casing:
    *   `DeploymentLogsCard.tsx` -> `DeploymentLogsCard.test.tsx`
    *   `formatBytes.ts` -> `formatBytes.spec.ts`

#### Directory Structure Reference Layout

```text
packages/
├── ui/
│   ├── src/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.module.css
│   │   └── Modal/
│   │       ├── Modal.tsx
│   │       └── Modal.module.css
apps/
├── dashboard/ (Next.js)
│   ├── public/
│   │   └── assets/
│   │       ├── brand-logo-light.svg
│   │       ├── hero-illustration.png
│   │       └── icon-bkash.svg
│   └── src/
│       ├── components/
│       │   ├── cards/
│       │   │   ├── DeploymentLogsCard.tsx
│       │   │   └── ServerMetricsCard.tsx
│       │   └── feedback/
│       │       └── ToastNotification.tsx
│       ├── hooks/
│       │   ├── useAuthSession.ts
│       │   └── useDeploymentStats.ts
│       ├── utils/
│       │   ├── formatBytes.ts
│       │   └── parseEnvironmentVariables.ts
│       └── app/
│           ├── (dashboard)/
│           │   ├── billing/
│           │   │   └── page.tsx
│           │   └── wordpress-hosting/
│           │       └── page.tsx
│           └── api/
│               └── health/
│                   └── route.ts
```

---

### 1.2 TypeScript Naming Standards

TypeScript files must adhere to standard ECMAScript conventions while clarifying type definitions and preventing namespace collisions:

*   **Variables**: Use **camelCase** (e.g., `const totalActiveContainers = 12;`, `let currentBackupProgress = 85;`).
*   **Functions**: Use **camelCase** (e.g., `function getActiveDeployments(projectId: string) { ... }`).
*   **Interfaces**: Use **PascalCase**. Do not prefix interfaces with `I` (e.g., use `UserProfile`, not `IUserProfile`). The only exception is legacy third-party overrides. Suffix interfaces representing Component props with `Props` (e.g., `interface ButtonProps`).
*   **Types**: Use **PascalCase** (e.g., `type DeploymentState = 'pending' | 'building' | 'deployed' | 'failed';`).
*   **Enums**: Use **PascalCase** for the enum type name, and **UPPER_SNAKE_CASE** for the member values to indicate they are constant declarations (e.g., `enum NodeStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', DRAINING = 'DRAINING' }`).
*   **Constants**: Use **UPPER_SNAKE_CASE** for true application constants (e.g., `export const MAX_BUILD_TIMEOUT_SEC = 600;`, `export const DEFAULT_PAGE_SIZE = 50;`).
*   **Boolean Variables**: Must be prefixed with `is`, `has`, `should`, or `can` to clarify their boolean type (e.g., `const isTwoFactorEnabled = true;`, `const hasActiveSubscription = false;`, `const shouldTriggerRebuild = true;`, `const canUserModifySettings = true;`).
*   **Generics**: Use single uppercase letters for generic type parameters (e.g., `T`, `U`) or descriptive names prefixed with `T` if there are multiple generics (e.g., `TResponse`, `TRequest`, `TEntity`).

#### TypeScript Convention Code Example

```typescript
// Enums
export enum DeploymentTrigger {
  GIT_PUSH = 'GIT_PUSH',
  MANUAL_REDEPLOY = 'MANUAL_REDEPLOY',
  ROLLBACK = 'ROLLBACK',
  ZIP_UPLOAD = 'ZIP_UPLOAD',
}

export enum PricingTier {
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

// Interfaces
export interface ServerNode {
  id: string;
  hostName: string;
  ipAddress: string;
  maxCpuCoreCount: number;
  allocatedMemoryMb: number;
  isHealthy: boolean;
  hasSslEnabled: boolean;
  shouldDrainingBeTriggered: boolean;
}

export interface ProjectDomain {
  id: string;
  domainName: string;
  isPrimary: boolean;
  hasCustomDnsConfigured: boolean;
  sslCertificateStatus: 'none' | 'valid' | 'expired';
}

// Type Aliases
export type PlatformStatus = 'healthy' | 'degraded' | 'offline';
export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

// Constants
export const DEFAULT_PAGE_SIZE_LIMIT = 50;
export const BKASH_API_VERSION = 'v1.2.0-beta';
export const MAX_ALLOWED_TEAM_MEMBERS = 100;

// Generics Naming
export interface ApiResponseEnvelope<TData> {
  success: boolean;
  data: TData;
  timestamp: string;
}

export function parseResponseJson<TResponse>(payload: string): ApiResponseEnvelope<TResponse> {
  const parsed = JSON.parse(payload) as ApiResponseEnvelope<TResponse>;
  return parsed;
}
```

---

### 1.3 React Component Specifications

To prevent prop drill pollution and layout inconsistency, components must conform to the following architectural specification:

*   **Props Naming**: Interface names must be `[ComponentName]Props` (e.g., `DeploymentLogsCardProps`).
*   **Props Destructuring**: Destructure props in the function arguments declaration line. Avoid inline type definitions.
*   **Handler Callbacks**:
    *   Props representing event handlers passed down to components must be prefixed with `on` (e.g., `onDeploymentSelect`, `onFilterChange`).
    *   Internal handler functions implementing the callback or browser event must be prefixed with `handle` (e.g., `handleDeploymentSelect`, `handleFilterChange`).
*   **Refs**: Use `[ElementOrPurpose]Ref` (e.g., `terminalScrollRef`, `formContainerRef`).
*   **Custom Hooks Returns**: When returning arrays, ensure elements are ordered by utility (value, setter). When returning objects, use clear camelCase properties.

#### React Component Specification Example

```tsx
import React, { useRef, useState, useEffect } from 'react';

// Props Interface naming
interface DeploymentLogsCardProps {
  projectId: string;
  initialLogs: string[];
  isLoading: boolean;
  onRefreshLogs: (projectId: string) => Promise<void>; // Prop handler starts with 'on'
  onLogSelect?: (logLine: string) => void;
}

export const DeploymentLogsCard: React.FC<DeploymentLogsCardProps> = ({
  projectId,
  initialLogs,
  isLoading,
  onRefreshLogs,
  onLogSelect, // Destructured arguments
}) => {
  const [logs, setLogs] = useState<string[]>(initialLogs);
  const terminalScrollRef = useRef<HTMLDivElement>(null); // Ref named with Ref suffix

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  // Internal handler prefixing with 'handle'
  const handleRefreshClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      await onRefreshLogs(projectId);
    } catch (error) {
      console.error('Failed to reload logs:', error);
    }
  };

  const handleLineClick = (lineContent: string) => {
    if (onLogSelect) {
      onLogSelect(lineContent);
    }
  };

  return (
    <div className="card-container">
      <h3>Logs for Project: {projectId}</h3>
      <div ref={terminalScrollRef} className="logs-terminal">
        {logs.map((log, index) => (
          <pre 
            key={`${projectId}-log-${index}`}
            onClick={() => handleLineClick(log)}
            className="log-line"
          >
            {log}
          </pre>
        ))}
      </div>
      <button onClick={handleRefreshClick} disabled={isLoading}>
        {isLoading ? 'Refreshing...' : 'Refresh Logs'}
      </button>
    </div>
  );
};
```

---

## 2. API & Network Conventions

Standardizing routing, websocket channels, and exchange formats ensures integration between services is simple and diagnostic data can be parsed uniformly by API gateways and log parsers.

### 2.1 RESTful Endpoint Routing Rules

API URLs must follow REST patterns using plural nouns, kebab-case variables, and clear version paths:

*   **Version Prefix**: Prefix all routes with the version (e.g., `/api/v1/`).
*   **Resource Collections**: Use lowercase, plural nouns (e.g., `/api/v1/projects`, `/api/v1/server-nodes`).
*   **Nested Relations**: Follow hierarchy patterns:
    *   `/api/v1/projects/:projectId/deployments`
    *   `/api/v1/domains/:domainId/dns-records`
*   **Actions Outside CRUD**: If an operation does not map directly to `GET`, `POST` (create), `PUT` (overwrite), or `DELETE`, use `POST` with the verb appended to the end of the resource path:
    *   `POST /api/v1/projects/:projectId/rebuild`
    *   `POST /api/v1/wordpress-sites/:siteId/clone`
    *   `POST /api/v1/servers/:serverId/reboot`
*   **Query Parameters**: Use camelCase for keys (e.g., `?sortBy=createdAt&pageSize=15&includeBackups=true`).

#### Detailed Route Reference Mapping

| Method | Endpoint Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/projects` | List all projects belonging to the active organization |
| `POST` | `/api/v1/projects` | Create a new project configuration |
| `GET` | `/api/v1/projects/:projectId` | Fetch details of a specific project |
| `PUT` | `/api/v1/projects/:projectId` | Update core details of a project |
| `DELETE` | `/api/v1/projects/:projectId` | Terminate and delete a project |
| `GET` | `/api/v1/projects/:projectId/deployments` | List all deployments associated with a project |
| `POST` | `/api/v1/projects/:projectId/deployments` | Trigger a new manual deployment |
| `GET` | `/api/v1/projects/:projectId/deployments/:deploymentId` | Get status metrics of a specific deployment |
| `POST` | `/api/v1/projects/:projectId/deployments/:deploymentId/rollback` | Roll back site build to this version |
| `GET` | `/api/v1/wordpress-sites` | Fetch list of active WordPress hosting nodes |
| `POST` | `/api/v1/wordpress-sites` | Deploy new WordPress VPS site container |
| `POST` | `/api/v1/wordpress-sites/:siteId/backup` | Trigger instant backup snapshot |
| `POST` | `/api/v1/wordpress-sites/:siteId/restore` | Restore site database and assets to backup state |

---

### 2.2 WebSocket Event Channels Naming Schema

WebSocket events use **dot-notation** to segregate namespaces, components, resource identifiers, and specific status actions. The format is:
`[namespace].[resource_scope].[resource_id].[action]`

*   **Namespaces**: Suffix components according to accessibility:
    *   `admin`: Restricted to platform operations dashboards.
    *   `client`: Accessible by authenticated client dashboards.
*   **Resource Scope**: Plural resource name (e.g., `projects`, `deployments`, `servers`).
*   **Resource ID**: The dynamic UUID representing the entity (or `*` for wildcard bindings in admin scopes).
*   **Action**: Verb representing the state update.

#### WebSocket Channel Naming Examples

*   `client.deployments.083c21a4-92e1-4560-8451-2fe68d6f51cb.log-stream`
*   `client.projects.882c31e9-44fc-4871-92b0-8c231122a2bb.status-changed`
*   `client.servers.441a2e7c-a81d-4de6-91e8-d14fb901ff2f.metrics-update`
*   `admin.servers.node-bd-dhaka-01.cpu-load-alert`
*   `admin.servers.*.health-alert`

#### WebSocket Message Envelope Structure

All messages passed across the WebSocket channel must wrapped in a standard JSON wrapper:

```json
{
  "event": "client.deployments.083c21a4-92e1-4560-8451-2fe68d6f51cb.log-stream",
  "stream": "stdout",
  "payload": {
    "step": "BUILDING",
    "message": "npm run build: compilation successful in 4.2 seconds.",
    "timestamp": "2026-07-04T17:18:02.124Z"
  }
}
```

---

### 2.3 Standard API Response Payload Patterns

To build predictable API integrations, all REST responses must share structural wrappers.

#### 2.3.1 Single Entity Response (Success)

```json
{
  "success": true,
  "data": {
    "id": "proj-9012a9e3-228c-4a3e-b819",
    "name": "itbengal-ecommerce",
    "framework": "nextjs",
    "createdAt": "2026-07-04T10:00:00Z"
  }
}
```

#### 2.3.2 Paginated List Response (Success)

```json
{
  "success": true,
  "data": [
    {
      "id": "dep-3392a9ee-4188-4231",
      "status": "deployed",
      "commitHash": "a9d3e84",
      "createdAt": "2026-07-04T11:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### 2.3.3 Error Payload Pattern

If a request fails (HTTP Status `4xx` or `5xx`), the response must utilize this schema:

```json
{
  "success": false,
  "error": {
    "code": "ERR_DEPLOY_BUILD_FAIL",
    "message": "The build script execution failed on the compilation step.",
    "details": [
      {
        "field": "buildScript",
        "issue": "Command 'npm run build' exited with code 1"
      }
    ],
    "trackingId": "req-88cf1a22-3a9d-479c-b1e0-798823fca881"
  }
}
```

---

## 3. Database & SQL Conventions (PostgreSQL & MariaDB)

Our database layer maps to multiple engines: PostgreSQL handles core configuration metadata on the Platform Server, while MariaDB handles WordPress-specific resources on host instances. Naming conventions across both must be fully uniform.

### 3.1 snake_case Schemas Naming Rules

*   **Tables**: Use lowercase, plural nouns (e.g., `users`, `projects`, `server_nodes`). Keep names descriptive and avoid abbreviations.
*   **Columns**: Use lowercase, singular **snake_case** (e.g., `first_name`, `created_at`, `disk_limit_mb`).
*   **Primary Keys**: The primary key column must always be named exactly `id` and store a secure UUIDv4 in PostgreSQL, or an auto-incrementing BIGINT in MariaDB.
*   **Foreign Keys**: Follow the pattern `[referenced_table_singular]_id` (e.g., `project_id` pointing to the `projects` table).
*   **Join Tables (Many-to-Many Relationships)**: Combine the names of both tables in alphabetical order using snake_case (e.g., `projects_users`, `roles_users`). Suffixes representing actions can override alphabetical order if it improves business domain semantics (e.g., `project_members`).

---

### 3.2 Constraint & Index Naming Conventions

SQL engines require explicit index and constraint names to simplify schema migrations and stack trace diagnostics.

| Constraint / Index Type | Prefix | Schema Pattern | Example |
| :--- | :--- | :--- | :--- |
| **Primary Key** | `pk_` | `pk_[table_name]` | `pk_server_nodes` |
| **Foreign Key** | `fk_` | `fk_[source_table]_[target_table]_[source_col]` | `fk_projects_users_user_id` |
| **Unique Constraint** | `uq_` | `uq_[table_name]_[column_name]` | `uq_users_email` |
| **Check Constraint** | `chk_` | `chk_[table_name]_[column_name]` | `chk_projects_cpu_limit` |
| **Normal Index** | `idx_` | `idx_[table_name]_[column_name(s)]` | `idx_deployments_status` |
| **Unique Index** | `udx_` | `udx_[table_name]_[column_name(s)]` | `udx_domains_domain_name` |

#### Sample DDL Script Demonstrating Naming Rules

```sql
-- Create users table first
CREATE TABLE users (
    id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Create projects table
CREATE TABLE projects (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL,
    cpu_limit_cores DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    memory_limit_mb INTEGER NOT NULL DEFAULT 512,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints Naming
    CONSTRAINT pk_projects PRIMARY KEY (id),
    CONSTRAINT fk_projects_users_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_projects_subdomain UNIQUE (subdomain),
    CONSTRAINT chk_projects_cpu_limit CHECK (cpu_limit_cores > 0.0),
    CONSTRAINT chk_projects_memory_limit CHECK (memory_limit_mb >= 128)
);

-- Compound Index for sorting/filtering
CREATE INDEX idx_projects_user_id_created_at ON projects (user_id, created_at DESC);

-- Unique index
CREATE UNIQUE INDEX udx_projects_project_name_user_id ON projects (project_name, user_id);

-- Create deployments table
CREATE TABLE deployments (
    id UUID NOT NULL,
    project_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    commit_hash VARCHAR(40),
    build_log_path VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_deployments PRIMARY KEY (id),
    CONSTRAINT fk_deployments_projects_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_deployments_project_id ON deployments (project_id);
CREATE INDEX idx_deployments_status ON deployments (status);
```

---

### 3.3 Migration Files Naming Conventions

Migration scripts must be prefixed with a 14-character timestamp followed by a snake_case description of the target schema changes:
`[YYYYMMDDHHMMSS]_[action]_[target_tables].sql` (or `.ts` if using Knex/TypeORM)

*   **Timestamp**: `20260704171802` represents 2026-07-04 17:18:02.
*   **Actions**:
    *   `create_`: Instantiating tables.
    *   `add_col_to_`: Appending attributes.
    *   `drop_col_from_`: Deleting fields.
    *   `create_idx_`: Generating secondary indexes.

#### Migration File Structure Examples

*   `20260704100512_create_users_table.sql`
*   `20260704111530_add_disk_usage_to_wordpress_sites.sql`
*   `20260704124500_create_idx_deployments_project_id.sql`

All migrations must provide isolated `up` and `down` actions (either in separate `.up.sql` / `.down.sql` files or explicitly exported in typescript handlers).

---

## 4. Containerization & Infrastructure Naming

Because the ITBengal platform runs entirely on self-managed VPS systems, container names, networks, and storage components must follow predictable naming structures to allow monitoring tools (Prometheus, Loki, Traefik) to dynamically configure route configurations and alert handlers.

### 4.1 Docker Image Tags & Registries

Docker images must follow the structure:
`[registry]/itbengal/[service_name]:[tag_version]`

*   **Registry**: Suffix with local or external domain (e.g., `registry.itbengal.com` or `itbengal` for standard Hub repos).
*   **Service Name**: Use kebab-case matching the monorepo package name (e.g., `api-gateway`, `deployment-engine`, `wp-backup-agent`).
*   **Tags**:
    *   **Production**: Semantic versioning (e.g., `v1.2.4`). Suffixing versions with build metadata is allowed (e.g., `v1.2.4-build423`).
    *   **Staging / Development**: Branch matching or git commits (e.g., `staging-a81d4de`, `dev-latest`).
    *   **Third-party Images**: Always pin explicit versions. **Never use the `:latest` tag in production deployment descriptors** (e.g., use `postgres:16.2-alpine`, NOT `postgres:latest`).

---

### 4.2 Docker Containers, Networks, and Volumes

To prevent name collisions on multi-tenant nodes, configurations must use standardized prefixing rules:

*   **Container Names**: Use the pattern `itbengal-[environment]-[service]` (e.g., `itbengal-prod-api`, `itbengal-dev-redis`).
*   **Volumes**: Suffix naming to target volume location type (e.g., `itbengal_prod_db_data`, `itbengal_prod_wp_uploads`).
*   **Networks**:
    *   `itbengal_internal`: Backend services network isolated from external interface.
    *   `itbengal_ingress`: Exposed to the reverse proxy (Traefik/Nginx).
    *   `itbengal_node_mesh`: Node synchronization network.
*   **Labels**: Use reverse domain notation for user-defined metadata:
    *   `org.itbengal.project-id`
    *   `org.itbengal.managed-by`
    *   `org.itbengal.billing.tier`

#### Docker Compose Reference Configuration

```yaml
version: '3.8'

services:
  api:
    image: registry.itbengal.com/itbengal/platform-api:v1.2.0
    container_name: itbengal-prod-api
    labels:
      org.itbengal.environment: "production"
      org.itbengal.managed-by: "ansible"
    networks:
      - itbengal_ingress
      - itbengal_internal
    volumes:
      - itbengal_prod_api_logs:/var/log/itbengal

  postgres:
    image: postgres:16.2-alpine
    container_name: itbengal-prod-postgres
    networks:
      - itbengal_internal
    volumes:
      - itbengal_prod_db_data:/var/lib/postgresql/data

networks:
  itbengal_ingress:
    name: itbengal_prod_ingress
    external: true
  itbengal_internal:
    name: itbengal_prod_internal

volumes:
  itbengal_prod_api_logs:
    name: itbengal_prod_api_logs
  itbengal_prod_db_data:
    name: itbengal_prod_db_data
```

---

### 4.3 Ansible Roles and Variables

Ansible orchestrates raw VPS hardware configurations. Standard naming maps variables to roles safely:

*   **Role Directory Names**: Kebab-case representing function (e.g., `roles/install-docker/`, `roles/configure-firewall/`).
*   **Role Variables Prefix**: To avoid scope shadowing, prefix all local variables within a role with the role name using snake_case:
    *   Variables in role `install_docker` must be formatted as `install_docker_version`, `install_docker_pkg_state`.
*   **Global Variables**: Prefixed with `global_` (e.g., `global_itbengal_domain`, `global_smtp_server`).
*   **Inventory Hosts & Groups**: Use lowercase, dot-separated identifiers representing geographical region and node group (e.g., `bd.platform.prod.node-1`, `intl.wordpress.staging.node-2`).

#### Ansible Playbook/Variable Structure Example

```yaml
# group_vars/bd_platform_nodes.yml
global_itbengal_domain: itbengal.com
global_dns_resolver_ips:
  - 1.1.1.1
  - 8.8.8.8

# roles/install-docker/defaults/main.yml
install_docker_version: "25.0.3"
install_docker_compose_version: "v2.24.5"
install_docker_enable_metrics: true

# roles/install-docker/tasks/main.yml
- name: Ensure docker group is present
  ansible.builtin.group:
    name: docker
    state: present

- name: Install docker runtime engine
  ansible.builtin.apt:
    name: "docker-ce={{ install_docker_version }}~3-0~ubuntu"
    state: present
    update_cache: yes
```

---

## 5. Git & Code Operations

Standardized version control history makes it easy to track deployments, support hotfixes, and automate changelog generation.

### 5.1 Git Branch Naming Types

All branch names must begin with a standardized workflow prefix followed by the Jira ticket reference or ticket-less identifier, and a short kebab-case description:
`[type]/[ticket-id]-[short-description]`

*   `feature/`: New features, capabilities, additions.
    *   Example: `feature/ITB-403-bkash-checkout`
*   `bugfix/`: Resolving bugs, code defects, logical errors.
    *   Example: `bugfix/ITB-129-logs-scroll-lock`
*   `hotfix/`: Emergency production patches (bypassing normal staging cycles).
    *   Example: `hotfix/ITB-911-ssl-handshake-timeout`
*   `release/`: Tagging release candidate builds.
    *   Example: `release/v1.3.0-rc1`
*   `docs/`: Updating user guides, diagrams, markdown specifications.
    *   Example: `docs/naming-conventions-overhaul`
*   `refactor/`: Reworking code architecture without changing functionality.
    *   Example: `refactor/clean-deployment-runner`
*   `chore/`: Updating build pipelines, npm package upgrades, dev tooling.
    *   Example: `chore/bump-vite-dependency`

---

### 5.2 Conventional Commits Naming Standards

Commit headers must follow the format:
`[type]([optional-scope]): [description]`

#### Commit Types Definitions

*   **feat**: A new feature was introduced.
*   **fix**: A bug was resolved.
*   **docs**: Documentation changes only.
*   **style**: Code style changes (whitespace, formatting, missing semi-colons) that do not affect compilation or execution.
*   **refactor**: A code change that neither fixes a bug nor adds a feature.
*   **perf**: Code modification focused purely on improving performance.
*   **test**: Adding missing tests or correcting existing tests.
*   **chore**: Maintenance tasks, build system updates, dependency updates.
*   **ci**: Changes to CI/CD files and pipeline scripts.

#### Commit Message Examples

```text
feat(billing): integrate Nagad payment gateway redirect pipeline
```

```text
fix(wordpress): resolve connection timeout when mapping custom domains to remote containers
```

```text
chore(deps): update nextjs from 14.1.0 to 14.2.0 in root package.json
```

```text
refactor(deployment-engine): extract container health check verification loop
```

---

### 5.3 CSS Variables and CSS Modules Rules

CSS patterns must ensure variables are defined globally and class names are scoped locally to prevent leakages across dashboard themes.

#### CSS Custom Properties (Variables)
Use **kebab-case** variables prefixed with double dashes. Group variables under categories representing scale:
`--[category]-[variant]-[state]`

*   Colors: `--color-primary-500`, `--color-background-darker`
*   Typography: `--font-size-base`, `--font-weight-semibold`
*   Spacing: `--spacing-layout-medium`, `--spacing-element-small`
*   Transitions: `--transition-duration-fast`

#### CSS Modules
To support dot-notation access in React Components (`styles.sidebarContent`), all CSS class names inside CSS modules must be written in **camelCase**.

*   Good: `.sidebarContainer { ... }`, `.primaryButton { ... }`
*   Bad: `.sidebar-container { ... }`, `.primary_button { ... }`

#### CSS Module and React Usage Example

```css
/* src/components/cards/deploymentCard.module.css */
.cardContainer {
  background-color: var(--color-background-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--border-radius-large);
  padding: var(--spacing-layout-medium);
  transition: border-color var(--transition-duration-fast) ease-in-out;
}

.cardContainer:hover {
  border-color: var(--color-primary-500);
}

.statusIndicatorActive {
  background-color: var(--color-status-success);
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
```

```tsx
// src/components/cards/DeploymentCard.tsx
import React from 'react';
import styles from './deploymentCard.module.css'; // Class names map to keys on styles object

interface DeploymentCardProps {
  status: 'active' | 'inactive';
}

export const DeploymentCard: React.FC<DeploymentCardProps> = ({ status }) => {
  return (
    <div className={styles.cardContainer}>
      <div className="flex items-center gap-2">
        {status === 'active' && <div className={styles.statusIndicatorActive} />}
        <span>Status: {status}</span>
      </div>
    </div>
  );
};
```

---

### 5.4 Uniform System Error Codes

Uniform System Error Codes use the format `ERR_[MODULE]_[ERROR_DESCRIPTION]`. All API gateways, microservices, background workers, and client engines must return error codes mapped to this lookup structure to streamline debugging and simplify troubleshooting for our customer support teams.

#### System Error Code Reference Table

| Error Code | Module | HTTP Status | User-Facing Message | Internal Description |
| :--- | :--- | :--- | :--- | :--- |
| `ERR_AUTH_EXPIRED` | `AUTH` | `401` | Your session has expired. Please log in again. | The JWT or session token has expired. |
| `ERR_AUTH_INVALID_TOKEN` | `AUTH` | `401` | Authentication failed. The security token is invalid. | Signature verification or formatting check on token failed. |
| `ERR_AUTH_INSUFFICIENT_PERMISSIONS` | `AUTH` | `403` | You do not have permission to perform this action. | RBAC validator blocked client based on roles. |
| `ERR_AUTH_MFA_REQUIRED` | `AUTH` | `400` | Multi-factor authentication code is required. | Session validated but pending 2FA token verify. |
| `ERR_AUTH_LIMIT_REACHED` | `AUTH` | `429` | Too many failed login attempts. Account temporarily locked. | Brute force detection triggered locks on user account. |
| `ERR_DEPLOY_BUILD_FAIL` | `DEPLOY` | `500` | Application build failed. Check your build logs. | Webpack/Vite build task failed with non-zero exit code. |
| `ERR_DEPLOY_CLONE_FAIL` | `DEPLOY` | `500` | Failed to clone repository. Check configuration. | Git clone failed due to network or repository permissions. |
| `ERR_DEPLOY_OOM_KILLED` | `DEPLOY` | `500` | Build process terminated due to resource exhaustion. | Build runtime exceeded node memory limits. |
| `ERR_DEPLOY_CONFIG_INVALID` | `DEPLOY` | `400` | Configuration schema in `itbengal.json` contains errors. | Schema verification of repository build manifest failed. |
| `ERR_DEPLOY_QUEUING_TIMEOUT` | `DEPLOY` | `504` | Deployment request timed out waiting for a slot. | BullMQ build runner queue exceeded execution time limit. |
| `ERR_BILLING_GATEWAY_TIMEOUT` | `BILLING` | `504` | Payment provider failed to respond. Please try again. | Outstream HTTP request timeout to payment gateways. |
| `ERR_BILLING_CARD_DECLINED` | `BILLING` | `402` | Credit card transaction was declined. | Stripe engine returned transaction decline code. |
| `ERR_BILLING_INSUFFICIENT_FUNDS` | `BILLING` | `402` | Wallet balance is insufficient to complete checkout. | bKash/Nagad/Rocket transaction code indicating no balance. |
| `ERR_BILLING_INVOICE_PAID` | `BILLING` | `400` | This invoice has already been settled. | Action attempted on a finalized and paid ledger record. |
| `ERR_BILLING_SUBSCRIPTION_ACTIVE` | `BILLING` | `409` | An active subscription already exists for this project. | Duplicate billing subscription enrollment attempt. |
| `ERR_DNS_RESOLVE_FAILED` | `DNS` | `500` | Hostname lookup failed. Verification cannot proceed. | Upstream resolution queries did not resolve name target. |
| `ERR_DNS_ZONE_NOT_FOUND` | `DNS` | `404` | DNS hosting zone was not registered on our system. | Zone query requested on domain not delegated to our NS. |
| `ERR_DNS_RECORD_EXISTS` | `DNS` | `409` | A record with this configuration already exists. | Duplicate key conflict within resource schema. |
| `ERR_DNS_API_FAILURE` | `DNS` | `502` | External DNS registry failed to apply changes. | Openprovider API returned connection error code. |
| `ERR_VPS_PROVISION_TIMEOUT` | `INFRA` | `504` | Node setup timed out. Infrastructure scale is retrying. | Host provisioning took longer than the 10-minute threshold. |
| `ERR_VPS_CONNECTION_FAILED` | `INFRA` | `503` | Target node connection offline. | Agent failed to connect to local VPS daemon port. |
| `ERR_VPS_DISK_FULL` | `INFRA` | `507` | Storage capacity on the target host has been exceeded. | Volume creation failed; disk utilization exceeded 95%. |
| `ERR_VPS_CPU_OVERLOAD` | `INFRA` | `503` | Host is experiencing heavy load. Task rescheduled. | CPU target load exceeded threshold metrics. |
| `ERR_VPS_DOCKER_DOWN` | `INFRA` | `500` | System backend docker daemon is unresponsive. | Systemd status query returned docker.service as failed. |
| `ERR_WP_INSTALL_FAILED` | `WP` | `500` | WordPress installation files failed to unpack. | Target folder write failed or wp-cli package corrupted. |
| `ERR_WP_DB_CONNECTION` | `WP` | `500` | Site dashboard database connection could not be verified. | WordPress wp-config.php values cannot hook MariaDB. |
| `ERR_WP_STAGING_EXISTS` | `WP` | `409` | A staging instance already exists for this site. | WordPress cloning process blocked by active staging directory. |
| `ERR_WP_BACKUP_FAILED` | `WP` | `500` | Site backup script execution failed. | Archive build or DB schema dump encountered disk errors. |
| `ERR_DB_QUERY_FAILED` | `DB` | `500` | Data transaction failed. Try again. | DB engine returned generic syntax or connection error. |
| `ERR_DB_CONNECTION_LIMIT` | `DB` | `503` | Database cluster pool has run out of connections. | Server client connection request rejected by Postgres. |
| `ERR_DB_UNIQUE_VIOLATION` | `DB` | `409` | Record with this unique identifier already exists. | Database unique index check failed on insert transaction. |
| `ERR_DB_FOREIGN_KEY_VIOLATION` | `DB` | `400` | Attempted to link to an invalid foreign record. | DB engine foreign constraint check failed. |
| `ERR_API_RATE_LIMIT_EXCEEDED` | `API` | `429` | Request threshold reached. Slow down. | API rate limit bucket has reached 0 capacity. |
| `ERR_API_INVALID_INPUT` | `API` | `400` | The payload data did not pass formatting checks. | Zod validation engine found structural input errors. |
| `ERR_API_NOT_FOUND` | `API` | `404` | Requested path or resource could not be found. | Route map does not exist or resource uuid is missing in DB. |
| `ERR_API_INTERNAL_SERVER_ERROR` | `API` | `500` | An unexpected software error occurred. | Catch-all handler outputting details to Loki logs. |

---

## 6. Document Metadata & Execution Rules

This document serves as the absolute authority on naming rules for all microservices, frontend applications, configuration files, and infrastructure databases in the ITBengal platform. Violations of this specification will fail Automated Build Pipelines during static lint checks.

### 6.1 Enforcement Strategies

To ensure absolute compliance, the engineering platform uses the following tooling integrations:

1.  **Linter Rules (ESLint)**: Extends standard TypeScript rules to mandate boolean naming standards (`is*`, `has*`, `should*`) and naming restrictions on directories and component files.
2.  **Husky & commitlint**: Prevents git pushes that do not follow Conventional Commits standard patterns or that specify invalid branch names.
3.  **Database Migration Checkers**: Automated scripts verify index names match `idx_[table_name]_[column_name]` formats during PR review.
4.  **SonarQube Quality Gate**: Blocks code merge approvals if CSS variable classifications violate scale formats.
