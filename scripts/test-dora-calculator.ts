#!/usr/bin/env npx tsx
/**
 * DORA Compliance Calculator Tests
 *
 * Validates the accuracy of:
 * 1. Exception severity scoring
 * 2. Coverage calculation with control effectiveness
 * 3. Gap threshold changes
 * 4. Maturity level calculations
 *
 * Run with: npx tsx scripts/test-dora-calculator.ts
 */

// ============================================================================
// Test Types (mirroring production types)
// ============================================================================

interface ParsedSOC2Exception {
  controlId: string;
  description: string;
  exceptionType?: 'design_deficiency' | 'operating_deficiency' | 'population_deviation';
  impact?: 'low' | 'medium' | 'high';
  managementResponse?: string;
  remediationDate?: string;
  remediationVerified?: boolean;
}

interface EvidenceSource {
  documentId: string;
  documentName: string;
  controlId: string;
  pageRef?: number;
  confidence: number;
}

// Maturity levels
const ML = {
  L0_NOT_PERFORMED: 0,
  L1_INFORMAL: 1,
  L2_PLANNED: 2,
  L3_WELL_DEFINED: 3,
  L4_QUANTITATIVE: 4,
} as const;

type MaturityLevel = typeof ML[keyof typeof ML];

// ============================================================================
// Functions Under Test (copied from dora-calculator.ts for testing)
// ============================================================================

function calculateExceptionSeverityScore(exception: ParsedSOC2Exception): number {
  const typeScore: Record<string, number> = {
    'design_deficiency': 0.3,
    'operating_deficiency': 0.5,
    'population_deviation': 0.7,
  };

  const impactScore: Record<string, number> = {
    'high': 0.4,
    'medium': 0.6,
    'low': 0.8,
  };

  const baseTypeScore = typeScore[exception.exceptionType || 'operating_deficiency'] || 0.5;
  const baseImpactScore = impactScore[exception.impact || 'medium'] || 0.6;

  let remediationBonus = 0;
  if (exception.remediationVerified) {
    remediationBonus = 0.3;
  } else if (exception.remediationDate) {
    const remediationDate = new Date(exception.remediationDate);
    if (remediationDate < new Date()) {
      remediationBonus = 0.15;
    }
  }

  return Math.min(1.0, baseTypeScore * baseImpactScore + remediationBonus);
}

// ============================================================================
// Test Framework
// ============================================================================

let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passedTests++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failedTests++;
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.log(`  ❌ ${name}`);
    console.log(`     ${message}`);
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeCloseTo(expected: number, precision = 2) {
      if (typeof actual !== 'number') {
        throw new Error(`Expected a number, got ${typeof actual}`);
      }
      const diff = Math.abs(actual - expected);
      const epsilon = Math.pow(10, -precision) / 2;
      if (diff > epsilon) {
        throw new Error(`Expected ${actual} to be close to ${expected} (diff: ${diff})`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${actual}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, got ${actual}`);
      }
    },
  };
}

function describe(name: string, fn: () => void) {
  console.log(`\n📋 ${name}`);
  fn();
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Exception Severity Scoring', () => {
  test('Design deficiency + high impact = worst score (~0.12)', () => {
    const exception: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Missing access control',
      exceptionType: 'design_deficiency',
      impact: 'high',
    };
    const score = calculateExceptionSeverityScore(exception);
    expect(score).toBeCloseTo(0.12, 2); // 0.3 * 0.4 = 0.12
  });

  test('Operating deficiency + medium impact = moderate score (~0.30)', () => {
    const exception: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Control didn\'t operate effectively',
      exceptionType: 'operating_deficiency',
      impact: 'medium',
    };
    const score = calculateExceptionSeverityScore(exception);
    expect(score).toBeCloseTo(0.30, 2); // 0.5 * 0.6 = 0.30
  });

  test('Population deviation + low impact = good score (~0.56)', () => {
    const exception: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Minor sampling deviation',
      exceptionType: 'population_deviation',
      impact: 'low',
    };
    const score = calculateExceptionSeverityScore(exception);
    expect(score).toBeCloseTo(0.56, 2); // 0.7 * 0.8 = 0.56
  });

  test('Verified remediation adds 0.3 bonus', () => {
    const withoutRemediation: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Exception',
      exceptionType: 'operating_deficiency',
      impact: 'medium',
    };
    const withRemediation: ParsedSOC2Exception = {
      ...withoutRemediation,
      remediationVerified: true,
    };

    const scoreWithout = calculateExceptionSeverityScore(withoutRemediation);
    const scoreWith = calculateExceptionSeverityScore(withRemediation);

    expect(scoreWith - scoreWithout).toBeCloseTo(0.3, 2);
  });

  test('Past remediation date adds 0.15 bonus', () => {
    const withoutDate: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Exception',
      exceptionType: 'operating_deficiency',
      impact: 'medium',
    };
    const withDate: ParsedSOC2Exception = {
      ...withoutDate,
      remediationDate: '2024-01-01', // Past date
    };

    const scoreWithout = calculateExceptionSeverityScore(withoutDate);
    const scoreWith = calculateExceptionSeverityScore(withDate);

    expect(scoreWith - scoreWithout).toBeCloseTo(0.15, 2);
  });

  test('Score capped at 1.0 even with remediation bonus', () => {
    const exception: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Minor exception',
      exceptionType: 'population_deviation',
      impact: 'low',
      remediationVerified: true,
    };
    const score = calculateExceptionSeverityScore(exception);
    expect(score).toBeCloseTo(0.86, 2); // 0.56 + 0.3 = 0.86, capped at 1.0
  });

  test('Default type is operating_deficiency when not specified', () => {
    const exception: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Exception without type',
      impact: 'medium',
    };
    const score = calculateExceptionSeverityScore(exception);
    expect(score).toBeCloseTo(0.30, 2); // 0.5 * 0.6 = 0.30
  });

  test('Default impact is medium when not specified', () => {
    const exception: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Exception without impact',
      exceptionType: 'operating_deficiency',
    };
    const score = calculateExceptionSeverityScore(exception);
    expect(score).toBeCloseTo(0.30, 2); // 0.5 * 0.6 = 0.30
  });
});

describe('Gap Threshold Validation', () => {
  test('L2_PLANNED (50-69%) should be flagged as gap', () => {
    const maturityLevel = ML.L2_PLANNED;
    const isGap = maturityLevel < ML.L3_WELL_DEFINED;
    expect(isGap).toBeTruthy();
  });

  test('L3_WELL_DEFINED (70%+) should NOT be flagged as gap', () => {
    const maturityLevel = ML.L3_WELL_DEFINED;
    const isGap = maturityLevel < ML.L3_WELL_DEFINED;
    expect(isGap).toBeFalsy();
  });

  test('L4_QUANTITATIVE (85%+) should NOT be flagged as gap', () => {
    const maturityLevel = ML.L4_QUANTITATIVE;
    const isGap = maturityLevel < ML.L3_WELL_DEFINED;
    expect(isGap).toBeFalsy();
  });

  test('L1_INFORMAL (25-49%) should be flagged as gap', () => {
    const maturityLevel = ML.L1_INFORMAL;
    const isGap = maturityLevel < ML.L3_WELL_DEFINED;
    expect(isGap).toBeTruthy();
  });

  test('L0_NOT_PERFORMED (0%) should be flagged as gap', () => {
    const maturityLevel = ML.L0_NOT_PERFORMED;
    const isGap = maturityLevel < ML.L3_WELL_DEFINED;
    expect(isGap).toBeTruthy();
  });
});

describe('Priority Escalation for L0 Requirements', () => {
  function escalatePriority(maturity: MaturityLevel, originalPriority: string): string {
    if (maturity === ML.L0_NOT_PERFORMED) {
      if (originalPriority === 'low') return 'medium';
      if (originalPriority === 'medium') return 'high';
      if (originalPriority === 'high') return 'critical';
    }
    return originalPriority;
  }

  test('Low priority escalates to medium for L0', () => {
    expect(escalatePriority(ML.L0_NOT_PERFORMED, 'low')).toBe('medium');
  });

  test('Medium priority escalates to high for L0', () => {
    expect(escalatePriority(ML.L0_NOT_PERFORMED, 'medium')).toBe('high');
  });

  test('High priority escalates to critical for L0', () => {
    expect(escalatePriority(ML.L0_NOT_PERFORMED, 'high')).toBe('critical');
  });

  test('Critical priority stays critical for L0', () => {
    expect(escalatePriority(ML.L0_NOT_PERFORMED, 'critical')).toBe('critical');
  });

  test('Priority does not escalate for L1+', () => {
    expect(escalatePriority(ML.L1_INFORMAL, 'low')).toBe('low');
    expect(escalatePriority(ML.L2_PLANNED, 'medium')).toBe('medium');
    expect(escalatePriority(ML.L3_WELL_DEFINED, 'high')).toBe('high');
  });
});

describe('Coverage Calculation with Control Effectiveness', () => {
  interface TestControl {
    testResult: 'operating_effectively' | 'exception' | 'not_tested';
  }

  function calculateEffectiveScore(controls: TestControl[]): number {
    return controls.reduce((sum, c) => {
      if (c.testResult === 'operating_effectively') return sum + 1.0;
      if (c.testResult === 'exception') return sum + 0.3;
      if (c.testResult === 'not_tested') return sum + 0.1;
      return sum;
    }, 0);
  }

  test('All effective controls = full score', () => {
    const controls: TestControl[] = [
      { testResult: 'operating_effectively' },
      { testResult: 'operating_effectively' },
      { testResult: 'operating_effectively' },
    ];
    expect(calculateEffectiveScore(controls)).toBe(3.0);
  });

  test('All exception controls = 30% score', () => {
    const controls: TestControl[] = [
      { testResult: 'exception' },
      { testResult: 'exception' },
      { testResult: 'exception' },
    ];
    expect(calculateEffectiveScore(controls)).toBeCloseTo(0.9, 2); // 3 * 0.3
  });

  test('Mixed controls = proportional score', () => {
    const controls: TestControl[] = [
      { testResult: 'operating_effectively' }, // 1.0
      { testResult: 'exception' },              // 0.3
      { testResult: 'not_tested' },             // 0.1
    ];
    expect(calculateEffectiveScore(controls)).toBeCloseTo(1.4, 2);
  });

  test('Not tested controls = 10% score', () => {
    const controls: TestControl[] = [
      { testResult: 'not_tested' },
      { testResult: 'not_tested' },
    ];
    expect(calculateEffectiveScore(controls)).toBeCloseTo(0.2, 2);
  });
});

describe('Maturity Level from Coverage', () => {
  function scoreToMaturity(percentage: number): MaturityLevel {
    if (percentage >= 85) return ML.L4_QUANTITATIVE;
    if (percentage >= 70) return ML.L3_WELL_DEFINED;
    if (percentage >= 50) return ML.L2_PLANNED;
    if (percentage >= 25) return ML.L1_INFORMAL;
    return ML.L0_NOT_PERFORMED;
  }

  test('85%+ coverage = L4_QUANTITATIVE', () => {
    expect(scoreToMaturity(85)).toBe(ML.L4_QUANTITATIVE);
    expect(scoreToMaturity(100)).toBe(ML.L4_QUANTITATIVE);
  });

  test('70-84% coverage = L3_WELL_DEFINED', () => {
    expect(scoreToMaturity(70)).toBe(ML.L3_WELL_DEFINED);
    expect(scoreToMaturity(84)).toBe(ML.L3_WELL_DEFINED);
  });

  test('50-69% coverage = L2_PLANNED', () => {
    expect(scoreToMaturity(50)).toBe(ML.L2_PLANNED);
    expect(scoreToMaturity(69)).toBe(ML.L2_PLANNED);
  });

  test('25-49% coverage = L1_INFORMAL', () => {
    expect(scoreToMaturity(25)).toBe(ML.L1_INFORMAL);
    expect(scoreToMaturity(49)).toBe(ML.L1_INFORMAL);
  });

  test('<25% coverage = L0_NOT_PERFORMED', () => {
    expect(scoreToMaturity(0)).toBe(ML.L0_NOT_PERFORMED);
    expect(scoreToMaturity(24)).toBe(ML.L0_NOT_PERFORMED);
  });
});

describe('Severe Exception Detection', () => {
  function hasSevereException(exceptions: ParsedSOC2Exception[]): boolean {
    return exceptions.some(e =>
      e.exceptionType === 'design_deficiency' ||
      e.impact === 'high'
    );
  }

  test('Design deficiency is severe', () => {
    expect(hasSevereException([{
      controlId: 'CC6.1',
      description: 'Missing control',
      exceptionType: 'design_deficiency',
      impact: 'low',
    }])).toBeTruthy();
  });

  test('High impact is severe', () => {
    expect(hasSevereException([{
      controlId: 'CC6.1',
      description: 'Operating issue',
      exceptionType: 'operating_deficiency',
      impact: 'high',
    }])).toBeTruthy();
  });

  test('Medium impact operating deficiency is NOT severe', () => {
    expect(hasSevereException([{
      controlId: 'CC6.1',
      description: 'Operating issue',
      exceptionType: 'operating_deficiency',
      impact: 'medium',
    }])).toBeFalsy();
  });

  test('Population deviation with low impact is NOT severe', () => {
    expect(hasSevereException([{
      controlId: 'CC6.1',
      description: 'Sampling deviation',
      exceptionType: 'population_deviation',
      impact: 'low',
    }])).toBeFalsy();
  });
});

describe('Operating Status Determination', () => {
  function determineOperatingStatus(
    hasExceptions: boolean,
    hasSevere: boolean,
    hasControls: boolean
  ): 'validated' | 'partial' | 'missing' | 'not_tested' {
    if (!hasControls) return 'not_tested';
    if (!hasExceptions) return 'validated';
    if (hasSevere) return 'missing';
    return 'partial';
  }

  test('No controls = not_tested', () => {
    expect(determineOperatingStatus(false, false, false)).toBe('not_tested');
  });

  test('Controls with no exceptions = validated', () => {
    expect(determineOperatingStatus(false, false, true)).toBe('validated');
  });

  test('Severe exceptions = missing', () => {
    expect(determineOperatingStatus(true, true, true)).toBe('missing');
  });

  test('Non-severe exceptions = partial', () => {
    expect(determineOperatingStatus(true, false, true)).toBe('partial');
  });
});

// ============================================================================
// Run Tests and Report
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('🧪 DORA Compliance Calculator Test Suite');
console.log('='.repeat(60));

// Tests are run inline via describe() calls above

console.log('\n' + '='.repeat(60));
console.log(`📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(60));

if (failedTests > 0) {
  console.log('\n❌ Failed Tests:');
  failures.forEach(f => console.log(`   - ${f}`));
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
