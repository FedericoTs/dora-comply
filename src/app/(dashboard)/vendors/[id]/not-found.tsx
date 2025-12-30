import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VendorNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">Vendor Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        The vendor you&apos;re looking for doesn&apos;t exist or you don&apos;t have
        permission to view it.
      </p>
      <Button asChild className="mt-6">
        <Link href="/vendors">Back to Vendors</Link>
      </Button>
    </div>
  );
}
