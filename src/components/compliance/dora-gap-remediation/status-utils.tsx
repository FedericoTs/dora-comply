'use client';

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CoverageStatus } from './types';

export function getStatusIcon(status: CoverageStatus) {
  switch (status) {
    case 'covered':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'partial':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'gap':
      return <XCircle className="h-4 w-4 text-destructive" />;
  }
}

export function getStatusBadge(status: CoverageStatus) {
  switch (status) {
    case 'covered':
      return <Badge className="bg-success text-white">Covered</Badge>;
    case 'partial':
      return <Badge className="bg-warning text-white">Partial</Badge>;
    case 'gap':
      return <Badge variant="destructive">Gap</Badge>;
  }
}
