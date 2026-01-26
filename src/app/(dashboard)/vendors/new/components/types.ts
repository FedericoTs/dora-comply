/**
 * Add Vendor Wizard Types and Constants
 *
 * Simplified 2-step wizard: Basic Info → Risk Profile
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
  { id: 1, title: 'Basic Info', description: 'Name and LEI lookup', icon: Building2, time: '1 min', requiredFields: 1, optionalFields: 1 },
  { id: 2, title: 'Risk Profile', description: 'Classification and details', icon: Shield, time: '1 min', requiredFields: 1, optionalFields: 7 },
];

export const TOTAL_TIME = '~2 min';

export interface LeiSearchState {
  isSearching: boolean;
  suggestions: GLEIFEntity[];
  selectedEntity: GLEIFEntity | null;
}
