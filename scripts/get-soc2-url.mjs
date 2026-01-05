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

async function getData() {
  // Get parsed SOC2 documents
  const { data: parsed, error } = await supabase
    .from('parsed_soc2')
    .select('id, document_id, auditor_firm, controls')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  if (parsed && parsed.length > 0) {
    const doc = parsed[0];
    console.log('Found parsed SOC2:');
    console.log(`  Document ID: ${doc.document_id}`);
    console.log(`  Auditor: ${doc.auditor_firm}`);
    console.log(`  Controls: ${doc.controls?.length || 0}`);
    console.log(`\nURL to test:`);
    console.log(`  http://localhost:3000/documents/${doc.document_id}/soc2-analysis`);
  } else {
    console.log('No parsed SOC2 documents found');
  }

  // Also get test user's organization membership
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users?.users?.find(u => u.email?.includes('test_u8m7eblt'));
  if (testUser) {
    console.log(`\nTest user ID: ${testUser.id}`);

    // Add test user to the organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .single();

    if (org) {
      console.log(`Organization ID: ${org.id}`);

      // Check if user is already a member
      const { data: membership } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', testUser.id)
        .eq('organization_id', org.id)
        .single();

      if (!membership) {
        console.log('Adding test user to organization...');
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            user_id: testUser.id,
            organization_id: org.id,
            role: 'admin'
          });

        if (memberError) {
          console.log('Membership error:', memberError.message);
        } else {
          console.log('Test user added to organization!');
        }
      } else {
        console.log('Test user already a member');
      }
    }
  }
}

getData();
