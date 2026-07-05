/**
 * Notification and support ticket types.
 * @module @itbengal/types/notification
 */

import type { NotificationType, SupportTicketStatus } from './enums.js';

/**
 * An in-app, email, SMS, or push notification.
 */
export interface Notification {
  /** Primary key (UUIDv7). */
  id: string;
  /** The user this notification is addressed to. */
  userId: string;
  /** Notification type / category. */
  type: string;
  /** Short title displayed in notification lists. */
  title: string;
  /** Body text of the notification. */
  message: string;
  /** Delivery channel. */
  channel: NotificationType;
  /** Whether the user has read this notification. */
  read: boolean;
  /** When the notification was read (null if unread). */
  readAt: string | null;
  /** Arbitrary structured data attached to the notification (JSONB). */
  data: Record<string, unknown> | null;
  /** When the notification was created. */
  createdAt: string;
}

/**
 * A customer support ticket.
 */
export interface SupportTicket {
  /** Primary key (UUIDv7). */
  id: string;
  /** The organization that filed the ticket. */
  organizationId: string;
  /** The user who created the ticket. */
  userId: string;
  /** Brief summary of the issue. */
  subject: string;
  /** Detailed description of the issue. */
  description: string;
  /** Current ticket status. */
  status: SupportTicketStatus;
  /** Priority level (1 = urgent, 2 = high, 3 = normal, 4 = low). */
  priority: number;
  /** User ID of the support agent assigned to this ticket. */
  assignedTo: string | null;
  /** When the ticket was closed. */
  closedAt: string | null;
  /** When the ticket was created. */
  createdAt: string;
  /** When the ticket was last updated. */
  updatedAt: string;
}

/**
 * Request body for creating a support ticket.
 */
export interface CreateSupportTicketRequest {
  /** Brief summary of the issue. */
  subject: string;
  /** Detailed description. */
  description: string;
  /** Priority level (1–4, defaults to 3). */
  priority?: number;
}

/**
 * A message within a support ticket thread.
 */
export interface SupportTicketMessage {
  /** Primary key (UUIDv7). */
  id: string;
  /** The parent support ticket. */
  ticketId: string;
  /** The user who wrote this message. */
  userId: string;
  /** Message body (supports markdown). */
  message: string;
  /** Whether the message is from an internal (staff) user. */
  isInternal: boolean;
  /** File attachment URLs, if any. */
  attachments: string[];
  /** When the message was created. */
  createdAt: string;
}
