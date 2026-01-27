/**
 * Risk Heat Map Page - Redirect
 *
 * This page now redirects to the main risk register page.
 * The unified /nis2/risk-register page handles Register and Heat Map with tabs.
 */

import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Risk Heat Map | NIS2 Compliance | DORA Comply',
  description: 'Interactive NIS2 risk heat map with inherent and residual risk visualization',
};

export default function HeatMapPage() {
  redirect('/nis2/risk-register');
}
