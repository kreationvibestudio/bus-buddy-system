import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UUID regex pattern for validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Input validation schema with comprehensive checks
const locationSchema = z.object({
  busId: z.string().regex(uuidRegex, 'Invalid bus ID format'),
  tripId: z.string().regex(uuidRegex, 'Invalid trip ID format').optional().nullable(),
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
  speed: z.number().min(0, 'Speed cannot be negative').max(300, 'Speed exceeds maximum (300 km/h)').optional().nullable(),
  heading: z.number().min(0, 'Heading must be >= 0').max(360, 'Heading must be <= 360').optional().nullable(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate input
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      console.error('Failed to parse request body as JSON');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input against schema
    const validationResult = locationSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error('Validation failed:', errorMessages);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errorMessages }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { busId, tripId, latitude, longitude, speed, heading } = validationResult.data;
    
    console.log(`Updating location for bus ${busId}: ${latitude}, ${longitude}`);

    const { data, error } = await supabase
      .from('bus_locations')
      .insert({
        bus_id: busId,
        trip_id: tripId || null,
        latitude,
        longitude,
        speed: speed ?? null,
        heading: heading ?? null,
        recorded_at: new Date().toISOString(),
      })
      .select('id');

    if (error) {
      console.error('Error inserting location:', error);
      throw error;
    }

    const insertedId = data?.[0]?.id;
    console.log('Location updated successfully:', insertedId);

    return new Response(
      JSON.stringify({ success: true, id: insertedId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-bus-location:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
