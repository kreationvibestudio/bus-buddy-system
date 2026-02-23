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

  const send = (body: { success?: boolean; error?: string; deviceId?: number; status?: number }) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return send({ success: false, error: 'Unauthorized — missing or invalid token' });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return send({ success: false, error: 'Unauthorized — please sign in again' });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleData?.role !== 'admin') {
      return send({ success: false, error: 'Admin only' });
    }

    let body: { deviceId?: number } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const deviceId = body.deviceId ?? 1;
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/traccar-webhook`;
    const secret = Deno.env.get('TRACCAR_WEBHOOK_SECRET')?.trim() || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();

    if (!secret) {
      return send({ success: false, error: 'TRACCAR_WEBHOOK_SECRET not configured in Supabase' });
    }

    const payload = {
      deviceId,
      latitude: 6.335,
      longitude: 5.627,
      deviceTime: new Date().toISOString(),
      fixTime: new Date().toISOString(),
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    let errorMsg = res.ok ? undefined : (data?.error || data?.hint || `Webhook returned ${res.status}`);

    // If "Bus not mapped", fetch actual mappings to help debug
    if (!res.ok && (data?.error?.includes('not mapped') || data?.error?.includes('Bus not mapped'))) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data: buses } = await supabaseAdmin
        .from('buses')
        .select('registration_number, traccar_device_id')
        .not('traccar_device_id', 'is', null);
      const mappings = (buses || []).map((b: any) => `${b.registration_number}=${b.traccar_device_id}`).join(', ');
      errorMsg = `Device ${deviceId} not found. Mapped buses: ${mappings || 'none'}`;
    }

    return send({
      success: res.ok,
      status: res.status,
      deviceId,
      error: errorMsg,
    });
  } catch (error) {
    console.error('test-traccar-webhook error:', error);
    return send({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
