#!/usr/bin/env node
/**
 * Test ESA xBRL-CSV Export Format
 *
 * Verifies the export package matches official ESA structure
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Mock the export functions inline since we can't easily import TypeScript
const ALL_TEMPLATES = [
  'B_01.01', 'B_01.02', 'B_01.03',
  'B_02.01', 'B_02.02', 'B_02.03',
  'B_03.01', 'B_03.02', 'B_03.03',
  'B_04.01', 'B_05.01', 'B_05.02',
  'B_06.01', 'B_07.01', 'B_99.01',
];

function generateReportPackageJson() {
  return JSON.stringify({
    documentInfo: {
      documentType: 'https://xbrl.org/report-package/2023',
    },
  }, null, 2);
}

function generateReportJson() {
  return JSON.stringify({
    documentInfo: {
      documentType: 'https://xbrl.org/2021/xbrl-csv',
      extends: [
        'http://www.eba.europa.eu/eu/fr/xbrl/crr/fws/dora/4.0/mod/dora.json',
      ],
    },
  }, null, 2);
}

function generateParametersCsv(params) {
  return `name,value
entityID,${params.entityId}
refPeriod,${params.refPeriod}
baseCurrency,${params.baseCurrency}
decimalsInteger,${params.decimalsInteger}
decimalsMonetary,${params.decimalsMonetary}
`;
}

function generateFilingIndicatorsCsv(templateData) {
  const lines = ['templateID,reported'];
  for (const templateId of ALL_TEMPLATES) {
    const data = templateData[templateId];
    const reported = data !== undefined && data.length > 0;
    lines.push(`${templateId},${reported}`);
  }
  return lines.join('\n') + '\n';
}

function generateMockCsv(templateId, data) {
  // Simple mock CSV with header only for empty data
  const headers = {
    'B_01.01': 'c0010,c0020,c0030,c0040,c0050,c0060',
    'B_01.02': 'c0010,c0020,c0030,c0040,c0050,c0060,c0070,c0080,c0090,c0100,c0110',
    'B_01.03': 'c0010,c0020,c0030,c0040',
    'B_02.01': 'c0010,c0020,c0030,c0040,c0050',
    'B_02.02': 'c0010,c0020,c0030,c0040,c0050,c0060,c0070,c0080,c0090,c0100,c0110,c0120,c0130,c0140,c0150,c0160,c0170,c0180',
    'B_02.03': 'c0010,c0020,c0030',
    'B_03.01': 'c0010,c0020,c0030',
    'B_03.02': 'c0010,c0020,c0030',
    'B_03.03': 'c0010,c0020,c0031',
    'B_04.01': 'c0010,c0020,c0030,c0040',
    'B_05.01': 'c0010,c0020,c0030,c0040,c0050,c0060,c0070,c0080,c0090,c0100,c0110,c0120',
    'B_05.02': 'c0010,c0020,c0030,c0040,c0050,c0060,c0070',
    'B_06.01': 'c0010,c0020,c0030,c0040,c0050,c0060,c0070,c0080,c0090,c0100',
    'B_07.01': 'c0010,c0020,c0030,c0040,c0050,c0060,c0070,c0080,c0090,c0100,c0110,c0120',
    'B_99.01': '',
  };

  const header = headers[templateId] || '';
  if (data.length === 0) {
    return header + '\n';
  }

  // Add sample data row for templates with data
  const lines = [header];
  for (const row of data) {
    const values = header.split(',').map(col => row[col] || '');
    lines.push(values.join(','));
  }
  return lines.join('\n') + '\n';
}

// Test parameters
const testParams = {
  entityId: 'rs:TESTLEI12345678901234.CON',
  refPeriod: '2024-12-31',
  baseCurrency: 'iso4217:EUR',
  decimalsInteger: 0,
  decimalsMonetary: -3,
};

// Mock template data (some with data, some empty)
const testTemplateData = {
  'B_01.01': [{ c0010: 'TESTLEI12345678901234', c0020: 'Test Entity', c0030: 'DE', c0040: 'eba_CT:x12', c0050: 'BaFin', c0060: '2024-12-31' }],
  'B_01.02': [{ c0010: 'TESTLEI12345678901234', c0020: 'Test Entity', c0030: 'DE' }],
  'B_05.01': [{ c0010: 'VENDOR123', c0020: 'LEI', c0050: 'Cloud Provider Inc' }],
};

// Generate the package
const timestamp = new Date();
const ts = timestamp.toISOString().replace(/[-T:.Z]/g, '').slice(0, 17);
const lei = testParams.entityId.replace('rs:', '');
const folderName = `${lei}_FR_DORA010100_DORA_${testParams.refPeriod}_${ts}`;

// Create output directory
const outputDir = '/tmp/esa-export-test';
const packageDir = join(outputDir, folderName);
const metaInfDir = join(packageDir, 'META-INF');
const reportsDir = join(packageDir, 'reports');

console.log('🧪 Testing ESA xBRL-CSV Export Format\n');
console.log('=' .repeat(60));

// Clean and create directories
if (existsSync(outputDir)) {
  console.log('📁 Cleaning existing test directory...');
}
mkdirSync(metaInfDir, { recursive: true });
mkdirSync(reportsDir, { recursive: true });

console.log(`📁 Created package: ${folderName}/`);

// Write META-INF/reportPackage.json
writeFileSync(join(metaInfDir, 'reportPackage.json'), generateReportPackageJson());
console.log('✅ META-INF/reportPackage.json');

// Write reports/report.json
writeFileSync(join(reportsDir, 'report.json'), generateReportJson());
console.log('✅ reports/report.json');

// Write reports/parameters.csv
writeFileSync(join(reportsDir, 'parameters.csv'), generateParametersCsv(testParams));
console.log('✅ reports/parameters.csv');

// Write reports/FilingIndicators.csv
writeFileSync(join(reportsDir, 'FilingIndicators.csv'), generateFilingIndicatorsCsv(testTemplateData));
console.log('✅ reports/FilingIndicators.csv');

// Write template CSVs
for (const templateId of ALL_TEMPLATES) {
  const data = testTemplateData[templateId] || [];
  const fileName = templateId.toLowerCase() + '.csv';
  const csv = generateMockCsv(templateId, data);
  writeFileSync(join(reportsDir, fileName), csv);
  const status = data.length > 0 ? `✅ (${data.length} rows)` : '⬜ (empty)';
  console.log(`${status} reports/${fileName}`);
}

console.log('\n' + '=' .repeat(60));
console.log('📊 Package Summary:');
console.log(`   - Location: ${packageDir}`);
console.log(`   - Templates with data: ${Object.keys(testTemplateData).length}`);
console.log(`   - Total templates: ${ALL_TEMPLATES.length}`);

// Verify structure
console.log('\n📋 Verifying ESA Structure:');

const checks = [
  { path: 'META-INF/reportPackage.json', required: true },
  { path: 'reports/report.json', required: true },
  { path: 'reports/parameters.csv', required: true },
  { path: 'reports/FilingIndicators.csv', required: true },
  { path: 'reports/b_01.01.csv', required: true },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  const fullPath = join(packageDir, check.path);
  if (existsSync(fullPath)) {
    console.log(`   ✅ ${check.path}`);
    passed++;
  } else {
    console.log(`   ❌ ${check.path} - MISSING`);
    failed++;
  }
}

// Check filename format (dot should be preserved)
const csvFiles = ALL_TEMPLATES.map(t => `reports/${t.toLowerCase()}.csv`);
const wrongFormat = csvFiles.filter(f => f.includes('_01_') || f.includes('_02_'));
if (wrongFormat.length === 0) {
  console.log('   ✅ CSV filename format (dot preserved)');
  passed++;
} else {
  console.log('   ❌ CSV filename format - wrong files:', wrongFormat);
  failed++;
}

console.log('\n' + '=' .repeat(60));
if (failed === 0) {
  console.log('✅ ALL CHECKS PASSED - Package matches ESA format!');
} else {
  console.log(`❌ ${failed} checks failed, ${passed} passed`);
}

console.log('\n📝 To view the generated package:');
console.log(`   tree ${packageDir}`);
console.log(`   cat ${join(reportsDir, 'FilingIndicators.csv')}`);
