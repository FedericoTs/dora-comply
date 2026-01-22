/**
 * Team Invitation Email Template
 *
 * Sent when an admin invites a new team member to join the organization
 */

interface TeamInviteEmailProps {
  email: string;
  organizationName: string;
  role: string;
  inviterName: string;
  token: string;
  baseUrl: string;
  expiresAt: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full access to all features including team management and settings',
  analyst: 'Access to compliance workflows, assessments, and reporting',
  viewer: 'Read-only access to dashboards and reports',
};

export function generateTeamInviteEmail({
  email,
  organizationName,
  role,
  inviterName,
  token,
  baseUrl,
  expiresAt,
}: TeamInviteEmailProps): { subject: string; html: string } {
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const expiresDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const roleDescription = ROLE_DESCRIPTIONS[role] || 'Access to the compliance platform';
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);

  const subject = `You've been invited to join ${organizationName} on NIS2 Comply`;

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
                Hello,
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on NIS2 Comply, the AI-powered compliance platform for EU organizations.
              </p>

              <!-- Role Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 8px; font-size: 16px; color: #166534;">
                      Your Role: ${roleName}
                    </h2>
                    <p style="margin: 0; font-size: 14px; color: #15803d; line-height: 1.5;">
                      ${roleDescription}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- What You'll Get Access To -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;">
                      Platform Features:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #6b7280; line-height: 1.8;">
                      <li>NIS2 compliance tracking & gap analysis</li>
                      <li>Third-party vendor risk management</li>
                      <li>AI-powered document analysis</li>
                      <li>Incident reporting workflows</li>
                      <li>Resilience testing management</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; line-height: 1.5;">
                Or copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #059669; word-break: break-all;">${inviteUrl}</a>
              </p>

              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                This invitation expires on ${expiresDate}.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; text-align: center;">
                This email was sent to ${email} because someone invited you to NIS2 Comply.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                If you weren't expecting this invitation, you can safely ignore this email.
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
