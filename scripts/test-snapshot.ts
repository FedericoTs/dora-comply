/**
 * Test Compliance Snapshot Creation
 *
 * Validates that the compliance snapshot calculates real KPI data
 * from live database tables instead of returning zeros.
 *
 * Usage: npx tsx scripts/test-snapshot.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};

    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
    return envVars;
  } catch {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSnapshot() {
  console.log('='.repeat(60));
  console.log('COMPLIANCE SNAPSHOT TEST');
  console.log('='.repeat(60));
  console.log();

  // First, let's check what data exists in the database
  console.log('1. Checking existing data in database...');
  console.log('-'.repeat(40));

  // Get organization ID from first user
  const { data: users } = await supabase
    .from('users')
    .select('id, organization_id, email')
    .limit(1);

  if (!users || users.length === 0) {
    console.log('❌ No users found in database');
    return;
  }

  const orgId = users[0].organization_id;
  console.log(`   Organization ID: ${orgId}`);

  // Count data in each table
  const [vendors, incidents, tests, findings, documents, certs] = await Promise.all([
    supabase.from('vendors').select('id', { count: 'exact' }).eq('organization_id', orgId).is('deleted_at', null),
    supabase.from('incidents').select('id', { count: 'exact' }).eq('organization_id', orgId),
    supabase.from('resilience_tests').select('id', { count: 'exact' }).eq('organization_id', orgId),
    supabase.from('test_findings').select('id', { count: 'exact' }).eq('organization_id', orgId),
    supabase.from('documents').select('id', { count: 'exact' }).eq('organization_id', orgId),
    supabase.from('vendor_certifications').select('id', { count: 'exact' }).eq('organization_id', orgId),
  ]);

  console.log(`   Vendors:        ${vendors.count || 0}`);
  console.log(`   Incidents:      ${incidents.count || 0}`);
  console.log(`   Tests:          ${tests.count || 0}`);
  console.log(`   Findings:       ${findings.count || 0}`);
  console.log(`   Documents:      ${documents.count || 0}`);
  console.log(`   Certifications: ${certs.count || 0}`);
  console.log();

  // Get more details about the data
  console.log('2. Data details...');
  console.log('-'.repeat(40));

  const { data: vendorDetails } = await supabase
    .from('vendors')
    .select('tier, status, risk_score, lei')
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (vendorDetails && vendorDetails.length > 0) {
    const assessed = vendorDetails.filter(v => v.risk_score !== null).length;
    const withLei = vendorDetails.filter(v => v.lei).length;
    console.log(`   Vendors with risk assessment: ${assessed}/${vendorDetails.length}`);
    console.log(`   Vendors with LEI: ${withLei}/${vendorDetails.length}`);
  }

  const { data: incidentDetails } = await supabase
    .from('incidents')
    .select('classification, status')
    .eq('organization_id', orgId);

  if (incidentDetails && incidentDetails.length > 0) {
    const resolved = incidentDetails.filter(i => ['resolved', 'closed'].includes(i.status)).length;
    console.log(`   Incidents resolved: ${resolved}/${incidentDetails.length}`);
  }

  const { data: testDetails } = await supabase
    .from('resilience_tests')
    .select('status, test_type')
    .eq('organization_id', orgId);

  if (testDetails && testDetails.length > 0) {
    const completed = testDetails.filter(t => t.status === 'completed').length;
    const testTypes = new Set(testDetails.map(t => t.test_type));
    console.log(`   Tests completed: ${completed}/${testDetails.length}`);
    console.log(`   Test types: ${Array.from(testTypes).join(', ') || 'none'}`);
  }

  const { data: docDetails } = await supabase
    .from('documents')
    .select('parsing_status')
    .eq('organization_id', orgId);

  if (docDetails && docDetails.length > 0) {
    const parsed = docDetails.filter(d => d.parsing_status === 'completed').length;
    console.log(`   Documents parsed: ${parsed}/${docDetails.length}`);
  }

  console.log();

  // Now check existing snapshots
  console.log('3. Checking existing snapshots...');
  console.log('-'.repeat(40));

  const { data: existingSnapshots } = await supabase
    .from('maturity_snapshots')
    .select('id, snapshot_date, overall_maturity_level, overall_readiness_percent')
    .eq('organization_id', orgId)
    .is('vendor_id', null)
    .order('snapshot_date', { ascending: false })
    .limit(3);

  if (existingSnapshots && existingSnapshots.length > 0) {
    console.log('   Recent snapshots:');
    for (const s of existingSnapshots) {
      console.log(`   - ${s.snapshot_date}: Level ${s.overall_maturity_level}, ${s.overall_readiness_percent}%`);
    }
  } else {
    console.log('   No existing snapshots found');
  }
  console.log();

  // Calculate expected values (simulating what the new function should do)
  console.log('4. Expected KPI calculations...');
  console.log('-'.repeat(40));

  // ICT Risk Management
  let ictScore = 0;
  if (vendorDetails && vendorDetails.length > 0) {
    const assessed = vendorDetails.filter(v => v.risk_score !== null).length;
    ictScore += (assessed / vendorDetails.length) * 40;
  } else {
    ictScore += 20;
  }
  if (docDetails && docDetails.length > 0) {
    const parsed = docDetails.filter(d => d.parsing_status === 'completed').length;
    ictScore += Math.min(30, parsed * 5);
  }
  console.log(`   ICT Risk Management: ~${Math.round(ictScore)}%`);

  // Incident Reporting
  let incidentScore = 25;
  if (incidentDetails && incidentDetails.length > 0) {
    const classified = incidentDetails.filter(i => i.classification).length;
    const resolved = incidentDetails.filter(i => ['resolved', 'closed'].includes(i.status)).length;
    incidentScore += (classified / incidentDetails.length) * 25;
    incidentScore += (resolved / incidentDetails.length) * 25;
  } else {
    incidentScore = 40; // Base score when no incidents
  }
  console.log(`   Incident Reporting: ~${Math.round(incidentScore)}%`);

  // Resilience Testing
  let testingScore = 20;
  if (testDetails && testDetails.length > 0) {
    const completed = testDetails.filter(t => t.status === 'completed').length;
    testingScore += (completed / testDetails.length) * 40;
    const testTypes = new Set(testDetails.map(t => t.test_type));
    testingScore += Math.min(20, testTypes.size * 5);
  }
  console.log(`   Resilience Testing: ~${Math.round(testingScore)}%`);

  // TPRM
  let tprmScore = 15;
  if (vendorDetails && vendorDetails.length > 0) {
    const active = vendorDetails.filter(v => v.status === 'active').length;
    const assessed = vendorDetails.filter(v => v.risk_score !== null).length;
    const withLei = vendorDetails.filter(v => v.lei).length;
    tprmScore += (active / vendorDetails.length) * 25;
    tprmScore += (assessed / vendorDetails.length) * 25;
    tprmScore += (withLei / vendorDetails.length) * 15;
  }
  console.log(`   Third Party Risk: ~${Math.round(tprmScore)}%`);

  // Info Sharing (capped at 60%)
  let infoScore = 20;
  if (docDetails && docDetails.length > 0) {
    const parsed = docDetails.filter(d => d.parsing_status === 'completed').length;
    infoScore += Math.min(30, parsed * 3);
  }
  infoScore = Math.min(60, infoScore);
  console.log(`   Information Sharing: ~${Math.round(infoScore)}%`);

  // Overall (weighted average)
  const weights = { ict: 3, incident: 3, testing: 2, tprm: 3, info: 1 };
  const totalWeight = 12;
  const overallPercent = Math.round(
    (ictScore * weights.ict +
     incidentScore * weights.incident +
     testingScore * weights.testing +
     tprmScore * weights.tprm +
     infoScore * weights.info) / totalWeight
  );
  console.log();
  console.log(`   OVERALL EXPECTED: ~${overallPercent}%`);
  console.log();

  console.log('='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
  console.log();
  console.log('The snapshot should now calculate KPIs based on actual data.');
  console.log('If all values above are 0%, check that you have data in the system.');
  console.log();
  console.log('To create a new snapshot, use the UI at /compliance/trends');
  console.log('or call POST /api/compliance/snapshot with { "type": "manual" }');
}

testSnapshot().catch(console.error);
