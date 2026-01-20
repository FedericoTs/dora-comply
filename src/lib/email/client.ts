/**
 * Email Client Configuration
 *
 * Centralized email sending using Resend
 */

import { Resend } from 'resend';

// Default sender configuration
export const EMAIL_FROM = process.env.EMAIL_FROM || 'NIS2 Comply <noreply@nis2comply.io>';

// Email sending options
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

// Lazy initialize Resend client (avoid build-time errors)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions) {
  const client = getResendClient();

  // Skip email if no API key configured
  if (!client) {
    console.warn('RESEND_API_KEY not configured, skipping email send');
    return { success: true, skipped: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
