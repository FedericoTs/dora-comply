import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  'https://oipwlrhyzayuxgcabsvu.supabase.co',
  'sb_secret_7Y0-3Hd51CFZ0oGJ1rgnyw_Kb7hSa26',
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

async function runMigration(filename) {
  console.log(`\n--- Running ${filename} ---`);

  const sqlPath = join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = readFileSync(sqlPath, 'utf8');

  // Split into statements (simple split, may need refinement for complex SQL)
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} statements`);

  for (let i = 0; i < Math.min(statements.length, 3); i++) {
    const stmt = statements[i];
    console.log(`\nStatement ${i + 1} preview:`, stmt.substring(0, 100) + '...');
  }

  return { filename, statementCount: statements.length };
}

async function main() {
  console.log('Migration Runner');
  console.log('================\n');

  const migrations = [
    '001_initial_schema.sql',
    '002_incident_reporting.sql',
    '003_enhanced_roi.sql',
    '004_framework_mapping.sql'
  ];

  for (const migration of migrations) {
    try {
      const result = await runMigration(migration);
      console.log(`✓ Parsed ${result.filename}: ${result.statementCount} statements`);
    } catch (error) {
      console.error(`✗ Error parsing ${migration}:`, error.message);
    }
  }

  console.log('\n================');
  console.log('NOTE: To run these migrations, please use one of these methods:');
  console.log('');
  console.log('1. Supabase Dashboard SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/oipwlrhyzayuxgcabsvu/sql');
  console.log('');
  console.log('2. Supabase CLI (after login):');
  console.log('   npx supabase login');
  console.log('   npx supabase link --project-ref oipwlrhyzayuxgcabsvu');
  console.log('   npx supabase db push');
  console.log('');
}

main();
