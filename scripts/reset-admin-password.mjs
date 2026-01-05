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

async function resetPassword() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users?.find(u => u.email === 'ryskmanagement26@gmail.com');

  if (!adminUser) {
    console.log('Admin user not found');
    return;
  }

  console.log(`Found admin user: ${adminUser.email}`);
  console.log(`User ID: ${adminUser.id}`);

  // Reset password to a known value
  const newPassword = 'TestAdmin123!';
  const { error } = await supabase.auth.admin.updateUserById(adminUser.id, {
    password: newPassword
  });

  if (error) {
    console.log('Error resetting password:', error.message);
  } else {
    console.log(`Password reset to: ${newPassword}`);
  }
}

resetPassword();
