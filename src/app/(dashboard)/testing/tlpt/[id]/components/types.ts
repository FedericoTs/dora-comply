/**
 * TLPT Detail Page Types
 *
 * Shared types for TLPT detail components
 */

import type { getTLPTById } from '@/lib/testing/queries';

export type TLPTData = NonNullable<Awaited<ReturnType<typeof getTLPTById>>['data']>;

export interface TLPTComponentProps {
  tlpt: TLPTData;
}
