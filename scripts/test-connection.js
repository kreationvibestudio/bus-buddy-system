// Quick script to test Supabase connection
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ccvjtchhcjzpiefrgbmk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'lJbOg1Lx4Zm5O62I9kkvD3CfOrv6X7wBTJTtNQNm5yIdrTpWVE9Us020QNh3uE5fZnwRI9oC2zldgZI/7Pf57Q==';

console.log('🔌 Testing Supabase connection...');
console.log(`URL: ${SUPABASE_URL.substring(0, 30)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    // Test 1: List users (requires service role)
    console.log('\n📋 Test 1: Listing users...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error:', userError.message);
      return false;
    }
    
    console.log(`✅ Found ${users.users.length} users`);
    if (users.users.length > 0) {
      console.log('   Users:');
      users.users.slice(0, 5).forEach(u => {
        console.log(`   - ${u.email} (${u.id.substring(0, 8)}...)`);
      });
    }
    
    // Test 2: Check tables
    console.log('\n📊 Test 2: Checking tables...');
    const tables = ['profiles', 'user_roles', 'buses', 'drivers', 'routes'];
    const existing = [];
    const missing = [];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            missing.push(table);
          } else {
            console.log(`   ⚠️  ${table}: ${error.message}`);
          }
        } else {
          existing.push(table);
        }
      } catch (e) {
        missing.push(table);
      }
    }
    
    if (existing.length > 0) {
      console.log(`✅ Found ${existing.length} tables: ${existing.join(', ')}`);
    }
    if (missing.length > 0) {
      console.log(`⚠️  Missing ${missing.length} tables: ${missing.join(', ')}`);
      console.log('   → Run the schema SQL script to create them');
    }
    
    // Test 3: Check admin user
    console.log('\n👤 Test 3: Checking admin user...');
    const adminUser = users.users.find(u => u.email === 'akin.anenih@sdkoncept.com');
    
    if (adminUser) {
      console.log(`✅ Admin user found: ${adminUser.email}`);
      
      // Check role
      if (existing.includes('user_roles')) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', adminUser.id)
          .maybeSingle();
        
        if (roleData) {
          console.log(`   Role: ${roleData.role}`);
          if (roleData.role !== 'admin') {
            console.log('   ⚠️  Role is not "admin" - needs to be updated');
          }
        } else {
          console.log('   ⚠️  No role found in user_roles table');
        }
      }
    } else {
      console.log('⚠️  Admin user not found');
      console.log('   → Create user: akin.anenih@sdkoncept.com');
    }
    
    console.log('\n✅ Connection test complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
