import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: share, error: shareError } = await supabase
      .from('location_shares')
      .select('booking_id')
      .eq('share_token', token)
      .maybeSingle();

    if (shareError || !share) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired share link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        trip:trips(
          id,
          bus_id,
          status,
          route:routes(name, origin, destination)
        )
      `)
      .eq('id', share.booking_id)
      .maybeSingle();

    if (bookingError || !booking?.trip) {
      return new Response(
        JSON.stringify({ error: 'Booking or trip not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trip = booking.trip as any;
    const busId = trip.bus_id;

    if (!busId) {
      return new Response(
        JSON.stringify({ error: 'No bus assigned to trip' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: bus } = await supabase
      .from('buses')
      .select('id, registration_number, model')
      .eq('id', busId)
      .maybeSingle();

    const { data: locations } = await supabase
      .from('bus_locations')
      .select('latitude, longitude, speed, heading, recorded_at')
      .eq('bus_id', busId)
      .order('recorded_at', { ascending: false })
      .limit(1);

    const latestLoc = locations?.[0];

    return new Response(
      JSON.stringify({
        bus: bus || { id: busId, registration_number: 'Unknown', model: '' },
        route: trip.route || { name: '', origin: '', destination: '' },
        location: latestLoc ? {
          lat: Number(latestLoc.latitude),
          lng: Number(latestLoc.longitude),
          speed: latestLoc.speed ? Number(latestLoc.speed) : 0,
          heading: latestLoc.heading ? Number(latestLoc.heading) : 0,
          lastUpdate: latestLoc.recorded_at,
        } : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('get-shared-location error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
