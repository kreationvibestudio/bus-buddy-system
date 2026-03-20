import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  JobCard, 
  JobCardStatus, 
  useUpdateJobCard, 
  useVehicleInspections,
  useJobCardFaults 
} from '@/hooks/useJobCards';
import { useJobCardWorkOrders } from '@/hooks/useMaintenance';
import { VehicleInspectionForm } from './VehicleInspectionForm';
import { FaultLogSection } from './FaultLogSection';
import { WorkOrdersTab } from './WorkOrdersTab';
import { 
  ArrowLeft, 
  Car, 
  User, 
  FileText, 
  ClipboardCheck, 
  AlertTriangle,
  Wrench,
  Clock,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';

interface JobCardDetailProps {
  jobCard: JobCard;
  onBack: () => void;
}

const statusConfig: Record<JobCardStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  inspection_complete: { label: 'Inspected', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  awaiting_parts: { label: 'Awaiting Parts', variant: 'destructive' },
  completed: { label: 'Completed', variant: 'outline' },
  closed: { label: 'Closed', variant: 'secondary' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-600' },
  high: { label: 'High', className: 'bg-orange-500/20 text-orange-600' },
  urgent: { label: 'Urgent', className: 'bg-destructive/20 text-destructive' },
};

export function JobCardDetail({ jobCard, onBack }: JobCardDetailProps) {
  const updateJobCard = useUpdateJobCard();
  const { data: inspections } = useVehicleInspections(jobCard.id);
  const { data: faults } = useJobCardFaults(jobCard.id);
  const { data: workOrders } = useJobCardWorkOrders(jobCard.id);
  const [activeTab, setActiveTab] = useState('overview');

  const hasInspection = inspections && inspections.length > 0;
  const preWorkInspection = inspections?.find(i => i.inspection_type === 'pre_work');

  const handleStatusChange = async (newStatus: JobCardStatus) => {
    await updateJobCard.mutateAsync({
      id: jobCard.id,
      status: newStatus,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{jobCard.job_card_number}</h1>
              <Badge variant={statusConfig[jobCard.status].variant}>
                {statusConfig[jobCard.status].label}
              </Badge>
              <Badge className={priorityConfig[jobCard.priority]?.className || ''}>
                {priorityConfig[jobCard.priority]?.label || jobCard.priority}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {jobCard.buses?.registration_number} - {jobCard.buses?.manufacturer} {jobCard.buses?.model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={jobCard.status} onValueChange={(v) => handleStatusChange(v as JobCardStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="inspection_complete">Inspection Complete</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="inspection" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Inspection
            {hasInspection && <CheckCircle2 className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="faults" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Faults
            {faults && faults.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {faults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="work-orders" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Work Orders
            {workOrders && workOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {workOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Vehicle Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Registration</p>
                  <p className="font-medium">{jobCard.buses?.registration_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{jobCard.buses?.manufacturer} {jobCard.buses?.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Odometer at Intake</p>
                  <p className="font-medium">{jobCard.odometer_reading.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(jobCard.created_at), 'PPp')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Reason for Visit</p>
                <p className="font-medium">{jobCard.reason_for_visit}</p>
              </div>
              {jobCard.customer_complaint && (
                <div>
                  <p className="text-sm text-muted-foreground">Customer/Driver Complaint</p>
                  <p>{jobCard.customer_complaint}</p>
                </div>
              )}
              {jobCard.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{jobCard.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Inspection Status</CardDescription>
                <CardTitle className="text-lg">
                  {hasInspection ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      Pending
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Faults Logged</CardDescription>
                <CardTitle className="text-lg">{faults?.length || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Labor Hours</CardDescription>
                <CardTitle className="text-lg">{jobCard.total_labor_hours}h</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inspection" className="space-y-6">
          {hasInspection ? (
            <Card>
              <CardHeader>
                <CardTitle>Pre-Work Inspection</CardTitle>
                <CardDescription>
                  Completed on {format(new Date(preWorkInspection?.inspected_at || ''), 'PPp')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Level</p>
                    <p className="font-medium">{preWorkInspection?.fuel_level || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lights</p>
                    <p className="font-medium">{preWorkInspection?.lights_working ? '✓ Working' : '✗ Issues'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horn</p>
                    <p className="font-medium">{preWorkInspection?.horn_working ? '✓ Working' : '✗ Issues'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wipers</p>
                    <p className="font-medium">{preWorkInspection?.wipers_working ? '✓ Working' : '✗ Issues'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 font-medium">Tire Conditions</h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {(['tire_front_left', 'tire_front_right', 'tire_rear_left', 'tire_rear_right'] as const).map((tire) => {
                      const tireData = preWorkInspection?.[tire];
                      return (
                        <div key={tire} className="rounded border p-2">
                          <p className="text-xs text-muted-foreground">
                            {tire.replace('tire_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="font-medium capitalize">{tireData?.condition || 'N/A'}</p>
                          {tireData?.pressure && <p className="text-xs">Pressure: {tireData.pressure} PSI</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {preWorkInspection?.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="mb-1 font-medium">Notes</h4>
                      <p className="text-sm text-muted-foreground">{preWorkInspection.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>
              <Card className="mb-6">
                <CardContent className="py-6 text-center">
                  <ClipboardCheck className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="mb-2 font-medium">No inspection recorded yet</p>
                  <p className="text-sm text-muted-foreground">
                    Complete the vehicle inspection form below
                  </p>
                </CardContent>
              </Card>
              <VehicleInspectionForm 
                jobCardId={jobCard.id} 
                onSuccess={() => setActiveTab('faults')}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="faults">
          <FaultLogSection jobCardId={jobCard.id} />
        </TabsContent>

        <TabsContent value="work-orders">
          <WorkOrdersTab jobCardId={jobCard.id} busId={jobCard.bus_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
