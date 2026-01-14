/**
 * TLPT Detail Content Component
 *
 * Main content display for TLPT detail page
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTLPTById } from '@/lib/testing/queries';
import { TLPTInfoCard } from './tlpt-info-card';
import { ProvidersCard } from './providers-card';
import { TIBERPhaseProgress } from './tiber-phase-progress';
import { RegulatorCard } from './regulator-card';
import { Article26Card } from './article26-card';

interface TLPTDetailContentProps {
  id: string;
}

export async function TLPTDetailContent({ id }: TLPTDetailContentProps) {
  const { data: tlpt, error } = await getTLPTById(id);

  if (error || !tlpt) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/testing" className="hover:underline">
              Resilience Testing
            </Link>
            <span>/</span>
            <Link href="/testing/tlpt" className="hover:underline">
              TLPT
            </Link>
            <span>/</span>
            <span>{tlpt.tlpt_ref}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{tlpt.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/testing/tlpt/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <TLPTInfoCard tlpt={tlpt} />
          <ProvidersCard tlpt={tlpt} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <TIBERPhaseProgress tlpt={tlpt} />
          <RegulatorCard tlpt={tlpt} />
          <Article26Card />
        </div>
      </div>
    </div>
  );
}
