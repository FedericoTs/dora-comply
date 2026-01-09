import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'DORA Comply Terms of Service - The terms and conditions governing your use of our platform.',
};

export default function TermsOfServicePage() {
  const lastUpdated = 'January 9, 2025';
  const effectiveDate = 'January 9, 2025';

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
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="lead text-lg text-muted-foreground">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of DORA Comply&apos;s
            platform and services. By accessing or using our services, you agree to be bound by these Terms.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating an account or using DORA Comply, you acknowledge that you have read, understood,
            and agree to be bound by these Terms and our{' '}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            If you do not agree to these Terms, you may not use our services.
          </p>

          <h2>2. Description of Services</h2>
          <p>DORA Comply provides a compliance management platform that includes:</p>
          <ul>
            <li>AI-powered document parsing and analysis</li>
            <li>Vendor risk management tools</li>
            <li>Register of Information (RoI) generation</li>
            <li>ICT incident reporting workflows</li>
            <li>Compliance framework mapping</li>
            <li>Reporting and analytics</li>
          </ul>
          <p>
            Our platform is designed to assist with DORA (Digital Operational Resilience Act) compliance
            but does not constitute legal or regulatory advice.
          </p>

          <h2>3. Account Registration</h2>
          <h3>3.1 Eligibility</h3>
          <p>
            You must be at least 18 years old and have the authority to bind your organization to these Terms.
            By registering, you represent that you are authorized to create an account on behalf of your organization.
          </p>

          <h3>3.2 Account Security</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
            <li>Enabling and maintaining multi-factor authentication where required</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the platform for any unlawful purpose</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the platform&apos;s operation</li>
            <li>Reverse engineer or attempt to extract source code</li>
            <li>Use the platform to process data in violation of applicable laws</li>
            <li>Share account credentials with unauthorized parties</li>
            <li>Exceed your subscription&apos;s usage limits</li>
          </ul>

          <h2>5. Data and Content</h2>
          <h3>5.1 Your Data</h3>
          <p>
            You retain all rights to the data you upload to DORA Comply. By using our services, you grant us
            a limited license to process, store, and display your data as necessary to provide our services.
          </p>

          <h3>5.2 AI Processing</h3>
          <p>
            Our platform uses AI to analyze documents and assist with compliance tasks. You acknowledge that:
          </p>
          <ul>
            <li>AI-generated outputs should be reviewed for accuracy</li>
            <li>You are responsible for verifying compliance decisions</li>
            <li>AI analysis is a tool to assist, not replace, professional judgment</li>
          </ul>

          <h3>5.3 Data Accuracy</h3>
          <p>
            You are responsible for ensuring the accuracy and completeness of data you provide.
            We are not liable for decisions made based on inaccurate input data.
          </p>

          <h2>6. Intellectual Property</h2>
          <h3>6.1 Our Property</h3>
          <p>
            DORA Comply, including its software, design, trademarks, and documentation, is our exclusive property.
            Nothing in these Terms grants you rights to our intellectual property except as expressly stated.
          </p>

          <h3>6.2 Feedback</h3>
          <p>
            If you provide feedback or suggestions about our platform, you grant us the right to use
            such feedback without restriction or compensation.
          </p>

          <h2>7. Subscription and Payment</h2>
          <h3>7.1 Fees</h3>
          <p>
            Access to DORA Comply requires a subscription. Fees are based on your selected plan
            and are billed in advance. All fees are non-refundable unless otherwise stated.
          </p>

          <h3>7.2 Renewal</h3>
          <p>
            Subscriptions automatically renew at the end of each billing period unless cancelled
            before the renewal date. Price changes will be communicated at least 30 days in advance.
          </p>

          <h3>7.3 Taxes</h3>
          <p>
            Fees are exclusive of applicable taxes. You are responsible for paying all taxes
            associated with your subscription.
          </p>

          <h2>8. Service Level and Support</h2>
          <p>
            We strive to maintain 99.9% uptime for our platform. Specific service levels and support
            terms are defined in your subscription agreement. Scheduled maintenance will be
            communicated in advance.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            DORA COMPLY IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            OR NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that:
          </p>
          <ul>
            <li>The platform will be uninterrupted or error-free</li>
            <li>AI outputs will be 100% accurate</li>
            <li>The platform will meet all your compliance requirements</li>
            <li>All security vulnerabilities will be identified or prevented</li>
          </ul>

          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DORA COMPLY SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
            LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
          </p>
          <p>
            Our total liability for any claims arising from these Terms or your use of the platform
            shall not exceed the fees paid by you in the twelve (12) months preceding the claim.
          </p>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless DORA Comply, its officers, directors, employees,
            and agents from any claims, damages, or expenses arising from:
          </p>
          <ul>
            <li>Your use of the platform</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights</li>
            <li>Data you upload to the platform</li>
          </ul>

          <h2>12. Termination</h2>
          <h3>12.1 By You</h3>
          <p>
            You may terminate your account at any time by contacting support. No refunds will be
            provided for partial billing periods.
          </p>

          <h3>12.2 By Us</h3>
          <p>
            We may suspend or terminate your account if you violate these Terms, fail to pay fees,
            or engage in activities that harm our platform or other users.
          </p>

          <h3>12.3 Effect of Termination</h3>
          <p>
            Upon termination, your access to the platform will cease. You may request export of your
            data within 30 days of termination. After this period, your data may be deleted.
          </p>

          <h2>13. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of Germany. Any disputes shall be resolved in the
            courts of Frankfurt am Main, Germany. You agree to attempt good-faith resolution of
            disputes before initiating legal proceedings.
          </p>

          <h2>14. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. Material changes will be communicated via email
            or platform notification at least 30 days before taking effect. Continued use after
            changes constitutes acceptance.
          </p>

          <h2>15. General Provisions</h2>
          <ul>
            <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and DORA Comply.</li>
            <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
            <li><strong>Waiver:</strong> Failure to enforce any right does not waive that right.</li>
            <li><strong>Assignment:</strong> You may not assign these Terms without our consent.</li>
          </ul>

          <h2>16. Contact Information</h2>
          <p>For questions about these Terms, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:legal@doracomply.eu">legal@doracomply.eu</a></li>
            <li><strong>Address:</strong> DORA Comply, Frankfurt, Germany</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
