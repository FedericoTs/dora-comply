import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read env file
const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#')) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  // Check for parsed SOC2 documents
  console.log('Checking for parsed SOC2 documents...');
  const { data: parsedDocs, error: parsedError } = await supabase
    .from('parsed_soc2')
    .select('id, document_id, organization_id, auditor_firm, created_at')
    .limit(5);

  if (parsedError) {
    console.log('Error:', parsedError.message);
  } else {
    console.log(`Found ${parsedDocs?.length || 0} parsed SOC2 documents`);
    parsedDocs?.forEach(doc => {
      console.log(`  - ID: ${doc.id}, Org: ${doc.organization_id}, Auditor: ${doc.auditor_firm}`);
    });
  }

  // Check documents
  console.log('\nChecking documents...');
  const { data: docs, error: docError } = await supabase
    .from('documents')
    .select('id, filename, type, organization_id')
    .eq('type', 'soc2')
    .limit(5);

  if (docError) {
    console.log('Error:', docError.message);
  } else {
    console.log(`Found ${docs?.length || 0} SOC2 documents`);
    docs?.forEach(doc => {
      console.log(`  - ${doc.filename} (ID: ${doc.id})`);
    });
  }

  // Check organizations
  console.log('\nChecking organizations...');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5);

  if (orgError) {
    console.log('Error:', orgError.message);
  } else {
    console.log(`Found ${orgs?.length || 0} organizations`);
    orgs?.forEach(org => {
      console.log(`  - ${org.name} (ID: ${org.id})`);
    });
  }

  // Check users
  console.log('\nChecking users...');
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.log('Error:', userError.message);
  } else {
    console.log(`Found ${users?.users?.length || 0} users`);
    users?.users?.forEach(u => {
      console.log(`  - ${u.email} (verified: ${u.email_confirmed_at ? 'yes' : 'no'})`);
    });
  }
}

checkData();
