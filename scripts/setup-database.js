// Script to connect to Supabase and set up the database
// Usage: node scripts/setup-database.js [--drop-all] [--create-admin]
// Requires SUPABASE_SERVICE_ROLE_KEY environment variable

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nSet these in your terminal before running:');
  console.error('   $env:VITE_SUPABASE_URL="your-supabase-url"');
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const args = process.argv.slice(2);
const shouldDropAll = args.includes('--drop-all');
const shouldCreateAdmin = args.includes('--create-admin');

const ADMIN_EMAIL = 'akin.anenih@sdkoncept.com';
const ADMIN_PASSWORD = '!1Jason2013';

async function testConnection() {
  console.log('\n🔌 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
      throw error;
    }
    console.log('✅ Connected to Supabase successfully!');
    console.log(`   URL: ${SUPABASE_URL}`);
    return true;
  } catch (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.log('✅ Connected to Supabase (tables not set up yet)');
      return true;
    }
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function checkExistingTables() {
  console.log('\n📊 Checking existing tables...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });
    
    // Alternative: Try to query a known table
    const tables = [
      'profiles', 'user_roles', 'buses', 'drivers', 'routes', 
      'stations', 'schedules', 'trips', 'bookings'
    ];
    
    const existing = [];
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (!error) {
          existing.push(table);
        }
      } catch (e) {
        // Table doesn't exist
      }
    }
    
    if (existing.length > 0) {
      console.log(`   Found ${existing.length} existing tables: ${existing.join(', ')}`);
      return existing;
    } else {
      console.log('   No tables found (database is empty)');
      return [];
    }
  } catch (error) {
    console.log('   Could not check tables (this is OK if schema not set up)');
    return [];
  }
}

async function dropAllTables() {
  console.log('\n🗑️  Dropping all existing tables and types...');
  
  const dropScriptPath = join(rootDir, 'supabase', 'setup', '00_drop_all_tables.sql');
  let dropScript;
  
  try {
    dropScript = readFileSync(dropScriptPath, 'utf-8');
  } catch (error) {
    console.error('❌ Could not read drop script:', dropScriptPath);
    return false;
  }
  
  // Execute the drop script via SQL
  // Note: Supabase client doesn't support executing arbitrary SQL directly
  // We'll need to use the REST API or provide instructions
  
  console.log('⚠️  Cannot execute DROP script directly via client.');
  console.log('   Please run this SQL in Supabase SQL Editor:');
  console.log(`   File: ${dropScriptPath}`);
  console.log('\n   Or use the Supabase Dashboard SQL Editor to run the script.');
  
  return false;
}

async function runSchema() {
  console.log('\n📝 Setting up database schema...');
  
  const schemaPath = join(rootDir, 'supabase', 'setup', '01_complete_schema.sql');
  let schema;
  
  try {
    schema = readFileSync(schemaPath, 'utf-8');
  } catch (error) {
    console.error('❌ Could not read schema file:', schemaPath);
    return false;
  }
  
  console.log('⚠️  Cannot execute schema directly via client.');
  console.log('   Please run this SQL in Supabase SQL Editor:');
  console.log(`   File: ${schemaPath}`);
  console.log('\n   Steps:');
  console.log('   1. Go to Supabase Dashboard → SQL Editor');
  console.log('   2. Click "New query"');
  console.log('   3. Copy the entire contents of 01_complete_schema.sql');
  console.log('   4. Paste and click "Run"');
  
  return false;
}

async function createAdminUser() {
  console.log('\n👤 Creating admin user...');
  
  // Check if user exists
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return false;
  }
  
  const existingUser = users.users.find(u => u.email === ADMIN_EMAIL);
  
  if (existingUser) {
    console.log(`   User already exists: ${ADMIN_EMAIL}`);
    
    // Update password
    const { error: passwordError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: ADMIN_PASSWORD
    });
    
    if (passwordError) {
      console.error('❌ Error updating password:', passwordError.message);
    } else {
      console.log('✅ Password updated');
    }
    
    // Set admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: existingUser.id,
        role: 'admin',
      }, { onConflict: 'user_id' });
    
    if (roleError) {
      console.error('❌ Error setting admin role:', roleError.message);
      console.log('\n📝 Run this SQL in Supabase SQL Editor:');
      console.log(`UPDATE public.user_roles SET role = 'admin' WHERE user_id = '${existingUser.id}';`);
      return false;
    } else {
      console.log('✅ Admin role set');
    }
  } else {
    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
      },
    });
    
    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      return false;
    }
    
    console.log('✅ User created');
    
    // Wait a moment for trigger
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
      return false;
    } else {
      console.log('✅ Admin role set');
    }
  }
  
  return true;
}

async function verifySetup() {
  console.log('\n✅ Verifying setup...');
  
  // Check tables
  const tables = ['profiles', 'user_roles', 'buses', 'drivers'];
  const missing = [];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        missing.push(table);
      }
    } catch (e) {
      missing.push(table);
    }
  }
  
  if (missing.length > 0) {
    console.log(`⚠️  Missing tables: ${missing.join(', ')}`);
    console.log('   Run the schema SQL script first!');
    return false;
  }
  
  // Check admin user
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users?.find(u => u.email === ADMIN_EMAIL);
  
  if (!adminUser) {
    console.log(`⚠️  Admin user not found: ${ADMIN_EMAIL}`);
    return false;
  }
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', adminUser.id)
    .maybeSingle();
  
  if (roleData?.role !== 'admin') {
    console.log(`⚠️  Admin user exists but role is: ${roleData?.role || 'NOT SET'}`);
    return false;
  }
  
  console.log('✅ Database setup complete!');
  console.log(`\n📧 Admin login:`);
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  
  return true;
}

async function main() {
  console.log('🚀 Supabase Database Setup Script\n');
  console.log('='.repeat(50));
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Check existing tables
  const existingTables = await checkExistingTables();
  
  // Drop all if requested
  if (shouldDropAll) {
    await dropAllTables();
  }
  
  // Run schema (provides instructions)
  if (existingTables.length === 0 || shouldDropAll) {
    await runSchema();
  }
  
  // Create admin user if requested
  if (shouldCreateAdmin) {
    await createAdminUser();
  }
  
  // Verify
  await verifySetup();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Setup script complete!');
}

main().catch(console.error);
