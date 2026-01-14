/**
 * Add Vendor Wizard Types and Constants
 */

import { Building2, Shield, Users, type LucideIcon } from 'lucide-react';
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
  { id: 1, title: 'Basic Info', description: 'Name and LEI lookup', icon: Building2, time: '1 min', requiredFields: 1, optionalFields: 1 },
  { id: 2, title: 'Classification', description: 'Tier and provider type', icon: Shield, time: '1 min', requiredFields: 1, optionalFields: 3 },
  { id: 3, title: 'DORA Details', description: 'Critical functions', icon: Users, time: '1 min', requiredFields: 0, optionalFields: 4 },
];

export const TOTAL_TIME = '~3 min';

export interface LeiSearchState {
  isSearching: boolean;
  suggestions: GLEIFEntity[];
  selectedEntity: GLEIFEntity | null;
}
