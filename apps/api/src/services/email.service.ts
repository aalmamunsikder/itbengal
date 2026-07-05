/**
 * Email service — Nodemailer-based transactional email delivery.
 *
 * Creates a reusable SMTP transport from `mailConfig` and exposes
 * purpose-specific helpers for verification, password-reset, and
 * welcome emails with ITBengal-branded HTML templates.
 *
 * @module services/email
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { appConfig } from '../config/app.js';
import { mailConfig } from '../config/mail.js';

// ---------------------------------------------------------------------------
// Transporter (lazy singleton)
// ---------------------------------------------------------------------------

let transporter: Transporter | null = null;

/**
 * Returns the shared Nodemailer transporter.
 * Created lazily on first use so module loading stays synchronous.
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      ...(mailConfig.user && mailConfig.password
        ? {
            auth: {
              user: mailConfig.user,
              pass: mailConfig.password,
            },
          }
        : {}),
    });
  }
  return transporter;
}

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------

const BRAND_COLOR = '#6366f1';
const BRAND_NAME = 'ITBengal';
const BRAND_URL = appConfig.appUrl;

// ---------------------------------------------------------------------------
// HTML template helpers
// ---------------------------------------------------------------------------

/**
 * Wraps email body content in the shared ITBengal branded layout.
 */
function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
    .logo { font-size: 28px; font-weight: 700; color: ${BRAND_COLOR}; text-decoration: none; letter-spacing: -0.5px; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e4e4e7; }
    h1 { font-size: 22px; font-weight: 600; color: #18181b; margin: 0 0 8px; }
    p { font-size: 15px; line-height: 1.6; color: #3f3f46; margin: 0 0 16px; }
    .btn { display: inline-block; padding: 12px 32px; background-color: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; text-align: center; }
    .btn:hover { background-color: #4f46e5; }
    .btn-wrapper { text-align: center; margin: 28px 0; }
    .muted { font-size: 13px; color: #71717a; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e4e4e7; }
    .footer p { font-size: 12px; color: #a1a1aa; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <a href="${BRAND_URL}" class="logo">${BRAND_NAME}</a>
      </div>
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
        <p>Modern hosting for React &amp; WordPress — <a href="${BRAND_URL}" style="color: ${BRAND_COLOR}; text-decoration: none;">itbengal.xyz</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

/**
 * Send a raw email via the SMTP transporter.
 *
 * @param to      - Recipient email address.
 * @param subject - Email subject line.
 * @param html    - Rendered HTML body.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const transport = getTransporter();

  await transport.sendMail({
    from: mailConfig.from,
    to,
    subject,
    html,
  });

  console.log(`[Email] Sent "${subject}" to ${to}`);
}

// ---------------------------------------------------------------------------
// Purpose-specific emails
// ---------------------------------------------------------------------------

/**
 * Send an email-verification link to a newly registered user.
 *
 * @param email     - Recipient email.
 * @param firstName - User's first name (for personalisation).
 * @param token     - The hex verification token.
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${appConfig.appUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const html = emailLayout(`
    <h1>Verify your email address</h1>
    <p>Hi ${firstName},</p>
    <p>
      Thanks for signing up for ${BRAND_NAME}! Please verify your email address
      by clicking the button below.
    </p>
    <div class="btn-wrapper">
      <a href="${verifyUrl}" class="btn">Verify Email</a>
    </div>
    <p class="muted">
      If the button doesn't work, copy and paste this URL into your browser:<br />
      <a href="${verifyUrl}" style="color: ${BRAND_COLOR}; word-break: break-all;">${verifyUrl}</a>
    </p>
    <p class="muted">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `);

  await sendEmail(email, `Verify your email — ${BRAND_NAME}`, html);
}

/**
 * Send a password-reset link.
 *
 * @param email     - Recipient email.
 * @param firstName - User's first name.
 * @param token     - The hex reset token.
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string,
): Promise<void> {
  const resetUrl = `${appConfig.appUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const html = emailLayout(`
    <h1>Reset your password</h1>
    <p>Hi ${firstName},</p>
    <p>
      We received a request to reset the password for your ${BRAND_NAME} account.
      Click the button below to choose a new password.
    </p>
    <div class="btn-wrapper">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p class="muted">
      If the button doesn't work, copy and paste this URL into your browser:<br />
      <a href="${resetUrl}" style="color: ${BRAND_COLOR}; word-break: break-all;">${resetUrl}</a>
    </p>
    <p class="muted">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  `);

  await sendEmail(email, `Reset your password — ${BRAND_NAME}`, html);
}

/**
 * Send a welcome email after email verification is complete.
 *
 * @param email     - Recipient email.
 * @param firstName - User's first name.
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
): Promise<void> {
  const dashboardUrl = `${appConfig.appUrl}/dashboard`;

  const html = emailLayout(`
    <h1>Welcome to ${BRAND_NAME}! 🎉</h1>
    <p>Hi ${firstName},</p>
    <p>
      Your email has been verified and your account is now active.
      You're all set to start deploying your projects!
    </p>
    <p>Here's what you can do next:</p>
    <ul style="color: #3f3f46; font-size: 15px; line-height: 1.8; padding-left: 20px;">
      <li>Create your first React or WordPress project</li>
      <li>Connect your GitHub repository for automatic deployments</li>
      <li>Set up a custom domain with free SSL</li>
      <li>Invite your team members to collaborate</li>
    </ul>
    <div class="btn-wrapper">
      <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
    </div>
    <p class="muted">Need help getting started? Check out our <a href="${appConfig.appUrl}/docs" style="color: ${BRAND_COLOR};">documentation</a> or reach out to our support team.</p>
  `);

  await sendEmail(email, `Welcome to ${BRAND_NAME}!`, html);
}
