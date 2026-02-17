import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrivers, useUpdateDriver } from '@/hooks/useDrivers';
import { useUpdateProfile } from '@/hooks/useUsers';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, Search, Edit, Star, Copy, CheckCircle, Trash2, AlertTriangle, Wrench, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrphanedDriverUser {
  user_id: string;
  full_name: string;
  email: string;
}

export default function DriversPage() {
  const navigate = useNavigate();
  const { data: drivers, isLoading } = useDrivers();
  const updateDriver = useUpdateDriver();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  // Credentials stored only from local form state for one-time display, never from API response
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; fullName: string } | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Orphaned driver users state
  const [orphanedUsers, setOrphanedUsers] = useState<OrphanedDriverUser[]>([]);
  const [isCheckingOrphans, setIsCheckingOrphans] = useState(false);
  const [isFixingOrphan, setIsFixingOrphan] = useState<string | null>(null);
  const [showOrphanDialog, setShowOrphanDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    status: 'active',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
  });

  const filteredDrivers = drivers?.filter(driver =>
    driver.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      on_leave: 'secondary',
      inactive: 'destructive',
    };
    return <Badge variant={variants[status || 'inactive'] || 'secondary'}>{status || 'unknown'}</Badge>;
  };

  // Check for orphaned driver users on mount
  useEffect(() => {
    checkForOrphanedDrivers();
  }, []);

  const checkForOrphanedDrivers = async () => {
    setIsCheckingOrphans(true);
    try {
      // Get all users with driver role
      const { data: driverRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver');

      if (rolesError) throw rolesError;

      if (!driverRoles || driverRoles.length === 0) {
        setOrphanedUsers([]);
        return;
      }

      // Get all driver records with user_id
      const { data: driverRecords, error: driversError } = await supabase
        .from('drivers')
        .select('user_id')
        .not('user_id', 'is', null);

      if (driversError) throw driversError;

      const linkedUserIds = new Set(driverRecords?.map(d => d.user_id) || []);
      const orphanedUserIds = driverRoles
        .map(r => r.user_id)
        .filter(userId => !linkedUserIds.has(userId));

      if (orphanedUserIds.length === 0) {
        setOrphanedUsers([]);
        return;
      }

      // Get profile info for orphaned users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', orphanedUserIds);

      if (profilesError) throw profilesError;

      setOrphanedUsers(profiles || []);
    } catch (error) {
      console.error('Error checking for orphaned drivers:', error);
    } finally {
      setIsCheckingOrphans(false);
    }
  };

  const fixOrphanedDriver = async (userId: string) => {
    setIsFixingOrphan(userId);
    try {
      // Create a driver record for this user
      const { error } = await supabase
        .from('drivers')
        .insert({
          user_id: userId,
          license_number: 'DL-PENDING-' + userId.substring(0, 8).toUpperCase(),
          license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
        });

      if (error) throw error;

      toast.success('Driver profile created successfully');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      await checkForOrphanedDrivers();
    } catch (error) {
      console.error('Error fixing orphaned driver:', error);
      toast.error('Failed to create driver profile: ' + (error as Error).message);
    } finally {
      setIsFixingOrphan(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDriver) {
      // Update existing driver
      try {
        // Update driver record
        await updateDriver.mutateAsync({ 
          id: editingDriver.id,
          license_number: formData.license_number,
          license_expiry: formData.license_expiry,
          status: formData.status,
          address: formData.address,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone,
        });
        
        // If driver has user_id, update profile
        if (editingDriver.user_id) {
          await updateProfile.mutateAsync({
            userId: editingDriver.user_id,
            data: {
              full_name: formData.full_name,
              phone: formData.phone || null,
            },
          });
          setIsDialogOpen(false);
          resetForm();
        } else if (formData.email && formData.password) {
          // Driver has no user_id - create account and link it
          setIsCreating(true);
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error('You must be logged in to create accounts');
            setIsCreating(false);
            return;
          }

          const response = await supabase.functions.invoke('link-driver-account', {
            body: {
              driver_id: editingDriver.id,
              email: formData.email,
              password: formData.password,
              full_name: formData.full_name,
              phone: formData.phone || undefined,
            },
          });

          if (response.error) {
            throw new Error(response.error.message || 'Failed to create account');
          }

          if (response.data?.error) {
            throw new Error(response.data.error);
          }

          // Store credentials for display
          const credentialsForDisplay = {
            email: formData.email,
            password: formData.password,
            fullName: formData.full_name,
          };
          setCreatedCredentials(credentialsForDisplay);
          
          queryClient.invalidateQueries({ queryKey: ['drivers'] });
          toast.success('Account created and linked successfully');
          setIsDialogOpen(false);
          setShowCredentials(true);
          resetForm();
          setIsCreating(false);
        } else {
          // No user_id and no email/password provided - just close
          setIsDialogOpen(false);
          resetForm();
        }
      } catch (error) {
        console.error('Update driver error:', error);
        toast.error((error as Error).message || 'Failed to update driver');
        setIsCreating(false);
      }
    } else {
      // Create new driver with user account
      setIsCreating(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('You must be logged in to create drivers');
          return;
        }

        const response = await supabase.functions.invoke('create-driver-user', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            phone: formData.phone || undefined,
            license_number: formData.license_number,
            license_expiry: formData.license_expiry,
            address: formData.address || undefined,
            emergency_contact: formData.emergency_contact || undefined,
            emergency_phone: formData.emergency_phone || undefined,
            status: formData.status,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to create driver');
        }

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        // Store credentials from form state for one-time display
        const credentialsForDisplay = {
          email: formData.email,
          password: formData.password,
          fullName: formData.full_name,
        };
        setCreatedCredentials(credentialsForDisplay);
        
        queryClient.invalidateQueries({ queryKey: ['drivers'] });
        
        toast.success('Driver created successfully');
        setIsDialogOpen(false);
        setShowCredentials(true);
        resetForm();
      } catch (error) {
        console.error('Create driver error:', error);
        toast.error((error as Error).message || 'Failed to create driver');
      } finally {
        setIsCreating(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      license_number: '',
      license_expiry: '',
      status: 'active',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
    });
    setEditingDriver(null);
  };

  const openEditDialog = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      email: '',
      password: '',
      full_name: driver.profile?.full_name || '',
      phone: driver.profile?.phone || '',
      license_number: driver.license_number,
      license_expiry: driver.license_expiry,
      status: driver.status || 'active',
      address: driver.address || '',
      emergency_contact: driver.emergency_contact || '',
      emergency_phone: driver.emergency_phone || '',
    });
    setIsDialogOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to delete drivers');
        return;
      }

      const response = await supabase.functions.invoke('delete-driver-user', {
        body: { driver_id: driverToDelete.id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete driver');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver deleted successfully');
      setDriverToDelete(null);
    } catch (error) {
      console.error('Delete driver error:', error);
      toast.error((error as Error).message || 'Failed to delete driver');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading drivers data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Orphaned Driver Alert */}
      {orphanedUsers.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-warning-foreground">
              <AlertTriangle className="h-4 w-4" />
              Orphaned Driver Accounts Detected
            </CardTitle>
            <CardDescription>
              {orphanedUsers.length} user(s) have the driver role but no linked driver profile. They cannot use the Driver App.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowOrphanDialog(true)}
              className="gap-2"
            >
              <Wrench className="h-4 w-4" />
              Fix Orphaned Accounts
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
          <p className="text-muted-foreground">Manage your drivers and their information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
              <DialogDescription>
                {editingDriver ? 'Update driver details' : 'Create a driver account with login credentials'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Details - Only show for new drivers */}
              {!editingDriver && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-sm">Login Credentials</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="driver@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 6 characters"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0803 123 4567"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Details */}
              <div className="space-y-4">
              {editingDriver && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-sm">Profile Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_full_name">Full Name *</Label>
                        <Input
                          id="edit_full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_phone">Phone</Label>
                        <Input
                          id="edit_phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="0803 123 4567"
                        />
                      </div>
                    </div>
                    
                    {/* Show account creation fields if driver has no user_id */}
                    {!editingDriver.user_id && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="font-semibold text-sm text-primary mb-3">Create Login Account</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          This driver doesn't have a login account. Create one so they can use the Driver App.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="link_email">Email *</Label>
                            <Input
                              id="link_email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="driver@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="link_password">Password *</Label>
                            <Input
                              id="link_password"
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              placeholder="Min 6 characters"
                              minLength={6}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!editingDriver && <h3 className="font-semibold text-sm">Driver Details</h3>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license">License Number *</Label>
                    <Input
                      id="license"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      placeholder="LAG-12345678"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_expiry">License Expiry *</Label>
                    <Input
                      id="license_expiry"
                      type="date"
                      value={formData.license_expiry}
                      onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="15 Awolowo Road, Ikeja, Lagos"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact">Emergency Contact</Label>
                    <Input
                      id="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                      placeholder="Full Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Emergency Phone</Label>
                    <Input
                      id="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                      placeholder="0803 123 4567"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || updateDriver.isPending || updateProfile.isPending}>
                  {isCreating || updateProfile.isPending ? 'Saving...' : editingDriver ? 'Update Driver' : 'Create Driver'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Driver Created Successfully
            </DialogTitle>
            <DialogDescription>
              Share these login credentials with {createdCredentials?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background px-3 py-2 rounded border text-sm">
                  {createdCredentials?.email}
                </code>
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => copyToClipboard(createdCredentials?.email || '', 'Email')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Password</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background px-3 py-2 rounded border text-sm">
                  {createdCredentials?.password}
                </code>
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => copyToClipboard(createdCredentials?.password || '', 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>⚠️ <strong>Important:</strong> Copy these credentials now. For security, they will not be shown again.</p>
            <p>The driver can use these credentials to log in to the app.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => { 
              // Clear credentials from memory immediately after closing
              setShowCredentials(false); 
              setCreatedCredentials(null); 
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers?.filter(d => d.status === 'active').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers?.filter(d => d.status === 'on_leave').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {drivers?.length ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Drivers</CardTitle>
              <CardDescription>Driver roster and details</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>License #</TableHead>
                <TableHead>License Expiry</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Total Trips</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers?.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell 
                    className="font-medium cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/drivers/${driver.id}`)}
                  >
                    {driver.profile?.full_name || '-'}
                    {driver.profile?.email && (
                      <div className="text-xs text-muted-foreground">{driver.profile.email}</div>
                    )}
                  </TableCell>
                  <TableCell>{driver.license_number}</TableCell>
                  <TableCell>{format(new Date(driver.license_expiry), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {driver.rating?.toFixed(1) || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{driver.total_trips || 0}</TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(`/drivers/${driver.id}`)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(driver)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDriverToDelete(driver)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDrivers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No drivers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!driverToDelete} onOpenChange={(open) => !open && setDriverToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {driverToDelete?.profile?.full_name || 'this driver'}? 
              This will permanently remove the driver record and their user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDriver}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Driver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Orphaned Drivers Fix Dialog */}
      <Dialog open={showOrphanDialog} onOpenChange={setShowOrphanDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Fix Orphaned Driver Accounts
            </DialogTitle>
            <DialogDescription>
              These users have the 'driver' role but no linked driver profile with license information.
              Create a placeholder driver profile for them to allow access to the Driver App.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {orphanedUsers.map((user) => (
              <div 
                key={user.user_id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => fixOrphanedDriver(user.user_id)}
                  disabled={isFixingOrphan === user.user_id}
                >
                  {isFixingOrphan === user.user_id ? 'Creating...' : 'Create Profile'}
                </Button>
              </div>
            ))}
            
            {orphanedUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>All driver accounts are properly linked!</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrphanDialog(false)}>
              Close
            </Button>
            <Button 
              variant="secondary" 
              onClick={checkForOrphanedDrivers}
              disabled={isCheckingOrphans}
            >
              {isCheckingOrphans ? 'Checking...' : 'Refresh'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
