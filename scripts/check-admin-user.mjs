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

async function checkUser() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users?.find(u => u.email === 'ryskmanagement26@gmail.com');

  if (!adminUser) {
    console.log('Admin user not found');
    return;
  }

  console.log('Admin User Details:');
  console.log(`  Email: ${adminUser.email}`);
  console.log(`  ID: ${adminUser.id}`);
  console.log(`  Email Confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`);
  console.log(`  Created At: ${adminUser.created_at}`);
  console.log(`  Last Sign In: ${adminUser.last_sign_in_at}`);
  console.log(`  Banned Until: ${adminUser.banned_until || 'Not banned'}`);

  // If email not confirmed, confirm it
  if (!adminUser.email_confirmed_at) {
    console.log('\nConfirming email...');
    const { error } = await supabase.auth.admin.updateUserById(adminUser.id, {
      email_confirm: true
    });
    if (error) {
      console.log('Error confirming email:', error.message);
    } else {
      console.log('Email confirmed!');
    }
  }

  // Check organization membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organizations(name)')
    .eq('user_id', adminUser.id);

  if (membership && membership.length > 0) {
    console.log('\nOrganization Membership:');
    membership.forEach(m => {
      console.log(`  - ${m.organizations?.name || 'Unknown'} (${m.role})`);
    });
  } else {
    console.log('\nNo organization membership found');
  }
}

checkUser();
