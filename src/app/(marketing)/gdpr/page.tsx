import type { Metadata } from 'next';
import Link from 'next/link';
import { Cookie, ArrowLeft, Shield, Lock, Globe, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'GDPR & Cookie Policy',
  description: 'DORA Comply GDPR compliance information and Cookie Policy - How we handle cookies and protect your data rights.',
};

export default function GDPRPage() {
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
            <Cookie className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">GDPR & Cookie Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="p-4 rounded-xl bg-slate-50 border">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-primary" />
              <span className="font-semibold">EU Data Residency</span>
            </div>
            <p className="text-sm text-muted-foreground">
              All data stored in Frankfurt, Germany within the EU.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-primary" />
              <span className="font-semibold">GDPR Compliant</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Full compliance with EU data protection regulations.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Your Control</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your cookie preferences at any time.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-primary" />
              <span className="font-semibold">Data Rights</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Access, export, or delete your data on request.
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <h2>Part 1: Cookie Policy</h2>

          <h3>What Are Cookies?</h3>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help
            the website remember your preferences, keep you logged in, and understand how you use the site.
          </p>

          <h3>Types of Cookies We Use</h3>

          <h4>Essential Cookies (Required)</h4>
          <p>
            These cookies are necessary for the website to function and cannot be disabled. They include:
          </p>
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>sb-*-auth-token</code></td>
                <td>Authentication session</td>
                <td>7 days</td>
              </tr>
              <tr>
                <td><code>dora-comply-cookie-consent</code></td>
                <td>Cookie preference</td>
                <td>1 year</td>
              </tr>
              <tr>
                <td><code>theme</code></td>
                <td>Theme preference</td>
                <td>1 year</td>
              </tr>
              <tr>
                <td><code>region</code></td>
                <td>Region/language preference</td>
                <td>1 year</td>
              </tr>
            </tbody>
          </table>

          <h4>Analytics Cookies (Optional)</h4>
          <p>
            These cookies help us understand how visitors interact with our website. They collect
            anonymous information about page visits and user behavior.
          </p>
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>_ga</code></td>
                <td>Google Analytics ID</td>
                <td>2 years</td>
              </tr>
              <tr>
                <td><code>_gid</code></td>
                <td>Google Analytics session</td>
                <td>24 hours</td>
              </tr>
              <tr>
                <td><code>ph_*</code></td>
                <td>PostHog analytics</td>
                <td>1 year</td>
              </tr>
            </tbody>
          </table>

          <h4>Marketing Cookies (Optional)</h4>
          <p>
            These cookies are used to deliver relevant advertisements and track the effectiveness
            of marketing campaigns.
          </p>
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>_gcl_*</code></td>
                <td>Google Ads conversion</td>
                <td>90 days</td>
              </tr>
              <tr>
                <td><code>li_sugr</code></td>
                <td>LinkedIn tracking</td>
                <td>90 days</td>
              </tr>
            </tbody>
          </table>

          <h3>Managing Your Cookie Preferences</h3>
          <p>
            You can manage your cookie preferences at any time by:
          </p>
          <ul>
            <li>Clicking the cookie settings link in the footer</li>
            <li>Adjusting your browser settings to block or delete cookies</li>
            <li>Using browser extensions that manage cookies</li>
          </ul>
          <p>
            <strong>Note:</strong> Blocking essential cookies may prevent the website from functioning properly.
          </p>

          <hr className="my-10" />

          <h2>Part 2: GDPR Compliance</h2>

          <h3>Data Controller</h3>
          <p>
            DORA Comply acts as a <strong>data controller</strong> for your account information and
            as a <strong>data processor</strong> for compliance data you upload to the platform.
          </p>
          <ul>
            <li><strong>Controller:</strong> DORA Comply GmbH, Frankfurt, Germany</li>
            <li><strong>DPO Contact:</strong> <a href="mailto:dpo@doracomply.eu">dpo@doracomply.eu</a></li>
          </ul>

          <h3>Your GDPR Rights</h3>
          <p>Under the GDPR, you have the following rights:</p>

          <div className="not-prose grid gap-4 my-6">
            <div className="p-4 rounded-lg border bg-slate-50">
              <h4 className="font-semibold mb-1">Right of Access (Art. 15)</h4>
              <p className="text-sm text-muted-foreground">
                Request a copy of all personal data we hold about you.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-slate-50">
              <h4 className="font-semibold mb-1">Right to Rectification (Art. 16)</h4>
              <p className="text-sm text-muted-foreground">
                Request correction of inaccurate or incomplete personal data.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-slate-50">
              <h4 className="font-semibold mb-1">Right to Erasure (Art. 17)</h4>
              <p className="text-sm text-muted-foreground">
                Request deletion of your personal data (&quot;right to be forgotten&quot;).
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-slate-50">
              <h4 className="font-semibold mb-1">Right to Restriction (Art. 18)</h4>
              <p className="text-sm text-muted-foreground">
                Request that we limit the processing of your personal data.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-slate-50">
              <h4 className="font-semibold mb-1">Right to Data Portability (Art. 20)</h4>
              <p className="text-sm text-muted-foreground">
                Receive your data in a structured, machine-readable format.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-slate-50">
              <h4 className="font-semibold mb-1">Right to Object (Art. 21)</h4>
              <p className="text-sm text-muted-foreground">
                Object to processing based on legitimate interests or for marketing.
              </p>
            </div>
          </div>

          <h3>How to Exercise Your Rights</h3>
          <p>To exercise any of these rights:</p>
          <ol>
            <li>Email us at <a href="mailto:privacy@doracomply.eu">privacy@doracomply.eu</a></li>
            <li>Include your full name and the email associated with your account</li>
            <li>Specify which right(s) you wish to exercise</li>
            <li>We will respond within 30 days</li>
          </ol>

          <h3>Data Processing Agreements</h3>
          <p>
            For enterprise customers, we provide Data Processing Agreements (DPAs) that detail:
          </p>
          <ul>
            <li>The scope and purpose of data processing</li>
            <li>Security measures implemented</li>
            <li>Sub-processor information</li>
            <li>Data breach notification procedures</li>
            <li>Audit rights</li>
          </ul>
          <p>
            Contact <a href="mailto:legal@doracomply.eu">legal@doracomply.eu</a> to request a DPA.
          </p>

          <h3>International Data Transfers</h3>
          <p>
            Your data is stored and processed exclusively within the European Union. Our infrastructure
            is hosted in Frankfurt, Germany. We do not transfer personal data outside the EEA unless:
          </p>
          <ul>
            <li>The destination country has an adequacy decision from the European Commission</li>
            <li>Standard Contractual Clauses (SCCs) are in place</li>
            <li>You have explicitly consented to the transfer</li>
          </ul>

          <h3>Data Breach Notification</h3>
          <p>
            In the event of a personal data breach that poses a risk to your rights and freedoms,
            we will:
          </p>
          <ul>
            <li>Notify the relevant supervisory authority within 72 hours</li>
            <li>Notify affected individuals without undue delay</li>
            <li>Document the breach and our response measures</li>
          </ul>

          <h3>Sub-Processors</h3>
          <p>We use the following sub-processors:</p>
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Supabase (AWS)</td>
                <td>Database & Authentication</td>
                <td>EU (Frankfurt)</td>
              </tr>
              <tr>
                <td>Vercel</td>
                <td>Application Hosting</td>
                <td>EU (Frankfurt)</td>
              </tr>
              <tr>
                <td>Anthropic</td>
                <td>AI Document Processing</td>
                <td>US (with SCCs)</td>
              </tr>
            </tbody>
          </table>

          <h3>Supervisory Authority</h3>
          <p>
            You have the right to lodge a complaint with a supervisory authority. Our lead
            supervisory authority is:
          </p>
          <p>
            <strong>Der Hessische Beauftragte für Datenschutz und Informationsfreiheit</strong><br />
            Postfach 3163<br />
            65021 Wiesbaden, Germany<br />
            <a href="https://datenschutz.hessen.de">datenschutz.hessen.de</a>
          </p>

          <h2>Contact Us</h2>
          <p>For any questions about cookies or GDPR compliance:</p>
          <ul>
            <li><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@doracomply.eu">privacy@doracomply.eu</a></li>
            <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@doracomply.eu">dpo@doracomply.eu</a></li>
            <li><strong>General Legal:</strong> <a href="mailto:legal@doracomply.eu">legal@doracomply.eu</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
