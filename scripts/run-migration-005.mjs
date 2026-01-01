/**
 * Run Migration 005: ESA Field Additions
 *
 * Applies the missing ESA-required fields to the database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const migrations = [
  // Organizations
  `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_roi_update TIMESTAMPTZ`,
  `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS annual_ict_spend_currency VARCHAR(3) DEFAULT 'EUR'`,
  `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS annual_ict_spend_amount DECIMAL(15,2)`,
  `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS nature_of_entity VARCHAR(50)`,

  // Vendors
  `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ultimate_parent_lei VARCHAR(20)`,
  `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS ultimate_parent_name TEXT`,
  `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS esa_register_id VARCHAR(50)`,
  `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS substitutability_assessment VARCHAR(50)`,
  `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS total_annual_expense DECIMAL(18,2)`,
  `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS expense_currency VARCHAR(3) DEFAULT 'EUR'`,

  // Contracts
  `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS governing_law_country VARCHAR(2)`,
  `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS notice_period_entity_days INTEGER`,
  `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS notice_period_provider_days INTEGER`,
  `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_amendment BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS amendment_date DATE`,
  `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS availability_sla DECIMAL(5,2)`,
  `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS rto_hours_contractual INTEGER`,
  `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS rpo_hours_contractual INTEGER`,

  // ICT Services
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS service_identification_code VARCHAR(100)`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS recipient_entity_lei VARCHAR(20)`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS service_start_date DATE`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS service_end_date DATE`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS notice_period_entity_days INTEGER`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS notice_period_provider_days INTEGER`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS level_of_reliance VARCHAR(50)`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS data_sensitiveness VARCHAR(50)`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS has_exit_plan BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS exit_plan_tested BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS exit_plan_last_test_date DATE`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS reintegration_possibility VARCHAR(50)`,
  `ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS alternative_providers_identified INTEGER DEFAULT 0`,

  // Service Data Locations
  `ALTER TABLE service_data_locations ADD COLUMN IF NOT EXISTS sensitivity_level VARCHAR(50)`,
  `ALTER TABLE service_data_locations ADD COLUMN IF NOT EXISTS data_volume_category VARCHAR(20)`,

  // Critical Functions
  `ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS business_rto_hours INTEGER`,
  `ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS business_rpo_hours INTEGER`,
  `ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS requires_regulatory_notification BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS impact_level VARCHAR(20) DEFAULT 'medium'`,

  // Subcontractors
  `ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS rank_in_chain INTEGER`,
  `ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS is_direct_subcontractor BOOLEAN DEFAULT TRUE`,
  `ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS data_access_level VARCHAR(50)`,
];

async function runMigration() {
  console.log('Running Migration 005: ESA Field Additions');
  console.log('==========================================\n');

  let success = 0;
  let failed = 0;

  for (const sql of migrations) {
    const shortSql = sql.length > 60 ? sql.slice(0, 60) + '...' : sql;
    process.stdout.write(`Running: ${shortSql}`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).maybeSingle();

    // If RPC doesn't exist, try direct query via REST
    if (error && error.code === 'PGRST202') {
      // Fallback: Use raw SQL via Supabase's internal API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });
    }

    if (error) {
      console.log(' ❌');
      console.log(`  Error: ${error.message}`);
      failed++;
    } else {
      console.log(' ✅');
      success++;
    }
  }

  console.log('\n==========================================');
  console.log(`Migration complete: ${success} succeeded, ${failed} failed`);

  // Create the roi_data_confirmations table
  console.log('\nCreating roi_data_confirmations table...');

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS roi_data_confirmations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      source_type VARCHAR(50) NOT NULL,
      source_id UUID,
      target_table VARCHAR(100) NOT NULL,
      target_id UUID NOT NULL,
      is_confirmed BOOLEAN DEFAULT FALSE,
      confirmed_by UUID REFERENCES users(id),
      confirmed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id, source_type, source_id, target_table, target_id)
    )
  `;

  const { error: tableError } = await supabase.rpc('exec_sql', { sql_query: createTableSql });
  if (tableError) {
    console.log('Table creation may require manual setup in Supabase dashboard');
  } else {
    console.log('Table created successfully');
  }
}

runMigration().catch(console.error);
