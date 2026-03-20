export type AppRole = 'admin' | 'driver' | 'passenger' | 'storekeeper' | 'mechanic' | 'staff' | 'accounts';
export type BusStatus = 'active' | 'maintenance' | 'out_of_service';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BookingType = 'one_way' | 'round_trip';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type StockRequestStatus = 'pending' | 'approved' | 'admin_approved' | 'rejected' | 'fulfilled';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Bus {
  id: string;
  registration_number: string;
  model: string;
  manufacturer?: string;
  year?: number;
  capacity: number;
  status: BusStatus;
  current_driver_id?: string;
  fuel_type?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  mileage?: number;
  notes?: string;
  traccar_device_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id?: string;
  license_number: string;
  license_expiry: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  hire_date?: string;
  status?: string;
  rating?: number;
  total_trips?: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface State {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Station {
  id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  state_id?: string;
  created_at: string;
  updated_at: string;
  state?: State;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance_km?: number;
  estimated_duration_minutes?: number;
  base_fare: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteStation {
  id: string;
  route_id: string;
  station_id: string;
  stop_order: number;
  distance_from_origin_km?: number;
  fare_from_origin?: number;
  estimated_time_minutes?: number;
  created_at: string;
  station?: Station;
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_name: string;
  stop_order: number;
  distance_from_origin_km?: number;
  estimated_time_from_origin_minutes?: number;
  fare_from_origin?: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface Seat {
  id: string;
  bus_id: string;
  seat_number: string;
  seat_type?: string;
  seat_row?: number;
  deck?: number;
  is_available?: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  route_id: string;
  bus_id?: string;
  driver_id?: string;
  departure_time: string;
  arrival_time: string;
  days_of_week?: number[];
  is_active?: boolean;
  effective_from?: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
  route?: Route;
  bus?: Bus;
  driver?: Driver;
}

export interface Trip {
  id: string;
  schedule_id?: string;
  route_id: string;
  bus_id?: string;
  driver_id?: string;
  trip_date: string;
  departure_time: string;
  actual_departure_time?: string;
  arrival_time: string;
  actual_arrival_time?: string;
  status?: string;
  available_seats?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  route?: Route;
  bus?: Bus;
  driver?: Driver;
}

export interface Booking {
  id: string;
  booking_number: string;
  user_id: string;
  trip_id: string;
  boarding_stop_id?: string;
  alighting_stop_id?: string;
  seat_numbers: number[];
  passenger_count: number;
  total_fare: number;
  status: BookingStatus;
  booking_type: BookingType;
  linked_booking_id?: string;
  is_return_leg: boolean;
  payment_status?: string;
  payment_method?: string;
  booked_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  linked_booking?: Booking;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  status: PaymentStatus;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  booking?: Booking;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  category_id?: string;
  supplier_id?: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  min_quantity?: number;
  unit?: string;
  unit_cost?: number;
  location?: string;
  supplier?: string;
  created_at: string;
  updated_at: string;
  category?: InventoryCategory;
}

export interface StockMovement {
  id: string;
  item_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  item?: InventoryItem;
}

export interface StockRequest {
  id: string;
  requested_by: string;
  item_id: string;
  quantity_requested: number;
  quantity_approved?: number;
  status: StockRequestStatus;
  work_order_id?: string;
  notes?: string;
  approved_by?: string;
  fulfilled_at?: string;
  created_at: string;
  updated_at: string;
  item?: InventoryItem;
}

export interface MaintenanceRecord {
  id: string;
  bus_id: string;
  type: string;
  description?: string;
  scheduled_date: string;
  completed_date?: string;
  status: MaintenanceStatus;
  cost?: number;
  mechanic_id?: string;
  odometer_reading?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  bus?: Bus;
}

export interface WorkOrder {
  id: string;
  maintenance_id?: string;
  job_card_id?: string;
  bus_id: string;
  assigned_to?: string;
  title: string;
  description?: string;
  priority?: string;
  status: WorkOrderStatus;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  bus?: Bus;
}

export interface PartsUsage {
  id: string;
  work_order_id: string;
  item_id: string;
  quantity: number;
  issued_by?: string;
  issued_at: string;
  item?: InventoryItem;
}

export interface Complaint {
  id: string;
  user_id: string;
  booking_id?: string;
  trip_id?: string;
  category?: string;
  subject: string;
  description?: string;
  status: ComplaintStatus;
  priority?: string;
  assigned_to?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  driver_id: string;
  trip_id?: string;
  bus_id?: string;
  incident_type: string;
  severity: IncidentSeverity;
  description: string;
  location_description?: string;
  latitude?: number;
  longitude?: number;
  reported_at: string;
  status?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  driver?: Driver;
  bus?: Bus;
}

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject?: string;
  body: string;
  is_read?: boolean;
  sent_at: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  date: string;
  created_by?: string;
  created_at: string;
}

export interface Payroll {
  id: string;
  driver_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  bonus?: number;
  deductions?: number;
  net_amount: number;
  status?: string;
  paid_at?: string;
  created_at: string;
  driver?: Driver;
}

export interface BusLocation {
  id: string;
  bus_id: string;
  trip_id?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  recorded_at: string;
}
