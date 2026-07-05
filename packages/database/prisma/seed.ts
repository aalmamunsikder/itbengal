/**
 * @module @itbengal/database/seed
 * @description Database seed script for local development and initial
 * production bootstrapping. Creates the super admin user, default
 * organization, hosting plans, and initial server nodes.
 *
 * Usage: `npm run db:seed` (from packages/database)
 */

import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

// ===========================================================================
// Helpers
// ===========================================================================

/** Deterministic UUIDs for seed data to make the seed idempotent. */
const SEED_IDS = {
  adminUser: '00000000-0000-4000-a000-000000000001',
  organization: '00000000-0000-4000-a000-000000000002',
  // React Hosting Plans
  reactStarter: '00000000-0000-4000-b000-000000000001',
  reactBasic: '00000000-0000-4000-b000-000000000002',
  reactProfessional: '00000000-0000-4000-b000-000000000003',
  reactBusiness: '00000000-0000-4000-b000-000000000004',
  reactEnterprise: '00000000-0000-4000-b000-000000000005',
  // WordPress Hosting Plans
  wpStarter: '00000000-0000-4000-b000-000000000011',
  wpBasic: '00000000-0000-4000-b000-000000000012',
  wpProfessional: '00000000-0000-4000-b000-000000000013',
  wpBusiness: '00000000-0000-4000-b000-000000000014',
  wpEnterprise: '00000000-0000-4000-b000-000000000015',
  // Server Nodes
  platformNode: '00000000-0000-4000-c000-000000000001',
  reactNode: '00000000-0000-4000-c000-000000000002',
  wordpressNode: '00000000-0000-4000-c000-000000000003',
} as const;

const BCRYPT_ROUNDS = 12;

// ===========================================================================
// Seed: Super Admin User
// ===========================================================================

async function seedAdminUser(): Promise<void> {
  const passwordHash = hashSync('Admin@12345678', BCRYPT_ROUNDS);

  await prisma.user.upsert({
    where: { id: SEED_IDS.adminUser },
    update: {},
    create: {
      id: SEED_IDS.adminUser,
      email: 'admin@itbengal.xyz',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Super admin user seeded (admin@itbengal.xyz)');
}

// ===========================================================================
// Seed: Default Organization
// ===========================================================================

async function seedOrganization(): Promise<void> {
  await prisma.organization.upsert({
    where: { id: SEED_IDS.organization },
    update: {},
    create: {
      id: SEED_IDS.organization,
      name: 'ITBengal',
      slug: 'itbengal',
      ownerId: SEED_IDS.adminUser,
      billingEmail: 'billing@itbengal.xyz',
    },
  });

  // Link admin user to the organization
  await prisma.user.update({
    where: { id: SEED_IDS.adminUser },
    data: { organizationId: SEED_IDS.organization },
  });

  // Create team member record for the admin
  await prisma.teamMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: SEED_IDS.organization,
        userId: SEED_IDS.adminUser,
      },
    },
    update: {},
    create: {
      organizationId: SEED_IDS.organization,
      userId: SEED_IDS.adminUser,
      role: 'OWNER',
      joinedAt: new Date(),
    },
  });

  console.log('✅ Default organization seeded (ITBengal)');
}

// ===========================================================================
// Seed: React Hosting Plans (BDT)
// ===========================================================================

async function seedReactPlans(): Promise<void> {
  const plans = [
    {
      id: SEED_IDS.reactStarter,
      name: 'React Starter',
      slug: 'react-starter',
      type: 'REACT_HOSTING' as const,
      tier: 'STARTER' as const,
      priceMonthly: 299,
      priceYearly: 2999,
      cpu: 0.5,
      memoryMb: 512,
      storageMb: 5120, // 5 GB
      bandwidthMb: BigInt(51200), // 50 GB
      maxProjects: 3,
      maxDomains: 3,
      maxTeamMembers: 1,
      buildMinutes: 100,
      deploymentsPerDay: 10,
      backupRetentionDays: 3,
      sslIncluded: true,
      prioritySupport: false,
      sortOrder: 1,
      features: {
        customDomain: true,
        autoDeployment: true,
        previewDeployments: false,
        analytics: false,
        teamCollaboration: false,
      },
    },
    {
      id: SEED_IDS.reactBasic,
      name: 'React Basic',
      slug: 'react-basic',
      type: 'REACT_HOSTING' as const,
      tier: 'BASIC' as const,
      priceMonthly: 599,
      priceYearly: 5999,
      cpu: 1,
      memoryMb: 1024,
      storageMb: 10240, // 10 GB
      bandwidthMb: BigInt(102400), // 100 GB
      maxProjects: 5,
      maxDomains: 5,
      maxTeamMembers: 3,
      buildMinutes: 200,
      deploymentsPerDay: 25,
      backupRetentionDays: 7,
      sslIncluded: true,
      prioritySupport: false,
      sortOrder: 2,
      features: {
        customDomain: true,
        autoDeployment: true,
        previewDeployments: true,
        analytics: false,
        teamCollaboration: true,
      },
    },
    {
      id: SEED_IDS.reactProfessional,
      name: 'React Professional',
      slug: 'react-professional',
      type: 'REACT_HOSTING' as const,
      tier: 'PROFESSIONAL' as const,
      priceMonthly: 1299,
      priceYearly: 12999,
      cpu: 2,
      memoryMb: 2048,
      storageMb: 25600, // 25 GB
      bandwidthMb: BigInt(256000), // 250 GB
      maxProjects: 15,
      maxDomains: 15,
      maxTeamMembers: 10,
      buildMinutes: 500,
      deploymentsPerDay: 50,
      backupRetentionDays: 14,
      sslIncluded: true,
      prioritySupport: false,
      sortOrder: 3,
      features: {
        customDomain: true,
        autoDeployment: true,
        previewDeployments: true,
        analytics: true,
        teamCollaboration: true,
        passwordProtection: true,
      },
    },
    {
      id: SEED_IDS.reactBusiness,
      name: 'React Business',
      slug: 'react-business',
      type: 'REACT_HOSTING' as const,
      tier: 'BUSINESS' as const,
      priceMonthly: 2499,
      priceYearly: 24999,
      cpu: 4,
      memoryMb: 4096,
      storageMb: 51200, // 50 GB
      bandwidthMb: BigInt(512000), // 500 GB
      maxProjects: 30,
      maxDomains: 30,
      maxTeamMembers: 25,
      buildMinutes: 1000,
      deploymentsPerDay: 100,
      backupRetentionDays: 30,
      sslIncluded: true,
      prioritySupport: true,
      sortOrder: 4,
      features: {
        customDomain: true,
        autoDeployment: true,
        previewDeployments: true,
        analytics: true,
        teamCollaboration: true,
        passwordProtection: true,
        slaGuarantee: true,
        dedicatedSupport: false,
      },
    },
    {
      id: SEED_IDS.reactEnterprise,
      name: 'React Enterprise',
      slug: 'react-enterprise',
      type: 'REACT_HOSTING' as const,
      tier: 'ENTERPRISE' as const,
      priceMonthly: 4999,
      priceYearly: 49999,
      cpu: 8,
      memoryMb: 8192,
      storageMb: 102400, // 100 GB
      bandwidthMb: BigInt(1048576), // 1 TB
      maxProjects: 999, // effectively unlimited
      maxDomains: 999,
      maxTeamMembers: 999,
      buildMinutes: 5000,
      deploymentsPerDay: 999,
      backupRetentionDays: 90,
      sslIncluded: true,
      prioritySupport: true,
      sortOrder: 5,
      features: {
        customDomain: true,
        autoDeployment: true,
        previewDeployments: true,
        analytics: true,
        teamCollaboration: true,
        passwordProtection: true,
        slaGuarantee: true,
        dedicatedSupport: true,
        customIntegrations: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }

  console.log('✅ React hosting plans seeded (5 tiers)');
}

// ===========================================================================
// Seed: WordPress Hosting Plans (BDT)
// ===========================================================================

async function seedWordPressPlans(): Promise<void> {
  const plans = [
    {
      id: SEED_IDS.wpStarter,
      name: 'WordPress Starter',
      slug: 'wp-starter',
      type: 'WORDPRESS_HOSTING' as const,
      tier: 'STARTER' as const,
      priceMonthly: 399,
      priceYearly: 3999,
      cpu: 0.5,
      memoryMb: 512,
      storageMb: 10240, // 10 GB
      bandwidthMb: BigInt(51200), // 50 GB
      maxProjects: 1,
      maxDomains: 1,
      maxTeamMembers: 1,
      buildMinutes: 0, // N/A for WP
      deploymentsPerDay: 0,
      backupRetentionDays: 3,
      sslIncluded: true,
      prioritySupport: false,
      sortOrder: 1,
      features: {
        managedUpdates: true,
        staging: false,
        caching: false,
        cdn: false,
        malwareScanning: false,
      },
    },
    {
      id: SEED_IDS.wpBasic,
      name: 'WordPress Basic',
      slug: 'wp-basic',
      type: 'WORDPRESS_HOSTING' as const,
      tier: 'BASIC' as const,
      priceMonthly: 799,
      priceYearly: 7999,
      cpu: 1,
      memoryMb: 1024,
      storageMb: 20480, // 20 GB
      bandwidthMb: BigInt(102400), // 100 GB
      maxProjects: 3,
      maxDomains: 3,
      maxTeamMembers: 3,
      buildMinutes: 0,
      deploymentsPerDay: 0,
      backupRetentionDays: 7,
      sslIncluded: true,
      prioritySupport: false,
      sortOrder: 2,
      features: {
        managedUpdates: true,
        staging: true,
        caching: true,
        cdn: false,
        malwareScanning: false,
      },
    },
    {
      id: SEED_IDS.wpProfessional,
      name: 'WordPress Professional',
      slug: 'wp-professional',
      type: 'WORDPRESS_HOSTING' as const,
      tier: 'PROFESSIONAL' as const,
      priceMonthly: 1499,
      priceYearly: 14999,
      cpu: 2,
      memoryMb: 2048,
      storageMb: 40960, // 40 GB
      bandwidthMb: BigInt(256000), // 250 GB
      maxProjects: 10,
      maxDomains: 10,
      maxTeamMembers: 10,
      buildMinutes: 0,
      deploymentsPerDay: 0,
      backupRetentionDays: 14,
      sslIncluded: true,
      prioritySupport: false,
      sortOrder: 3,
      features: {
        managedUpdates: true,
        staging: true,
        caching: true,
        cdn: true,
        malwareScanning: true,
      },
    },
    {
      id: SEED_IDS.wpBusiness,
      name: 'WordPress Business',
      slug: 'wp-business',
      type: 'WORDPRESS_HOSTING' as const,
      tier: 'BUSINESS' as const,
      priceMonthly: 2999,
      priceYearly: 29999,
      cpu: 4,
      memoryMb: 4096,
      storageMb: 81920, // 80 GB
      bandwidthMb: BigInt(512000), // 500 GB
      maxProjects: 25,
      maxDomains: 25,
      maxTeamMembers: 25,
      buildMinutes: 0,
      deploymentsPerDay: 0,
      backupRetentionDays: 30,
      sslIncluded: true,
      prioritySupport: true,
      sortOrder: 4,
      features: {
        managedUpdates: true,
        staging: true,
        caching: true,
        cdn: true,
        malwareScanning: true,
        waf: true,
        multisite: true,
      },
    },
    {
      id: SEED_IDS.wpEnterprise,
      name: 'WordPress Enterprise',
      slug: 'wp-enterprise',
      type: 'WORDPRESS_HOSTING' as const,
      tier: 'ENTERPRISE' as const,
      priceMonthly: 5999,
      priceYearly: 59999,
      cpu: 8,
      memoryMb: 8192,
      storageMb: 204800, // 200 GB
      bandwidthMb: BigInt(1048576), // 1 TB
      maxProjects: 999,
      maxDomains: 999,
      maxTeamMembers: 999,
      buildMinutes: 0,
      deploymentsPerDay: 0,
      backupRetentionDays: 90,
      sslIncluded: true,
      prioritySupport: true,
      sortOrder: 5,
      features: {
        managedUpdates: true,
        staging: true,
        caching: true,
        cdn: true,
        malwareScanning: true,
        waf: true,
        multisite: true,
        dedicatedResources: true,
        customPlugins: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }

  console.log('✅ WordPress hosting plans seeded (5 tiers)');
}

// ===========================================================================
// Seed: Initial Server Nodes
// ===========================================================================

async function seedServerNodes(): Promise<void> {
  const nodes = [
    {
      id: SEED_IDS.platformNode,
      hostname: 'platform-01',
      ipAddress: '10.0.0.1',
      type: 'PLATFORM' as const,
      status: 'ACTIVE' as const,
      cpuCores: 4,
      memoryMb: 8192,
      storageMb: 102400,
      region: 'bd-dhaka',
      agentVersion: '0.1.0',
      maxContainers: 20,
      metadata: {
        description: 'Primary platform node — API, dashboard, admin services',
        purpose: 'platform',
      },
    },
    {
      id: SEED_IDS.reactNode,
      hostname: 'react-01',
      ipAddress: '10.0.1.1',
      type: 'REACT_HOSTING' as const,
      status: 'ACTIVE' as const,
      cpuCores: 8,
      memoryMb: 16384,
      storageMb: 204800,
      region: 'bd-dhaka',
      agentVersion: '0.1.0',
      maxContainers: 50,
      metadata: {
        description: 'React hosting node — containers for React/Next.js apps',
        purpose: 'react-hosting',
      },
    },
    {
      id: SEED_IDS.wordpressNode,
      hostname: 'wp-01',
      ipAddress: '10.0.2.1',
      type: 'WORDPRESS_HOSTING' as const,
      status: 'ACTIVE' as const,
      cpuCores: 8,
      memoryMb: 16384,
      storageMb: 512000,
      region: 'bd-dhaka',
      agentVersion: '0.1.0',
      maxContainers: 40,
      metadata: {
        description: 'WordPress hosting node — containers for WordPress sites',
        purpose: 'wordpress-hosting',
      },
    },
  ];

  for (const node of nodes) {
    await prisma.serverNode.upsert({
      where: { id: node.id },
      update: {},
      create: node,
    });
  }

  console.log('✅ Server nodes seeded (platform-01, react-01, wp-01)');
}

// ===========================================================================
// Main
// ===========================================================================

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  await seedAdminUser();
  await seedOrganization();
  await seedReactPlans();
  await seedWordPressPlans();
  await seedServerNodes();

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
