import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckResult {
  name: string;
  status: 'ok' | 'error';
  latencyMs?: number;
  message?: string;
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('ANON_KEY');
    if (!url) return { name: 'Supabase', status: 'ok', message: 'Running (edge function)' };
    if (!anonKey) return { name: 'Supabase', status: 'error', message: 'ANON_KEY not set in Edge Function secrets' };
    const headers: Record<string, string> = {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    };
    // Use Auth health endpoint; HEAD to /rest/v1/ often returns 401
    const res = await fetch(`${url}/auth/v1/health`, { method: 'GET', headers });
    return {
      name: 'Supabase',
      status: res.ok ? 'ok' : 'error',
      latencyMs: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    return { name: 'Supabase', status: 'error', latencyMs: Date.now() - start, message: String(e) };
  }
}

async function checkVercel(): Promise<CheckResult> {
  const start = Date.now();
  const url = 'https://bms.sdkoncept.com';
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return {
      name: 'Vercel (bms.sdkoncept.com)',
      status: res.ok ? 'ok' : 'error',
      latencyMs: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    return { name: 'Vercel', status: 'error', latencyMs: Date.now() - start, message: String(e) };
  }
}

async function checkGitHub(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch('https://api.github.com/repos/kreationvibestudio/bus-buddy-system', {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    const data = res.ok ? await res.json() : null;
    return {
      name: 'GitHub',
      status: res.ok ? 'ok' : 'error',
      latencyMs: Date.now() - start,
      message: res.ok ? (data?.pushed_at ? `Last push: ${data.pushed_at}` : undefined) : `HTTP ${res.status}`,
    };
  } catch (e) {
    return { name: 'GitHub', status: 'error', latencyMs: Date.now() - start, message: String(e) };
  }
}

async function checkTraccarServer(): Promise<CheckResult> {
  let traccarUrl = Deno.env.get('TRACCAR_SERVER_URL')?.trim();
  if (!traccarUrl) {
    return { name: 'Traccar Server', status: 'error', message: 'TRACCAR_SERVER_URL not configured' };
  }
  if (!traccarUrl.startsWith('http://') && !traccarUrl.startsWith('https://')) {
    traccarUrl = 'http://' + traccarUrl;
  }
  // Private/CGNAT IPs (10.x, 172.16-31.x, 192.168.x, 100.64-127.x) cannot be reached from Supabase cloud
  const host = new URL(traccarUrl).hostname;
  const isPrivateIp = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|100\.(6[4-9]|[7-9][0-9]|1[0-2][0-7])\.)/.test(host);
  if (isPrivateIp) {
    return {
      name: 'Traccar Server',
      status: 'error',
      message: `Private IP (${host}) cannot be reached from cloud. Use a public URL or tunnel (ngrok/Cloudflare).`,
    };
  }
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s max
  try {
    const url = traccarUrl.replace(/\/$/, '') + '/api/server';
    const user = Deno.env.get('TRACCAR_API_USER')?.trim();
    const pass = Deno.env.get('TRACCAR_API_PASS')?.trim();
    const headers: Record<string, string> = {};
    if (user && pass) {
      headers['Authorization'] = 'Basic ' + btoa(`${user}:${pass}`);
    }
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    return {
      name: 'Traccar Server',
      status: res.ok ? 'ok' : 'error',
      latencyMs: Date.now() - start,
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    clearTimeout(timeout);
    const msg = String(e);
    const isTimeout = msg.includes('abort') || msg.includes('timed out');
    return {
      name: 'Traccar Server',
      status: 'error',
      latencyMs: Date.now() - start,
      message: isTimeout
        ? `Connection timed out. Is Traccar running? Is it reachable from the internet?`
        : msg,
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const checks = await Promise.all([
      checkSupabase(),
      checkVercel(),
      checkGitHub(),
      checkTraccarServer(),
    ]);

    const summary = {
      ok: checks.filter(c => c.status === 'ok').length,
      total: checks.length,
      checks,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('system-status error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
