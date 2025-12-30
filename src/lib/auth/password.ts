/**
 * Password Utilities
 * Password strength validation using zxcvbn
 */

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';

// ============================================================================
// Configuration
// ============================================================================

const MIN_SCORE = 3; // 0-4 scale, 3 = "reasonably strong"
const MIN_LENGTH = 12;

// Initialize zxcvbn with language packages
const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
};

zxcvbnOptions.setOptions(options);

// ============================================================================
// Types
// ============================================================================

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTime: string;
  isValid: boolean;
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

// ============================================================================
// Password Strength Analysis
// ============================================================================

/**
 * Analyze password strength using zxcvbn
 * Returns detailed strength information and validation status
 */
export function analyzePassword(
  password: string,
  userInputs: string[] = []
): PasswordStrength {
  const result = zxcvbn(password, userInputs);

  const labels: Record<number, PasswordStrength['label']> = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };

  const requirements = checkRequirements(password);
  const allRequirementsMet = requirements.every((r) => r.met);

  return {
    score: result.score as PasswordStrength['score'],
    label: labels[result.score],
    feedback: {
      warning: result.feedback.warning || '',
      suggestions: result.feedback.suggestions || [],
    },
    crackTime: formatCrackTime(result.crackTimesDisplay.offlineSlowHashing1e4PerSecond),
    isValid: result.score >= MIN_SCORE && allRequirementsMet,
    requirements,
  };
}

/**
 * Check individual password requirements
 */
function checkRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'length',
      label: `At least ${MIN_LENGTH} characters`,
      met: password.length >= MIN_LENGTH,
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'One number',
      met: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'One special character',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
  ];
}

/**
 * Format crack time for display
 */
function formatCrackTime(time: string): string {
  // zxcvbn returns human-readable times, but we can make them more user-friendly
  const replacements: Record<string, string> = {
    centuries: 'centuries',
    century: 'century',
    years: 'years',
    year: 'year',
    months: 'months',
    month: 'month',
    weeks: 'weeks',
    week: 'week',
    days: 'days',
    day: 'day',
    hours: 'hours',
    hour: 'hour',
    minutes: 'minutes',
    minute: 'minute',
    seconds: 'seconds',
    second: 'second',
  };

  let formatted = time;
  Object.entries(replacements).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(key, 'gi'), value);
  });

  return formatted;
}

// ============================================================================
// Password Validation
// ============================================================================

/**
 * Validate password meets all requirements
 * Returns error messages if invalid
 */
export function validatePassword(
  password: string,
  userInputs: string[] = []
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const strength = analyzePassword(password, userInputs);

  // Check requirements
  strength.requirements.forEach((req) => {
    if (!req.met) {
      errors.push(`Password must have ${req.label.toLowerCase()}`);
    }
  });

  // Check zxcvbn score
  if (strength.score < MIN_SCORE) {
    errors.push('Password is too weak. Try adding more unique words or characters.');
    if (strength.feedback.warning) {
      errors.push(strength.feedback.warning);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Password Strength Colors
// ============================================================================

/**
 * Get color class for password strength indicator
 */
export function getStrengthColor(score: PasswordStrength['score']): string {
  const colors: Record<number, string> = {
    0: 'bg-red-500',
    1: 'bg-orange-500',
    2: 'bg-yellow-500',
    3: 'bg-green-500',
    4: 'bg-emerald-500',
  };
  return colors[score];
}

/**
 * Get text color class for password strength label
 */
export function getStrengthTextColor(score: PasswordStrength['score']): string {
  const colors: Record<number, string> = {
    0: 'text-red-600',
    1: 'text-orange-600',
    2: 'text-yellow-600',
    3: 'text-green-600',
    4: 'text-emerald-600',
  };
  return colors[score];
}
