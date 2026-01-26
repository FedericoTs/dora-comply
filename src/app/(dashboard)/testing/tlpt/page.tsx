/**
 * TLPT Page - Redirect
 *
 * This page now redirects to the main testing page.
 * The unified /testing page handles both Tests and TLPT with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'TLPT | Resilience Testing | DORA Comply',
  description: 'Threat-Led Penetration Testing per DORA Article 26',
};

export default function TLPTPage() {
  redirect('/testing');
}
