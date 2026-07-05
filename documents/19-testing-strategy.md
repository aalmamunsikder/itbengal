# Testing Strategy

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| **Document**    | Testing Strategy                       |
| **Version**     | 1.0                                    |
| **Date**        | 2026-07-04                             |
| **Status**      | Approved                               |
| **Owner**       | Engineering Lead                       |
| **Applies To**  | All ITBengal platform services         |

---

## Table of Contents

- [1. Testing Philosophy & Objectives](#1-testing-philosophy--objectives)
- [2. Testing Pyramid](#2-testing-pyramid)
- [3. Unit Testing](#3-unit-testing)
- [4. Integration Testing](#4-integration-testing)
- [5. End-to-End Testing](#5-end-to-end-testing)
- [6. Performance Testing](#6-performance-testing)
- [7. Security Testing](#7-security-testing)
- [8. Test Environment Architecture](#8-test-environment-architecture)
- [9. Test Data Management](#9-test-data-management)
- [10. CI/CD Integration](#10-cicd-integration)
- [11. Test Reporting](#11-test-reporting)
- [12. Regression Testing](#12-regression-testing)
- [13. Per-Module Testing Approach](#13-per-module-testing-approach)

---

## 1. Testing Philosophy & Objectives

### 1.1 Quality-First Culture

Quality is a shared responsibility across the entire engineering organization. Every developer is a tester. Every code change ships with tests. There is no "testing phase" — testing is embedded into every stage of the development lifecycle.

### 1.2 Shift-Left Testing

Defects are cheapest to fix when caught early. Our strategy prioritizes:

- **Static analysis** at code-authoring time (TypeScript strict mode, ESLint, Prettier)
- **Unit tests** written alongside production code (TDD encouraged)
- **Integration tests** running on every pull request
- **E2E tests** gating every release

### 1.3 Key Objectives

| Objective              | Target                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| **Reliability**        | 99.9% uptime; zero data-loss incidents                                 |
| **Security**           | Zero critical/high vulnerabilities in production                       |
| **Performance**        | API p95 < 200 ms; page load < 3 s                                     |
| **User Experience**    | All critical user journeys pass E2E on every release                   |
| **Developer Velocity** | Test suite completes in < 15 min in CI                                 |
| **Coverage**           | ≥ 80% line coverage, ≥ 75% branch coverage across all services        |

---

## 2. Testing Pyramid

```mermaid
graph TB
    subgraph Pyramid["Testing Pyramid"]
        E2E["🔺 E2E Tests<br/>~10% of tests<br/>Playwright"]
        INT["🔶 Integration Tests<br/>~20% of tests<br/>Supertest + Testcontainers"]
        UNIT["🟩 Unit Tests<br/>~70% of tests<br/>Jest + RTL"]
    end

    E2E --> INT --> UNIT

    style E2E fill:#ef4444,stroke:#dc2626,color:#fff
    style INT fill:#f59e0b,stroke:#d97706,color:#fff
    style UNIT fill:#22c55e,stroke:#16a34a,color:#fff
```

### Distribution Rationale

| Level           | Ratio | Characteristics                                               |
| --------------- | ----- | ------------------------------------------------------------- |
| **Unit**        | 70%   | Fast (< 50 ms each), isolated, high coverage, low cost        |
| **Integration** | 20%   | Moderate speed, tests real interactions, catches wiring bugs   |
| **E2E**         | 10%   | Slow, expensive, validates complete user journeys              |

> **Principle:** Push tests as low on the pyramid as possible. Only test at a higher level what cannot be validated at a lower level.

---

## 3. Unit Testing

### 3.1 Frameworks & Tools

| Tool                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| **Jest**                  | Test runner, assertions, mocking     |
| **React Testing Library** | Component testing (frontend)         |
| **MSW (Mock Service Worker)** | API mocking for frontend tests  |
| **ts-jest**               | TypeScript support for Jest          |

### 3.2 Coverage Requirements

| Metric            | Minimum | Target |
| ----------------- | ------- | ------ |
| Line coverage     | 80%     | 90%    |
| Branch coverage   | 75%     | 85%    |
| Function coverage | 80%     | 90%    |
| Statement coverage| 80%     | 90%    |

Coverage is enforced in CI. PRs that drop coverage below the minimum threshold are blocked.

### 3.3 Jest Configuration

```typescript
// jest.config.ts (root)
import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/apps/web/jest.config.ts',
    '<rootDir>/apps/api/jest.config.ts',
    '<rootDir>/packages/*/jest.config.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/',
    '/test/',
    '/.next/',
    '/migrations/',
    '/seeds/',
  ],
};

export default config;
```

```typescript
// apps/web/jest.config.ts (Next.js frontend)
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.ts',
  ],
};

export default createJestConfig(config);
```

```typescript
// apps/api/jest.config.ts (Express.js backend)
import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/migrations/**',
    '!src/seeds/**',
  ],
};

export default config;
```

### 3.4 React Component Test

```typescript
// apps/web/src/components/features/projects/ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from './ProjectCard';
import type { Project } from '@/types/project';

const mockProject: Project = {
  id: 'proj_abc123',
  name: 'my-react-app',
  framework: 'nextjs',
  status: 'active',
  lastDeployedAt: '2026-07-01T12:00:00Z',
  domain: 'my-react-app.itbengal.app',
  repositoryUrl: 'https://github.com/user/my-react-app',
};

describe('ProjectCard', () => {
  it('renders project name and framework', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('my-react-app')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
  });

  it('displays active status badge', () => {
    render(<ProjectCard project={mockProject} />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Active');
    expect(badge).toHaveClass('badge-success');
  });

  it('shows last deployment time in relative format', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<ProjectCard project={mockProject} onSelect={onSelect} />);
    await user.click(screen.getByRole('article'));

    expect(onSelect).toHaveBeenCalledWith('proj_abc123');
  });

  it('renders deploy button for active projects', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByRole('button', { name: /deploy/i })).toBeEnabled();
  });

  it('disables deploy button for suspended projects', () => {
    const suspended = { ...mockProject, status: 'suspended' as const };
    render(<ProjectCard project={suspended} />);

    expect(screen.getByRole('button', { name: /deploy/i })).toBeDisabled();
  });
});
```

### 3.5 Express.js Service Test

```typescript
// apps/api/src/services/__tests__/deploymentService.test.ts
import { DeploymentService } from '../deploymentService';
import { DeploymentRepository } from '../../repositories/deploymentRepository';
import { ProjectRepository } from '../../repositories/projectRepository';
import { NodeSelector } from '../../infrastructure/nodeSelector';
import { DeploymentQueue } from '../../queues/deploymentQueue';
import { DeploymentStatus } from '../../types/deployment';
import { AppError } from '../../errors/AppError';

jest.mock('../../repositories/deploymentRepository');
jest.mock('../../repositories/projectRepository');
jest.mock('../../infrastructure/nodeSelector');
jest.mock('../../queues/deploymentQueue');

describe('DeploymentService', () => {
  let service: DeploymentService;
  let deploymentRepo: jest.Mocked<DeploymentRepository>;
  let projectRepo: jest.Mocked<ProjectRepository>;
  let nodeSelector: jest.Mocked<NodeSelector>;
  let deploymentQueue: jest.Mocked<DeploymentQueue>;

  beforeEach(() => {
    deploymentRepo = new DeploymentRepository() as jest.Mocked<DeploymentRepository>;
    projectRepo = new ProjectRepository() as jest.Mocked<ProjectRepository>;
    nodeSelector = new NodeSelector() as jest.Mocked<NodeSelector>;
    deploymentQueue = new DeploymentQueue() as jest.Mocked<DeploymentQueue>;

    service = new DeploymentService(
      deploymentRepo,
      projectRepo,
      nodeSelector,
      deploymentQueue,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createDeployment', () => {
    it('creates a deployment and enqueues build job', async () => {
      const projectId = 'proj_abc123';
      const userId = 'usr_xyz789';

      projectRepo.findByIdAndUserId.mockResolvedValue({
        id: projectId,
        userId,
        name: 'my-app',
        framework: 'nextjs',
        status: 'active',
      });

      nodeSelector.selectBestNode.mockResolvedValue({
        id: 'node_01',
        hostname: 'react-node-01.itbengal.com',
        availableSlots: 50,
      });

      deploymentRepo.create.mockResolvedValue({
        id: 'dep_new001',
        projectId,
        status: DeploymentStatus.Queued,
        nodeId: 'node_01',
        createdAt: new Date(),
      });

      const result = await service.createDeployment(projectId, userId, {
        branch: 'main',
        commitSha: 'abc123def',
      });

      expect(result.status).toBe(DeploymentStatus.Queued);
      expect(nodeSelector.selectBestNode).toHaveBeenCalledWith('react');
      expect(deploymentQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ deploymentId: 'dep_new001' }),
      );
    });

    it('throws NotFoundError if project does not exist', async () => {
      projectRepo.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        service.createDeployment('proj_invalid', 'usr_xyz789', { branch: 'main' }),
      ).rejects.toThrow(AppError);
    });

    it('throws error if project is suspended', async () => {
      projectRepo.findByIdAndUserId.mockResolvedValue({
        id: 'proj_abc123',
        userId: 'usr_xyz789',
        name: 'my-app',
        framework: 'nextjs',
        status: 'suspended',
      });

      await expect(
        service.createDeployment('proj_abc123', 'usr_xyz789', { branch: 'main' }),
      ).rejects.toThrow('Project is suspended');
    });
  });
});
```

### 3.6 Custom Hook Test

```typescript
// apps/web/src/hooks/__tests__/useDeployments.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useDeployments } from '../useDeployments';
import type { ReactNode } from 'react';

const mockDeployments = [
  {
    id: 'dep_001',
    status: 'live',
    branch: 'main',
    commitMessage: 'feat: add dashboard',
    createdAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'dep_002',
    status: 'building',
    branch: 'feat/billing',
    commitMessage: 'feat: add billing page',
    createdAt: '2026-07-02T14:00:00Z',
  },
];

const server = setupServer(
  http.get('/api/v1/projects/:projectId/deployments', () => {
    return HttpResponse.json({
      success: true,
      data: mockDeployments,
      meta: { total: 2, page: 1, limit: 20 },
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useDeployments', () => {
  it('fetches deployments for a project', async () => {
    const { result } = renderHook(
      () => useDeployments('proj_abc123'),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].id).toBe('dep_001');
  });

  it('handles API errors gracefully', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId/deployments', () => {
        return HttpResponse.json(
          { success: false, error: { message: 'Project not found' } },
          { status: 404 },
        );
      }),
    );

    const { result } = renderHook(
      () => useDeployments('proj_invalid'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### 3.7 Zod Schema Validation Test

```typescript
// apps/api/src/schemas/__tests__/deploymentSchema.test.ts
import { createDeploymentSchema, updateDeploymentSchema } from '../deploymentSchema';

describe('createDeploymentSchema', () => {
  it('validates a correct deployment request', () => {
    const validInput = {
      branch: 'main',
      commitSha: 'abc123def456',
      environmentVariables: {
        NODE_ENV: 'production',
        API_URL: 'https://api.itbengal.com',
      },
    };

    const result = createDeploymentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects an empty branch name', () => {
    const input = { branch: '' };

    const result = createDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('branch');
    }
  });

  it('rejects branch names with invalid characters', () => {
    const input = { branch: 'my branch with spaces' };

    const result = createDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('validates optional commitSha format', () => {
    const input = { branch: 'main', commitSha: 'not-a-hex' };

    const result = createDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('limits environment variable key length', () => {
    const input = {
      branch: 'main',
      environmentVariables: {
        ['A'.repeat(256)]: 'value',
      },
    };

    const result = createDeploymentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
```

### 3.8 Mocking Strategies

| Strategy           | When to Use                                | Tool          |
| ------------------ | ------------------------------------------ | ------------- |
| `jest.mock()`      | Module-level mocking (repos, services)     | Jest          |
| `jest.spyOn()`     | Spy on methods without replacing them      | Jest          |
| MSW handlers       | Mock HTTP APIs in frontend/integration     | MSW           |
| Manual mocks       | Complex modules needing custom behavior    | Jest `__mocks__` |
| Factory functions  | Generate test data with controlled values  | Custom + Faker |

**Rules:**
- Never mock what you don't own (use integration tests instead).
- Always restore mocks in `afterEach` to prevent test pollution.
- Prefer dependency injection over `jest.mock()` in backend services.

---

## 4. Integration Testing

### 4.1 Frameworks & Tools

| Tool                   | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| **Supertest**          | HTTP endpoint testing                      |
| **testcontainers-node**| Disposable Docker containers for DB/Redis  |
| **Jest**               | Test runner                                |
| **Prisma / Knex**      | Database migrations in test environment    |

### 4.2 What to Test

- API endpoint request/response contracts
- Middleware chains (auth → validation → handler → error handling)
- Database CRUD operations with real PostgreSQL
- Redis cache operations with real Redis
- BullMQ job enqueue/dequeue with real Redis
- Inter-service communication patterns
- File upload/download flows

### 4.3 Test Container Setup

```typescript
// apps/api/test/setup/testContainers.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';

let pgContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;

export async function setupTestContainers() {
  pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('itbengal_test')
    .withUsername('test')
    .withPassword('test')
    .withExposedPorts(5432)
    .start();

  redisContainer = await new RedisContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  // Set environment variables for the test process
  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  // Run database migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: pgContainer.getConnectionUri() },
  });
}

export async function teardownTestContainers() {
  await pgContainer?.stop();
  await redisContainer?.stop();
}

export function getPostgresConnectionUri(): string {
  return pgContainer.getConnectionUri();
}
```

### 4.4 API Route Integration Test

```typescript
// apps/api/test/integration/deployments.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestContainers, teardownTestContainers } from '../setup/testContainers';
import { seedTestUser, generateAuthToken } from '../helpers/auth';
import { seedTestProject } from '../helpers/projects';
import { prisma } from '../../src/lib/prisma';

let authToken: string;
let testProjectId: string;

beforeAll(async () => {
  await setupTestContainers();

  const user = await seedTestUser(prisma);
  authToken = generateAuthToken(user);
  const project = await seedTestProject(prisma, user.id);
  testProjectId = project.id;
}, 60_000); // 60s timeout for container startup

afterAll(async () => {
  await prisma.$disconnect();
  await teardownTestContainers();
});

afterEach(async () => {
  // Clean deployment records between tests
  await prisma.deployment.deleteMany({});
});

describe('POST /api/v1/projects/:projectId/deployments', () => {
  it('creates a deployment and returns 201', async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${testProjectId}/deployments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ branch: 'main' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      projectId: testProjectId,
      status: 'queued',
      branch: 'main',
    });
    expect(response.body.data.id).toBeDefined();
  });

  it('returns 401 without authentication', async () => {
    await request(app)
      .post(`/api/v1/projects/${testProjectId}/deployments`)
      .send({ branch: 'main' })
      .expect(401);
  });

  it('returns 404 for non-existent project', async () => {
    await request(app)
      .post('/api/v1/projects/proj_nonexistent/deployments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ branch: 'main' })
      .expect(404);
  });

  it('returns 422 for invalid branch name', async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${testProjectId}/deployments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ branch: '' })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 403 if user lacks project access', async () => {
    const otherUser = await seedTestUser(prisma, 'other@test.com');
    const otherToken = generateAuthToken(otherUser);

    await request(app)
      .post(`/api/v1/projects/${testProjectId}/deployments`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ branch: 'main' })
      .expect(403);
  });
});

describe('GET /api/v1/projects/:projectId/deployments', () => {
  it('returns paginated deployments', async () => {
    // Seed multiple deployments
    await prisma.deployment.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        projectId: testProjectId,
        status: 'completed',
        branch: 'main',
        commitSha: `sha_${i}`,
      })),
    });

    const response = await request(app)
      .get(`/api/v1/projects/${testProjectId}/deployments`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.data).toHaveLength(10);
    expect(response.body.meta.total).toBe(25);
    expect(response.body.meta.totalPages).toBe(3);
  });
});
```

### 4.5 Authentication Flow Integration Test

```typescript
// apps/api/test/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestContainers, teardownTestContainers } from '../setup/testContainers';
import { prisma } from '../../src/lib/prisma';

beforeAll(async () => {
  await setupTestContainers();
}, 60_000);

afterAll(async () => {
  await prisma.$disconnect();
  await teardownTestContainers();
});

afterEach(async () => {
  await prisma.user.deleteMany({});
});

describe('Authentication Flow', () => {
  const validUser = {
    email: 'test@itbengal.com',
    password: 'SecurePass123!',
    name: 'Test User',
  };

  it('completes full signup → login → access protected route', async () => {
    // Step 1: Register
    const signupRes = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser)
      .expect(201);

    expect(signupRes.body.data.user.email).toBe(validUser.email);

    // Step 2: Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password })
      .expect(200);

    const { accessToken, refreshToken } = loginRes.body.data;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // Step 3: Access protected route
    const profileRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileRes.body.data.email).toBe(validUser.email);
  });

  it('prevents login with incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'WrongPassword!' })
      .expect(401);
  });

  it('rate limits login attempts', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);

    // Make 10 failed login attempts
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'wrong' });
    }

    // 11th attempt should be rate limited
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'wrong' })
      .expect(429);

    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

### 4.6 Test Database Seeding & Cleanup

| Strategy                    | When to Use                                                  |
| --------------------------- | ------------------------------------------------------------ |
| **beforeAll seed**          | Shared read-only data across all tests in a describe block   |
| **beforeEach seed**         | Each test needs a fresh, known state                         |
| **afterEach cleanup**       | Remove data created by individual tests                      |
| **Transaction rollback**    | Wrap each test in a transaction, rollback after               |
| **Truncate tables**         | Fast cleanup between test suites                              |

```typescript
// apps/api/test/helpers/cleanup.ts
import { PrismaClient } from '@prisma/client';

const tablesToClean = [
  'deployment_logs',
  'deployments',
  'environment_variables',
  'domains',
  'projects',
  'sessions',
  'users',
];

export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  for (const table of tablesToClean) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}
```

---

## 5. End-to-End Testing

### 5.1 Framework & Configuration

**Framework:** Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e-results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### 5.2 User Registration & Login Flow

```typescript
// e2e/auth/registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('new user can register and access dashboard', async ({ page }) => {
    const uniqueEmail = `test+${Date.now()}@itbengal.com`;

    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveTitle(/Sign Up.*ITBengal/);

    // Fill registration form
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password', { exact: true }).fill('SecurePass123!');
    await page.getByLabel('Confirm Password').fill('SecurePass123!');
    await page.getByRole('checkbox', { name: /terms/i }).check();

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome, Test User')).toBeVisible();
  });

  test('shows validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.getByRole('button', { name: /create account/i }).click();

    // Verify validation errors
    await expect(page.getByText('Full name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('shows error for duplicate email', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill('existing@itbengal.com');
    await page.getByLabel('Password', { exact: true }).fill('SecurePass123!');
    await page.getByLabel('Confirm Password').fill('SecurePass123!');
    await page.getByRole('checkbox', { name: /terms/i }).check();

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText('An account with this email already exists')).toBeVisible();
  });
});
```

### 5.3 Project Deployment Flow

```typescript
// e2e/deployments/deploy-project.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Project Deployment', () => {
  test.use({
    storageState: 'e2e/.auth/user.json', // Pre-authenticated state
  });

  test('deploy a React project from GitHub', async ({ page }) => {
    // Navigate to new project page
    await page.goto('/projects/new');

    // Step 1: Select source
    await page.getByRole('button', { name: /import from github/i }).click();

    // Step 2: Select repository
    await page.getByPlaceholder('Search repositories...').fill('my-react-app');
    await page.getByText('user/my-react-app').click();

    // Step 3: Configure project
    await page.getByLabel('Project Name').fill('my-react-app');
    await page.getByLabel('Framework').selectOption('nextjs');
    await page.getByLabel('Branch').selectOption('main');
    await page.getByLabel('Build Command').fill('npm run build');
    await page.getByLabel('Output Directory').fill('.next');

    // Step 4: Add environment variables
    await page.getByRole('button', { name: /add variable/i }).click();
    await page.getByPlaceholder('KEY').fill('API_URL');
    await page.getByPlaceholder('Value').fill('https://api.example.com');

    // Step 5: Deploy
    await page.getByRole('button', { name: /deploy/i }).click();

    // Verify deployment started
    await expect(page.getByText('Deployment started')).toBeVisible();
    await expect(page.getByTestId('deployment-status')).toHaveText('Building');

    // Wait for build to complete (with extended timeout)
    await expect(page.getByTestId('deployment-status')).toHaveText('Live', {
      timeout: 300_000, // 5-minute timeout for build
    });

    // Verify deployment URL is shown
    await expect(page.getByTestId('deployment-url')).toContainText('.itbengal.app');
  });

  test('rollback to a previous deployment', async ({ page }) => {
    await page.goto('/projects/my-react-app/deployments');

    // Find a previous successful deployment
    const previousDeploy = page.getByTestId('deployment-row').nth(1);
    await previousDeploy.getByRole('button', { name: /rollback/i }).click();

    // Confirm rollback
    await page.getByRole('dialog').getByRole('button', { name: /confirm rollback/i }).click();

    // Verify rollback started
    await expect(page.getByText('Rollback initiated')).toBeVisible();
  });
});
```

### 5.4 Visual Regression Testing

```typescript
// e2e/visual/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('dashboard matches snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('project detail page matches snapshot', async ({ page }) => {
    await page.goto('/projects/my-react-app');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('project-detail.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});
```

### 5.5 Cross-Browser Testing Matrix

| Browser   | Engine   | Desktop | Mobile  | Priority |
| --------- | -------- | ------- | ------- | -------- |
| Chrome    | Chromium | ✅      | ✅      | P0       |
| Firefox   | Gecko    | ✅      | —       | P1       |
| Safari    | WebKit   | ✅      | ✅      | P1       |
| Edge      | Chromium | ✅      | —       | P2       |

---

## 6. Performance Testing

### 6.1 Tools

| Tool          | Purpose                                 |
| ------------- | --------------------------------------- |
| **k6**        | Load testing, stress testing, soak tests |
| **Artillery** | API scenario-based testing              |
| **Lighthouse**| Frontend performance auditing           |
| **Web Vitals**| Real-user monitoring metrics            |

### 6.2 Performance Budgets

| Metric                    | Budget        | Alert Threshold |
| ------------------------- | ------------- | --------------- |
| Largest Contentful Paint  | < 2.5 s       | > 3.0 s         |
| First Input Delay         | < 100 ms      | > 150 ms        |
| Cumulative Layout Shift   | < 0.1         | > 0.15          |
| Time to Interactive       | < 2.5 s       | > 3.5 s         |
| API Response (p50)        | < 100 ms      | > 150 ms        |
| API Response (p95)        | < 200 ms      | > 350 ms        |
| API Response (p99)        | < 500 ms      | > 800 ms        |
| Deployment Trigger        | < 5 s         | > 8 s           |
| Page Load (Full)          | < 3 s         | > 4 s           |
| JS Bundle Size (gzipped)  | < 200 KB      | > 250 KB        |
| Database Query (p95)      | < 50 ms       | > 100 ms        |
| Redis Operation (p95)     | < 5 ms        | > 10 ms         |

### 6.3 k6 Load Test Script

```javascript
// performance/tests/api-load.k6.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const deploymentDuration = new Trend('deployment_trigger_duration');

export const options = {
  scenarios: {
    // Baseline: normal traffic
    baseline: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      gracefulStop: '30s',
    },
    // Spike: sudden traffic surge
    spike: {
      executor: 'ramping-vus',
      startTime: '5m',
      stages: [
        { duration: '30s', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 50 },
      ],
    },
    // Stress: gradually increase load
    stress: {
      executor: 'ramping-vus',
      startTime: '8m',
      stages: [
        { duration: '2m', target: 100 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 500 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
    deployment_trigger_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging-api.itbengal.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

export default function () {
  group('Dashboard API', () => {
    // Get projects list
    const projectsRes = http.get(`${BASE_URL}/api/v1/projects`, { headers });
    check(projectsRes, {
      'GET /projects returns 200': (r) => r.status === 200,
      'GET /projects responds within 200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(projectsRes.status !== 200);

    // Get deployment history
    const deploymentsRes = http.get(
      `${BASE_URL}/api/v1/projects/proj_test/deployments?limit=20`,
      { headers },
    );
    check(deploymentsRes, {
      'GET /deployments returns 200': (r) => r.status === 200,
    });
    errorRate.add(deploymentsRes.status !== 200);
  });

  group('Deployment Trigger', () => {
    const start = Date.now();
    const deployRes = http.post(
      `${BASE_URL}/api/v1/projects/proj_test/deployments`,
      JSON.stringify({ branch: 'main' }),
      { headers },
    );
    deploymentDuration.add(Date.now() - start);

    check(deployRes, {
      'POST /deployments returns 201': (r) => r.status === 201,
      'Deployment is queued': (r) => JSON.parse(r.body).data.status === 'queued',
    });
  });

  sleep(1);
}
```

### 6.4 Artillery Scenario

```yaml
# performance/tests/deployment-flow.artillery.yml
config:
  target: "https://staging-api.itbengal.com"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 50
      name: "Peak load"
  defaults:
    headers:
      Content-Type: "application/json"
  plugins:
    expect: {}

scenarios:
  - name: "Full Deployment Flow"
    flow:
      # Login
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "loadtest@itbengal.com"
            password: "{{ $processEnvironment.LOAD_TEST_PASSWORD }}"
          capture:
            - json: "$.data.accessToken"
              as: "authToken"
          expect:
            - statusCode: 200

      # List projects
      - get:
          url: "/api/v1/projects"
          headers:
            Authorization: "Bearer {{ authToken }}"
          capture:
            - json: "$.data[0].id"
              as: "projectId"
          expect:
            - statusCode: 200
            - hasProperty: "data"

      # Trigger deployment
      - post:
          url: "/api/v1/projects/{{ projectId }}/deployments"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            branch: "main"
          capture:
            - json: "$.data.id"
              as: "deploymentId"
          expect:
            - statusCode: 201

      # Check deployment status
      - get:
          url: "/api/v1/deployments/{{ deploymentId }}"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200

      - think: 2
```

### 6.5 Database Query Performance Benchmarks

| Query Category                      | p50 Target | p95 Target | p99 Target |
| ----------------------------------- | ---------- | ---------- | ---------- |
| Simple SELECT by primary key        | < 2 ms     | < 5 ms     | < 10 ms    |
| List with pagination (20 rows)      | < 10 ms    | < 30 ms    | < 50 ms    |
| Complex JOIN (3+ tables)            | < 20 ms    | < 50 ms    | < 100 ms   |
| Full-text search                    | < 30 ms    | < 80 ms    | < 150 ms   |
| Aggregation / analytics queries     | < 50 ms    | < 200 ms   | < 500 ms   |
| INSERT with related records         | < 10 ms    | < 30 ms    | < 50 ms    |
| Bulk operations (100 rows)          | < 50 ms    | < 150 ms   | < 300 ms   |

---

## 7. Security Testing

### 7.1 OWASP ZAP Automated Scanning

```yaml
# .github/workflows/security-scan.yml (excerpt)
security-scan:
  runs-on: ubuntu-latest
  needs: [deploy-staging]
  steps:
    - name: OWASP ZAP Full Scan
      uses: zaproxy/action-full-scan@v0.10.0
      with:
        target: "https://staging.itbengal.com"
        rules_file_name: ".zap/rules.tsv"
        cmd_options: "-a -j -l WARN"
        allow_issue_writing: false

    - name: Upload ZAP Report
      uses: actions/upload-artifact@v4
      with:
        name: zap-report
        path: report_html.html
```

### 7.2 Dependency Auditing

| Tool             | Schedule         | Severity Threshold | Action           |
| ---------------- | ---------------- | ------------------- | ---------------- |
| `npm audit`      | Every CI run     | High                | Block merge      |
| Snyk             | Daily scan       | High                | Create issue     |
| GitHub Dependabot | Real-time       | Critical + High     | Auto-PR          |
| Trivy            | Docker build     | Critical            | Fail build       |

### 7.3 Penetration Testing

| Aspect               | Details                                                       |
| --------------------- | ------------------------------------------------------------- |
| **Schedule**          | Quarterly (external), monthly (internal)                      |
| **Scope**             | All public APIs, customer dashboard, admin dashboard          |
| **Provider**          | Third-party security firm + internal security engineer        |
| **Methodology**       | OWASP Testing Guide v4, PTES                                 |
| **Report Handling**   | Encrypted report, shared only with CTO and Security Lead     |
| **Remediation SLA**   | Critical: 24h, High: 72h, Medium: 2 weeks, Low: next sprint  |

### 7.4 Security Test Categories

| Category                         | Tools / Method                                            | Automated |
| -------------------------------- | --------------------------------------------------------- | --------- |
| Authentication bypass            | Custom test suite, OWASP ZAP                              | ✅        |
| Authorization / RBAC             | Integration tests for every role × endpoint combination   | ✅        |
| SQL Injection                    | SQLMap, Parameterized query verification                  | ✅        |
| XSS                              | OWASP ZAP, CSP header validation                         | ✅        |
| CSRF                             | Token validation tests, SameSite cookie checks            | ✅        |
| Container escape                 | Manual pen-test, seccomp profile validation               | Partial   |
| API rate limiting                | k6 scripts exceeding rate limits                          | ✅        |
| Secrets in code                  | gitleaks, truffleHog in pre-commit                        | ✅        |
| Insecure direct object reference | Authorization tests per resource                          | ✅        |
| SSL/TLS configuration            | testssl.sh, SSL Labs API                                  | ✅        |

### 7.5 Automated Security Scan in CI

```yaml
# .github/workflows/ci.yml (security stage excerpt)
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Run npm audit
      run: npm audit --audit-level=high

    - name: Run Snyk test
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

    - name: Scan for secrets with gitleaks
      uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    - name: Trivy container scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'itbengal/api:${{ github.sha }}'
        format: 'sarif'
        output: 'trivy-results.sarif'
        severity: 'CRITICAL,HIGH'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v3
      with:
        sarif_file: 'trivy-results.sarif'
```

---

## 8. Test Environment Architecture

```mermaid
flowchart LR
    subgraph Local["🏠 Local Development"]
        DEV[Developer Machine]
        DOCKER_LOCAL[Docker Compose<br/>PostgreSQL + Redis]
    end

    subgraph CI["⚙️ CI Environment"]
        GHA[GitHub Actions Runner]
        TC[Testcontainers<br/>PostgreSQL + Redis]
        PLAYWRIGHT_CI[Playwright Browsers]
    end

    subgraph Staging["🟡 Staging"]
        STAGING_APP[Staging App<br/>staging.itbengal.com]
        STAGING_DB[(PostgreSQL)]
        STAGING_REDIS[(Redis)]
    end

    subgraph Production["🟢 Production"]
        PROD_APP[Production App<br/>itbengal.com]
        PROD_DB[(PostgreSQL)]
        PROD_REDIS[(Redis)]
    end

    DEV -- "Unit + Integration" --> DOCKER_LOCAL
    GHA -- "Unit + Integration" --> TC
    GHA -- "E2E" --> PLAYWRIGHT_CI
    GHA -- "Deploy" --> STAGING_APP
    STAGING_APP -- "Smoke + Perf" --> STAGING_DB
    STAGING_APP -- "Promote" --> PROD_APP
```

### 8.1 Environment Parity Requirements

| Aspect                | Local           | CI                | Staging              | Production           |
| --------------------- | --------------- | ----------------- | -------------------- | -------------------- |
| PostgreSQL version    | 16              | 16 (testcontainer) | 16                   | 16                   |
| Redis version         | 7               | 7 (testcontainer)  | 7                    | 7                    |
| Node.js version       | 20 LTS          | 20 LTS            | 20 LTS               | 20 LTS               |
| Docker version        | Latest stable   | Latest stable     | Latest stable         | Latest stable         |
| OS                    | Any             | Ubuntu 22.04      | Ubuntu 22.04          | Ubuntu 22.04          |
| Data                  | Seeded/fixtures | Seeded/fixtures   | Anonymized production | Real                  |

### 8.2 Docker Compose Test Environment

```yaml
# docker-compose.test.yml
version: "3.9"

services:
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: itbengal_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # RAM disk for speed
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    command: redis-server --save "" --appendonly no  # No persistence for speed
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### 8.3 Environment Variable Management for Tests

```typescript
// apps/api/test/setup/env.ts
import { z } from 'zod';

const testEnvSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://test:test@localhost:5433/itbengal_test'),
  REDIS_URL: z.string().default('redis://localhost:6380'),
  JWT_SECRET: z.string().default('test-jwt-secret-do-not-use-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  NODE_ENV: z.literal('test').default('test'),
  LOG_LEVEL: z.string().default('silent'),
});

export const testEnv = testEnvSchema.parse(process.env);
```

---

## 9. Test Data Management

### 9.1 Factory Pattern

```typescript
// apps/api/test/factories/index.ts
import { faker } from '@faker-js/faker';
import type { PrismaClient } from '@prisma/client';

export function buildUser(overrides: Partial<UserCreateInput> = {}) {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    passwordHash: '$2b$10$hashedpassword', // Pre-hashed "TestPass123!"
    emailVerified: true,
    ...overrides,
  };
}

export function buildProject(userId: string, overrides: Partial<ProjectCreateInput> = {}) {
  return {
    name: faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
    framework: faker.helpers.arrayElement(['nextjs', 'react', 'vue', 'angular']),
    status: 'active' as const,
    userId,
    repositoryUrl: `https://github.com/${faker.internet.username()}/${faker.lorem.slug()}`,
    branch: 'main',
    buildCommand: 'npm run build',
    outputDirectory: '.next',
    ...overrides,
  };
}

export function buildDeployment(projectId: string, overrides: Partial<DeploymentCreateInput> = {}) {
  return {
    projectId,
    branch: 'main',
    commitSha: faker.git.commitSha(),
    commitMessage: faker.git.commitMessage(),
    status: 'queued' as const,
    ...overrides,
  };
}

export function buildDomain(projectId: string, overrides: Partial<DomainCreateInput> = {}) {
  return {
    projectId,
    name: faker.internet.domainName(),
    type: 'custom' as const,
    sslStatus: 'pending' as const,
    ...overrides,
  };
}

// Database-persisted factory helpers
export async function createUser(prisma: PrismaClient, overrides = {}) {
  return prisma.user.create({ data: buildUser(overrides) });
}

export async function createProject(prisma: PrismaClient, userId: string, overrides = {}) {
  return prisma.project.create({ data: buildProject(userId, overrides) });
}

export async function createDeployment(prisma: PrismaClient, projectId: string, overrides = {}) {
  return prisma.deployment.create({ data: buildDeployment(projectId, overrides) });
}
```

### 9.2 Test Data Isolation Strategies

| Strategy                | Description                                                      | Use Case                           |
| ----------------------- | ---------------------------------------------------------------- | ---------------------------------- |
| **Unique identifiers**  | Each test creates data with unique emails, names, IDs            | All tests                          |
| **Transaction rollback**| Wrap test in transaction, rollback on completion                  | Fast integration tests             |
| **Per-test cleanup**    | `afterEach` deletes created records                              | Tests that require committed data  |
| **Dedicated schemas**   | Each test suite uses a separate PostgreSQL schema                | Parallel test execution            |
| **Testcontainers**      | Fresh container per test suite                                   | CI environment                     |

### 9.3 Sensitive Data Handling

- **Never** use real customer data in tests.
- **Never** commit credentials, API keys, or tokens to the repository.
- Use `faker.js` to generate realistic but synthetic data.
- Mask sensitive fields in test logs (email, password, tokens).
- Payment testing uses provider sandbox/test mode credentials only.

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Testing Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "20"

jobs:
  # ─── Stage 1: Lint & Type Check ───
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  # ─── Stage 2: Unit Tests ───
  unit-tests:
    runs-on: ubuntu-latest
    needs: [lint]
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
      - run: npm ci
      - run: npm run test:unit -- --shard=${{ matrix.shard }}/4 --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-unit-${{ matrix.shard }}
          path: coverage/

  # ─── Stage 3: Integration Tests ───
  integration-tests:
    runs-on: ubuntu-latest
    needs: [lint]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: itbengal_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready -U test"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/itbengal_test
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/itbengal_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: ci-test-secret
          NODE_ENV: test

  # ─── Stage 4: E2E Tests ───
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox
      - name: Run E2E tests
        run: npx playwright test --project=chromium --project=firefox
        env:
          E2E_BASE_URL: http://localhost:3000
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  # ─── Stage 5: Security Scan ───
  security:
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
      - run: npm ci
      - run: npm audit --audit-level=high
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ─── Stage 6: Performance Check ───
  performance:
    runs-on: ubuntu-latest
    needs: [e2e-tests]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
      - run: npm ci
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6 -y
      - name: Run k6 smoke tests
        run: k6 run performance/tests/api-load.k6.js --duration 30s --vus 10
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          AUTH_TOKEN: ${{ secrets.STAGING_AUTH_TOKEN }}

  # ─── Coverage Report ───
  coverage-report:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          pattern: coverage-*
          merge-multiple: true
          path: coverage/
      - name: Check coverage thresholds
        run: |
          npx istanbul check-coverage \
            --lines 80 \
            --branches 75 \
            --functions 80 \
            --statements 80
```

### 10.2 Branch Protection Rules

| Rule                                      | Setting  |
| ----------------------------------------- | -------- |
| Require pull request before merging        | ✅       |
| Required approvals                         | 2        |
| Require status checks: `lint`              | ✅       |
| Require status checks: `unit-tests`        | ✅       |
| Require status checks: `integration-tests` | ✅       |
| Require status checks: `e2e-tests`         | ✅       |
| Require status checks: `security`          | ✅       |
| Require conversation resolution            | ✅       |
| Require linear history (squash merge)      | ✅       |

---

## 11. Test Reporting

### 11.1 Jest Reporting Configuration

```typescript
// jest.config.ts (reporters section)
{
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './reports/jest',
      filename: 'test-report.html',
      openReport: false,
      pageTitle: 'ITBengal Test Report',
      expand: true,
    }],
    ['jest-junit', {
      outputDirectory: './reports/junit',
      outputName: 'junit-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
    }],
  ],
}
```

### 11.2 Coverage Reporting

| Report Type    | Output Path                  | Purpose                          |
| -------------- | ---------------------------- | -------------------------------- |
| Text summary   | stdout                       | Quick CI feedback                |
| LCOV           | `coverage/lcov.info`         | SonarQube integration            |
| HTML           | `coverage/html/index.html`   | Human-readable browsable report  |
| JSON summary   | `coverage/coverage-summary.json` | Automated threshold checking |

### 11.3 Playwright Reporting

```typescript
// playwright.config.ts (reporter section)
reporter: [
  ['html', { outputFolder: 'reports/playwright', open: 'never' }],
  ['json', { outputFile: 'reports/playwright/results.json' }],
  ['junit', { outputFile: 'reports/playwright/junit.xml' }],
  ...(process.env.CI ? [['github' as const]] : [['list' as const]]),
],
```

### 11.4 Test Trend Tracking

| Metric                          | Tracking Tool      | Dashboard        |
| ------------------------------- | ------------------ | ---------------- |
| Test pass/fail rate             | GitHub Actions      | Grafana          |
| Code coverage over time         | SonarQube           | SonarQube        |
| Test execution time             | Jest + custom       | Grafana          |
| Flaky test detection            | Playwright retries  | Custom dashboard |
| E2E test success rate           | Playwright          | Grafana          |
| Performance regression          | k6 Cloud / Grafana  | Grafana          |

---

## 12. Regression Testing

### 12.1 Regression Suite Definition

The regression suite is a subset of all tests that cover **critical user paths** and **previously-found bugs**. It is the minimum set of tests that must pass before any production release.

### 12.2 When to Run Regression Tests

| Trigger                              | Suite          | Environment |
| ------------------------------------ | -------------- | ----------- |
| Every pull request                   | Smoke          | CI          |
| Merge to `develop`                   | Full regression | CI          |
| Merge to `main`                      | Full regression | CI + Staging |
| Pre-production deploy                | Full regression + performance | Staging |
| Hotfix                               | Targeted regression + smoke | CI + Staging |
| Infrastructure change                | Full regression + infrastructure | Staging |

### 12.3 Critical Path Regression Tests

| Critical Path                              | Test Count | Priority |
| ------------------------------------------ | ---------- | -------- |
| User Registration → Email Verification     | 5          | P0       |
| Login → Dashboard → View Projects          | 4          | P0       |
| Create Project → Deploy → Verify Live      | 8          | P0       |
| Custom Domain → SSL → Verify HTTPS         | 6          | P0       |
| Billing → Subscribe → Payment → Receipt    | 7          | P0       |
| Deployment Rollback                        | 3          | P0       |
| WordPress One-Click Install                | 5          | P1       |
| Domain Search → Purchase → DNS Setup       | 6          | P1       |
| Admin → Customer Management                | 4          | P1       |
| API Key → Programmatic Deployment          | 3          | P2       |

---

## 13. Per-Module Testing Approach

| Module | Unit Tests | Integration Tests | E2E Tests | Performance Tests | Key Scenarios |
| --- | --- | --- | --- | --- | --- |
| **Authentication & Authorization** | JWT generation/validation, password hashing, RBAC policy evaluation, token refresh logic | Login/register API flow, middleware chain, session management, OAuth flows | Full signup→login→access flow, 2FA enrollment, password reset | Login endpoint throughput, token validation latency | Brute-force protection, session expiry, role escalation prevention |
| **User Management** | Profile validation, avatar upload logic, email change validation | Profile CRUD API, organization membership, team management | Profile update flow, team invite→accept | User list query with filters | Email uniqueness, cascading deletes |
| **Project Management** | Project name validation, framework detection, config merging | Project CRUD API, environment variable encryption/decryption | Create project→configure→deploy | Project list with 100+ projects | Repository connection, env var security |
| **Deployment Engine** | Build command generation, Dockerfile template selection, status state machine | Deployment create→build→deploy pipeline, webhook processing, log streaming | Full GitHub→build→deploy→live flow | Concurrent deployments (50+), queue throughput | Build failure recovery, rollback, zero-downtime deploy |
| **Domain Management (Openprovider)** | DNS record validation, domain name parsing, WHOIS formatting | Openprovider API wrapper, domain registration flow, DNS propagation check | Domain search→purchase→configure DNS→verify | DNS query resolution speed | Transfer flow, renewal automation, WHOIS privacy |
| **WordPress Management** | PHP version validation, wp-config generation, backup scheduling | WordPress install API, staging clone, file manager operations | One-click install→configure→verify, staging→production push | WordPress page load under concurrency | Auto-update rollback, malware scan, backup restore |
| **Billing & Payments** | Invoice calculation, tax computation, promo code validation, plan comparison | bKash/Nagad/Stripe/PayPal webhook processing, subscription lifecycle, refund flow | Subscribe→pay→receive invoice→renew | Payment processing throughput | Failed payment retry, subscription downgrade, refund edge cases |
| **Server/Node Management** | Node health score calculation, capacity algorithm, load distribution | Node registration API, health check reporting, server selection | Admin node management flow | Node selection under high load | Failover scenarios, node draining |
| **Notification System** | Template rendering, delivery routing, preference filtering | Email/SMS delivery via queue, in-app notification CRUD | Notification preferences→trigger→receive | Notification throughput (1000+/min) | Delivery failure retry, preference opt-out |
| **Admin Dashboard** | Permission checks, analytics aggregation, audit log formatting | Admin API endpoints, customer management, system settings | Admin login→manage customer→view logs | Admin dashboard query performance | Audit log completeness, bulk operations |
| **API Gateway** | Rate limiter logic, API key validation, request transformation | Rate limiting with Redis, API key CRUD, version routing | API key generation→use→revoke | Rate limit behavior under load | Key rotation, scope enforcement |
| **Background Jobs (BullMQ)** | Job data validation, retry policy, cron expression parsing | Job enqueue→process→complete/fail flow, dead letter queue | End-to-end job processing (deploy, backup, notification) | Queue throughput, concurrent worker processing | Job failure→retry→DLQ, priority ordering |

---

## Appendix A: Test Script Commands

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --selectProjects web api --testPathPattern='__tests__|.test.ts'",
    "test:integration": "jest --selectProjects api --testPathPattern='integration'",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:perf": "k6 run performance/tests/api-load.k6.js",
    "test:security": "npm audit --audit-level=high && npx snyk test"
  }
}
```

## Appendix B: Testing Checklist for New Features

- [ ] Unit tests written for all new functions/methods
- [ ] Integration tests for new API endpoints
- [ ] E2E test for the associated user journey (if UI change)
- [ ] Negative test cases (invalid input, unauthorized access)
- [ ] Edge cases documented and tested
- [ ] Test coverage meets minimum thresholds
- [ ] No flaky tests introduced
- [ ] Test data factories updated if new entities are introduced
- [ ] Performance impact assessed (new queries, new API calls)
- [ ] Security implications tested (new inputs validated, auth checked)

---

*This document is maintained by the ITBengal Engineering team. Last updated: 2026-07-04.*
