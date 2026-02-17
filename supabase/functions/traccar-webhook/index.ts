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
    // Accept: Bearer with service_role key OR TRACCAR_WEBHOOK_SECRET (set in Edge Function secrets)
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    const webhookSecret = Deno.env.get('TRACCAR_WEBHOOK_SECRET')?.trim();
    const isValid = token && (token === serviceKey || (webhookSecret && token === webhookSecret));
    if (!isValid) {
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
    const position = rawBody.position as Record<string, unknown> | undefined;
    // Traccar sends { device: { id }, position: { deviceId, latitude, longitude, ... } }
    const deviceId = rawBody.deviceId ?? position?.deviceId ?? device?.id;
    const lat = rawBody.latitude ?? position?.latitude ?? rawBody.lat;
    const lng = rawBody.longitude ?? position?.longitude ?? rawBody.lng ?? rawBody.lon;

    console.log('[traccar-webhook] Received', { deviceId, lat, lng, hasDevice: !!device, hasPosition: !!position });

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

    const speedKnots = rawBody.speed ?? position?.speed ?? 0;
    const speedKmh = typeof speedKnots === 'number' ? speedKnots * 1.852 : null;
    const course = rawBody.course ?? rawBody.heading ?? position?.course ?? null;
    const heading = course != null ? Math.round(Number(course)) % 360 : null;

    const attrs = (rawBody.attributes ?? position?.attributes) as Record<string, unknown> | undefined;
    const totalDistM = attrs?.totalDistance ?? attrs?.distance ?? rawBody.totalDistance;
    const odometerKm = totalDistM != null ? Number(totalDistM) / 1000 : null;
    const geofenceName = (rawBody.geofence ?? attrs?.geofence ?? attrs?.geofenceName) as string | undefined;

    const deviceTime = rawBody.deviceTime ?? rawBody.fixTime ?? position?.deviceTime ?? position?.fixTime ?? rawBody.serverTime;
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
        odometer_km: odometerKm != null && !isNaN(odometerKm) ? odometerKm : null,
        geofence_name: geofenceName && String(geofenceName).trim() ? String(geofenceName).trim() : null,
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
