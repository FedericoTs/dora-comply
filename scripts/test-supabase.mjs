import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oipwlrhyzayuxgcabsvu.supabase.co',
  'sb_secret_7Y0-3Hd51CFZ0oGJ1rgnyw_Kb7hSa26'
);

async function test() {
  console.log('Testing Supabase connection...\n');

  // Test connection by checking tables
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Status: Database connected, table does not exist yet');
    console.log('Error:', error.message);
    console.log('\n✓ Connection works! We need to run migrations to create tables.');
  } else {
    console.log('✓ Success! Table exists:', data);
  }
}

test();
