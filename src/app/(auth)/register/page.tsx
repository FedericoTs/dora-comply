import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Get Started | DORA Comply',
  description: 'Contact our team to discuss DORA compliance solutions for your organization',
};

/**
 * Registration is handled through sales.
 *
 * DORA Comply is a premium enterprise solution for EU financial institutions.
 * Customers must contact sales to discuss requirements, pricing, and contract
 * terms before receiving access credentials.
 *
 * After contract signing, admins create accounts for their team via the
 * /settings/team invite flow.
 */
export default async function RegisterPage() {
  // Redirect to contact page with context
  redirect('/contact?source=register');
}
