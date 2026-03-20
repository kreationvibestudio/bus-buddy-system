import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Bus } from 'lucide-react';

interface BusLocation {
  id: string;
  registration_number: string;
  model: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  route?: {
    name: string;
    origin: string;
    destination: string;
  };
}

interface MapboxMapProps {
  buses: BusLocation[];
  selectedBusId: string;
  onBusSelect: (busId: string) => void;
  mapboxToken: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ 
  buses, 
  selectedBusId, 
  onBusSelect,
  mapboxToken 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    setMapError(null);
    setMapLoaded(false);

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [3.3792, 6.5244], // Lagos, Nigeria
      zoom: 10,
      pitch: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    const handleLoad = () => {
      setMapLoaded(true);
    };

    const handleError = (e: any) => {
      // Mapbox errors are often token/style/network related.
      console.error('Mapbox error:', e?.error || e);
      setMapError(e?.error?.message || 'Failed to load map. Check Mapbox token and network access.');
    };

    map.current.on('load', handleLoad);
    map.current.on('error', handleError);

    return () => {
      // Clean up markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};

      if (map.current) {
        map.current.off('load', handleLoad);
        map.current.off('error', handleError);
        map.current.remove();
      }
      map.current = null;
    };
  }, [mapboxToken]);

  // Update bus markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove old markers that are no longer in the buses array
    const currentBusIds = new Set(buses.map(b => b.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentBusIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    buses.forEach(bus => {
      const existing = markersRef.current[bus.id];

      if (existing) {
        // Update existing marker position
        existing.setLngLat([bus.lng, bus.lat]);

        // Update rotation on inner element (do NOT override the marker's transform)
        const el = existing.getElement();
        const inner = el.querySelector<HTMLElement>('[data-marker-inner]');
        if (inner) {
          inner.style.transform = `rotate(${bus.heading}deg)`;
        }
        return;
      }

      // Create new marker
      const el = document.createElement('div');
      el.className = 'bus-marker';

      const inner = document.createElement('div');
      inner.setAttribute('data-marker-inner', 'true');
      inner.style.width = '40px';
      inner.style.height = '40px';
      inner.style.borderRadius = '9999px';
      inner.style.display = 'flex';
      inner.style.alignItems = 'center';
      inner.style.justifyContent = 'center';
      inner.style.cursor = 'pointer';
      inner.style.transition = 'transform 150ms ease, filter 150ms ease';
      inner.style.background = 'hsl(var(--primary))';
      inner.style.border = '2px solid hsl(var(--background))';
      inner.style.boxShadow = '0 10px 20px -10px rgba(0,0,0,0.35)';
      inner.style.transform = `rotate(${bus.heading}deg)`;

      inner.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Bus">
          <path d="M8 6v6"/>
          <path d="M16 6v6"/>
          <path d="M2 12h20"/>
          <path d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/>
        </svg>
      `;

      inner.addEventListener('mouseenter', () => {
        inner.style.filter = 'brightness(1.05)';
        // Add a little scale without breaking rotation
        inner.style.transform = `rotate(${bus.heading}deg) scale(1.06)`;
      });
      inner.addEventListener('mouseleave', () => {
        inner.style.filter = '';
        inner.style.transform = `rotate(${bus.heading}deg)`;
      });

      el.appendChild(inner);

      el.addEventListener('click', () => {
        onBusSelect(bus.id);
      });

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div style="padding:8px; font-family: ui-sans-serif, system-ui;">
          <div style="font-weight: 600;">${bus.registration_number}</div>
          <div style="font-size: 12px; opacity: .8; margin-top: 2px;">${bus.model}</div>
          <div style="font-size: 12px; margin-top: 6px;">
            <span style="font-weight: 600;">${Math.round(bus.speed)} km/h</span>
          </div>
          ${bus.route ? `
            <div style="font-size: 11px; opacity: .75; margin-top: 4px;">
              ${bus.route.origin} → ${bus.route.destination}
            </div>
          ` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([bus.lng, bus.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Show popup on hover
      el.addEventListener('mouseenter', () => {
        marker.togglePopup();
      });
      el.addEventListener('mouseleave', () => {
        marker.togglePopup();
      });

      markersRef.current[bus.id] = marker;
    });
  }, [buses, mapLoaded, onBusSelect]);

  // Fly to selected bus
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedBusId) return;

    const selectedBus = buses.find(b => b.id === selectedBusId);
    if (selectedBus) {
      map.current.flyTo({
        center: [selectedBus.lng, selectedBus.lat],
        zoom: 14,
        duration: 1500,
      });

      // Show popup for selected bus
      const marker = markersRef.current[selectedBusId];
      if (marker && !marker.getPopup().isOpen()) {
        marker.togglePopup();
      }
    }
  }, [selectedBusId, buses, mapLoaded]);

  if (!mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center p-8">
          <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground">
            Please configure your Mapbox public token to enable live tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" style={{ minHeight: '400px' }} />

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60 rounded-lg">
          <div className="max-w-md text-center p-6">
            <Bus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold">Map failed to load</h3>
            <p className="text-sm text-muted-foreground mt-1">{mapError}</p>
          </div>
        </div>
      )}

      {!mapError && !mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
