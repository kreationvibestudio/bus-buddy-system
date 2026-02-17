import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin JWT - debug endpoint exposes internal data
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin session required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Invalid session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = supabaseAdmin;

    // Get Lagos - Benin City routes (both directions)
    const { data: routes } = await supabase
      .from('routes')
      .select('*')
      .or('name.ilike.%Lagos%Benin%,name.ilike.%Benin%Lagos%');

    const lagosBeninRoute = routes?.find(r => r.name.includes('Lagos - Benin'));
    const beninLagosRoute = routes?.find(r => r.name.includes('Benin City - Lagos'));

    // Get all unique trip_dates
    const { data: tripDates } = await supabase
      .from('trips')
      .select('trip_date')
      .order('trip_date', { ascending: true });

    const uniqueDates = [...new Set(tripDates?.map(t => t.trip_date) || [])];

    // Get trips for the return route (Benin - Lagos) on Jan 3
    const { data: returnTrips } = await supabase
      .from('trips')
      .select('*')
      .eq('route_id', beninLagosRoute?.id)
      .eq('trip_date', '2026-01-03');

    // Get schedules for Benin - Lagos route
    const { data: schedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('route_id', beninLagosRoute?.id);

    // Get count of all trips
    const { count: totalTrips } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({ 
        lagosBeninRoute,
        beninLagosRoute,
        totalTrips,
        uniqueDates,
        returnTripsForJan3: returnTrips,
        schedulesForBeninLagos: schedules,
        message: 'Debug data retrieved'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

