import { getVendorStats } from '@/lib/vendors/queries';
import { getDocumentStats } from '@/lib/documents/queries';
import { getIncidentStatsEnhanced } from '@/lib/incidents/queries';
import { fetchAllTemplateStats } from '@/lib/roi/queries';

// ============================================================================
// Onboarding Progress Types
// ============================================================================

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  time: string;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  completed: number;
  total: number;
  isNewUser: boolean;
  nextStep: OnboardingStep | null;
}

// ============================================================================
// Step Configuration
// ============================================================================

const STEP_CONFIG = {
  'add-vendor': {
    label: 'Add first vendor',
    description: 'Start building your Register of Information by adding your ICT providers.',
    href: '/vendors/new',
    time: '~2 min',
  },
  'upload-docs': {
    label: 'Upload documents',
    description: 'Add contracts and certifications for automated compliance extraction.',
    href: '/documents',
    time: '~3 min',
  },
  'setup-incidents': {
    label: 'Set up incidents',
    description: "Configure incident reporting to meet DORA's 4-hour requirement.",
    href: '/incidents/new',
    time: '~2 min',
  },
  'start-roi': {
    label: 'Start RoI',
    description: 'Review and finalize your Register of Information for regulators.',
    href: '/roi',
    time: '~5 min',
  },
} as const;

// ============================================================================
// Main Function
// ============================================================================

/**
 * Calculate onboarding progress for the current user/organization
 * This is a server-side function that fetches data and calculates completion status
 */
export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  try {
    // Fetch all required stats in parallel
    const [vendorStats, documentStats, incidentStatsResult, roiStats] = await Promise.all([
      getVendorStats(),
      getDocumentStats(),
      getIncidentStatsEnhanced(),
      fetchAllTemplateStats(),
    ]);

    const incidentStats = incidentStatsResult.data;

    // Calculate RoI completeness
    const templatesWithData = roiStats.filter(s => s.rowCount > 0);
    const avgRoiCompleteness = templatesWithData.length > 0
      ? Math.round(templatesWithData.reduce((sum, s) => sum + s.completeness, 0) / templatesWithData.length)
      : 0;

    // Build steps array with completion status
    const steps: OnboardingStep[] = [
      {
        id: 'add-vendor',
        ...STEP_CONFIG['add-vendor'],
        done: vendorStats.total > 0,
      },
      {
        id: 'upload-docs',
        ...STEP_CONFIG['upload-docs'],
        done: documentStats.total > 0,
      },
      {
        id: 'setup-incidents',
        ...STEP_CONFIG['setup-incidents'],
        done: (incidentStats?.total ?? 0) > 0,
      },
      {
        id: 'start-roi',
        ...STEP_CONFIG['start-roi'],
        done: avgRoiCompleteness > 0,
      },
    ];

    const completed = steps.filter(s => s.done).length;
    const total = steps.length;
    const isNewUser = completed < 2;
    const nextStep = steps.find(s => !s.done) || null;

    return {
      steps,
      completed,
      total,
      isNewUser,
      nextStep,
    };
  } catch (error) {
    // Return default progress on error (prevents layout from breaking)
    console.error('Failed to fetch onboarding progress:', error);
    return {
      steps: Object.entries(STEP_CONFIG).map(([id, config]) => ({
        id,
        ...config,
        done: false,
      })),
      completed: 0,
      total: 4,
      isNewUser: true,
      nextStep: {
        id: 'add-vendor',
        ...STEP_CONFIG['add-vendor'],
        done: false,
      },
    };
  }
}
