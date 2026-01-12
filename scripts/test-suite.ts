#!/usr/bin/env npx tsx
/**
 * DORA Comply - Comprehensive Test Suite
 *
 * Tests critical business logic including:
 * - LEI validation (ISO 17442)
 * - API input sanitization (XSS, SQL injection)
 * - Vendor schema validation
 * - DORA compliance calculations
 *
 * Run with: npx tsx scripts/test-suite.ts
 */

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
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: unknown) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
    toContain(expected: string) {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toMatch(pattern: RegExp) {
      if (typeof actual !== 'string' || !pattern.test(actual)) {
        throw new Error(`Expected "${actual}" to match ${pattern}`);
      }
    },
    toThrow(expectedMessage?: string) {
      if (typeof actual !== 'function') {
        throw new Error(`Expected a function, got ${typeof actual}`);
      }
      try {
        actual();
        throw new Error('Expected function to throw, but it did not');
      } catch (error) {
        if (expectedMessage && error instanceof Error && !error.message.includes(expectedMessage)) {
          throw new Error(`Expected error message to include "${expectedMessage}", got "${error.message}"`);
        }
      }
    },
    toHaveLength(expected: number) {
      if (!Array.isArray(actual) && typeof actual !== 'string') {
        throw new Error(`Expected array or string, got ${typeof actual}`);
      }
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new Error(`Expected ${actual} to be >= ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new Error(`Expected ${actual} to be <= ${expected}`);
      }
    },
  };
}

function describe(name: string, fn: () => void) {
  console.log(`\n📋 ${name}`);
  fn();
}

// ============================================================================
// LEI Validation (from src/lib/vendors/schemas.ts)
// ============================================================================

function validateLEIChecksum(lei: string): boolean {
  if (!lei || lei.length !== 20) return false;

  const converted = lei
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 48 && code <= 57) return char;
      if (code >= 65 && code <= 90) return (code - 55).toString();
      return '';
    })
    .join('');

  let remainder = 0;
  for (let i = 0; i < converted.length; i++) {
    remainder = (remainder * 10 + parseInt(converted[i], 10)) % 97;
  }

  return remainder === 1;
}

describe('LEI Validation (ISO 17442)', () => {
  test('Valid LEI passes checksum validation', () => {
    // Known valid LEIs
    expect(validateLEIChecksum('529900T8BM49AURSDO55')).toBeTruthy(); // Deutsche Bank
    expect(validateLEIChecksum('7H6GLXDRUGQFU57RNE97')).toBeTruthy(); // Example valid
  });

  test('Invalid LEI fails checksum validation', () => {
    expect(validateLEIChecksum('529900T8BM49AURSDO56')).toBeFalsy(); // Wrong checksum
    expect(validateLEIChecksum('INVALID0000000000000')).toBeFalsy();
  });

  test('Rejects LEI with wrong length', () => {
    expect(validateLEIChecksum('123')).toBeFalsy();
    expect(validateLEIChecksum('12345678901234567890123')).toBeFalsy();
    expect(validateLEIChecksum('')).toBeFalsy();
  });

  test('Handles edge cases', () => {
    expect(validateLEIChecksum('00000000000000000000')).toBeFalsy();
    expect(validateLEIChecksum('AAAAAAAAAAAAAAAAAAAA')).toBeFalsy();
  });
});

// ============================================================================
// XSS/HTML Sanitization (from src/lib/api/sanitize.ts)
// ============================================================================

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function removeDangerousPatterns(input: string): string {
  return input
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*(?!image\/(png|jpeg|gif|webp))/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/url\s*\(\s*['"]?\s*javascript/gi, 'url(')
    .replace(/@import/gi, '')
    .replace(/-moz-binding/gi, '');
}

function normalizeWhitespace(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeString(input: string, options: { escapeHtml?: boolean; allowNewlines?: boolean; maxLength?: number } = {}): string {
  const { escapeHtml: escape = false, allowNewlines = false, maxLength } = options;
  let result = removeDangerousPatterns(input);
  if (escape) {
    result = escapeHtml(result);
  } else {
    result = stripHtml(result);
  }
  if (!allowNewlines) {
    result = normalizeWhitespace(result);
  }
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  return result;
}

describe('XSS Prevention - HTML Escaping', () => {
  test('Escapes basic HTML characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('"test"')).toBe('&quot;test&quot;');
    expect(escapeHtml("'test'")).toBe('&#x27;test&#x27;');
  });

  test('Escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  test('Handles mixed content', () => {
    expect(escapeHtml('<div class="test">Hello</div>')).toContain('&lt;');
    expect(escapeHtml('<div class="test">Hello</div>')).toContain('&gt;');
  });
});

describe('XSS Prevention - HTML Stripping', () => {
  test('Removes script tags and content', () => {
    expect(stripHtml('<script>alert("xss")</script>Hello')).toBe('Hello');
    expect(stripHtml('Before<script>bad</script>After')).toBe('BeforeAfter');
  });

  test('Removes style tags and content', () => {
    expect(stripHtml('<style>body{display:none}</style>Content')).toBe('Content');
  });

  test('Removes HTML comments', () => {
    expect(stripHtml('<!-- secret comment -->Visible')).toBe('Visible');
  });

  test('Removes generic HTML tags', () => {
    expect(stripHtml('<div><span>Text</span></div>')).toBe('Text');
    expect(stripHtml('<p>Paragraph</p>')).toBe('Paragraph');
  });

  test('Handles nested tags', () => {
    expect(stripHtml('<div><p><span>Nested</span></p></div>')).toBe('Nested');
  });
});

describe('XSS Prevention - Dangerous Patterns', () => {
  test('Removes javascript: protocol', () => {
    expect(removeDangerousPatterns('javascript:alert(1)')).toBe('alert(1)');
    expect(removeDangerousPatterns('JAVASCRIPT:alert(1)')).toBe('alert(1)');
  });

  test('Removes vbscript: protocol', () => {
    expect(removeDangerousPatterns('vbscript:msgbox(1)')).toBe('msgbox(1)');
  });

  test('Removes event handlers', () => {
    expect(removeDangerousPatterns('onclick=alert(1)')).toBe('alert(1)');
    expect(removeDangerousPatterns('onmouseover=bad()')).toBe('bad()');
    expect(removeDangerousPatterns('onerror=hack()')).toBe('hack()');
  });

  test('Removes CSS expression()', () => {
    expect(removeDangerousPatterns('expression(alert(1))')).toBe('alert(1))');
  });

  test('Removes @import', () => {
    expect(removeDangerousPatterns('@import url(evil.css)')).toBe(' url(evil.css)');
  });
});

describe('String Sanitization', () => {
  test('Normalizes whitespace', () => {
    expect(normalizeWhitespace('  too   many   spaces  ')).toBe('too many spaces');
    expect(normalizeWhitespace('\t\ttabs\t\t')).toBe('tabs');
  });

  test('Removes control characters', () => {
    expect(normalizeWhitespace('text\x00\x01\x02')).toBe('text');
  });

  test('Sanitizes with maxLength', () => {
    const result = sanitizeString('This is a long string', { maxLength: 10 });
    // After normalization, cut to 10 chars (may have trailing space)
    expect(result.length).toBeLessThan(12);
    expect(result.startsWith('This is a')).toBeTruthy();
  });

  test('Full sanitization removes XSS', () => {
    const dangerous = '<script>alert("xss")</script><div onclick=evil()>Click</div>';
    const safe = sanitizeString(dangerous);
    expect(safe).toBe('Click');
    // Verify no HTML/script content remains
    expect(safe.includes('<')).toBeFalsy();
    expect(safe.includes('script')).toBeFalsy();
  });
});

// ============================================================================
// SQL Injection Prevention
// ============================================================================

function hasSqlInjectionPatterns(input: string): boolean {
  const patterns = [
    /'\s*OR\s+'?\d*'?\s*=\s*'?\d*'?/i,
    /'\s*OR\s+1\s*=\s*1/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE)\s/i,
    /UNION\s+(ALL\s+)?SELECT/i,
    /--\s*$/,
    /\/\*[\s\S]*?\*\//,
    /'\s*;\s*--/,
    /xp_cmdshell/i,
    /EXEC\s*\(/i,
  ];
  return patterns.some((pattern) => pattern.test(input));
}

describe('SQL Injection Detection', () => {
  test('Detects OR 1=1 injection', () => {
    expect(hasSqlInjectionPatterns("' OR '1'='1")).toBeTruthy();
    expect(hasSqlInjectionPatterns("' OR 1=1")).toBeTruthy();
  });

  test('Detects UNION SELECT injection', () => {
    expect(hasSqlInjectionPatterns("' UNION SELECT * FROM users")).toBeTruthy();
    expect(hasSqlInjectionPatterns("UNION ALL SELECT password")).toBeTruthy();
  });

  test('Detects DROP/DELETE commands', () => {
    expect(hasSqlInjectionPatterns('; DROP TABLE users')).toBeTruthy();
    expect(hasSqlInjectionPatterns('; DELETE FROM accounts')).toBeTruthy();
  });

  test('Detects SQL comments', () => {
    expect(hasSqlInjectionPatterns("admin'--")).toBeTruthy();
    expect(hasSqlInjectionPatterns('/* comment */')).toBeTruthy();
  });

  test('Detects xp_cmdshell', () => {
    expect(hasSqlInjectionPatterns('xp_cmdshell dir')).toBeTruthy();
  });

  test('Safe input passes', () => {
    expect(hasSqlInjectionPatterns('John Doe')).toBeFalsy();
    expect(hasSqlInjectionPatterns('test@example.com')).toBeFalsy();
    expect(hasSqlInjectionPatterns('Normal company name LLC')).toBeFalsy();
  });
});

// ============================================================================
// Field-Specific Sanitization
// ============================================================================

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  const lowerUrl = trimmed.toLowerCase();
  if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:') || lowerUrl.startsWith('vbscript:')) {
    return '';
  }
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return '';
  }
  return trimmed;
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+\s\-().]/g, '').trim();
}

function sanitizeLei(lei: string): string {
  return lei.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function sanitizeCountryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2);
}

describe('Field Sanitization - Email', () => {
  test('Lowercases email', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
  });

  test('Trims whitespace', () => {
    expect(sanitizeEmail('  email@test.com  ')).toBe('email@test.com');
  });
});

describe('Field Sanitization - URL', () => {
  test('Rejects javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  test('Rejects data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  test('Adds https:// to valid domains', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com');
    expect(sanitizeUrl('www.google.com')).toBe('https://www.google.com');
  });

  test('Preserves valid URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });
});

describe('Field Sanitization - Phone', () => {
  test('Keeps valid phone characters', () => {
    expect(sanitizePhone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
  });

  test('Removes invalid characters', () => {
    // Letters are removed, then trim() removes trailing spaces
    expect(sanitizePhone('555-1234 ext ABC')).toBe('555-1234');
  });
});

describe('Field Sanitization - LEI', () => {
  test('Uppercases LEI', () => {
    expect(sanitizeLei('529900t8bm49aursdo55')).toBe('529900T8BM49AURSDO55');
  });

  test('Removes non-alphanumeric characters', () => {
    expect(sanitizeLei('5299-00T8-BM49-AURS-DO55')).toBe('529900T8BM49AURSDO55');
  });
});

describe('Field Sanitization - Country Code', () => {
  test('Uppercases and limits to 2 chars', () => {
    expect(sanitizeCountryCode('us')).toBe('US');
    expect(sanitizeCountryCode('usa')).toBe('US');
  });

  test('Removes non-letter characters', () => {
    expect(sanitizeCountryCode('U1S')).toBe('US');
  });
});

// ============================================================================
// DORA Compliance Calculations (from existing test)
// ============================================================================

interface ParsedSOC2Exception {
  controlId: string;
  description: string;
  exceptionType?: 'design_deficiency' | 'operating_deficiency' | 'population_deviation';
  impact?: 'low' | 'medium' | 'high';
  remediationVerified?: boolean;
  remediationDate?: string;
}

function calculateExceptionSeverityScore(exception: ParsedSOC2Exception): number {
  const typeScore: Record<string, number> = {
    design_deficiency: 0.3,
    operating_deficiency: 0.5,
    population_deviation: 0.7,
  };
  const impactScore: Record<string, number> = {
    high: 0.4,
    medium: 0.6,
    low: 0.8,
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

describe('DORA Exception Severity Scoring', () => {
  test('Design deficiency + high impact = worst score (~0.12)', () => {
    const exception: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Missing access control',
      exceptionType: 'design_deficiency',
      impact: 'high',
    };
    expect(calculateExceptionSeverityScore(exception)).toBeCloseTo(0.12, 2);
  });

  test('Population deviation + low impact = best score (~0.56)', () => {
    const exception: ParsedSOC2Exception = {
      controlId: 'CC6.1',
      description: 'Minor sampling deviation',
      exceptionType: 'population_deviation',
      impact: 'low',
    };
    expect(calculateExceptionSeverityScore(exception)).toBeCloseTo(0.56, 2);
  });
});

// ============================================================================
// Incident Classification (DORA Article 19)
// ============================================================================

interface IncidentCriteria {
  affectedClients: number;
  financialImpact: number;
  durationMinutes: number;
  geographicSpread: number;
  dataBreached: boolean;
  criticalServicesAffected: boolean;
}

function classifyIncident(criteria: IncidentCriteria): 'major' | 'significant' | 'minor' {
  // DORA Article 19 criteria for Major incident
  const majorThresholds = {
    affectedClients: 10000,
    financialImpact: 100000, // EUR
    durationMinutes: 120,
    geographicSpread: 3, // countries
  };

  let majorCriteriaMet = 0;

  if (criteria.affectedClients >= majorThresholds.affectedClients) majorCriteriaMet++;
  if (criteria.financialImpact >= majorThresholds.financialImpact) majorCriteriaMet++;
  if (criteria.durationMinutes >= majorThresholds.durationMinutes) majorCriteriaMet++;
  if (criteria.geographicSpread >= majorThresholds.geographicSpread) majorCriteriaMet++;
  if (criteria.dataBreached) majorCriteriaMet++;
  if (criteria.criticalServicesAffected) majorCriteriaMet++;

  // Major if 3+ criteria met
  if (majorCriteriaMet >= 3) return 'major';

  // Significant if 1-2 criteria met
  if (majorCriteriaMet >= 1) return 'significant';

  return 'minor';
}

describe('Incident Classification (DORA Article 19)', () => {
  test('Major incident - multiple criteria met', () => {
    const criteria: IncidentCriteria = {
      affectedClients: 50000,
      financialImpact: 500000,
      durationMinutes: 300,
      geographicSpread: 5,
      dataBreached: true,
      criticalServicesAffected: true,
    };
    expect(classifyIncident(criteria)).toBe('major');
  });

  test('Significant incident - 1-2 criteria met', () => {
    const criteria: IncidentCriteria = {
      affectedClients: 5000,
      financialImpact: 150000, // Over threshold
      durationMinutes: 60,
      geographicSpread: 1,
      dataBreached: false,
      criticalServicesAffected: true, // Over threshold
    };
    expect(classifyIncident(criteria)).toBe('significant');
  });

  test('Minor incident - no criteria met', () => {
    const criteria: IncidentCriteria = {
      affectedClients: 100,
      financialImpact: 5000,
      durationMinutes: 30,
      geographicSpread: 1,
      dataBreached: false,
      criticalServicesAffected: false,
    };
    expect(classifyIncident(criteria)).toBe('minor');
  });
});

// ============================================================================
// Incident Reporting Deadlines
// ============================================================================

interface IncidentDeadlines {
  initialReport: Date;
  intermediateReport: Date;
  finalReport: Date;
}

function calculateIncidentDeadlines(detectionTime: Date): IncidentDeadlines {
  const initial = new Date(detectionTime);
  initial.setHours(initial.getHours() + 4); // 4 hours for initial

  const intermediate = new Date(detectionTime);
  intermediate.setHours(intermediate.getHours() + 72); // 72 hours for intermediate

  const final = new Date(detectionTime);
  final.setDate(final.getDate() + 30); // 30 days for final

  return { initialReport: initial, intermediateReport: intermediate, finalReport: final };
}

describe('Incident Reporting Deadlines (DORA)', () => {
  test('Initial report due in 4 hours', () => {
    const detection = new Date('2025-01-01T10:00:00Z');
    const deadlines = calculateIncidentDeadlines(detection);
    expect(deadlines.initialReport.getTime() - detection.getTime()).toBe(4 * 60 * 60 * 1000);
  });

  test('Intermediate report due in 72 hours', () => {
    const detection = new Date('2025-01-01T10:00:00Z');
    const deadlines = calculateIncidentDeadlines(detection);
    expect(deadlines.intermediateReport.getTime() - detection.getTime()).toBe(72 * 60 * 60 * 1000);
  });

  test('Final report due in 30 days', () => {
    const detection = new Date('2025-01-01T10:00:00Z');
    const deadlines = calculateIncidentDeadlines(detection);
    const diffDays = Math.round((deadlines.finalReport.getTime() - detection.getTime()) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(30);
  });
});

// ============================================================================
// Concentration Risk Calculation
// ============================================================================

interface ConcentrationMetrics {
  herfindahlIndex: number;
  topVendorShare: number;
  geographicConcentration: number;
}

function calculateHerfindahlIndex(shares: number[]): number {
  // HHI = sum of squared market shares
  return shares.reduce((sum, share) => sum + Math.pow(share / 100, 2), 0) * 10000;
}

function assessConcentrationRisk(hhi: number): 'low' | 'moderate' | 'high' {
  if (hhi < 1500) return 'low';
  if (hhi < 2500) return 'moderate';
  return 'high';
}

describe('Concentration Risk - Herfindahl Index', () => {
  test('Perfectly distributed market = low HHI', () => {
    // 10 vendors with 10% each
    const shares = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    const hhi = calculateHerfindahlIndex(shares);
    // Use toBeCloseTo for floating point comparison
    expect(hhi).toBeCloseTo(1000, 0); // 10 * 100 = 1000
    expect(assessConcentrationRisk(hhi)).toBe('low');
  });

  test('Concentrated market = high HHI', () => {
    // One vendor with 70%, rest split
    const shares = [70, 10, 10, 5, 5];
    const hhi = calculateHerfindahlIndex(shares);
    expect(hhi).toBeGreaterThan(5000);
    expect(assessConcentrationRisk(hhi)).toBe('high');
  });

  test('Monopoly = maximum HHI', () => {
    const shares = [100];
    const hhi = calculateHerfindahlIndex(shares);
    expect(hhi).toBe(10000);
  });
});

// ============================================================================
// RoI Validation Rules
// ============================================================================

function validateLeiFormat(lei: string): { valid: boolean; error?: string } {
  if (!lei) return { valid: true }; // Optional
  if (!/^[A-Z0-9]{20}$/.test(lei)) {
    return { valid: false, error: 'LEI must be exactly 20 alphanumeric characters' };
  }
  if (!validateLEIChecksum(lei)) {
    return { valid: false, error: 'Invalid LEI checksum' };
  }
  return { valid: true };
}

function validateDateRange(start: string, end: string): { valid: boolean; error?: string } {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }
  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }
  if (endDate < startDate) {
    return { valid: false, error: 'End date must be after start date' };
  }
  return { valid: true };
}

function validateCountryCode(code: string): { valid: boolean; error?: string } {
  if (!code) return { valid: true };
  if (!/^[A-Z]{2}$/.test(code)) {
    return { valid: false, error: 'Country code must be 2 uppercase letters (ISO 3166-1)' };
  }
  return { valid: true };
}

describe('RoI Validation - LEI Format', () => {
  test('Valid LEI passes', () => {
    expect(validateLeiFormat('529900T8BM49AURSDO55').valid).toBeTruthy();
  });

  test('Invalid format fails', () => {
    expect(validateLeiFormat('INVALID').valid).toBeFalsy();
    expect(validateLeiFormat('12345').valid).toBeFalsy();
  });

  test('Invalid checksum fails', () => {
    expect(validateLeiFormat('529900T8BM49AURSDO56').valid).toBeFalsy();
  });

  test('Empty LEI passes (optional)', () => {
    expect(validateLeiFormat('').valid).toBeTruthy();
  });
});

describe('RoI Validation - Date Range', () => {
  test('Valid date range passes', () => {
    expect(validateDateRange('2025-01-01', '2025-12-31').valid).toBeTruthy();
  });

  test('End before start fails', () => {
    expect(validateDateRange('2025-12-31', '2025-01-01').valid).toBeFalsy();
  });

  test('Invalid dates fail', () => {
    expect(validateDateRange('invalid', '2025-01-01').valid).toBeFalsy();
    expect(validateDateRange('2025-01-01', 'invalid').valid).toBeFalsy();
  });
});

describe('RoI Validation - Country Code', () => {
  test('Valid ISO codes pass', () => {
    expect(validateCountryCode('US').valid).toBeTruthy();
    expect(validateCountryCode('DE').valid).toBeTruthy();
    expect(validateCountryCode('GB').valid).toBeTruthy();
  });

  test('Invalid codes fail', () => {
    expect(validateCountryCode('USA').valid).toBeFalsy();
    expect(validateCountryCode('us').valid).toBeFalsy();
    expect(validateCountryCode('1A').valid).toBeFalsy();
  });
});

// ============================================================================
// Run Tests
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('🧪 DORA Comply - Comprehensive Test Suite');
console.log('='.repeat(70));

console.log('\n' + '='.repeat(70));
console.log(`📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
console.log('='.repeat(70));

if (failedTests > 0) {
  console.log('\n❌ Failed Tests:');
  failures.forEach((f) => console.log(`   - ${f}`));
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
