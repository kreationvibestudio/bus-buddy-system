import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Bus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') || '/dashboard';
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle error from Supabase
      if (errorParam) {
        setError(errorDescription || errorParam);
        toast({
          title: 'Authentication Error',
          description: errorDescription || 'An error occurred during authentication.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/auth'), 2000);
        return;
      }

      // Handle PKCE code exchange
      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setError(exchangeError.message);
            toast({
              title: 'Authentication Error',
              description: exchangeError.message,
              variant: 'destructive',
            });
            setTimeout(() => navigate('/auth'), 2000);
            return;
          }

          // Successfully exchanged code, navigate to next page
          navigate(next, { replace: true });
          return;
        } catch (err) {
          console.error('Unexpected error during code exchange:', err);
          setError('An unexpected error occurred');
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }
      }

      // No code parameter, check for hash tokens (legacy flow)
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
        // Let Supabase client handle the hash automatically
        // Wait a moment for it to process
        setTimeout(() => {
          navigate(next, { replace: true });
        }, 500);
        return;
      }

      // No valid auth parameters, redirect to auth
      navigate('/auth', { replace: true });
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
          <Bus className="h-8 w-8 text-primary-foreground" />
        </div>
        {error ? (
          <>
            <p className="text-destructive font-medium">Authentication Failed</p>
            <p className="text-muted-foreground text-sm text-center max-w-xs">{error}</p>
            <p className="text-muted-foreground text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Processing authentication...</p>
          </>
        )}
      </div>
    </div>
  );
}
