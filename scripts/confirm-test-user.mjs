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

async function confirmUser() {
  console.log('Listing users...');
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log(`Found ${users.users.length} users`);

  // Find any test user
  const testUser = users.users.find(u => u.email?.includes('test_'));

  if (testUser) {
    console.log('Found test user:', testUser.email);
    console.log('Email confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No');

    if (!testUser.email_confirmed_at) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        testUser.id,
        { email_confirm: true }
      );
      if (updateError) {
        console.log('Update error:', updateError.message);
      } else {
        console.log('User email confirmed!');
      }
    }
  } else {
    console.log('No test user found. Available users:');
    users.users.slice(0, 5).forEach(u => console.log('  -', u.email, u.email_confirmed_at ? '(verified)' : '(unverified)'));
  }
}

confirmUser();
