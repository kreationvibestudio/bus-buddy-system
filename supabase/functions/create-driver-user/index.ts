import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateDriverRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  license_number: string;
  license_expiry: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  status?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request has authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create regular client to verify the caller is an admin
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the calling user
    const { data: { user: callingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !callingUser) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify calling user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Only admins can create driver accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateDriverRequest = await req.json();
    console.log('Creating driver user:', { email: body.email, full_name: body.full_name });

    // Validate required fields
    if (!body.email || !body.password || !body.full_name || !body.license_number || !body.license_expiry) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, full_name, license_number, license_expiry' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === body.email);
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the user with admin API (doesn't affect current session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: body.full_name,
      },
    });

    if (createError || !newUser?.user) {
      console.error('Create user error:', createError);
      return new Response(
        JSON.stringify({ error: createError?.message || 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', newUser.user.id);

    // Update the profile with phone if provided
    if (body.phone) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ phone: body.phone })
        .eq('user_id', newUser.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }
    }

    // Set the user role to driver (upsert to handle if trigger already created it)
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: newUser.user.id, role: 'driver' },
        { onConflict: 'user_id' }
      );

    if (roleInsertError) {
      console.error('Role insert error:', roleInsertError);
      // Don't fail - the trigger might have created a default role
    }

    // Update role to driver if it was created as passenger
    await supabaseAdmin
      .from('user_roles')
      .update({ role: 'driver' })
      .eq('user_id', newUser.user.id);

    // Create the driver record linked to the new user
    const { data: driverData, error: driverError } = await supabaseAdmin
      .from('drivers')
      .insert({
        user_id: newUser.user.id,
        license_number: body.license_number,
        license_expiry: body.license_expiry,
        address: body.address || null,
        emergency_contact: body.emergency_contact || null,
        emergency_phone: body.emergency_phone || null,
        status: body.status || 'active',
      })
      .select()
      .single();

    if (driverError) {
      console.error('Driver insert error:', driverError);
      // Cleanup: delete the created user if driver creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create driver record: ' + driverError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Driver created successfully:', driverData.id);

    // Note: Never return passwords in API responses for security
    // The frontend captures the password from the form before submission
    console.log('Driver account created successfully for:', body.email);
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name: body.full_name,
        },
        driver: driverData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
