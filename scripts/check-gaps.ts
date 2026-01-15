import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load env
const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...valueParts] = trimmed.split('=');
  if (key && valueParts.length > 0) {
    env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  // Get org
  const { data: users } = await supabase.from('users').select('organization_id').limit(1);
  const orgId = users![0].organization_id;
  console.log('Organization:', orgId);

  // Check maturity snapshots for gaps
  const { data: snapshots } = await supabase
    .from('maturity_snapshots')
    .select('id, snapshot_date, critical_gaps_count, high_gaps_count, medium_gaps_count, low_gaps_count, critical_gaps, requirements_met, requirements_partial, requirements_not_met, total_requirements')
    .eq('organization_id', orgId)
    .is('vendor_id', null)
    .order('snapshot_date', { ascending: false })
    .limit(3);

  console.log('\nRecent Snapshots Gap Data:');
  for (const s of snapshots!) {
    console.log(`  ${s.snapshot_date}: Total=${s.total_requirements}, Met=${s.requirements_met}, Partial=${s.requirements_partial}, NotMet=${s.requirements_not_met}`);
    console.log(`    Critical=${s.critical_gaps_count}, High=${s.high_gaps_count}, Medium=${s.medium_gaps_count}, Low=${s.low_gaps_count}`);
    if (s.critical_gaps && s.critical_gaps.length > 0) {
      console.log('    Critical gaps:', JSON.stringify(s.critical_gaps).slice(0, 300));
    }
  }

  // Check test_findings for severity
  const { data: findings, count } = await supabase
    .from('test_findings')
    .select('id, severity, status, remediation_status', { count: 'exact' })
    .eq('organization_id', orgId);

  console.log('\nTest Findings:', count);
  if (findings && findings.length > 0) {
    const bySeverity: Record<string, number> = {};
    for (const f of findings) {
      bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    }
    console.log('  By Severity:', bySeverity);
  }
}

check().catch(console.error);
