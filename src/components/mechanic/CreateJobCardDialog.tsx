import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBuses } from '@/hooks/useBuses';
import { useDrivers } from '@/hooks/useDrivers';
import { useCreateJobCard, JobCard } from '@/hooks/useJobCards';
import { Loader2, Car, User, FileText } from 'lucide-react';

const formSchema = z.object({
  bus_id: z.string().min(1, 'Please select a vehicle'),
  driver_id: z.string().optional(),
  odometer_reading: z.coerce.number().min(0, 'Odometer reading must be positive'),
  reason_for_visit: z.string().min(1, 'Please select a reason'),
  customer_complaint: z.string().optional(),
  priority: z.string().default('medium'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const reasonOptions = [
  'Scheduled Maintenance',
  'Breakdown Repair',
  'Accident Damage',
  'Pre-Trip Inspection',
  'Post-Trip Inspection',
  'Engine Issues',
  'Brake Issues',
  'Electrical Issues',
  'Transmission Issues',
  'Suspension Issues',
  'Tire Replacement',
  'Body Work',
  'Air Conditioning',
  'Other',
];

interface CreateJobCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (jobCard: JobCard) => void;
}

export function CreateJobCardDialog({ open, onOpenChange, onSuccess }: CreateJobCardDialogProps) {
  const { data: buses, isLoading: busesLoading } = useBuses();
  const { data: drivers, isLoading: driversLoading } = useDrivers();
  const createJobCard = useCreateJobCard();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bus_id: '',
      driver_id: '',
      odometer_reading: 0,
      reason_for_visit: '',
      customer_complaint: '',
      priority: 'medium',
      notes: '',
    },
  });

  const selectedBusId = form.watch('bus_id');
  const selectedBus = buses?.find(b => b.id === selectedBusId);

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createJobCard.mutateAsync({
        bus_id: data.bus_id,
        driver_id: data.driver_id || null,
        odometer_reading: data.odometer_reading,
        reason_for_visit: data.reason_for_visit,
        customer_complaint: data.customer_complaint || undefined,
        priority: data.priority,
        notes: data.notes || undefined,
      });
      
      form.reset();
      if (onSuccess) {
        onSuccess(result as unknown as JobCard);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job Card</DialogTitle>
          <DialogDescription>
            Enter vehicle intake information to create a new job card
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Car className="h-5 w-5" />
                Vehicle Information
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bus_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Vehicle *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a vehicle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {busesLoading ? (
                            <SelectItem value="" disabled>Loading...</SelectItem>
                          ) : (
                            buses?.map((bus) => (
                              <SelectItem key={bus.id} value={bus.id}>
                                {bus.registration_number} - {bus.manufacturer} {bus.model}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="odometer_reading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Odometer (km) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={selectedBus ? `Last: ${selectedBus.mileage?.toLocaleString() || 'N/A'} km` : 'Enter reading'} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedBus && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p><strong>Vehicle:</strong> {selectedBus.manufacturer} {selectedBus.model} ({selectedBus.year})</p>
                  <p><strong>Last Recorded Mileage:</strong> {selectedBus.mileage?.toLocaleString() || 'N/A'} km</p>
                  <p><strong>Status:</strong> {selectedBus.status}</p>
                </div>
              )}
            </div>

            {/* Driver Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Driver Information
              </div>
              
              <FormField
                control={form.control}
                name="driver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Who Brought Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No driver specified</SelectItem>
                        {driversLoading ? (
                          <SelectItem value="" disabled>Loading...</SelectItem>
                        ) : (
                          drivers?.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.profile?.full_name || 'Unknown'} - {driver.license_number}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                Job Details
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="reason_for_visit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Visit *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reasonOptions.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="customer_complaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer/Driver Complaint</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what the driver or customer reported..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createJobCard.isPending}>
                {createJobCard.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Job Card
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
