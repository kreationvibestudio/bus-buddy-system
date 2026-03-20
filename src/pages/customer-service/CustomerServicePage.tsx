import { useState } from 'react';
import { useComplaints, useUpdateComplaint, useIncidents } from '@/hooks/useCustomerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, AlertTriangle, Search, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerServicePage() {
  const { data: complaints, isLoading: complaintsLoading } = useComplaints();
  const { data: incidents } = useIncidents();
  const updateComplaint = useUpdateComplaint();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [resolution, setResolution] = useState('');

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
      closed: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return <Badge variant={variants[priority || 'medium'] || 'outline'}>{priority || 'medium'}</Badge>;
  };

  const handleResolve = async () => {
    if (selectedComplaint) {
      await updateComplaint.mutateAsync({
        id: selectedComplaint.id,
        status: 'resolved',
        resolution,
        resolved_at: new Date().toISOString(),
      });
      setSelectedComplaint(null);
      setResolution('');
    }
  };

  const filteredComplaints = complaints?.filter(c =>
    c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (complaintsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Service</h1>
          <p className="text-muted-foreground">Handle complaints and incidents</p>
        </div>
      </div>

      <Tabs defaultValue="complaints" className="space-y-6">
        <TabsList>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complaints?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
                <div className="h-2 w-2 rounded-full bg-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complaints?.filter(c => c.status === 'open').length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complaints?.filter(c => c.status === 'in_progress').length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complaints?.filter(c => c.status === 'resolved').length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Complaints Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Customer Complaints</CardTitle>
                  <CardDescription>Review and resolve complaints</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search complaints..."
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
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints?.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.subject}</TableCell>
                      <TableCell className="capitalize">{complaint.category || '-'}</TableCell>
                      <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                      <TableCell>{format(new Date(complaint.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedComplaint(complaint)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredComplaints?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No complaints found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Complaint Detail Dialog */}
          <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Complaint Details</DialogTitle>
                <DialogDescription>{selectedComplaint?.subject}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {getStatusBadge(selectedComplaint?.status)}
                  {getPriorityBadge(selectedComplaint?.priority)}
                  <Badge variant="outline">{selectedComplaint?.category}</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {selectedComplaint?.description || 'No description provided'}
                  </p>
                </div>
                {selectedComplaint?.status !== 'resolved' && selectedComplaint?.status !== 'closed' && (
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Textarea
                      id="resolution"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Describe how the issue was resolved..."
                    />
                  </div>
                )}
                {selectedComplaint?.resolution && (
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                      {selectedComplaint.resolution}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
                  Close
                </Button>
                {selectedComplaint?.status !== 'resolved' && selectedComplaint?.status !== 'closed' && (
                  <Button onClick={handleResolve} disabled={updateComplaint.isPending || !resolution}>
                    Mark as Resolved
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
              <CardDescription>Driver-reported incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reported At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents?.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium capitalize">{incident.incident_type.replace('_', ' ')}</TableCell>
                      <TableCell className="max-w-xs truncate">{incident.description}</TableCell>
                      <TableCell>
                        <Badge variant={incident.severity === 'critical' || incident.severity === 'high' ? 'destructive' : 'outline'}>
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(incident.reported_at), 'MMM d, yyyy HH:mm')}</TableCell>
                      <TableCell>{getStatusBadge(incident.status || 'open')}</TableCell>
                    </TableRow>
                  ))}
                  {incidents?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No incidents reported
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
