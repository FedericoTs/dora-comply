/**
 * Questionnaire Invitation Email Template
 *
 * Sent when a company invites a vendor to complete a security questionnaire
 */

interface QuestionnaireInviteEmailProps {
  vendorName: string;
  companyName: string;
  templateName: string;
  estimatedMinutes: number;
  dueDate?: string;
  accessToken: string;
  baseUrl: string;
}

export function generateQuestionnaireInviteEmail({
  vendorName,
  companyName,
  templateName,
  estimatedMinutes,
  dueDate,
  accessToken,
  baseUrl,
}: QuestionnaireInviteEmailProps): { subject: string; html: string } {
  const portalUrl = `${baseUrl}/q/${accessToken}`;
  const dueDateText = dueDate
    ? `Please complete by ${new Date(dueDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}.`
    : 'Please complete at your earliest convenience.';

  const subject = `Security Questionnaire Request from ${companyName}`;

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
            <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                NIS2 Comply
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
                <strong>${companyName}</strong> has requested that you complete a security questionnaire as part of their vendor compliance assessment process.
              </p>

              <!-- Questionnaire Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 12px; font-size: 18px; color: #166534;">
                      ${templateName}
                    </h2>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #15803d;">
                      ⏱️ Estimated time: ${estimatedMinutes} minutes
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #15803d;">
                      📅 ${dueDateText}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- AI Feature Highlight -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf5ff; border: 1px solid #d8b4fe; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #7c3aed;">
                      ✨ AI-Powered Auto-Fill
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #6d28d9; line-height: 1.5;">
                      Upload your SOC 2 report, ISO 27001 certificate, or security policies, and our AI will automatically extract relevant information to help fill out your answers.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Start Questionnaire
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; line-height: 1.5;">
                Or copy and paste this link into your browser:<br>
                <a href="${portalUrl}" style="color: #059669; word-break: break-all;">${portalUrl}</a>
              </p>

              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                This link is valid for 30 days. Your responses are encrypted and stored securely.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; text-align: center;">
                This email was sent by NIS2 Comply on behalf of ${companyName}.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                If you did not expect this request, please contact ${companyName} directly.
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
