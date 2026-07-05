/**
 * Domain and DNS management types.
 * @module @itbengal/types/domain
 */

import type { DNSRecordType, DomainStatus } from './enums.js';

/**
 * A registered or connected domain.
 */
export interface Domain {
  /** Primary key (UUIDv7). */
  id: string;
  /** The organization that owns this domain. */
  organizationId: string;
  /** Fully-qualified domain name (e.g. "example.com"). */
  domainName: string;
  /** Current domain status. */
  status: DomainStatus;
  /** Registrar name (e.g. "Namecheap", "Cloudflare"). */
  registrar: string | null;
  /** Domain expiration date (ISO-8601). */
  expiresAt: string | null;
  /** Whether the domain auto-renews. */
  autoRenew: boolean;
  /** Whether WHOIS privacy protection is enabled. */
  whoisPrivacy: boolean;
  /** Nameserver hostnames assigned to this domain. */
  nameservers: string[];
  /** When the domain record was created. */
  createdAt: string;
  /** When the domain record was last updated. */
  updatedAt: string;
}

/**
 * A DNS record attached to a domain.
 */
export interface DNSRecord {
  /** Primary key (UUIDv7). */
  id: string;
  /** The domain this record belongs to. */
  domainId: string;
  /** DNS record type. */
  type: DNSRecordType;
  /** Record name / host (e.g. "@", "www", "mail"). */
  name: string;
  /** Record value / content (e.g. IP address, CNAME target). */
  content: string;
  /** Time-to-live in seconds. */
  ttl: number;
  /** Priority (used by MX, SRV records; null otherwise). */
  priority: number | null;
  /** When the record was created. */
  createdAt: string;
  /** When the record was last updated. */
  updatedAt: string;
}

/**
 * Response from a domain-availability check.
 */
export interface DomainAvailabilityResponse {
  /** The domain name checked. */
  domainName: string;
  /** Whether the domain is available for registration. */
  available: boolean;
  /** Registration price (smallest currency unit), if available. */
  price: number | null;
  /** ISO-4217 currency code. */
  currency: string | null;
  /** Whether the domain is premium-priced. */
  premium: boolean;
}

/**
 * Request body for registering a new domain.
 */
export interface RegisterDomainRequest {
  /** The domain name to register. */
  domainName: string;
  /** Registration period in years. */
  years?: number;
  /** Whether to enable WHOIS privacy. */
  whoisPrivacy?: boolean;
  /** Whether to enable auto-renewal. */
  autoRenew?: boolean;
}

/**
 * Request body for creating a DNS record.
 */
export interface CreateDNSRecordRequest {
  /** DNS record type. */
  type: DNSRecordType;
  /** Record name / host. */
  name: string;
  /** Record value / content. */
  content: string;
  /** Time-to-live in seconds. */
  ttl?: number;
  /** Priority (required for MX, SRV). */
  priority?: number;
}
