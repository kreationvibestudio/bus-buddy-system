import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteDriverRequest {
  driver_id: string;
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
        JSON.stringify({ error: 'Only admins can delete driver accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: DeleteDriverRequest = await req.json();
    console.log('Deleting driver:', body.driver_id);

    if (!body.driver_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: driver_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the driver record to find the associated user_id
    const { data: driver, error: driverFetchError } = await supabaseAdmin
      .from('drivers')
      .select('id, user_id, license_number')
      .eq('id', body.driver_id)
      .single();

    if (driverFetchError || !driver) {
      console.error('Driver fetch error:', driverFetchError);
      return new Response(
        JSON.stringify({ error: 'Driver not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found driver:', driver);

    // Delete the driver record first
    const { error: driverDeleteError } = await supabaseAdmin
      .from('drivers')
      .delete()
      .eq('id', body.driver_id);

    if (driverDeleteError) {
      console.error('Driver delete error:', driverDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete driver record: ' + driverDeleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If the driver has an associated user account, delete it too
    if (driver.user_id) {
      console.log('Deleting associated user:', driver.user_id);
      
      const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(driver.user_id);
      
      if (userDeleteError) {
        console.error('User delete error:', userDeleteError);
        // Don't fail - driver is already deleted, just log the warning
        console.warn('Driver deleted but user account deletion failed:', userDeleteError.message);
      } else {
        console.log('User account deleted successfully');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Driver deleted successfully',
        deleted_driver_id: body.driver_id,
        deleted_user_id: driver.user_id,
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
