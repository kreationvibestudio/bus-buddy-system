import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useJobCardFaults, useCreateFault, useUpdateFault, JobCardFault, FaultRepairStatus } from '@/hooks/useJobCards';
import { Plus, Loader2, AlertTriangle, Clock, CheckCircle2, Pause } from 'lucide-react';
import { format } from 'date-fns';

const faultCategories = [
  'Engine',
  'Transmission',
  'Brakes',
  'Suspension',
  'Electrical',
  'Air Conditioning',
  'Exhaust',
  'Steering',
  'Cooling System',
  'Fuel System',
  'Body/Exterior',
  'Interior',
  'Tires/Wheels',
  'Other',
];

const severityConfig: Record<string, { label: string; className: string }> = {
  minor: { label: 'Minor', className: 'bg-muted text-muted-foreground' },
  moderate: { label: 'Moderate', className: 'bg-yellow-500/20 text-yellow-600' },
  major: { label: 'Major', className: 'bg-orange-500/20 text-orange-600' },
  critical: { label: 'Critical', className: 'bg-destructive/20 text-destructive' },
};

const statusConfig: Record<FaultRepairStatus, { label: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', icon: <Loader2 className="h-3 w-3" /> },
  completed: { label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" /> },
  deferred: { label: 'Deferred', icon: <Pause className="h-3 w-3" /> },
};

const formSchema = z.object({
  fault_code: z.string().optional(),
  fault_category: z.string().min(1, 'Please select a category'),
  description: z.string().min(1, 'Description is required'),
  severity: z.string().default('moderate'),
  diagnosis: z.string().optional(),
  labor_hours: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;

interface FaultLogSectionProps {
  jobCardId: string;
}

export function FaultLogSection({ jobCardId }: FaultLogSectionProps) {
  const { data: faults, isLoading } = useJobCardFaults(jobCardId);
  const createFault = useCreateFault();
  const updateFault = useUpdateFault();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingFault, setEditingFault] = useState<JobCardFault | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fault_code: '',
      fault_category: '',
      description: '',
      severity: 'moderate',
      diagnosis: '',
      labor_hours: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createFault.mutateAsync({
        job_card_id: jobCardId,
        fault_code: data.fault_code || undefined,
        fault_category: data.fault_category,
        description: data.description,
        severity: data.severity,
        diagnosis: data.diagnosis || undefined,
        labor_hours: data.labor_hours,
      });
      form.reset();
      setAddDialogOpen(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStatusChange = async (fault: JobCardFault, newStatus: FaultRepairStatus) => {
    await updateFault.mutateAsync({
      id: fault.id,
      job_card_id: fault.job_card_id,
      repair_status: newStatus,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Faults & Issues</h3>
          <p className="text-sm text-muted-foreground">
            Log and track all faults found during inspection and repair
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Log Fault
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log New Fault</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fault_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {faultCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fault_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fault/Diagnostic Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. P0300, B1234" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the fault in detail..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What do you think is causing this issue?"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labor_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Labor Hours</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFault.isPending}>
                    {createFault.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Log Fault
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Loading faults...
          </CardContent>
        </Card>
      ) : !faults || faults.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No faults logged yet</p>
            <p className="text-sm">Click "Log Fault" to add issues found during inspection</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {faults.map((fault) => (
            <Card key={fault.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{fault.fault_category}</span>
                      {fault.fault_code && (
                        <Badge variant="outline" className="font-mono">
                          {fault.fault_code}
                        </Badge>
                      )}
                      <Badge className={severityConfig[fault.severity]?.className || ''}>
                        {severityConfig[fault.severity]?.label || fault.severity}
                      </Badge>
                    </div>
                    <p className="text-sm">{fault.description}</p>
                    {fault.diagnosis && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Diagnosis:</strong> {fault.diagnosis}
                      </p>
                    )}
                    {fault.repair_action && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Action:</strong> {fault.repair_action}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Logged {format(new Date(fault.created_at), 'PPp')}
                      {fault.labor_hours > 0 && ` • ${fault.labor_hours}h labor`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={fault.repair_status} 
                      onValueChange={(value) => handleStatusChange(fault, value as FaultRepairStatus)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="deferred">Deferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
