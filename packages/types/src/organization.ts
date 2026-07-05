/**
 * Organization and team management types.
 * @module @itbengal/types/organization
 */

import type { UserRole } from './enums.js';

/**
 * An organization (tenant) that owns projects, subscriptions, and team members.
 */
export interface Organization {
  /** Primary key (UUIDv7). */
  id: string;
  /** Display name of the organization. */
  name: string;
  /** URL-safe slug (globally unique). */
  slug: string;
  /** User ID of the organization owner. */
  ownerId: string;
  /** Email address for billing correspondence. */
  billingEmail: string;
  /** Billing address (free-form text or JSON). */
  billingAddress: string | null;
  /** VAT or tax identification number. */
  vatNumber: string | null;
  /** When the organization was created. */
  createdAt: string;
  /** When the organization was last updated. */
  updatedAt: string;
}

/**
 * A user's membership in an organization.
 */
export interface TeamMember {
  /** Primary key (UUIDv7). */
  id: string;
  /** The organization. */
  organizationId: string;
  /** The member's user ID. */
  userId: string;
  /** The member's role within this organization. */
  role: UserRole;
  /** When the invitation was sent. */
  invitedAt: string;
  /** When the user accepted the invitation (null if pending). */
  joinedAt: string | null;
}

/**
 * Request body for creating a new organization.
 */
export interface CreateOrganizationRequest {
  /** Display name. */
  name: string;
  /** Billing email address. */
  billingEmail: string;
  /** Optional billing address. */
  billingAddress?: string;
  /** Optional VAT number. */
  vatNumber?: string;
}

/**
 * Request body for inviting a new team member.
 */
export interface InviteTeamMemberRequest {
  /** Email address of the person to invite. */
  email: string;
  /** Role to assign within the organization. */
  role: UserRole;
}
