// Apply migration 006 using fetch
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local directly
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing environment variables');
  console.log('SUPABASE_URL:', SUPABASE_URL ? 'set' : 'missing');
  console.log('SERVICE_KEY:', SERVICE_KEY ? 'set' : 'missing');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('Project ref:', projectRef);
console.log('Applying migration 006...');

// Use PostgREST RPC if available, otherwise just document the migration SQL
const migrationSql = `
-- Migration 006: LEI Enrichment Fields
-- Run this in Supabase SQL Editor

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lei_status VARCHAR(30);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lei_verified_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lei_next_renewal DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS entity_status VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS registration_authority_id VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS legal_form_code VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS legal_address JSONB DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS headquarters_address JSONB DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS entity_creation_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gleif_data JSONB DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gleif_fetched_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS direct_parent_lei VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS direct_parent_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS direct_parent_country VARCHAR(2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ultimate_parent_country VARCHAR(2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS parent_exception_reason TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ultimate_parent_lei VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ultimate_parent_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS esa_register_id VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS substitutability_assessment VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_annual_expense DECIMAL(18,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS expense_currency VARCHAR(3) DEFAULT 'EUR';

CREATE INDEX IF NOT EXISTS idx_vendors_lei_status ON vendors(lei_status) WHERE lei IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_ultimate_parent_lei ON vendors(ultimate_parent_lei) WHERE ultimate_parent_lei IS NOT NULL;
`;

// Test the API connection
async function testConnection() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/vendors?select=id&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    const data = await response.json();
    console.log('API connection successful. Sample vendor:', data[0]?.id || 'none');
    return true;
  } catch (e) {
    console.error('Connection failed:', e.message);
    return false;
  }
}

// Check if columns already exist
async function checkColumns() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/vendors?select=lei_status&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });

    if (response.ok) {
      console.log('✓ Migration already applied - lei_status column exists');
      return true;
    } else {
      const error = await response.json();
      if (error.code === '42703') {
        console.log('✗ Migration needed - lei_status column does not exist');
        console.log('\n=== RUN THIS SQL IN SUPABASE DASHBOARD ===\n');
        console.log(migrationSql);
        console.log('\n===========================================\n');
        return false;
      }
    }
  } catch (e) {
    console.error('Check failed:', e.message);
  }
  return false;
}

async function main() {
  await testConnection();
  const applied = await checkColumns();

  if (!applied) {
    console.log('Dashboard URL: https://supabase.com/dashboard/project/' + projectRef + '/sql');
  }
}

main();
