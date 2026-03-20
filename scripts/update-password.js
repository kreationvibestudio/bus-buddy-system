// Script to create/update admin user using Supabase Admin API
// Usage: node scripts/update-password.js
// Requires SUPABASE_SERVICE_ROLE_KEY environment variable

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nSet these in your terminal before running:');
  console.error('  PowerShell: $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.error('  Bash: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const EMAIL = 'akin.anenih@sdkoncept.com';
const NEW_PASSWORD = '!1Jason2013';
const FULL_NAME = 'Akin Anenih';

async function setupAdminUser() {
  console.log(`Setting up admin user: ${EMAIL}...`);
  
  // First, check if user exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }
  
  let user = users.users.find(u => u.email === EMAIL);
  
  if (!user) {
    // Create the user
    console.log(`User not found. Creating new user...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: NEW_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: FULL_NAME
      }
    });
    
    if (createError) {
      console.error('Error creating user:', createError.message);
      process.exit(1);
    }
    
    user = newUser.user;
    console.log(`✓ User created: ${user.id}`);
  } else {
    // Update the user's password
    console.log(`Found existing user: ${user.id}`);
    console.log(`Updating password...`);
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: NEW_PASSWORD,
      email_confirm: true
    });
    
    if (updateError) {
      console.error('Error updating password:', updateError.message);
      process.exit(1);
    }
    
    console.log(`✓ Password updated successfully`);
  }
  
  // Ensure profile exists
  console.log(`Setting up profile...`);
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      email: EMAIL,
      full_name: FULL_NAME,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  
  if (profileError) {
    console.error('Error setting up profile:', profileError.message);
  } else {
    console.log(`✓ Profile configured`);
  }
  
  // Set admin role
  console.log(`Setting admin role...`);
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: user.id,
      role: 'admin'
    }, { onConflict: 'user_id' });
  
  if (roleError) {
    console.error('Error setting role:', roleError.message);
  } else {
    console.log(`✓ Admin role assigned`);
  }
  
  console.log(`\n========================================`);
  console.log(`✓ Admin user setup complete!`);
  console.log(`  Email: ${EMAIL}`);
  console.log(`  Password: ${NEW_PASSWORD}`);
  console.log(`  Role: admin`);
  console.log(`========================================\n`);
}

setupAdminUser();


