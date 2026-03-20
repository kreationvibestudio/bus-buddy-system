import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkDriverRequest {
  driver_id: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
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
        JSON.stringify({ error: 'Only admins can link driver accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: LinkDriverRequest = await req.json();
    console.log('Linking driver account:', { driver_id: body.driver_id, email: body.email, full_name: body.full_name });

    // Validate required fields
    if (!body.driver_id || !body.email || !body.password || !body.full_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: driver_id, email, password, full_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the driver exists and has no user_id
    const { data: existingDriver, error: driverError } = await supabaseAdmin
      .from('drivers')
      .select('id, user_id')
      .eq('id', body.driver_id)
      .single();

    if (driverError || !existingDriver) {
      console.error('Driver lookup error:', driverError);
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingDriver.user_id) {
      return new Response(
        JSON.stringify({ error: 'This driver already has a linked user account' }),
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

    // Create the user with admin API
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
    }

    // Update role to driver if it was created as passenger
    await supabaseAdmin
      .from('user_roles')
      .update({ role: 'driver' })
      .eq('user_id', newUser.user.id);

    // Link the driver record to the new user
    const { data: updatedDriver, error: linkError } = await supabaseAdmin
      .from('drivers')
      .update({ user_id: newUser.user.id })
      .eq('id', body.driver_id)
      .select()
      .single();

    if (linkError) {
      console.error('Driver link error:', linkError);
      // Cleanup: delete the created user if linking fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to link driver record: ' + linkError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Driver linked successfully:', updatedDriver.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name: body.full_name,
        },
        driver: updatedDriver,
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
