/**
 * Questionnaire Reminder Email Template
 *
 * Sent when a company reminds a vendor to complete the questionnaire
 */

interface QuestionnaireReminderEmailProps {
  vendorName: string;
  companyName: string;
  templateName: string;
  progressPercentage: number;
  dueDate?: string;
  accessToken: string;
  baseUrl: string;
}

export function generateQuestionnaireReminderEmail({
  vendorName,
  companyName,
  templateName,
  progressPercentage,
  dueDate,
  accessToken,
  baseUrl,
}: QuestionnaireReminderEmailProps): { subject: string; html: string } {
  const portalUrl = `${baseUrl}/q/${accessToken}`;
  const isOverdue = dueDate && new Date(dueDate) < new Date();

  let urgencyText = '';
  let urgencyColor = '#f59e0b';

  if (isOverdue) {
    urgencyText = 'This questionnaire is now overdue.';
    urgencyColor = '#ef4444';
  } else if (dueDate) {
    const daysLeft = Math.ceil(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 3) {
      urgencyText = `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining to complete.`;
      urgencyColor = '#ef4444';
    } else if (daysLeft <= 7) {
      urgencyText = `${daysLeft} days remaining to complete.`;
      urgencyColor = '#f59e0b';
    }
  }

  const subject = `Reminder: Security Questionnaire from ${companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ⏰ Reminder
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151;">
                Hello ${vendorName || 'Vendor'},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                This is a friendly reminder that <strong>${companyName}</strong> is still awaiting your response to their security questionnaire.
              </p>

              ${
                urgencyText
                  ? `
              <!-- Urgency Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${urgencyColor};">
                      ${urgencyText}
                    </p>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Progress Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 12px; font-size: 18px; color: #166534;">
                      ${templateName}
                    </h2>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #15803d;">
                      Your progress: <strong>${progressPercentage}% complete</strong>
                    </p>
                    <!-- Progress Bar -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #dcfce7; border-radius: 4px; height: 8px;">
                          <div style="width: ${progressPercentage}%; background-color: #22c55e; height: 8px; border-radius: 4px;"></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Continue Questionnaire
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                Or copy and paste this link into your browser:<br>
                <a href="${portalUrl}" style="color: #059669; word-break: break-all;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; text-align: center;">
                This reminder was sent by NIS2 Comply on behalf of ${companyName}.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Need help? Reply to this email to contact ${companyName}.
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

  return { subject, html };
}
