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

async function addAdminToOrg() {
  // Get admin user
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const adminUser = authUsers?.users?.find(u => u.email === 'ryskmanagement26@gmail.com');

  if (!adminUser) {
    console.log('Admin user not found');
    return;
  }

  console.log(`Admin user: ${adminUser.email} (${adminUser.id})`);

  // Get all organizations
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name');

  if (orgError) {
    console.log('Error fetching organizations:', orgError.message);
    return;
  }

  console.log(`\nFound ${orgs?.length || 0} organizations:`);
  for (const org of orgs || []) {
    console.log(`  - ${org.name} (${org.id})`);
  }

  // Check if admin user exists in users table
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('id, organization_id, role')
    .eq('id', adminUser.id)
    .single();

  if (existingUser) {
    console.log(`\nUser already exists in users table:`);
    console.log(`  Organization: ${existingUser.organization_id}`);
    console.log(`  Role: ${existingUser.role}`);
  } else {
    // Add admin to the organization
    const org = orgs?.[0];
    if (org) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: adminUser.id,
          organization_id: org.id,
          email: adminUser.email,
          full_name: 'Admin User',
          role: 'admin'
        });

      if (insertError) {
        console.log(`Error adding user: ${insertError.message}`);
      } else {
        console.log(`Added admin to: ${org.name}`);
      }
    }
  }

  // Verify the parsed_soc2 document exists
  const { data: parsed } = await supabase
    .from('parsed_soc2')
    .select('id, document_id')
    .limit(1);

  if (parsed && parsed.length > 0) {
    console.log(`\nSOC2 document: ${parsed[0].document_id}`);
    console.log(`Test URL: http://localhost:3000/documents/${parsed[0].document_id}/soc2-analysis`);
  }
}

addAdminToOrg();
