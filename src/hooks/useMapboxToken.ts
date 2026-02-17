import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMapboxToken() {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      console.log('[useMapboxToken] Fetching token from edge function...');
      try {
        // Use direct fetch with anon key since verify_jwt = false but Supabase still requires anon key
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        if (!supabaseUrl || !anonKey) {
          throw new Error('Supabase URL or anon key not configured');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/get-mapbox-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('[useMapboxToken] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useMapboxToken] HTTP error:', response.status, errorText);
          throw new Error(`Failed to fetch token: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('[useMapboxToken] Response data:', data);

        if (data?.token) {
          console.log('[useMapboxToken] Token received (length:', data.token.length, ')');
          setToken(data.token);
        } else {
          console.warn('[useMapboxToken] No token in response data:', data);
          setError('Mapbox token not configured in backend secrets');
        }
      } catch (err: any) {
        console.error('[useMapboxToken] Unexpected error:', err);
        setError(`Failed to load Mapbox token: ${err?.message || 'Unexpected error'}`);
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, []);

  return { token, loading, error };
}
