'use client';

import { Check } from 'lucide-react';
import { getCountryFlag } from '@/lib/external/gleif';
import type { GLEIFEntity } from '@/lib/vendors/types';

interface VerifiedEntityCardProps {
  entity: GLEIFEntity;
}

export function VerifiedEntityCard({ entity }: VerifiedEntityCardProps) {
  return (
    <div className="rounded-lg border border-success/50 bg-success/10 p-4">
      <div className="flex items-start gap-3">
        <Check className="h-5 w-5 text-success mt-0.5" />
        <div>
          <p className="font-medium text-success">Entity verified</p>
          <p className="text-sm text-muted-foreground mt-1">
            {entity.legalName}
          </p>
          <p className="text-xs text-muted-foreground">
            {getCountryFlag(entity.legalAddress.country)}{' '}
            {entity.legalAddress.city},{' '}
            {entity.legalAddress.country}
          </p>
        </div>
      </div>
    </div>
  );
}
