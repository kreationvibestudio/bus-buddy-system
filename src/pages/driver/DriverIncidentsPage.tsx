import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDriverIncidents, useCreateIncident, CreateIncidentData } from '@/hooks/useDriverIncidents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Plus, 
  MapPin,
  Clock,
  Locate,
  Car,
  Fuel,
  Wrench,
  Users,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { sampleIncidents } from '@/data/sampleDriverData';

const INCIDENT_TYPES = [
  { value: 'accident', label: 'Accident', icon: Car },
  { value: 'breakdown', label: 'Breakdown', icon: Wrench },
  { value: 'fuel_issue', label: 'Fuel Issue', icon: Fuel },
  { value: 'passenger_issue', label: 'Passenger Issue', icon: Users },
  { value: 'traffic_delay', label: 'Traffic Delay', icon: Clock },
  { value: 'other', label: 'Other', icon: AlertCircle },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-muted text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'bg-warning text-warning-foreground' },
  { value: 'high', label: 'High', color: 'bg-destructive/80 text-destructive-foreground' },
  { value: 'critical', label: 'Critical', color: 'bg-destructive text-destructive-foreground' },
];

export default function DriverIncidentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripId, busId } = (location.state as { tripId?: string; busId?: string }) || {};
  
  const { data: incidents, isLoading } = useDriverIncidents();
  const createIncident = useCreateIncident();
  
  // Use sample data if no real incidents exist
  const displayIncidents = incidents && incidents.length > 0 
    ? incidents 
    : sampleIncidents as unknown as typeof incidents;
  const hasRealData = incidents && incidents.length > 0;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formData, setFormData] = useState<CreateIncidentData>({
    incident_type: '',
    description: '',
    severity: 'medium',
    bus_id: busId,
    trip_id: tripId,
    location_description: '',
    latitude: undefined,
    longitude: undefined,
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setIsGettingLocation(false);
        toast.success('Location captured');
      },
      (error) => {
        setIsGettingLocation(false);
        toast.error('Failed to get location: ' + error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.incident_type || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    await createIncident.mutateAsync(formData);
    setIsDialogOpen(false);
    setFormData({
      incident_type: '',
      description: '',
      severity: 'medium',
      bus_id: busId,
      trip_id: tripId,
      location_description: '',
      latitude: undefined,
      longitude: undefined,
    });
  };

  const getSeverityBadge = (severity: string) => {
    const option = SEVERITY_OPTIONS.find(s => s.value === severity);
    return (
      <Badge className={option?.color || 'bg-muted'}>
        {option?.label || severity}
      </Badge>
    );
  };

  const getIncidentIcon = (type: string) => {
    const incident = INCIDENT_TYPES.find(t => t.value === type);
    const Icon = incident?.icon || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-muted-foreground">Report and view incidents</p>
          {!hasRealData && displayIncidents && displayIncidents.length > 0 && (
            <Badge variant="outline" className="mt-2">Sample Data</Badge>
          )}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Report Incident
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Incident Type *</Label>
                <Select
                  value={formData.incident_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, incident_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe what happened..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Location Description</Label>
                <Input
                  placeholder="e.g., Near KM 45 marker"
                  value={formData.location_description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>GPS Coordinates</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                  >
                    <Locate className="h-4 w-4 mr-2" />
                    {isGettingLocation ? 'Getting...' : 'Get Location'}
                  </Button>
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="text-sm text-muted-foreground">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={createIncident.isPending}
              >
                {createIncident.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayIncidents && displayIncidents.length > 0 ? (
        <div className="space-y-4">
          {displayIncidents.map((incident) => (
            <Card key={incident.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-warning/10">
                      {getIncidentIcon(incident.incident_type)}
                    </div>
                    <div>
                      <p className="font-semibold capitalize">
                        {incident.incident_type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(incident.reported_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  {getSeverityBadge(incident.severity)}
                </div>

                <p className="text-sm mb-3">{incident.description}</p>

                {incident.location_description && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{incident.location_description}</span>
                  </div>
                )}

                {incident.bus && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Bus: {incident.bus.registration_number}
                    </span>
                  </div>
                )}

                {incident.status && (
                  <div className="mt-2">
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No incidents reported</h3>
            <p className="text-muted-foreground text-center">
              You haven't reported any incidents yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
