import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-seed-secret',
}

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'driver' | 'passenger' | 'storekeeper' | 'mechanic' | 'staff' | 'accounts';
}

const testUsers: TestUser[] = [
  { email: 'admin@sdkoncept.com', password: 'Test1234!', full_name: 'Admin User', role: 'admin' },
  { email: 'staff@sdkoncept.com', password: 'Test1234!', full_name: 'Staff User', role: 'staff' },
  { email: 'storekeeper@sdkoncept.com', password: 'Test1234!', full_name: 'Store Keeper', role: 'storekeeper' },
  { email: 'driver@sdkoncept.com', password: 'Test1234!', full_name: 'Driver User', role: 'driver' },
  { email: 'passenger@sdkoncept.com', password: 'Test1234!', full_name: 'Passenger User', role: 'passenger' },
  { email: 'mechanic@sdkoncept.com', password: 'Test1234!', full_name: 'Mechanic User', role: 'mechanic' },
  { email: 'accounts@sdkoncept.com', password: 'Test1234!', full_name: 'Accounts User', role: 'accounts' },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require SEED_SECRET to prevent unauthorized user creation in production
    const seedSecret = Deno.env.get('SEED_SECRET');
    const providedSecret = req.headers.get('X-Seed-Secret');
    if (seedSecret && (!providedSecret || providedSecret !== seedSecret)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Valid X-Seed-Secret header required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!seedSecret) {
      console.warn('SEED_SECRET not set - consider setting it for production security');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of testUsers) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === user.email);

        if (existingUser) {
          // User exists, just ensure the role is set correctly
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: existingUser.id,
              role: user.role,
            }, { onConflict: 'user_id' });

          if (roleError) {
            results.push({ email: user.email, status: 'exists, role update failed', error: roleError.message });
          } else {
            results.push({ email: user.email, status: 'exists, role updated' });
          }
          continue;
        }

        // Create new user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
          },
        });

        if (authError) {
          results.push({ email: user.email, status: 'failed', error: authError.message });
          continue;
        }

        // Update the role (the handle_new_user trigger will create the profile with default 'passenger' role)
        // Always update role since we want to set the correct role for all test users
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: user.role })
          .eq('user_id', authData.user.id);

        if (roleError) {
          results.push({ email: user.email, status: 'created, role update failed', error: roleError.message });
          continue;
        }

        results.push({ email: user.email, status: 'created successfully' });
      } catch (err) {
        results.push({ email: user.email, status: 'error', error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
