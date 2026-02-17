import { useState } from 'react';
import { format } from 'date-fns';
import { MaintenanceRecord } from '@/types/database';
import { useUpdateMaintenanceRecord } from '@/hooks/useMaintenance';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Bus, Calendar, DollarSign, Gauge, Wrench, Save } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceRecordDetailProps {
  record: MaintenanceRecord;
  onClose: () => void;
  isDialog?: boolean;
}

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function MaintenanceRecordDetail({ record, onClose, isDialog = true }: MaintenanceRecordDetailProps) {
  const updateRecord = useUpdateMaintenanceRecord();
  const [status, setStatus] = useState(record.status);
  const [notes, setNotes] = useState(record.notes || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as typeof record.status);
    setHasChanges(true);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateRecord.mutateAsync({
        id: record.id,
        status: status,
        notes: notes,
        completed_date: status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : record.completed_date,
      });
      setHasChanges(false);
      toast.success('Maintenance record updated');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  const content = (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{record.type}</h3>
            <p className="text-sm text-muted-foreground">
              Scheduled: {format(new Date(record.scheduled_date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        {getStatusBadge(status)}
      </div>

      {/* Vehicle Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bus className="h-4 w-4" />
            Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Registration</p>
            <p className="font-medium">{record.bus?.registration_number || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{record.bus?.model || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Maintenance Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Scheduled Date</p>
              <p className="font-medium">{format(new Date(record.scheduled_date), 'MMM d, yyyy')}</p>
            </div>
          </div>
          {record.completed_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Completed Date</p>
                <p className="font-medium">{format(new Date(record.completed_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          )}
          <div>
            <div>
              <p className="text-muted-foreground">Cost</p>
              <p className="font-medium">{formatCurrency(record.cost || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Odometer Reading</p>
              <p className="font-medium">{record.odometer_reading?.toLocaleString() || '-'} km</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {record.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{record.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Status Change */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Update Status</CardTitle>
          <CardDescription>Change the maintenance status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes about the maintenance work..."
              rows={3}
            />
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={updateRecord.isPending} className="w-full gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isDialog) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maintenance Record Details</DialogTitle>
            <DialogDescription>View and update maintenance record</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onClose} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Maintenance
      </Button>
      {content}
    </div>
  );
}
