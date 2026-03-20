import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MapPin, Edit, Trash2, Building, Navigation } from 'lucide-react';
import { useStates, useStationsWithState, useCreateStationWithState, useUpdateStationWithState, useDeleteStationWithState } from '@/hooks/useStates';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface StationFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  state_id: string;
}

const initialFormData: StationFormData = {
  name: '',
  code: '',
  address: '',
  city: '',
  latitude: null,
  longitude: null,
  is_active: true,
  state_id: '',
};

const StationsPage = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  
  const { data: states, isLoading: statesLoading } = useStates();
  const { data: stations, isLoading: stationsLoading } = useStationsWithState();
  const createStation = useCreateStationWithState();
  const updateStation = useUpdateStationWithState();
  const deleteStation = useDeleteStationWithState();
  const { token: mapboxToken, loading: tokenLoading } = useMapboxToken();

  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<StationFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const pendingFlyToRef = useRef<any>(null);
  const skipFitBoundsRef = useRef(false);
  const lastFilterKeyRef = useRef<string>('');

  // Filter stations by state - memoized to prevent unnecessary re-renders
  const filteredStations = useMemo(() => {
    return stations?.filter(s => 
      selectedState === 'all' || s.state_id === selectedState
    ) || [];
  }, [stations, selectedState]);

  // Clear selected station when it's no longer in the filtered list and fly to new filter area
  useEffect(() => {
    if (selectedStation && filteredStations.length > 0) {
      const stillInList = filteredStations.some(s => s.id === selectedStation.id);
      if (!stillInList) {
        setSelectedStation(null);
        
        // Fly to the filtered stations area
        const stationsWithCoords = filteredStations.filter(s => s.latitude && s.longitude);
        if (stationsWithCoords.length > 0 && map.current) {
          if (stationsWithCoords.length === 1) {
            // Single station - fly directly to it
            const station = stationsWithCoords[0];
            map.current.flyTo({
              center: [station.longitude!, station.latitude!],
              zoom: 10,
              duration: 1500,
            });
          } else {
            // Multiple stations - fit bounds
            const bounds = new mapboxgl.LngLatBounds();
            stationsWithCoords.forEach(s => {
              bounds.extend([s.longitude!, s.latitude!]);
            });
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 10, duration: 1500 });
          }
        }
      }
    }
  }, [filteredStations, selectedStation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [8.6753, 9.0820], // Center of Nigeria
      zoom: 5.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      console.log('Map loaded');
      setMapLoaded(true);
      
      // Execute pending flyTo if any
      if (pendingFlyToRef.current && map.current) {
        const { lng, lat } = pendingFlyToRef.current;
        map.current.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 1500,
        });
        pendingFlyToRef.current = null;
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, [mapboxToken]);

  // Store the current flyToStation in a ref so markers always have the latest version
  const flyToStationRef = useRef<((station: any) => void) | null>(null);

  // Update markers when stations change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for filtered stations
    filteredStations.forEach((station) => {
      if (station.latitude && station.longitude) {
        const el = document.createElement('div');
        el.className = 'station-marker';
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: hsl(var(--primary));
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
        
        // Create SVG element safely (no user data in innerHTML)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'white');
        svg.innerHTML = '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="hsl(var(--primary))"/>';
        el.appendChild(svg);

        // Create popup content safely using DOM methods to prevent XSS
        const popupContent = document.createElement('div');
        popupContent.style.padding = '8px';
        
        const title = document.createElement('strong');
        title.textContent = station.name;
        popupContent.appendChild(title);
        
        const locationInfo = document.createElement('p');
        locationInfo.style.cssText = 'margin: 4px 0 0; color: #666; font-size: 12px;';
        const stateName = station.state?.name || '';
        const cityText = station.city ? ` • ${station.city}` : '';
        locationInfo.textContent = stateName + cityText;
        popupContent.appendChild(locationInfo);
        
        if (station.address) {
          const addressInfo = document.createElement('p');
          addressInfo.style.cssText = 'margin: 4px 0 0; font-size: 12px;';
          addressInfo.textContent = station.address;
          popupContent.appendChild(addressInfo);
        }

        const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([station.longitude, station.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        // Store station ID in data attribute and use ref for handler to avoid stale closures
        const stationId = station.id;
        el.addEventListener('click', () => {
          // Find the current station data by ID to ensure fresh data
          const currentStation = filteredStations.find(s => s.id === stationId) || station;
          if (flyToStationRef.current) {
            flyToStationRef.current(currentStation);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Only fit bounds if filter changed (not when user clicked a station)
    const currentFilterKey = selectedState;
    const filterChanged = lastFilterKeyRef.current !== currentFilterKey;
    lastFilterKeyRef.current = currentFilterKey;

    // Skip fitBounds if user just clicked a station (but still keep markers rendered)
    const shouldFitBounds = !skipFitBoundsRef.current;
    if (skipFitBoundsRef.current) {
      skipFitBoundsRef.current = false;
    }

    // Fit bounds only when filter changes or initial load
    const stationsWithCoords = filteredStations.filter(s => s.latitude && s.longitude);
    if (shouldFitBounds && stationsWithCoords.length > 0 && map.current && filterChanged) {
      const bounds = new mapboxgl.LngLatBounds();
      stationsWithCoords.forEach(s => {
        bounds.extend([s.longitude!, s.latitude!]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  }, [filteredStations, selectedState, mapLoaded]);

  const handleOpenDialog = (station?: any) => {
    if (station) {
      setEditingId(station.id);
      setFormData({
        name: station.name || '',
        code: station.code || '',
        address: station.address || '',
        city: station.city || '',
        latitude: station.latitude || null,
        longitude: station.longitude || null,
        is_active: station.is_active ?? true,
        state_id: station.state_id || '',
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.state_id) {
      toast.error('Please fill in required fields');
      return;
    }

    const payload = {
      name: formData.name,
      code: formData.code || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
      is_active: formData.is_active,
      state_id: formData.state_id,
    };

    if (editingId) {
      await updateStation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createStation.mutateAsync(payload);
    }
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteStation.mutateAsync(id);
    if (selectedStation?.id === id) {
      setSelectedStation(null);
    }
  };

  const flyToStation = useCallback((station: any) => {
    // Prevent fitBounds from overriding this flyTo
    skipFitBoundsRef.current = true;
    
    // Always select the station first
    setSelectedStation(station);
    
    // Coerce coordinates to numbers
    const lat = Number(station.latitude);
    const lng = Number(station.longitude);
    
    // Only try to fly if coordinates are valid numbers
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }
    
    if (map.current && mapLoaded) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1500,
      });
    } else {
      // Store pending flyTo for when map loads
      pendingFlyToRef.current = { lng, lat };
    }
  }, [mapLoaded]);

  // Keep the ref updated with the latest flyToStation function
  useEffect(() => {
    flyToStationRef.current = flyToStation;
  }, [flyToStation]);

  if (statesLoading || stationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading stations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Stations</h1>
          <p className="text-muted-foreground">Manage stations across Nigerian states</p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Station
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Station' : 'Add New Station'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Station Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Lagos Central"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Station Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. LAG-C"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.state_id}
                    onValueChange={(value) => setFormData({ ...formData, state_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states?.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Ikeja"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude ?? ''}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="e.g. 6.5244"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude ?? ''}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="e.g. 3.3792"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active Station</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={createStation.isPending || updateStation.isPending}>
                  {editingId ? 'Update' : 'Create'} Station
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* State Filter */}
      <div className="flex gap-4 items-center">
        <Label>Filter by State:</Label>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states?.map((state) => (
              <SelectItem key={state.id} value={state.id}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredStations.length} stations</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Station Locations
            </CardTitle>
            <CardDescription>Click a marker to view station details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {tokenLoading ? (
              <div className="h-[500px] flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            ) : !mapboxToken ? (
              <div className="h-[500px] flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">Map token not configured</p>
              </div>
            ) : (
              <div ref={mapContainer} className="h-[500px] w-full" />
            )}
          </CardContent>
        </Card>

        {/* Station Details / List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedStation ? 'Station Details' : 'Station List'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStation ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedStation.name}</h3>
                    <p className="text-muted-foreground">
                      {selectedStation.state?.name}
                      {selectedStation.city && ` • ${selectedStation.city}`}
                    </p>
                  </div>
                  <Badge variant={selectedStation.is_active ? 'default' : 'secondary'}>
                    {selectedStation.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {selectedStation.code && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Station Code</Label>
                    <p className="font-mono">{selectedStation.code}</p>
                  </div>
                )}

                {selectedStation.address && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Address</Label>
                    <p>{selectedStation.address}</p>
                  </div>
                )}

                {selectedStation.latitude && selectedStation.longitude && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Coordinates</Label>
                    <p className="font-mono text-sm">
                      {selectedStation.latitude.toFixed(6)}, {selectedStation.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedStation(null)}>
                    Back to List
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="outline" onClick={() => handleOpenDialog(selectedStation)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Station?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{selectedStation.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(selectedStation.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Station</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No stations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStations.map((station) => (
                        <TableRow 
                          key={station.id} 
                          className="cursor-pointer hover:bg-muted/50" 
                          onClick={() => {
                            // Directly set selected station and fly to it
                            setSelectedStation(station);
                            skipFitBoundsRef.current = true;
                            const lat = Number(station.latitude);
                            const lng = Number(station.longitude);
                            if (Number.isFinite(lat) && Number.isFinite(lng) && map.current && mapLoaded) {
                              map.current.flyTo({
                                center: [lng, lat],
                                zoom: 14,
                                duration: 1500,
                              });
                            }
                          }}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{station.name}</p>
                              {station.city && <p className="text-xs text-muted-foreground">{station.city}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{station.state?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={station.is_active ? 'default' : 'secondary'} className="text-xs">
                              {station.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {station.latitude && station.longitude && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setSelectedStation(station);
                                  skipFitBoundsRef.current = true;
                                  const lat = Number(station.latitude);
                                  const lng = Number(station.longitude);
                                  if (Number.isFinite(lat) && Number.isFinite(lng) && map.current && mapLoaded) {
                                    map.current.flyTo({
                                      center: [lng, lat],
                                      zoom: 14,
                                      duration: 1500,
                                    });
                                  }
                                }}
                              >
                                <Navigation className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StationsPage;
