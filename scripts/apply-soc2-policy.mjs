// Apply parsed_soc2 INSERT policy migration
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
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

console.log('Project ref:', projectRef);
console.log('Applying parsed_soc2 policies...\n');

const sql = `
CREATE POLICY "Users can create parsed_soc2 for org documents"
  ON parsed_soc2 FOR INSERT
  WITH CHECK (document_id IN (
    SELECT id FROM documents WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can update parsed_soc2 for org documents"
  ON parsed_soc2 FOR UPDATE
  USING (document_id IN (
    SELECT id FROM documents WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can delete parsed_soc2 for org documents"
  ON parsed_soc2 FOR DELETE
  USING (document_id IN (
    SELECT id FROM documents WHERE organization_id = get_user_organization_id()
  ));
`;

console.log('--- SQL to run in Supabase Dashboard SQL Editor: ---\n');
console.log(sql);
console.log('\n--- End SQL ---\n');
console.log('Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
console.log('\nPaste the SQL above and click "Run" to apply the policies.');
