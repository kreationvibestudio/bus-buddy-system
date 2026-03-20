import { useState, useEffect, useCallback, useRef } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { bearingDegrees, speedKmhFromSamples } from '@/lib/geo';

// GPS acquisition stages
type GPSStage = 'idle' | 'warming_up' | 'acquiring' | 'tracking' | 'error';

interface GPSPosition {
  latitude: number;
  longitude: number;
  speed: number | null; // m/s from device API
  heading: number | null; // degrees from device API
  accuracy: number;
  timestamp: number;
}

interface GPSDiagnostics {
  stage: GPSStage;
  permissionStatus: string;
  lastFixAge: number | null; // seconds since last fix
  fixCount: number;
  lastSendResult: 'success' | 'error' | 'pending' | null;
  lastSendTime: number | null;
  lastError: string | null;
  watchAttempts: number;
  provider: 'high_accuracy' | 'low_accuracy' | 'cached';
}

interface UseCapacitorGPSOptions {
  tripId?: string;
  busId?: string;
  updateIntervalMs?: number;
  enabled?: boolean;
}

const STORAGE_KEY = 'gps_last_known_position';

// Persist last known position to localStorage
function saveLastKnownPosition(pos: GPSPosition) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch (e) {
    console.warn('[CapacitorGPS] Failed to save position to localStorage:', e);
  }
}

function loadLastKnownPosition(): GPSPosition | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[CapacitorGPS] Failed to load position from localStorage:', e);
  }
  return null;
}

export function useCapacitorGPS({
  tripId,
  busId,
  updateIntervalMs = 15000,
  enabled = false,
}: UseCapacitorGPSOptions) {
  const [position, setPosition] = useState<GPSPosition | null>(() => loadLastKnownPosition());
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [stage, setStage] = useState<GPSStage>('idle');
  const [diagnostics, setDiagnostics] = useState<GPSDiagnostics>({
    stage: 'idle',
    permissionStatus: 'unknown',
    lastFixAge: null,
    fixCount: 0,
    lastSendResult: null,
    lastSendTime: null,
    lastError: null,
    watchAttempts: 0,
    provider: 'cached',
  });

  const watchIdRef = useRef<string | null>(null);
  const lastSentRef = useRef<number>(0);
  const lastFixRef = useRef<GPSPosition | null>(null);
  const fixCountRef = useRef(0);
  const watchAttemptsRef = useRef(0);
  const warmUpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Update diagnostics helper
  const updateDiagnostics = useCallback((updates: Partial<GPSDiagnostics>) => {
    setDiagnostics(prev => ({ ...prev, ...updates }));
  }, []);

  // Check if running on native platform
  const checkPlatform = useCallback(() => {
    console.log('[CapacitorGPS] Platform:', Capacitor.getPlatform());
    console.log('[CapacitorGPS] Is native:', isNative);
    return isNative;
  }, [isNative]);

  // Check and request permissions
  const checkPermissions = useCallback(async () => {
    try {
      const status = await Geolocation.checkPermissions();
      console.log('[CapacitorGPS] Permission status:', status);
      setPermissionStatus(status);
      updateDiagnostics({ permissionStatus: status.location || 'unknown' });
      return status;
    } catch (err) {
      console.error('[CapacitorGPS] Error checking permissions:', err);
      updateDiagnostics({ permissionStatus: 'error' });
      return null;
    }
  }, [updateDiagnostics]);

  const requestPermissions = useCallback(async () => {
    try {
      const status = await Geolocation.requestPermissions();
      console.log('[CapacitorGPS] Permission requested:', status);
      setPermissionStatus(status);
      updateDiagnostics({ permissionStatus: status.location || 'unknown' });
      return status;
    } catch (err) {
      console.error('[CapacitorGPS] Error requesting permissions:', err);
      setError('Failed to request location permissions');
      updateDiagnostics({ permissionStatus: 'denied', lastError: 'Permission request failed' });
      return null;
    }
  }, [updateDiagnostics]);

  // Send location to backend
  const sendLocation = useCallback(
    async (pos: GPSPosition) => {
      if (!busId) {
        console.log('[CapacitorGPS] No bus ID, skipping update');
        return;
      }

      const now = Date.now();
      if (now - lastSentRef.current < updateIntervalMs) {
        return;
      }
      lastSentRef.current = now;

      // Normalize speed to km/h (device speed is usually m/s). If missing, compute from last fix.
      const prev = lastFixRef.current;
      const computedSpeedKmh =
        pos.speed == null && prev
          ? speedKmhFromSamples(
              {
                latitude: prev.latitude,
                longitude: prev.longitude,
                timestamp: prev.timestamp,
              },
              { latitude: pos.latitude, longitude: pos.longitude, timestamp: pos.timestamp }
            )
          : null;

      const speedKmh =
        pos.speed == null
          ? computedSpeedKmh
          : Math.max(0, pos.speed * 3.6);

      // Normalize heading (if missing, compute bearing from last fix)
      const heading =
        pos.heading == null && prev
          ? bearingDegrees(
              {
                latitude: prev.latitude,
                longitude: prev.longitude,
                timestamp: prev.timestamp,
              },
              { latitude: pos.latitude, longitude: pos.longitude, timestamp: pos.timestamp }
            )
          : pos.heading;

      updateDiagnostics({ lastSendResult: 'pending' });

      try {
        console.log('[CapacitorGPS] Sending location:', {
          busId,
          tripId,
          latitude: pos.latitude,
          longitude: pos.longitude,
          speedKmh,
          heading,
          accuracy: pos.accuracy,
          timestamp: pos.timestamp,
        });

        const { data, error: sendError } = await supabase.functions.invoke('update-bus-location', {
          body: {
            busId,
            tripId,
            latitude: pos.latitude,
            longitude: pos.longitude,
            speed: speedKmh == null ? null : Number(speedKmh.toFixed(2)),
            heading: heading == null ? null : Math.round(heading),
          },
        });

        if (sendError) {
          const errMsg = (sendError as any)?.message || 'Unknown error';
          const status = (sendError as any)?.status;

          console.error(
            '[CapacitorGPS] Error sending location:',
            JSON.stringify({ status: status || null, message: errMsg })
          );

          // Surface auth problems prominently (common cause of "GPS not working" even when fixes are acquired)
          if (status === 401 || /authorization|jwt|unauthorized|Missing authorization header/i.test(errMsg)) {
            setError(`Backend authorization error (${status || 401}). Please sign in again.`);
          }

          updateDiagnostics({
            lastSendResult: 'error',
            lastSendTime: now,
            lastError: `Send failed${status ? ` (${status})` : ''}: ${errMsg}`,
          });
        } else {
          console.log('[CapacitorGPS] Location sent successfully:', data);
          updateDiagnostics({
            lastSendResult: 'success',
            lastSendTime: now,
            lastError: null,
          });
        }
      } catch (err: any) {
        console.error('[CapacitorGPS] Failed to send location:', err);
        updateDiagnostics({ 
          lastSendResult: 'error', 
          lastSendTime: now,
          lastError: `Network error: ${err?.message || 'Unknown'}`
        });
      }
    },
    [busId, tripId, updateIntervalMs, updateDiagnostics]
  );

  // Handle position update
  const handlePositionUpdate = useCallback(
    (position: Position, provider: 'high_accuracy' | 'low_accuracy' | 'cached' = 'cached') => {
      const newPosition: GPSPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };

      fixCountRef.current += 1;
      const now = Date.now();
      const lastFixAge = lastFixRef.current 
        ? Math.round((now - lastFixRef.current.timestamp) / 1000) 
        : null;

      console.log(`[CapacitorGPS] Position update #${fixCountRef.current}:`, {
        ...newPosition,
        provider,
        lastFixAge
      });

      setPosition(newPosition);
      saveLastKnownPosition(newPosition);
      setError(null);
      
      updateDiagnostics({
        fixCount: fixCountRef.current,
        lastFixAge: 0,
        provider,
        lastError: null,
      });

      // If we're in warming_up stage and got a fix, move to tracking
      if (stage === 'warming_up' || stage === 'acquiring') {
        setStage('tracking');
        updateDiagnostics({ stage: 'tracking' });
      }

      sendLocation(newPosition);
      lastFixRef.current = newPosition;
    },
    [sendLocation, stage, updateDiagnostics]
  );

  // Stop any existing watch
  const clearExistingWatch = useCallback(async () => {
    if (watchIdRef.current) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current });
        console.log('[CapacitorGPS] Cleared existing watch:', watchIdRef.current);
      } catch (err) {
        console.warn('[CapacitorGPS] Error clearing watch:', err);
      }
      watchIdRef.current = null;
    }
    if (warmUpTimeoutRef.current) {
      clearTimeout(warmUpTimeoutRef.current);
      warmUpTimeoutRef.current = null;
    }
  }, []);

  // Stage 1: Warm-up phase - try to get a quick cached/low-accuracy fix
  const warmUpPhase = useCallback(async (): Promise<boolean> => {
    console.log('[CapacitorGPS] Starting warm-up phase...');
    setStage('warming_up');
    updateDiagnostics({ stage: 'warming_up' });

    try {
      // Try cached position first (fastest)
      const cachedPosition = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 120000, // Accept positions up to 2 minutes old
      });
      
      console.log('[CapacitorGPS] Warm-up: got cached/low-accuracy fix');
      handlePositionUpdate(cachedPosition, 'cached');
      return true;
    } catch (err: any) {
      console.log('[CapacitorGPS] Warm-up: no cached fix available, continuing...');
      // Don't treat this as an error - just means no cached position
    }

    // Try low accuracy fresh position
    try {
      const lowAccuracyPosition = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 0,
      });
      
      console.log('[CapacitorGPS] Warm-up: got low-accuracy fix');
      handlePositionUpdate(lowAccuracyPosition, 'low_accuracy');
      return true;
    } catch (err: any) {
      console.log('[CapacitorGPS] Warm-up: low accuracy failed:', err?.message);
    }

    return false;
  }, [handlePositionUpdate, updateDiagnostics]);

  // Stage 2: Start continuous watch
  const startWatch = useCallback(async (highAccuracy: boolean) => {
    console.log(`[CapacitorGPS] Starting watch (highAccuracy: ${highAccuracy})...`);
    watchAttemptsRef.current += 1;
    updateDiagnostics({ watchAttempts: watchAttemptsRef.current });

    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: highAccuracy,
          timeout: 60000,
          maximumAge: highAccuracy ? 0 : 30000,
        },
        (position, err) => {
          if (err) {
            const msg = err.message || 'Location error';
            console.error('[CapacitorGPS] Watch callback error:', err);

            // Timeouts are common - don't stop tracking
            if (/timeout|obtain location/i.test(msg)) {
              console.log('[CapacitorGPS] Timeout - GPS still acquiring...');
              updateDiagnostics({ 
                lastError: 'GPS acquiring signal...',
                stage: 'acquiring'
              });
              setStage('acquiring');
              return;
            }

            // Other errors
            updateDiagnostics({ lastError: msg });
            setError(msg);
            return;
          }
          
          if (position) {
            handlePositionUpdate(position, highAccuracy ? 'high_accuracy' : 'low_accuracy');
          }
        }
      );

      watchIdRef.current = watchId;
      console.log('[CapacitorGPS] Watch started, ID:', watchId);
      return true;
    } catch (err: any) {
      console.error('[CapacitorGPS] Failed to start watch:', err);
      updateDiagnostics({ lastError: err?.message || 'Watch failed' });
      return false;
    }
  }, [handlePositionUpdate, updateDiagnostics]);

  // Main start tracking function with staged approach
  const startTracking = useCallback(async () => {
    console.log('[CapacitorGPS] startTracking called', { busId, tripId, isTracking, stage });

    if (!busId) {
      console.log('[CapacitorGPS] No bus ID, cannot start tracking');
      setError('No bus assigned');
      updateDiagnostics({ lastError: 'No bus assigned' });
      return;
    }

    // Clear any existing watch first
    await clearExistingWatch();

    setError(null);
    fixCountRef.current = 0;
    watchAttemptsRef.current = 0;

    try {
      // Check/request permissions first
      let status = await checkPermissions();
      if (status?.location !== 'granted') {
        status = await requestPermissions();
        if (status?.location !== 'granted') {
          setError('Location permission denied');
          setStage('error');
          updateDiagnostics({ stage: 'error', lastError: 'Permission denied' });
          return;
        }
      }

      // Stage 1: Warm-up phase
      const warmUpSuccess = await warmUpPhase();
      
      // Stage 2: Start continuous low-accuracy watch first (faster to get fixes)
      console.log('[CapacitorGPS] Starting low-accuracy watch...');
      let watchStarted = await startWatch(false);
      
      if (!watchStarted) {
        console.log('[CapacitorGPS] Low-accuracy watch failed, trying high-accuracy...');
        watchStarted = await startWatch(true);
      }

      if (watchStarted) {
        setIsTracking(true);
        if (!warmUpSuccess) {
          setStage('acquiring');
          updateDiagnostics({ stage: 'acquiring' });
        }
        
        // After 30 seconds of successful tracking, upgrade to high accuracy
        warmUpTimeoutRef.current = setTimeout(async () => {
          if (fixCountRef.current >= 2 && watchIdRef.current) {
            console.log('[CapacitorGPS] Upgrading to high-accuracy watch...');
            await clearExistingWatch();
            await startWatch(true);
          }
        }, 30000);

        console.log('[CapacitorGPS] Tracking started successfully');
      } else {
        setError('Failed to start GPS watch');
        setStage('error');
        updateDiagnostics({ stage: 'error', lastError: 'Watch start failed' });
      }
    } catch (err: any) {
      console.error('[CapacitorGPS] Start tracking error:', err);
      setError(err?.message || 'Failed to start GPS tracking');
      setStage('error');
      updateDiagnostics({ stage: 'error', lastError: err?.message });
    }
  }, [busId, tripId, isTracking, stage, checkPermissions, requestPermissions, warmUpPhase, startWatch, clearExistingWatch, updateDiagnostics]);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    await clearExistingWatch();
    setIsTracking(false);
    setStage('idle');
    updateDiagnostics({ stage: 'idle' });
    console.log('[CapacitorGPS] Tracking stopped');
  }, [clearExistingWatch, updateDiagnostics]);

  // Get current position once (for manual refresh)
  const getCurrentPosition = useCallback(async () => {
    console.log('[CapacitorGPS] Getting current position...');
    
    // Try high accuracy first
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      });
      handlePositionUpdate(position, 'high_accuracy');
      return position;
    } catch (err: any) {
      console.log('[CapacitorGPS] High accuracy failed, trying low accuracy...');
    }

    // Fallback to low accuracy
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 30000,
      });
      handlePositionUpdate(position, 'low_accuracy');
      return position;
    } catch (err: any) {
      console.error('[CapacitorGPS] getCurrentPosition failed:', err);
      updateDiagnostics({ lastError: err?.message || 'Position request failed' });
      setError(err?.message || 'Failed to get current position');
      return null;
    }
  }, [handlePositionUpdate, updateDiagnostics]);

  // Update lastFixAge periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFixRef.current) {
        const age = Math.round((Date.now() - lastFixRef.current.timestamp) / 1000);
        setDiagnostics(prev => ({ ...prev, lastFixAge: age }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    console.log('[CapacitorGPS] Auto-start/stop effect', { enabled, busId, isTracking });

    if (enabled && busId && !isTracking) {
      console.log('[CapacitorGPS] Auto-starting tracking');
      startTracking();
    } else if (!enabled && isTracking) {
      console.log('[CapacitorGPS] Auto-stopping tracking');
      stopTracking();
    }

    return () => {
      if (watchIdRef.current) {
        console.log('[CapacitorGPS] Cleanup: clearing watch');
        Geolocation.clearWatch({ id: watchIdRef.current }).catch(console.error);
      }
    };
  }, [enabled, busId]); // Removed isTracking, startTracking, stopTracking from deps to prevent loops

  // Check permissions on mount
  useEffect(() => {
    checkPlatform();
    checkPermissions();
  }, [checkPlatform, checkPermissions]);

  return {
    position,
    isTracking,
    error,
    permissionStatus,
    isNative,
    stage,
    diagnostics,
    startTracking,
    stopTracking,
    getCurrentPosition,
    requestPermissions,
  };
}
