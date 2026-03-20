import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useJobCardWorkOrders, useUpdateWorkOrder } from '@/hooks/useMaintenance';
import { WorkOrder, WorkOrderStatus } from '@/types/database';
import { CreateWorkOrderDialog } from './CreateWorkOrderDialog';
import { EditWorkOrderDialog } from './EditWorkOrderDialog';
import { ClipboardList, Calendar, Loader2, Pencil } from 'lucide-react';
import { format } from 'date-fns';

interface WorkOrdersTabProps {
  jobCardId: string;
  busId: string;
}

const statusConfig: Record<WorkOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  assigned: { label: 'Assigned', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-600' },
  high: { label: 'High', className: 'bg-orange-500/20 text-orange-600' },
  urgent: { label: 'Urgent', className: 'bg-destructive/20 text-destructive' },
};

export function WorkOrdersTab({ jobCardId, busId }: WorkOrdersTabProps) {
  const { data: workOrders, isLoading } = useJobCardWorkOrders(jobCardId);
  const updateWorkOrder = useUpdateWorkOrder();
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);

  const handleStatusChange = async (workOrderId: string, newStatus: WorkOrderStatus) => {
    await updateWorkOrder.mutateAsync({
      id: workOrderId,
      status: newStatus,
      ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Work Orders</h3>
          <p className="text-sm text-muted-foreground">
            Manage work orders linked to this job card
          </p>
        </div>
        <CreateWorkOrderDialog jobCardId={jobCardId} busId={busId} />
      </div>

      {workOrders && workOrders.length > 0 ? (
        <div className="space-y-3">
          {workOrders.map((workOrder) => (
            <Card key={workOrder.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{workOrder.title}</h4>
                      <Badge variant={statusConfig[workOrder.status].variant}>
                        {statusConfig[workOrder.status].label}
                      </Badge>
                      <Badge className={priorityConfig[workOrder.priority || 'medium']?.className}>
                        {priorityConfig[workOrder.priority || 'medium']?.label}
                      </Badge>
                    </div>
                    {workOrder.description && (
                      <p className="text-sm text-muted-foreground">
                        {workOrder.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {format(new Date(workOrder.created_at), 'PP')}</span>
                      {workOrder.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {format(new Date(workOrder.due_date), 'PP')}
                        </span>
                      )}
                      {workOrder.completed_at && (
                        <span className="text-green-600">
                          Completed: {format(new Date(workOrder.completed_at), 'PP')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingWorkOrder(workOrder)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Select
                      value={workOrder.status}
                      onValueChange={(v) => handleStatusChange(workOrder.id, v as WorkOrderStatus)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 font-medium">No work orders yet</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Create work orders to track individual tasks for this job card
            </p>
            <CreateWorkOrderDialog jobCardId={jobCardId} busId={busId} />
          </CardContent>
        </Card>
      )}

      {editingWorkOrder && (
        <EditWorkOrderDialog
          workOrder={editingWorkOrder}
          open={!!editingWorkOrder}
          onOpenChange={(open) => !open && setEditingWorkOrder(null)}
        />
      )}
    </div>
  );
}
