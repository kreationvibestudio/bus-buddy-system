import { useState } from 'react';
import { useRoutes, useCreateRoute, useUpdateRoute, useStations, useCreateStation } from '@/hooks/useRoutes';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Route, MapPin, Search, Edit, Clock, DollarSign } from 'lucide-react';

export default function RoutesPage() {
  const { data: routes, isLoading: routesLoading } = useRoutes();
  const { data: stations, isLoading: stationsLoading } = useStations();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const createStation = useCreateStation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isStationDialogOpen, setIsStationDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  
  const [routeForm, setRouteForm] = useState({
    name: '',
    origin: '',
    destination: '',
    base_fare: 0,
    distance_km: 0,
    estimated_duration_minutes: 0,
    is_active: true,
  });

  const [stationForm, setStationForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    latitude: 0,
    longitude: 0,
    is_active: true,
  });

  const filteredRoutes = routes?.filter(route =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await updateRoute.mutateAsync({ id: editingRoute.id, ...routeForm });
      } else {
        await createRoute.mutateAsync(routeForm);
      }
      setIsRouteDialogOpen(false);
      resetRouteForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStation.mutateAsync(stationForm);
      setIsStationDialogOpen(false);
      resetStationForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetRouteForm = () => {
    setRouteForm({
      name: '',
      origin: '',
      destination: '',
      base_fare: 0,
      distance_km: 0,
      estimated_duration_minutes: 0,
      is_active: true,
    });
    setEditingRoute(null);
  };

  const resetStationForm = () => {
    setStationForm({
      name: '',
      code: '',
      address: '',
      city: '',
      latitude: 0,
      longitude: 0,
      is_active: true,
    });
  };

  const openEditRouteDialog = (route: any) => {
    setEditingRoute(route);
    setRouteForm({
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      base_fare: route.base_fare,
      distance_km: route.distance_km || 0,
      estimated_duration_minutes: route.estimated_duration_minutes || 0,
      is_active: route.is_active ?? true,
    });
    setIsRouteDialogOpen(true);
  };

  if (routesLoading || stationsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes & Stations</h1>
          <p className="text-muted-foreground">Manage bus routes and station locations</p>
        </div>
      </div>

      <Tabs defaultValue="routes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="stations">Stations</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
                <Route className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routes?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routes?.filter(r => r.is_active).length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routes?.reduce((sum, r) => sum + (r.distance_km || 0), 0)} km</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Fare</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(routes?.length ? routes.reduce((sum, r) => sum + r.base_fare, 0) / routes.length : 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Routes Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>All Routes</CardTitle>
                  <CardDescription>Manage your bus routes</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search routes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Dialog open={isRouteDialogOpen} onOpenChange={(open) => { setIsRouteDialogOpen(open); if (!open) resetRouteForm(); }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Route
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
                        <DialogDescription>Configure route details</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRouteSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Route Name</Label>
                          <Input
                            id="name"
                            value={routeForm.name}
                            onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                            placeholder="Express Route A"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="origin">Origin</Label>
                            <Input
                              id="origin"
                              value={routeForm.origin}
                              onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                              placeholder="Lagos"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="destination">Destination</Label>
                            <Input
                              id="destination"
                              value={routeForm.destination}
                              onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                              placeholder="Abuja"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="base_fare">Base Fare (₦)</Label>
                            <Input
                              id="base_fare"
                              type="number"
                              step="0.01"
                              value={routeForm.base_fare}
                              onChange={(e) => setRouteForm({ ...routeForm, base_fare: parseFloat(e.target.value) })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="distance">Distance (km)</Label>
                            <Input
                              id="distance"
                              type="number"
                              value={routeForm.distance_km}
                              onChange={(e) => setRouteForm({ ...routeForm, distance_km: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="duration">Duration (min)</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={routeForm.estimated_duration_minutes}
                              onChange={(e) => setRouteForm({ ...routeForm, estimated_duration_minutes: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_active"
                            checked={routeForm.is_active}
                            onCheckedChange={(checked) => setRouteForm({ ...routeForm, is_active: checked })}
                          />
                          <Label htmlFor="is_active">Active Route</Label>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => { setIsRouteDialogOpen(false); resetRouteForm(); }}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createRoute.isPending || updateRoute.isPending}>
                            {editingRoute ? 'Update' : 'Create'} Route
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Base Fare</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes?.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell>{route.origin}</TableCell>
                      <TableCell>{route.destination}</TableCell>
                      <TableCell>{route.distance_km} km</TableCell>
                      <TableCell>{route.estimated_duration_minutes} min</TableCell>
                      <TableCell>{formatCurrency(route.base_fare)}</TableCell>
                      <TableCell>
                        <Badge variant={route.is_active ? 'default' : 'secondary'}>
                          {route.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditRouteDialog(route)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Stations</CardTitle>
                  <CardDescription>Reusable station locations</CardDescription>
                </div>
                <Dialog open={isStationDialogOpen} onOpenChange={setIsStationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Station
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Station</DialogTitle>
                      <DialogDescription>Create a new station location</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleStationSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="station_name">Station Name</Label>
                          <Input
                            id="station_name"
                            value={stationForm.name}
                            onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                            placeholder="Central Bus Terminal"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="code">Code</Label>
                          <Input
                            id="code"
                            value={stationForm.code}
                            onChange={(e) => setStationForm({ ...stationForm, code: e.target.value })}
                            placeholder="CBT"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={stationForm.address}
                          onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={stationForm.city}
                          onChange={(e) => setStationForm({ ...stationForm, city: e.target.value })}
                          placeholder="Ikeja"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="station_active"
                          checked={stationForm.is_active}
                          onCheckedChange={(checked) => setStationForm({ ...stationForm, is_active: checked })}
                        />
                        <Label htmlFor="station_active">Active Station</Label>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsStationDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createStation.isPending}>
                          Create Station
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations?.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">{station.name}</TableCell>
                      <TableCell>{station.code || '-'}</TableCell>
                      <TableCell>{station.address || '-'}</TableCell>
                      <TableCell>{station.city || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={station.is_active ? 'default' : 'secondary'}>
                          {station.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
