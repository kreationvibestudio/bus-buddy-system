import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMapboxToken() {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token', {
          method: 'GET',
        });

        if (fnError) {
          throw new Error(fnError.message || 'Edge function error');
        }

        if (data?.token) {
          setToken(data.token);
        } else {
          setError(data?.error || 'Mapbox token not configured in backend secrets');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        setError(`Failed to load Mapbox token: ${message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, []);

  return { token, loading, error };
}
