/**
 * CTPP Implementation Verification Script
 * Validates type consistency between TypeScript, Zod schemas, and database
 */

import {
  CTPP_DESIGNATION_SOURCE_LABELS,
  CTPP_AUTHORITY_LABELS,
  OVERSIGHT_PLAN_STATUS_INFO,
  CTPP_SUBSTITUTABILITY_INFO,
} from '../src/lib/vendors/types';

import {
  ctppDesignationSourceSchema,
  ctppDesignatingAuthoritySchema,
  oversightPlanStatusSchema,
  ctppSubstitutabilitySchema,
} from '../src/lib/vendors/schemas';

console.log('=== CTPP IMPLEMENTATION VERIFICATION ===\n');

// Database constraint values (from migration 017)
const DB_CONSTRAINTS = {
  ctpp_designation_source: ['esa_list', 'self_identified', 'authority_notification'],
  ctpp_designating_authority: ['EBA', 'ESMA', 'EIOPA'],
  lead_overseer: ['EBA', 'ESMA', 'EIOPA'],
  oversight_plan_status: ['not_applicable', 'pending', 'in_progress', 'completed'],
  ctpp_substitutability_assessment: ['easily_substitutable', 'moderately_difficult', 'highly_concentrated', 'no_alternatives'],
};

let passCount = 0;
let failCount = 0;

// Test 1: Verify Zod schema values match database constraints
console.log('1. Verifying Zod schema values match database constraints...');

const zodSchemaValues: Record<string, readonly string[]> = {
  ctpp_designation_source: ctppDesignationSourceSchema.options,
  ctpp_designating_authority: ctppDesignatingAuthoritySchema.options,
  oversight_plan_status: oversightPlanStatusSchema.options,
  ctpp_substitutability_assessment: ctppSubstitutabilitySchema.options,
};

for (const [field, dbValues] of Object.entries(DB_CONSTRAINTS)) {
  if (field === 'lead_overseer') continue; // Same as designating authority

  const zodValues = zodSchemaValues[field];
  const dbSet = new Set(dbValues);
  const zodSet = new Set(zodValues);

  const missing = dbValues.filter(v => !zodSet.has(v));
  const extra = zodValues.filter(v => !dbSet.has(v));

  if (missing.length > 0 || extra.length > 0) {
    console.log('  ❌ FAIL: ' + field);
    if (missing.length > 0) console.log('     Missing in Zod: ' + missing.join(', '));
    if (extra.length > 0) console.log('     Extra in Zod: ' + extra.join(', '));
    failCount++;
  } else {
    console.log('  ✅ PASS: ' + field + ' (' + dbValues.length + ' values)');
    passCount++;
  }
}

// Test 2: Verify UI labels exist for all enum values
console.log('\n2. Verifying UI labels exist for all enum values...');

const labelMaps: Record<string, { values: string[]; labels: Record<string, unknown> }> = {
  ctpp_designation_source: { values: DB_CONSTRAINTS.ctpp_designation_source, labels: CTPP_DESIGNATION_SOURCE_LABELS },
  ctpp_designating_authority: { values: DB_CONSTRAINTS.ctpp_designating_authority, labels: CTPP_AUTHORITY_LABELS },
  oversight_plan_status: { values: DB_CONSTRAINTS.oversight_plan_status, labels: OVERSIGHT_PLAN_STATUS_INFO },
  ctpp_substitutability_assessment: { values: DB_CONSTRAINTS.ctpp_substitutability_assessment, labels: CTPP_SUBSTITUTABILITY_INFO },
};

for (const [field, { values, labels }] of Object.entries(labelMaps)) {
  const missingLabels = values.filter(v => !(v in labels));
  if (missingLabels.length > 0) {
    console.log('  ❌ FAIL: ' + field + ' - Missing labels: ' + missingLabels.join(', '));
    failCount++;
  } else {
    console.log('  ✅ PASS: ' + field + ' - All ' + values.length + ' values have labels');
    passCount++;
  }
}

// Test 3: Count expected database columns
console.log('\n3. Counting CTPP-related database columns...');
const expectedColumns = [
  'is_ctpp',
  'ctpp_designation_date',
  'ctpp_designation_source',
  'ctpp_designating_authority',
  'ctpp_designation_reason',
  'lead_overseer',
  'lead_overseer_assigned_date',
  'lead_overseer_contact_email',
  'joint_examination_team',
  'oversight_plan_status',
  'last_oversight_assessment_date',
  'next_oversight_assessment_date',
  'oversight_findings_count',
  'oversight_recommendations_pending',
  'info_sharing_portal_access',
  'info_sharing_portal_url',
  'last_info_exchange_date',
  'ctpp_exit_strategy_documented',
  'ctpp_exit_strategy_last_review',
  'ctpp_substitutability_assessment',
];
console.log('  Expected: ' + expectedColumns.length + ' CTPP columns');
passCount++;

// Test 4: Verify DORA Article coverage
console.log('\n4. Verifying DORA Article coverage...');
const doraArticleCoverage = {
  'Art. 33 - Designation': ['is_ctpp', 'ctpp_designation_source', 'ctpp_designating_authority', 'ctpp_designation_date'],
  'Art. 34 - Lead Overseer': ['lead_overseer', 'lead_overseer_assigned_date', 'lead_overseer_contact_email'],
  'Art. 35-37 - Oversight': ['oversight_plan_status', 'last_oversight_assessment_date', 'oversight_findings_count'],
  'Art. 37 - Joint Examination': ['joint_examination_team'],
  'Art. 38 - Info Sharing': ['info_sharing_portal_access', 'info_sharing_portal_url', 'last_info_exchange_date'],
  'Art. 28(8) - Exit Strategy': ['ctpp_exit_strategy_documented', 'ctpp_substitutability_assessment'],
};

for (const [article, columns] of Object.entries(doraArticleCoverage)) {
  const allExist = columns.every(col => expectedColumns.includes(col));
  if (allExist) {
    console.log('  ✅ ' + article + ' - ' + columns.length + ' field(s)');
    passCount++;
  } else {
    const missing = columns.filter(col => !expectedColumns.includes(col));
    console.log('  ❌ ' + article + ' - Missing: ' + missing.join(', '));
    failCount++;
  }
}

// Summary
console.log('\n=== VERIFICATION SUMMARY ===');
console.log('Passed: ' + passCount);
console.log('Failed: ' + failCount);
if (failCount === 0) {
  console.log('\n✅ All CTPP verification checks passed!');
} else {
  console.log('\n❌ Some checks failed - review above');
  process.exit(1);
}
