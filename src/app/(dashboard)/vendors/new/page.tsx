import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddVendorWizard } from './add-vendor-wizard';

export const metadata: Metadata = {
  title: 'Add Vendor | DORA Comply',
  description: 'Add a new ICT third-party service provider',
};

export default function AddVendorPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/vendors">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Vendors
        </Link>
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Vendor</h1>
        <p className="text-muted-foreground">
          Register a new ICT third-party service provider. Start by entering their
          name or LEI to auto-fill details.
        </p>
      </div>

      {/* Wizard */}
      <AddVendorWizard />
    </div>
  );
}
