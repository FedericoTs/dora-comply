import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'DORA Comply Privacy Policy - How we collect, use, and protect your personal data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 9, 2025';

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="lead text-lg text-muted-foreground">
            DORA Comply (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our platform.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Personal Information</h3>
          <p>We collect personal information that you voluntarily provide to us when you:</p>
          <ul>
            <li>Register for an account</li>
            <li>Complete your organization profile</li>
            <li>Contact us for support</li>
            <li>Subscribe to our newsletter</li>
          </ul>
          <p>This information may include:</p>
          <ul>
            <li>Name and job title</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Organization name and details</li>
            <li>Legal Entity Identifier (LEI)</li>
          </ul>

          <h3>1.2 Compliance Data</h3>
          <p>
            When you use our platform, you may upload or input compliance-related data including:
          </p>
          <ul>
            <li>Vendor information and assessments</li>
            <li>SOC 2, ISO 27001, and other audit reports</li>
            <li>Contract documents</li>
            <li>ICT incident reports</li>
            <li>Register of Information data</li>
          </ul>

          <h3>1.3 Automatically Collected Information</h3>
          <p>We automatically collect certain information when you visit our platform:</p>
          <ul>
            <li>IP address and location data</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Pages visited and time spent</li>
            <li>Referral source</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our platform</li>
            <li>Process and complete your compliance workflows</li>
            <li>Generate Register of Information reports</li>
            <li>Send administrative information and updates</li>
            <li>Respond to inquiries and provide support</li>
            <li>Improve our platform and develop new features</li>
            <li>Detect and prevent fraud or security incidents</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Legal Basis for Processing (GDPR)</h2>
          <p>Under the General Data Protection Regulation (GDPR), we process your data based on:</p>
          <ul>
            <li><strong>Contract Performance:</strong> Processing necessary to provide our services</li>
            <li><strong>Legitimate Interests:</strong> Improving our platform and ensuring security</li>
            <li><strong>Legal Obligation:</strong> Compliance with applicable laws and regulations</li>
            <li><strong>Consent:</strong> Where you have given explicit consent (e.g., marketing)</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>We may share your information with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Third parties who perform services on our behalf (hosting, analytics, support)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale</li>
          </ul>
          <p>
            <strong>We never sell your personal data to third parties.</strong>
          </p>

          <h2>5. Data Storage and Security</h2>
          <p>
            Your data is stored in secure data centers located in the European Union (Frankfurt, Germany).
            We implement industry-standard security measures including:
          </p>
          <ul>
            <li>Encryption at rest and in transit (TLS 1.3)</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and authentication</li>
            <li>Continuous monitoring and logging</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed to provide services.
            Compliance data is retained according to regulatory requirements (typically 5-7 years for financial records).
            You may request deletion of your data at any time, subject to legal retention requirements.
          </p>

          <h2>7. Your Rights Under GDPR</h2>
          <p>As an EU data subject, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
            <li><strong>Restriction:</strong> Limit processing of your data</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@doracomply.eu">privacy@doracomply.eu</a>.
          </p>

          <h2>8. International Data Transfers</h2>
          <p>
            Your data is processed within the European Economic Area (EEA). If we transfer data outside the EEA,
            we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the European Commission.
          </p>

          <h2>9. Cookies</h2>
          <p>
            We use cookies and similar technologies to enhance your experience. For detailed information,
            please see our <Link href="/gdpr" className="text-primary hover:underline">Cookie Policy</Link>.
          </p>

          <h2>10. Children&apos;s Privacy</h2>
          <p>
            Our platform is not intended for individuals under 18 years of age. We do not knowingly collect
            personal data from children.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes
            by posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>12. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:privacy@doracomply.eu">privacy@doracomply.eu</a></li>
            <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@doracomply.eu">dpo@doracomply.eu</a></li>
            <li><strong>Address:</strong> DORA Comply, Frankfurt, Germany</li>
          </ul>

          <h2>13. Supervisory Authority</h2>
          <p>
            You have the right to lodge a complaint with a supervisory authority if you believe your data protection
            rights have been violated. In Germany, this is the Federal Commissioner for Data Protection and Freedom
            of Information (BfDI).
          </p>
        </div>
      </div>
    </div>
  );
}
