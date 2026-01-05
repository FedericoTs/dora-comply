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

async function getData() {
  // Get parsed SOC2 document IDs
  const { data: parsed, error } = await supabase
    .from('parsed_soc2')
    .select('id, document_id')
    .limit(1);

  if (error) {
    console.log('Parsed SOC2 error:', error.message);
  } else if (parsed && parsed.length > 0) {
    console.log(`Document ID: ${parsed[0].document_id}`);
    console.log(`\nTest URL: http://localhost:3000/documents/${parsed[0].document_id}/soc2-analysis`);
  }

  // Add test user to org
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users?.users?.find(u => u.email?.includes('test_u8m7eblt'));
  const { data: org } = await supabase.from('organizations').select('id').single();

  if (testUser && org) {
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert({
        user_id: testUser.id,
        organization_id: org.id,
        role: 'admin'
      }, { onConflict: 'user_id,organization_id' });

    if (memberError) {
      console.log('Member error:', memberError.message);
    } else {
      console.log('Test user added/updated in organization');
    }
  }
}

getData();
