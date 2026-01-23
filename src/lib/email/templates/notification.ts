/**
 * Notification Email Templates
 *
 * HTML email templates for notification emails
 */

import type { NotificationType } from '@/lib/notifications/actions';

// Notification type styling
const TYPE_CONFIG: Record<NotificationType, { color: string; icon: string; label: string }> = {
  incident: { color: '#EF4444', icon: '🚨', label: 'Incident' },
  vendor: { color: '#F59E0B', icon: '🏢', label: 'Vendor' },
  compliance: { color: '#059669', icon: '📋', label: 'Compliance' },
  security: { color: '#3B82F6', icon: '🔐', label: 'Security' },
  system: { color: '#6B7280', icon: '⚙️', label: 'System' },
};

interface NotificationEmailData {
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  recipientName?: string;
}

/**
 * Generate notification email HTML
 */
export function generateNotificationEmail(data: NotificationEmailData): string {
  const config = TYPE_CONFIG[data.type];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nis2comply.io';
  const actionUrl = data.href ? `${appUrl}${data.href}` : appUrl;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <img src="${appUrl}/logo.png" alt="NIS2 Comply" width="140" style="display: block;" />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

              <!-- Type Badge -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 24px 24px 16px 24px;">
                    <span style="display: inline-block; padding: 6px 12px; background-color: ${config.color}15; color: ${config.color}; font-size: 12px; font-weight: 600; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${config.icon} ${config.label}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 24px 12px 24px;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827; line-height: 1.4;">
                      ${escapeHtml(data.title)}
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 24px 24px 24px;">
                    <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                      ${escapeHtml(data.message)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              ${data.href ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 0 24px 24px 24px;">
                    <a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      View Details →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">
                You received this email because you have notifications enabled.
              </p>
              <p style="margin: 0; font-size: 13px; color: #6b7280;">
                <a href="${appUrl}/settings/notifications" style="color: #059669; text-decoration: underline;">
                  Manage notification preferences
                </a>
              </p>
            </td>
          </tr>

          <!-- Copyright -->
          <tr>
            <td style="text-align: center; padding-bottom: 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} NIS2 Comply. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate notification email subject
 */
export function generateNotificationSubject(data: NotificationEmailData): string {
  const config = TYPE_CONFIG[data.type];
  return `${config.icon} [${config.label}] ${data.title}`;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}
