import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateInspection, TireCondition, FluidLevels } from '@/hooks/useJobCards';
import { Loader2, Fuel, CircleDot, Lightbulb, Droplets, Car } from 'lucide-react';

const tireSchema = z.object({
  condition: z.enum(['good', 'fair', 'poor', 'needs_replacement']),
  tread_depth: z.string(),
  pressure: z.string(),
});

const fluidSchema = z.object({
  oil: z.enum(['ok', 'low', 'critical']),
  coolant: z.enum(['ok', 'low', 'critical']),
  brake_fluid: z.enum(['ok', 'low', 'critical']),
  power_steering: z.enum(['ok', 'low', 'critical']),
  windshield_washer: z.enum(['ok', 'low', 'critical']),
});

const formSchema = z.object({
  fuel_level: z.string(),
  interior_condition: z.string().optional(),
  exterior_dents: z.string().optional(),
  exterior_scratches: z.string().optional(),
  exterior_damage: z.string().optional(),
  tire_front_left: tireSchema,
  tire_front_right: tireSchema,
  tire_rear_left: tireSchema,
  tire_rear_right: tireSchema,
  spare_present: z.boolean(),
  spare_condition: z.string(),
  lights_working: z.boolean(),
  horn_working: z.boolean(),
  wipers_working: z.boolean(),
  mirrors_condition: z.string().optional(),
  battery_condition: z.string().optional(),
  fluid_levels: fluidSchema,
  personal_items: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface VehicleInspectionFormProps {
  jobCardId: string;
  onSuccess?: () => void;
}

const defaultTire: TireCondition = { condition: 'good', tread_depth: '', pressure: '' };
const defaultFluids: FluidLevels = { 
  oil: 'ok', 
  coolant: 'ok', 
  brake_fluid: 'ok', 
  power_steering: 'ok', 
  windshield_washer: 'ok' 
};

export function VehicleInspectionForm({ jobCardId, onSuccess }: VehicleInspectionFormProps) {
  const createInspection = useCreateInspection();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fuel_level: '1/2',
      interior_condition: '',
      exterior_dents: '',
      exterior_scratches: '',
      exterior_damage: '',
      tire_front_left: { condition: 'good', tread_depth: '', pressure: '' },
      tire_front_right: { condition: 'good', tread_depth: '', pressure: '' },
      tire_rear_left: { condition: 'good', tread_depth: '', pressure: '' },
      tire_rear_right: { condition: 'good', tread_depth: '', pressure: '' },
      spare_present: true,
      spare_condition: 'good',
      lights_working: true,
      horn_working: true,
      wipers_working: true,
      mirrors_condition: '',
      battery_condition: '',
      fluid_levels: { oil: 'ok', coolant: 'ok', brake_fluid: 'ok', power_steering: 'ok', windshield_washer: 'ok' },
      personal_items: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createInspection.mutateAsync({
        job_card_id: jobCardId,
        inspection_type: 'pre_work',
        fuel_level: data.fuel_level,
        exterior_condition: {
          dents: data.exterior_dents,
          scratches: data.exterior_scratches,
          damage: data.exterior_damage,
        },
        interior_condition: data.interior_condition,
        tire_front_left: data.tire_front_left as TireCondition,
        tire_front_right: data.tire_front_right as TireCondition,
        tire_rear_left: data.tire_rear_left as TireCondition,
        tire_rear_right: data.tire_rear_right as TireCondition,
        spare_tire: { present: data.spare_present, condition: data.spare_condition },
        lights_working: data.lights_working,
        horn_working: data.horn_working,
        wipers_working: data.wipers_working,
        mirrors_condition: data.mirrors_condition,
        battery_condition: data.battery_condition,
        fluid_levels: data.fluid_levels as FluidLevels,
        personal_items: data.personal_items,
        notes: data.notes,
      });
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const TireFieldGroup = ({ name, label }: { name: 'tire_front_left' | 'tire_front_right' | 'tire_rear_left' | 'tire_rear_right'; label: string }) => (
    <div className="space-y-2 rounded-md border p-3">
      <h4 className="font-medium text-sm">{label}</h4>
      <div className="grid gap-2 sm:grid-cols-3">
        <FormField
          control={form.control}
          name={`${name}.condition`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Condition</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="needs_replacement">Replace</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${name}.tread_depth`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Tread (mm)</FormLabel>
              <FormControl>
                <Input className="h-8" placeholder="e.g. 5" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${name}.pressure`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Pressure (PSI)</FormLabel>
              <FormControl>
                <Input className="h-8" placeholder="e.g. 35" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const FluidField = ({ name, label }: { name: keyof FluidLevels; label: string }) => (
    <FormField
      control={form.control}
      name={`fluid_levels.${name}`}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Fuel Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Fuel className="h-5 w-5" />
              Fuel Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="fuel_level"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="empty">Empty</SelectItem>
                      <SelectItem value="1/4">1/4 Tank</SelectItem>
                      <SelectItem value="1/2">1/2 Tank</SelectItem>
                      <SelectItem value="3/4">3/4 Tank</SelectItem>
                      <SelectItem value="full">Full Tank</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tire Conditions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleDot className="h-5 w-5" />
              Tire Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TireFieldGroup name="tire_front_left" label="Front Left" />
              <TireFieldGroup name="tire_front_right" label="Front Right" />
              <TireFieldGroup name="tire_rear_left" label="Rear Left" />
              <TireFieldGroup name="tire_rear_right" label="Rear Right" />
            </div>
            
            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="spare_present"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Spare Tire Present</FormLabel>
                  </FormItem>
                )}
              />
              {form.watch('spare_present') && (
                <FormField
                  control={form.control}
                  name="spare_condition"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Spare condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exterior Condition */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5" />
              Exterior Condition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="exterior_dents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dents</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe any dents and their locations..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exterior_scratches"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scratches</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe any scratches and their locations..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exterior_damage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Damage</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe any other visible damage..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Interior & Lights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5" />
              Interior & Electrical
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="interior_condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interior Condition</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe seats, dashboard, floor, cleanliness..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="lights_working"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">All Lights Working</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="horn_working"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Horn Working</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wipers_working"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Wipers Working</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="mirrors_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mirrors Condition</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Good, cracked left mirror" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="battery_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Battery Condition</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Good, weak, needs replacement" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fluid Levels */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5" />
              Fluid Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-5">
              <FluidField name="oil" label="Engine Oil" />
              <FluidField name="coolant" label="Coolant" />
              <FluidField name="brake_fluid" label="Brake Fluid" />
              <FluidField name="power_steering" label="Power Steering" />
              <FluidField name="windshield_washer" label="Washer Fluid" />
            </div>
          </CardContent>
        </Card>

        {/* Personal Items & Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="personal_items"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Items Left in Vehicle</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List any personal items found in the vehicle..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspection Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional observations..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={createInspection.isPending}>
            {createInspection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Inspection
          </Button>
        </div>
      </form>
    </Form>
  );
}
