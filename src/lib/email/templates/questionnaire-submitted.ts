/**
 * Questionnaire Submitted Email Template
 *
 * Sent to the company when a vendor submits their questionnaire
 */

interface QuestionnaireSubmittedEmailProps {
  recipientName: string;
  vendorName: string;
  vendorCompany: string;
  templateName: string;
  questionsTotal: number;
  questionsAiFilled: number;
  questionnaireId: string;
  baseUrl: string;
}

export function generateQuestionnaireSubmittedEmail({
  recipientName,
  vendorName,
  vendorCompany,
  templateName,
  questionsTotal,
  questionsAiFilled,
  questionnaireId,
  baseUrl,
}: QuestionnaireSubmittedEmailProps): { subject: string; html: string } {
  const reviewUrl = `${baseUrl}/questionnaires/${questionnaireId}`;
  const aiFillRate = questionsTotal > 0 ? Math.round((questionsAiFilled / questionsTotal) * 100) : 0;

  const subject = `Questionnaire Submitted by ${vendorCompany || vendorName}`;

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
                ✅ Questionnaire Submitted
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151;">
                Hello ${recipientName || 'there'},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Great news! <strong>${vendorCompany || vendorName}</strong> has submitted their response to your security questionnaire and it's ready for your review.
              </p>

              <!-- Submission Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 16px; font-size: 18px; color: #166534;">
                      ${templateName}
                    </h2>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 14px; color: #15803d;">Vendor:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="font-size: 14px; font-weight: 600; color: #166534;">${vendorCompany || vendorName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 14px; color: #15803d;">Questions Answered:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="font-size: 14px; font-weight: 600; color: #166534;">${questionsTotal}</span>
                        </td>
                      </tr>
                      ${
                        questionsAiFilled > 0
                          ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 14px; color: #15803d;">AI-Assisted:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="font-size: 14px; font-weight: 600; color: #7c3aed;">${questionsAiFilled} (${aiFillRate}%)</span>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 14px; color: #15803d;">Submitted:</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="font-size: 14px; font-weight: 600; color: #166534;">${new Date().toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}</span>
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
                    <a href="${reviewUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Review Responses
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                You can approve or request changes to the vendor's responses from the review page.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                This notification was sent by NIS2 Comply.
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
