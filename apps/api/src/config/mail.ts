/**
 * Mail (SMTP) configuration.
 * Self-hosted SMTP in production, Mailpit (localhost:1025) for local development.
 * @module config/mail
 */

/** SMTP mail transport configuration */
export const mailConfig = {
  /** SMTP server hostname */
  host: process.env['SMTP_HOST'] ?? 'localhost',

  /** SMTP server port (1025 for Mailpit dev, 587 for production) */
  port: parseInt(process.env['SMTP_PORT'] ?? '1025', 10),

  /** Use TLS for SMTP connection */
  secure: process.env['SMTP_SECURE'] === 'true',

  /** SMTP authentication username (empty for Mailpit) */
  user: process.env['SMTP_USER'] ?? '',

  /** SMTP authentication password (empty for Mailpit) */
  password: process.env['SMTP_PASSWORD'] ?? '',

  /** Display name for outgoing emails */
  fromName: process.env['SMTP_FROM_NAME'] ?? 'ITBengal',

  /** Sender email address for outgoing emails */
  fromEmail: process.env['SMTP_FROM_EMAIL'] ?? 'noreply@itbengal.xyz',

  /**
   * Full "From" header value.
   * e.g., "ITBengal <noreply@itbengal.xyz>"
   */
  get from(): string {
    return `${this.fromName} <${this.fromEmail}>`;
  },
} as const;
