/**
 * Test Detail Page Types
 *
 * Shared types for test detail components
 */

import type { getTestById } from '@/lib/testing/queries';
import type { TestFinding, TestType } from '@/lib/testing/types';

export type TestData = NonNullable<Awaited<ReturnType<typeof getTestById>>['data']>;

export interface TestInfoCardProps {
  test: TestData;
}

export interface FindingsTableProps {
  findings: TestFinding[];
  testId: string;
}

export interface QuickStatsCardProps {
  test: TestData;
}

export interface Article25CardProps {
  testType: TestType;
}

export type { TestFinding, TestType };
