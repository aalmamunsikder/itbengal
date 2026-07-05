/**
 * Email job — BullMQ queue and worker for asynchronous email delivery.
 *
 * Emails are enqueued by the auth and user services, then processed
 * by the worker which delegates to the email service.
 *
 * Job data shape:
 * ```ts
 * { type: 'verification' | 'password-reset' | 'welcome', to: string, firstName: string, token?: string }
 * ```
 *
 * @module jobs/email
 */

import { Queue, Worker } from 'bullmq';

import { queueConnection, defaultJobOptions, QUEUE_NAMES } from '../config/queue.js';
import * as emailService from '../services/email.service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of data for each email job. */
interface EmailJobData {
  /** The type of email to send. */
  type: 'verification' | 'password-reset' | 'welcome';
  /** Recipient email address. */
  to: string;
  /** Recipient's first name (for personalisation). */
  firstName: string;
  /** Token (required for verification and password-reset types). */
  token?: string;
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

/** BullMQ queue instance for email jobs. */
const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
  connection: queueConnection,
  defaultJobOptions,
});

/**
 * Enqueue an email job for asynchronous processing.
 *
 * @param data - The email job payload.
 * @returns The created BullMQ job.
 */
export async function addEmailJob(data: EmailJobData): Promise<void> {
  await emailQueue.add(`email:${data.type}`, data, {
    // Remove completed jobs quickly for email queue
    removeOnComplete: { age: 3600, count: 500 },
  });

  console.log(`[EmailJob] Enqueued ${data.type} email to ${data.to}`);
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

/**
 * BullMQ worker that processes email jobs.
 *
 * Routes to the appropriate `emailService` function based on `data.type`.
 */
const emailWorker = new Worker<EmailJobData>(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    const { type, to, firstName, token } = job.data;

    console.log(
      `[EmailWorker] Processing job ${job.id ?? 'unknown'}: ${type} → ${to}`,
    );

    switch (type) {
      case 'verification': {
        if (!token) {
          throw new Error('Verification email requires a token');
        }
        await emailService.sendVerificationEmail(to, firstName, token);
        break;
      }

      case 'password-reset': {
        if (!token) {
          throw new Error('Password-reset email requires a token');
        }
        await emailService.sendPasswordResetEmail(to, firstName, token);
        break;
      }

      case 'welcome': {
        await emailService.sendWelcomeEmail(to, firstName);
        break;
      }

      default: {
        // Exhaustive check — TypeScript ensures all types are handled
        const _exhaustive: never = type;
        throw new Error(`Unknown email job type: ${String(_exhaustive)}`);
      }
    }
  },
  {
    connection: queueConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

// ---------------------------------------------------------------------------
// Worker event handlers
// ---------------------------------------------------------------------------

emailWorker.on('completed', (job) => {
  console.log(
    `[EmailWorker] Job ${job.id ?? 'unknown'} completed: ${job.data.type} → ${job.data.to}`,
  );
});

emailWorker.on('failed', (job, err) => {
  console.error(
    `[EmailWorker] Job ${job?.id ?? 'unknown'} failed:`,
    err.message,
  );
});

emailWorker.on('error', (err) => {
  console.error('[EmailWorker] Worker error:', err.message);
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { emailQueue, emailWorker };
export type { EmailJobData };
