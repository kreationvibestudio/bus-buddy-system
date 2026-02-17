import { useState } from 'react';
import { useMaintenanceRecords, useCreateMaintenanceRecord, useWorkOrders } from '@/hooks/useMaintenance';
import { useBuses } from '@/hooks/useBuses';
import { MaintenanceRecord } from '@/types/database';
import { MaintenanceRecordDetail } from '@/components/maintenance/MaintenanceRecordDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Wrench, Search, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

export default function MaintenancePage() {
  const { data: records, isLoading: recordsLoading } = useMaintenanceRecords();
  const { data: workOrders } = useWorkOrders();
  const { data: buses } = useBuses();
  const createRecord = useCreateMaintenanceRecord();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const [form, setForm] = useState({
    bus_id: '',
    type: '',
    description: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'scheduled' as const,
    cost: 0,
    odometer_reading: 0,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRecord.mutateAsync(form);
      setIsDialogOpen(false);
      setForm({
        bus_id: '',
        type: '',
        description: '',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'scheduled' as const,
        cost: 0,
        odometer_reading: 0,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredRecords = records?.filter(record =>
    record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.bus?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (recordsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  const totalCost = records?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Record Detail Dialog */}
      {selectedRecord && (
        <MaintenanceRecordDetail 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">Manage bus maintenance and work orders</p>
        </div>
      </div>

      <Tabs defaultValue="records" className="space-y-6">
        <TabsList>
          <TabsTrigger value="records">Maintenance Records</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{records?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{records?.filter(r => r.status === 'scheduled').length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{records?.filter(r => r.status === 'in_progress').length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Maintenance Records</CardTitle>
                  <CardDescription>All maintenance history</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Schedule Maintenance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Maintenance</DialogTitle>
                        <DialogDescription>Create a new maintenance record</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="bus">Bus</Label>
                          <Select value={form.bus_id} onValueChange={(value) => setForm({ ...form, bus_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bus" />
                            </SelectTrigger>
                            <SelectContent>
                              {buses?.map((bus) => (
                                <SelectItem key={bus.id} value={bus.id}>
                                  {bus.registration_number} - {bus.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Oil Change">Oil Change</SelectItem>
                                <SelectItem value="Tire Rotation">Tire Rotation</SelectItem>
                                <SelectItem value="Brake Service">Brake Service</SelectItem>
                                <SelectItem value="Full Service">Full Service</SelectItem>
                                <SelectItem value="Engine Repair">Engine Repair</SelectItem>
                                <SelectItem value="Inspection">Inspection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="scheduled_date">Scheduled Date</Label>
                            <Input
                              id="scheduled_date"
                              type="date"
                              value={form.scheduled_date}
                              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe the maintenance work..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cost">Estimated Cost ($)</Label>
                            <Input
                              id="cost"
                              type="number"
                              step="0.01"
                              value={form.cost}
                              onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="odometer">Odometer Reading</Label>
                            <Input
                              id="odometer"
                              type="number"
                              value={form.odometer_reading}
                              onChange={(e) => setForm({ ...form, odometer_reading: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createRecord.isPending}>
                            Schedule
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
                    <TableHead>Bus</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords?.map((record) => (
                    <TableRow 
                      key={record.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <TableCell className="font-medium">{record.bus?.registration_number || '-'}</TableCell>
                      <TableCell>{record.type}</TableCell>
                      <TableCell>{format(new Date(record.scheduled_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{record.cost ? formatCurrency(record.cost) : '₦0.00'}</TableCell>
                      <TableCell>{record.odometer_reading?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
              <CardDescription>
                All work orders across job cards. To create or edit work orders, go to the linked job card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Job Card</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.title}</TableCell>
                      <TableCell>{order.bus?.registration_number || '-'}</TableCell>
                      <TableCell>
                        {order.job_card_id ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            Linked
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.priority === 'high' || order.priority === 'urgent' ? 'destructive' : 'outline'}>
                          {order.priority || 'medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.due_date ? format(new Date(order.due_date), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                    </TableRow>
                  ))}
                  {workOrders?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No work orders found. Work orders are created within job cards.
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
