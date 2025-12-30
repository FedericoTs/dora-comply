import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVendorWithRelations } from '@/lib/vendors/queries';
import { EditVendorForm } from './edit-vendor-form';

interface EditVendorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditVendorPageProps): Promise<Metadata> {
  const { id } = await params;
  const vendor = await getVendorWithRelations(id);

  if (!vendor) {
    return { title: 'Vendor Not Found | DORA Comply' };
  }

  return {
    title: `Edit ${vendor.name} | DORA Comply`,
    description: `Edit vendor details for ${vendor.name}`,
  };
}

export default async function EditVendorPage({ params }: EditVendorPageProps) {
  const { id } = await params;
  const vendor = await getVendorWithRelations(id);

  if (!vendor) {
    notFound();
  }

  return <EditVendorForm vendor={vendor} />;
}
