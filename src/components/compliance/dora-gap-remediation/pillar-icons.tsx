'use client';

import { Shield, AlertCircle, TestTube2, Building2, Share2 } from 'lucide-react';
import type { DORAPillar } from '@/lib/compliance/dora-types';

export const PillarIcons: Record<DORAPillar, React.ReactNode> = {
  ICT_RISK: <Shield className="h-4 w-4" />,
  INCIDENT: <AlertCircle className="h-4 w-4" />,
  TESTING: <TestTube2 className="h-4 w-4" />,
  TPRM: <Building2 className="h-4 w-4" />,
  SHARING: <Share2 className="h-4 w-4" />,
};
