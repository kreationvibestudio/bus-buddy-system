// Script to verify and fix admin user
// Usage: node scripts/fix-admin-user.js
// Requires SUPABASE_SERVICE_ROLE_KEY environment variable

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nSet these in your terminal before running:');
  console.error('$env:VITE_SUPABASE_URL="your-supabase-url"');
  console.error('$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const EMAIL = 'akin.anenih@sdkoncept.com';
const PASSWORD = '!1Jason2013';

async function fixAdminUser() {
  console.log(`\n🔍 Checking user: ${EMAIL}...\n`);
  
  // Step 1: Check if user exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    process.exit(1);
  }
  
  const user = users.users.find(u => u.email === EMAIL);
  
  if (!user) {
    console.log('⚠️  User not found. Creating user...');
    
    // Create the user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
      },
    });
    
    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      process.exit(1);
    }
    
    console.log('✅ User created successfully');
    
    // Wait a moment for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: newUser.user.id,
        role: 'admin',
      }, { onConflict: 'user_id' });
    
    if (roleError) {
      console.error('❌ Error setting admin role:', roleError.message);
      console.log('\n📝 Run this SQL in Supabase SQL Editor:');
      console.log(`UPDATE public.user_roles SET role = 'admin' WHERE user_id = '${newUser.user.id}';`);
      process.exit(1);
    }
    
    console.log('✅ Admin role set successfully');
    console.log('\n✅ User created and set as admin!');
    console.log(`\n📧 Email: ${EMAIL}`);
    console.log(`🔑 Password: ${PASSWORD}`);
    return;
  }
  
  console.log(`✅ User found: ${user.id}`);
  
  // Step 2: Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (profileError) {
    console.error('❌ Error checking profile:', profileError.message);
  } else if (!profile) {
    console.log('⚠️  Profile not found. Creating profile...');
    const { error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: EMAIL,
        full_name: 'Admin User',
      });
    
    if (createProfileError) {
      console.error('❌ Error creating profile:', createProfileError.message);
    } else {
      console.log('✅ Profile created');
    }
  } else {
    console.log('✅ Profile exists');
  }
  
  // Step 3: Check and set admin role
  const { data: roleData, error: roleCheckError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (roleCheckError) {
    console.error('❌ Error checking role:', roleCheckError.message);
  } else if (!roleData) {
    console.log('⚠️  No role found. Creating admin role...');
    const { error: createRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin',
      });
    
    if (createRoleError) {
      console.error('❌ Error creating role:', createRoleError.message);
      console.log('\n📝 Run this SQL in Supabase SQL Editor:');
      console.log(`INSERT INTO public.user_roles (user_id, role) VALUES ('${user.id}', 'admin');`);
    } else {
      console.log('✅ Admin role created');
    }
  } else if (roleData.role !== 'admin') {
    console.log(`⚠️  Current role: ${roleData.role}. Updating to admin...`);
    const { error: updateRoleError } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', user.id);
    
    if (updateRoleError) {
      console.error('❌ Error updating role:', updateRoleError.message);
      console.log('\n📝 Run this SQL in Supabase SQL Editor:');
      console.log(`UPDATE public.user_roles SET role = 'admin' WHERE user_id = '${user.id}';`);
    } else {
      console.log('✅ Role updated to admin');
    }
  } else {
    console.log('✅ User already has admin role');
  }
  
  // Step 4: Update password (in case it changed)
  console.log('\n🔑 Updating password...');
  const { error: passwordError } = await supabase.auth.admin.updateUserById(user.id, {
    password: PASSWORD
  });
  
  if (passwordError) {
    console.error('❌ Error updating password:', passwordError.message);
  } else {
    console.log('✅ Password updated');
  }
  
  // Step 5: Verify everything
  console.log('\n📋 Final Verification:');
  const { data: finalRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  
  console.log(`   User ID: ${user.id}`);
  console.log(`   Email: ${EMAIL}`);
  console.log(`   Role: ${finalRole?.role || 'NOT SET'}`);
  console.log(`   Password: ${PASSWORD}`);
  
  if (finalRole?.role === 'admin') {
    console.log('\n✅ Admin user is ready!');
    console.log(`\n📧 Login with:`);
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}`);
  } else {
    console.log('\n❌ Admin role not set. Run the SQL command above.');
  }
}

fixAdminUser().catch(console.error);
