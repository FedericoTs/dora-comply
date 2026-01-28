/**
 * Add Vendor Wizard Types and Constants
 *
 * Simplified 2-step wizard: Identity & Contact → Risk & Compliance
 */

import { Building2, Shield, type LucideIcon } from 'lucide-react';
import type { GLEIFEntity } from '@/lib/vendors/types';

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  time: string;
  requiredFields: number;
  optionalFields: number;
}

export const WIZARD_STEPS: StepConfig[] = [
  { id: 1, title: 'Identity & Contact', description: 'Name, website, and company details', icon: Building2, time: '1 min', requiredFields: 2, optionalFields: 4 },
  { id: 2, title: 'Risk & Compliance', description: 'Classification and frameworks', icon: Shield, time: '1 min', requiredFields: 1, optionalFields: 6 },
];

export const TOTAL_TIME = '~2 min';

export interface LeiSearchState {
  isSearching: boolean;
  suggestions: GLEIFEntity[];
  selectedEntity: GLEIFEntity | null;
}
