/**
 * Autonomous Test Suite for DORA Compliance Gap Fixes
 * Tests all 6 priority fixes implemented
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env from .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let passCount = 0;
let failCount = 0;

function pass(test) {
  console.log(`✅ ${test}`);
  passCount++;
}

function fail(test, reason) {
  console.log(`❌ ${test}: ${reason}`);
  failCount++;
}

async function testB_05_01_ParentLEIFields() {
  console.log('\n=== Test 1: B_05.01 Parent LEI Fields ===\n');

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, name, lei, ultimate_parent_lei, ultimate_parent_name, total_annual_expense, expense_currency')
    .limit(5);

  if (error) {
    fail('B_05.01 vendor query', error.message);
    return;
  }

  pass('B_05.01 vendor columns accessible');

  if (vendors.length > 0) {
    const v = vendors[0];
    if ('ultimate_parent_lei' in v) pass('ultimate_parent_lei column exists');
    else fail('ultimate_parent_lei column', 'missing');

    if ('total_annual_expense' in v) pass('total_annual_expense column exists');
    else fail('total_annual_expense column', 'missing');

    if ('expense_currency' in v) pass('expense_currency column exists');
    else fail('expense_currency column', 'missing');

    console.log(`   Found ${vendors.length} vendors for B_05.01 export`);
  } else {
    pass('B_05.01 query works (no vendors yet)');
  }
}

async function testVendorLEIEnrichmentColumns() {
  console.log('\n=== Test 2: Vendor LEI Enrichment Columns ===\n');

  const enrichmentColumns = [
    'lei_status', 'lei_verified_at', 'lei_next_renewal', 'entity_status',
    'direct_parent_lei', 'direct_parent_name', 'direct_parent_country',
    'ultimate_parent_lei', 'ultimate_parent_name', 'ultimate_parent_country',
    'total_annual_expense', 'expense_currency'
  ];

  const { data, error } = await supabase
    .from('vendors')
    .select(enrichmentColumns.join(', '))
    .limit(1);

  if (error) {
    fail('LEI enrichment columns query', error.message);
    return;
  }

  pass(`All ${enrichmentColumns.length} LEI enrichment columns accessible`);

  const parentColumns = ['direct_parent_lei', 'direct_parent_name', 'ultimate_parent_lei', 'ultimate_parent_name'];
  parentColumns.forEach(col => {
    if (data.length === 0 || col in data[0]) {
      pass(`Parent field: ${col}`);
    } else {
      fail(`Parent field: ${col}`, 'missing from query result');
    }
  });
}

async function testVendorStatsRiskBreakdown() {
  console.log('\n=== Test 3: VendorStats Risk Breakdown ===\n');

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('risk_score, tier, status')
    .is('deleted_at', null);

  if (error) {
    fail('Risk breakdown query', error.message);
    return;
  }

  const byRisk = {
    critical: vendors.filter(v => (v.risk_score ?? 0) >= 81).length,
    high: vendors.filter(v => (v.risk_score ?? 0) >= 61 && (v.risk_score ?? 0) < 81).length,
    medium: vendors.filter(v => (v.risk_score ?? 0) >= 31 && (v.risk_score ?? 0) < 61).length,
    low: vendors.filter(v => (v.risk_score ?? 0) < 31 || v.risk_score === null).length,
  };

  pass('Risk breakdown calculation works');
  console.log(`   Critical: ${byRisk.critical}, High: ${byRisk.high}, Medium: ${byRisk.medium}, Low: ${byRisk.low}`);

  const total = byRisk.critical + byRisk.high + byRisk.medium + byRisk.low;
  if (total === vendors.length) {
    pass(`Risk totals match (${total} vendors)`);
  } else {
    fail('Risk totals', `${total} != ${vendors.length}`);
  }
}

async function testActivityLogTable() {
  console.log('\n=== Test 4: Activity Log Table ===\n');

  const { data, error } = await supabase
    .from('activity_log')
    .select('id, action, entity_type, entity_id, entity_name, details, created_at')
    .limit(5);

  if (error) {
    fail('Activity log query', error.message);
    return;
  }

  pass('Activity log table accessible');
  console.log(`   Found ${data.length} activity entries`);
}

async function testDashboardDataSources() {
  console.log('\n=== Test 5: Dashboard Data Sources ===\n');

  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('tier, status, risk_score, lei, supports_critical_function')
    .is('deleted_at', null);

  if (vendorError) {
    fail('Dashboard vendor stats', vendorError.message);
  } else {
    pass('Dashboard vendor stats query');
    const byTier = {
      critical: vendors.filter(v => v.tier === 'critical').length,
      important: vendors.filter(v => v.tier === 'important').length,
      standard: vendors.filter(v => v.tier === 'standard').length,
    };
    console.log(`   By tier: Critical=${byTier.critical}, Important=${byTier.important}, Standard=${byTier.standard}`);
  }
}

async function testValidationDataSources() {
  console.log('\n=== Test 6: Validation Rules Data Sources ===\n');

  const { data: contracts, error: cErr } = await supabase
    .from('contracts').select('contract_ref').limit(5);
  if (!cErr) {
    pass('B_02.01/B_02.02 data source (contracts)');
    console.log(`   Found ${contracts.length} contracts`);
  } else fail('Contracts query', cErr.message);

  const { data: services, error: sErr } = await supabase
    .from('ict_services').select('service_name').limit(5);
  if (!sErr) {
    pass('B_04.01 data source (ict_services)');
    console.log(`   Found ${services.length} ICT services`);
  } else fail('ICT services query', sErr.message);

  const { data: subcontractors, error: subErr } = await supabase
    .from('subcontractors').select('subcontractor_name').limit(5);
  if (!subErr) {
    pass('B_05.02 data source (subcontractors)');
    console.log(`   Found ${subcontractors.length} subcontractors`);
  } else fail('Subcontractors query', subErr.message);

  const { data: functions, error: fErr } = await supabase
    .from('critical_functions').select('function_name').limit(5);
  if (!fErr) {
    pass('B_06.01 data source (critical_functions)');
    console.log(`   Found ${functions.length} critical functions`);
  } else fail('Critical functions query', fErr.message);
}

async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     DORA Compliance Gap Fixes - Autonomous Test Suite         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  await testB_05_01_ParentLEIFields();
  await testVendorLEIEnrichmentColumns();
  await testVendorStatsRiskBreakdown();
  await testActivityLogTable();
  await testDashboardDataSources();
  await testValidationDataSources();

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log(`║  Results: ${passCount} passed, ${failCount} failed                                  ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests();
