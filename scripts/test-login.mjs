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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testLogin() {
  console.log('Testing login with TestAdmin123!...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ryskmanagement26@gmail.com',
    password: 'TestAdmin123!'
  });

  if (error) {
    console.log('Login error:', error.message);
    console.log('Error code:', error.code);
  } else {
    console.log('Login successful!');
    console.log('User ID:', data.user?.id);
    console.log('Session:', data.session ? 'Yes' : 'No');
  }
}

testLogin();
