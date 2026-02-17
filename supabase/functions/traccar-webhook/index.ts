import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Traccar sends device + position. deviceId is integer, position has lat/lng/speed/course
// Speed: Traccar uses knots; convert to km/h (1 knot = 1.852 km/h)
// Course: 0-360 degrees (heading)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Bearer token (Traccar forward.header: Authorization: Bearer SERVICE_ROLE_KEY)
    const authHeader = req.headers.get('Authorization');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let rawBody: Record<string, unknown>;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const device = rawBody.device as Record<string, unknown> | undefined;
    const deviceId = rawBody.deviceId ?? device?.id;
    const lat = rawBody.latitude ?? rawBody.lat;
    const lng = rawBody.longitude ?? rawBody.lng ?? rawBody.lon;

    if (deviceId == null || typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Missing deviceId, latitude, or longitude' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      supabaseServiceKey
    );

    const { data: bus, error: busError } = await supabase
      .from('buses')
      .select('id')
      .eq('traccar_device_id', Number(deviceId))
      .maybeSingle();

    if (busError || !bus) {
      console.warn(`No bus mapped for Traccar device ${deviceId}`);
      return new Response(
        JSON.stringify({ error: 'Bus not mapped for this device', deviceId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const speedKnots = rawBody.speed ?? 0;
    const speedKmh = typeof speedKnots === 'number' ? speedKnots * 1.852 : null;
    const course = rawBody.course ?? rawBody.heading ?? null;
    const heading = course != null ? Math.round(Number(course)) % 360 : null;

    const deviceTime = rawBody.deviceTime ?? rawBody.fixTime ?? rawBody.serverTime;
    const recordedAt = typeof deviceTime === 'string' ? deviceTime : new Date().toISOString();

    const { data: loc, error: insertError } = await supabase
      .from('bus_locations')
      .insert({
        bus_id: bus.id,
        trip_id: null,
        latitude: lat,
        longitude: lng,
        speed: speedKmh,
        heading: heading,
        recorded_at: recordedAt,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, id: loc?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('traccar-webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
