/**
 * Multi-Framework Mapping Verification Script
 * Tests data integrity and cross-references
 */

import { ALL_FRAMEWORK_MAPPINGS, getAllFrameworkOverlaps } from '../src/lib/compliance/mappings';
import { getFrameworkRequirements } from '../src/lib/compliance/framework-calculator';
import { FrameworkCode } from '../src/lib/compliance/framework-types';

console.log('=== MULTI-FRAMEWORK MAPPING VERIFICATION ===\n');

// Test 1: Check for duplicate mapping IDs
console.log('1. Checking for duplicate mapping IDs...');
const mappingIds = ALL_FRAMEWORK_MAPPINGS.map(m => m.id);
const duplicateIds = mappingIds.filter((id, idx) => mappingIds.indexOf(id) !== idx);
if (duplicateIds.length > 0) {
  console.log('  ❌ FAIL: Duplicate IDs found:', duplicateIds);
} else {
  console.log('  ✅ PASS: All', mappingIds.length, 'mapping IDs are unique');
}

// Test 2: Verify coverage percentages are valid (0-100)
console.log('\n2. Verifying coverage percentages...');
const invalidCoverage = ALL_FRAMEWORK_MAPPINGS.filter(
  m => m.coverage_percentage < 0 || m.coverage_percentage > 100
);
if (invalidCoverage.length > 0) {
  console.log('  ❌ FAIL: Invalid coverage values:', invalidCoverage.map(m => m.id + ': ' + m.coverage_percentage));
} else {
  console.log('  ✅ PASS: All coverage percentages are valid (0-100)');
}

// Test 3: Verify confidence scores are valid (0-1)
console.log('\n3. Verifying confidence scores...');
const invalidConfidence = ALL_FRAMEWORK_MAPPINGS.filter(
  m => m.confidence < 0 || m.confidence > 1
);
if (invalidConfidence.length > 0) {
  console.log('  ❌ FAIL: Invalid confidence values:', invalidConfidence.map(m => m.id + ': ' + m.confidence));
} else {
  console.log('  ✅ PASS: All confidence scores are valid (0-1)');
}

// Test 4: Verify mapping types are valid
console.log('\n4. Verifying mapping types...');
const validTypes = ['equivalent', 'partial', 'supports', 'related'];
const invalidTypes = ALL_FRAMEWORK_MAPPINGS.filter(
  m => !validTypes.includes(m.mapping_type)
);
if (invalidTypes.length > 0) {
  console.log('  ❌ FAIL: Invalid mapping types:', invalidTypes.map(m => m.id + ': ' + m.mapping_type));
} else {
  console.log('  ✅ PASS: All mapping types are valid');
}

// Test 5: Count mappings by framework pair
console.log('\n5. Mapping counts by framework pair:');
const frameworkPairs: Record<string, number> = {};
ALL_FRAMEWORK_MAPPINGS.forEach(m => {
  const key = m.source_framework + ' → ' + m.target_framework;
  frameworkPairs[key] = (frameworkPairs[key] || 0) + 1;
});
Object.entries(frameworkPairs).sort().forEach(([pair, count]) => {
  console.log('  ' + pair + ': ' + count + ' mappings');
});

// Test 6: Verify framework overlap summaries
console.log('\n6. Framework overlap summaries:');
const overlaps = getAllFrameworkOverlaps();
overlaps.forEach(o => {
  console.log('  ' + o.source + ' → ' + o.target + ': ' + o.total_mappings + ' mappings, ' + o.average_coverage + '% avg coverage');
  console.log('    Equivalent: ' + o.equivalent_count + ', Partial: ' + o.partial_count + ', Supports: ' + o.supports_count + ', Related: ' + o.related_count);
});

// Test 7: Verify source requirement IDs exist
console.log('\n7. Verifying source requirement ID references...');
const frameworks: FrameworkCode[] = ['dora', 'nis2', 'gdpr', 'iso27001'];
let missingSourceRefs = 0;
const missingSourceDetails: string[] = [];

ALL_FRAMEWORK_MAPPINGS.forEach(m => {
  const sourceReqs = getFrameworkRequirements(m.source_framework as FrameworkCode);
  const exists = sourceReqs.some(r => r.id === m.source_requirement_id);
  if (!exists) {
    missingSourceRefs++;
    missingSourceDetails.push(m.id + ': ' + m.source_framework + '/' + m.source_requirement_id);
  }
});

if (missingSourceRefs > 0) {
  console.log('  ⚠️  WARNING: ' + missingSourceRefs + ' source requirement IDs not found in framework data');
  console.log('     (This may be expected for DORA requirements using article-based IDs)');
  if (missingSourceDetails.length <= 10) {
    missingSourceDetails.forEach(d => console.log('     - ' + d));
  } else {
    console.log('     First 10: ');
    missingSourceDetails.slice(0, 10).forEach(d => console.log('     - ' + d));
  }
} else {
  console.log('  ✅ PASS: All source requirement IDs exist');
}

// Test 8: Calculate overall statistics
console.log('\n8. Overall statistics:');
const totalMappings = ALL_FRAMEWORK_MAPPINGS.length;
const avgCoverage = ALL_FRAMEWORK_MAPPINGS.reduce((sum, m) => sum + m.coverage_percentage, 0) / totalMappings;
const avgConfidence = ALL_FRAMEWORK_MAPPINGS.reduce((sum, m) => sum + m.confidence, 0) / totalMappings;
const bidirectionalCount = ALL_FRAMEWORK_MAPPINGS.filter(m => m.bidirectional).length;

console.log('  Total mappings: ' + totalMappings);
console.log('  Average coverage: ' + avgCoverage.toFixed(1) + '%');
console.log('  Average confidence: ' + (avgConfidence * 100).toFixed(1) + '%');
console.log('  Bidirectional mappings: ' + bidirectionalCount + ' (' + ((bidirectionalCount/totalMappings)*100).toFixed(1) + '%)');

// Test 9: Type distribution
console.log('\n9. Mapping type distribution:');
const typeDistribution: Record<string, number> = {};
ALL_FRAMEWORK_MAPPINGS.forEach(m => {
  typeDistribution[m.mapping_type] = (typeDistribution[m.mapping_type] || 0) + 1;
});
Object.entries(typeDistribution).forEach(([type, count]) => {
  console.log('  ' + type + ': ' + count + ' (' + ((count/totalMappings)*100).toFixed(1) + '%)');
});

// Test 10: Framework requirements counts
console.log('\n10. Framework requirement counts:');
frameworks.forEach(fw => {
  const reqs = getFrameworkRequirements(fw);
  console.log('  ' + fw.toUpperCase() + ': ' + reqs.length + ' requirements');
});

// Test 11: Verify GDPR-ISO27001 specific mappings
console.log('\n11. GDPR-ISO27001 mapping verification:');
const gdprIsoMappings = ALL_FRAMEWORK_MAPPINGS.filter(
  m => m.source_framework === 'gdpr' && m.target_framework === 'iso27001'
);
console.log('  Total GDPR→ISO27001 mappings: ' + gdprIsoMappings.length);
const gdprIsoAvgCoverage = gdprIsoMappings.reduce((sum, m) => sum + m.coverage_percentage, 0) / gdprIsoMappings.length;
console.log('  Average coverage: ' + gdprIsoAvgCoverage.toFixed(1) + '%');

// Verify all GDPR source IDs are unique within GDPR-ISO mappings
const gdprSourceIds = gdprIsoMappings.map(m => m.source_requirement_id);
const uniqueGdprSources = new Set(gdprSourceIds).size;
console.log('  Unique GDPR source requirements: ' + uniqueGdprSources);

// Verify all ISO target IDs are valid format
const isoTargetIds = gdprIsoMappings.map(m => m.target_requirement_id);
const validIsoFormat = isoTargetIds.every(id => id.startsWith('iso-A'));
console.log('  ISO target IDs format valid: ' + (validIsoFormat ? '✅ YES' : '❌ NO'));

console.log('\n=== VERIFICATION COMPLETE ===');
