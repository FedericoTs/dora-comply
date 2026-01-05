import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDoc() {
  const docId = '9da8d45e-9db4-475b-beed-e8d676518670';

  // Check document
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, organization_id, filename, type')
    .eq('id', docId)
    .single();

  if (docError) {
    console.log('Document error:', docError.message);
    return;
  }

  console.log('Document found:');
  console.log(`  ID: ${doc.id}`);
  console.log(`  Filename: ${doc.filename}`);
  console.log(`  Type: ${doc.type}`);
  console.log(`  Organization: ${doc.organization_id}`);

  // Check parsed SOC2
  const { data: parsed, error: parsedError } = await supabase
    .from('parsed_soc2')
    .select('id, document_id, auditor_firm')
    .eq('document_id', docId)
    .single();

  if (parsedError) {
    console.log('\nParsed SOC2 error:', parsedError.message);
  } else {
    console.log('\nParsed SOC2 found:');
    console.log(`  Auditor: ${parsed.auditor_firm}`);
  }

  // Check admin user's org
  const adminId = '2ac2447d-4cd5-413f-b519-ef930e401e19';
  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', adminId)
    .single();

  console.log(`\nAdmin's organization: ${user?.organization_id}`);
  console.log(`Document's organization: ${doc.organization_id}`);
  console.log(`Match: ${user?.organization_id === doc.organization_id}`);
}

checkDoc();
