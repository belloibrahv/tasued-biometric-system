import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Verifying lecturer accounts in Supabase...\n');

  const emails = [
    'adeyemi.lecturer@tasued.edu.ng',
    'johnson.lecturer@tasued.edu.ng'
  ];

  for (const email of emails) {
    try {
      // Try to get user by email
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error(`Error listing users: ${error.message}`);
        continue;
      }

      const user = users.find(u => u.email === email);
      
      if (user) {
        console.log(`✓ Found in Supabase: ${email}`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Created: ${user.created_at}`);
        console.log(`  Metadata:`, user.user_metadata);
      } else {
        console.log(`✗ NOT found in Supabase: ${email}`);
        console.log(`  Need to create this account in Supabase`);
      }
    } catch (error: any) {
      console.error(`Error checking ${email}:`, error.message);
    }
  }

  console.log('\n✅ Verification complete!');
}

main()
  .catch(console.error);
