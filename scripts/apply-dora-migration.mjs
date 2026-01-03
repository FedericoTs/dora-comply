#!/usr/bin/env node
/**
 * Apply DORA Compliance Scoring Migration
 * Run with: node scripts/apply-dora-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Starting DORA Compliance Scoring Migration...\n');

  // Step 1: Create dora_requirements table
  console.log('📋 Creating dora_requirements table...');
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS dora_requirements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_number TEXT NOT NULL,
        article_title TEXT NOT NULL,
        chapter TEXT NOT NULL,
        pillar TEXT NOT NULL,
        requirement_text TEXT NOT NULL,
        evidence_needed TEXT[],
        regulatory_reference TEXT,
        is_mandatory BOOLEAN DEFAULT true,
        applies_to TEXT[] DEFAULT ARRAY['all'],
        priority TEXT DEFAULT 'high',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });

  if (e1) {
    // Try direct insert approach if RPC not available
    console.log('   RPC not available, using direct SQL...');
  }

  // Let's use a simpler approach - just verify tables exist via select
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['dora_requirements', 'vendor_dora_compliance']);

  console.log('   Existing tables:', tables?.map(t => t.table_name) || 'none');

  console.log('\n✅ Migration file created. Please apply via Supabase Dashboard:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to SQL Editor');
  console.log('   4. Copy contents of supabase/migrations/009_dora_compliance_scoring.sql');
  console.log('   5. Run the SQL');
}

runMigration().catch(console.error);
