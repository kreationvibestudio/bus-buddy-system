import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDriverDetail, useDriverTrips, useDriverIncidents } from '@/hooks/useDriverDetail';
import { useDriverLeavesById, useCreateLeave, useUpdateLeaveStatus, useDeleteLeave } from '@/hooks/useDriverLeaves';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  Car,
  AlertTriangle,
  Clock,
  IdCard,
  Shield,
  CheckCircle,
  XCircle,
  Plus,
  CalendarDays,
  Timer
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: driver, isLoading: driverLoading } = useDriverDetail(id || '');
  const { data: trips, isLoading: tripsLoading } = useDriverTrips(id || '');
  const { data: incidents, isLoading: incidentsLoading } = useDriverIncidents(id || '');
  const { data: leaves, isLoading: leavesLoading } = useDriverLeavesById(id || '');
  
  const createLeave = useCreateLeave();
  const updateLeaveStatus = useUpdateLeaveStatus();
  const deleteLeave = useDeleteLeave();
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  if (driverLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/drivers')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Drivers
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Driver not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      on_leave: 'secondary',
      inactive: 'destructive',
    };
    return <Badge variant={variants[status || 'inactive'] || 'secondary'}>{status || 'unknown'}</Badge>;
  };

  const getTripStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      scheduled: { variant: 'outline', label: 'Scheduled' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'secondary', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = statusConfig[status || 'scheduled'] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      critical: 'destructive',
    };
    return <Badge variant={variants[severity] || 'outline'}>{severity}</Badge>;
  };

  const getLeaveStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
      completed: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const initials = driver.profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'DR';

  const completedTrips = trips?.filter(t => t.status === 'completed').length || 0;
  const totalTrips = trips?.length || 0;
  
  // Find active leave
  const activeLeave = leaves?.find(l => l.is_active);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    await createLeave.mutateAsync({
      driver_id: id,
      leave_type: leaveForm.leave_type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      reason: leaveForm.reason || undefined,
      status: 'approved', // Admin creates as approved
    });
    
    setShowLeaveDialog(false);
    setLeaveForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
  };

  const handleApproveLeave = async (leaveId: string) => {
    if (!user?.id) return;
    await updateLeaveStatus.mutateAsync({ leaveId, status: 'approved', approvedBy: user.id });
  };

  const handleRejectLeave = async (leaveId: string) => {
    if (!user?.id) return;
    await updateLeaveStatus.mutateAsync({ leaveId, status: 'rejected', approvedBy: user.id });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/drivers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <Avatar className="h-16 w-16">
            <AvatarImage src={driver.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{driver.profile?.full_name || 'Unknown Driver'}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <IdCard className="h-4 w-4" />
              <span>{driver.license_number}</span>
              {getStatusBadge(driver.status)}
              {activeLeave && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Timer className="h-3 w-3 mr-1" />
                  {activeLeave.days_remaining} days left
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Leave Alert */}
      {activeLeave && (
        <Card className="border-info bg-info/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-info" />
                <div>
                  <p className="font-medium">Currently on {activeLeave.leave_type} leave</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(activeLeave.start_date), 'MMM d, yyyy')} - {format(parseISO(activeLeave.end_date), 'MMM d, yyyy')}
                    {' '}({activeLeave.days_total} days total, {activeLeave.days_remaining} remaining)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{driver.total_trips || totalTrips}</p>
                <p className="text-sm text-muted-foreground">Total Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{completedTrips}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{driver.rating?.toFixed(1) || '5.0'}</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{incidents?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{driver.profile?.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{driver.profile?.phone || 'No phone'}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{driver.address || 'No address'}</span>
            </div>
            {driver.date_of_birth && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Born: {format(new Date(driver.date_of_birth), 'MMM d, yyyy')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* License Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IdCard className="h-4 w-4" />
              License Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">License Number:</span>
              <p className="font-medium">{driver.license_number}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Expiry Date:</span>
              <p className="font-medium flex items-center gap-2">
                {format(new Date(driver.license_expiry), 'MMM d, yyyy')}
                {new Date(driver.license_expiry) < new Date() && (
                  <Badge variant="destructive" className="text-xs">Expired</Badge>
                )}
              </p>
            </div>
            {driver.hire_date && (
              <div className="text-sm">
                <span className="text-muted-foreground">Hire Date:</span>
                <p className="font-medium">{format(new Date(driver.hire_date), 'MMM d, yyyy')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Contact Name:</span>
              <p className="font-medium">{driver.emergency_contact || 'Not provided'}</p>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Contact Phone:</span>
              <p className="font-medium">{driver.emergency_phone || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Trip History, Incidents, and Leaves */}
      <Tabs defaultValue="trips" className="w-full">
        <TabsList>
          <TabsTrigger value="trips" className="gap-2">
            <Car className="h-4 w-4" />
            Trip History
            {trips && <Badge variant="secondary" className="ml-1">{trips.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidents
            {incidents && <Badge variant="secondary" className="ml-1">{incidents.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="leaves" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Leave History
            {leaves && <Badge variant="secondary" className="ml-1">{leaves.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          <Card>
            <CardHeader>
              <CardTitle>Trip History</CardTitle>
              <CardDescription>All trips assigned to this driver</CardDescription>
            </CardHeader>
            <CardContent>
              {tripsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : trips && trips.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Bus</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-medium">
                            {format(new Date(trip.trip_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {trip.route ? (
                              <div>
                                <p className="font-medium">{trip.route.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {trip.route.origin} → {trip.route.destination}
                                </p>
                              </div>
                            ) : (
                              'Unknown Route'
                            )}
                          </TableCell>
                          <TableCell>
                            {trip.bus ? (
                              <div>
                                <p className="font-medium">{trip.bus.registration_number}</p>
                                <p className="text-xs text-muted-foreground">{trip.bus.model}</p>
                              </div>
                            ) : (
                              'Unassigned'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {trip.departure_time.slice(0, 5)} - {trip.arrival_time.slice(0, 5)}
                            </div>
                          </TableCell>
                          <TableCell>{getTripStatusBadge(trip.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No trips found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>Incidents reported by or involving this driver</CardDescription>
            </CardHeader>
            <CardContent>
              {incidentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : incidents && incidents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell className="font-medium">
                            {format(new Date(incident.reported_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium capitalize">{incident.incident_type.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{incident.description}</p>
                          </TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {incident.location_description || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={incident.status === 'resolved' ? 'secondary' : 'outline'}>
                              {incident.status || 'open'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No incidents found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Leave History</CardTitle>
                <CardDescription>All leave records for this driver</CardDescription>
              </div>
              <Button onClick={() => setShowLeaveDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Leave
              </Button>
            </CardHeader>
            <CardContent>
              {leavesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : leaves && leaves.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((leave) => (
                        <TableRow key={leave.id} className={leave.is_active ? 'bg-info/5' : ''}>
                          <TableCell className="font-medium capitalize">
                            {leave.leave_type}
                            {leave.is_active && (
                              <Badge variant="outline" className="ml-2 text-xs">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(leave.start_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(leave.end_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{leave.days_total} days</span>
                              {leave.is_active && (
                                <span className="text-xs text-info font-medium">
                                  {leave.days_remaining} days remaining
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getLeaveStatusBadge(leave.status)}</TableCell>
                          <TableCell>
                            {leave.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs"
                                  onClick={() => handleApproveLeave(leave.id)}
                                  disabled={updateLeaveStatus.isPending}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs text-destructive"
                                  onClick={() => handleRejectLeave(leave.id)}
                                  disabled={updateLeaveStatus.isPending}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {leave.status !== 'pending' && leave.is_expired && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 text-xs text-destructive"
                                onClick={() => deleteLeave.mutate(leave.id)}
                                disabled={deleteLeave.isPending}
                              >
                                Delete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No leave records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Leave for {driver.profile?.full_name}</DialogTitle>
            <DialogDescription>
              Create a new leave record for this driver
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLeave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leave_type">Leave Type</Label>
              <Select 
                value={leaveForm.leave_type} 
                onValueChange={(value) => setLeaveForm({ ...leaveForm, leave_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  <SelectItem value="maternity">Maternity Leave</SelectItem>
                  <SelectItem value="paternity">Paternity Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  min={leaveForm.start_date}
                  required
                />
              </div>
            </div>
            {leaveForm.start_date && leaveForm.end_date && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                Duration: {differenceInDays(parseISO(leaveForm.end_date), parseISO(leaveForm.start_date)) + 1} days
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Enter reason for leave..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLeaveDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLeave.isPending}>
                {createLeave.isPending ? 'Creating...' : 'Create Leave'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
