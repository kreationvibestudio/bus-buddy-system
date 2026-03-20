export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          alighting_stop_id: string | null
          boarding_stop_id: string | null
          booked_at: string
          booking_number: string
          booking_type: Database["public"]["Enums"]["booking_type"]
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          is_return_leg: boolean
          linked_booking_id: string | null
          passenger_count: number
          payment_method: string | null
          payment_status: string | null
          seat_numbers: number[]
          status: Database["public"]["Enums"]["booking_status"]
          total_fare: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alighting_stop_id?: string | null
          boarding_stop_id?: string | null
          booked_at?: string
          booking_number: string
          booking_type?: Database["public"]["Enums"]["booking_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          is_return_leg?: boolean
          linked_booking_id?: string | null
          passenger_count?: number
          payment_method?: string | null
          payment_status?: string | null
          seat_numbers: number[]
          status?: Database["public"]["Enums"]["booking_status"]
          total_fare: number
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alighting_stop_id?: string | null
          boarding_stop_id?: string | null
          booked_at?: string
          booking_number?: string
          booking_type?: Database["public"]["Enums"]["booking_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          is_return_leg?: boolean
          linked_booking_id?: string | null
          passenger_count?: number
          payment_method?: string | null
          payment_status?: string | null
          seat_numbers?: number[]
          status?: Database["public"]["Enums"]["booking_status"]
          total_fare?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_alighting_stop_id_fkey"
            columns: ["alighting_stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_boarding_stop_id_fkey"
            columns: ["boarding_stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_linked_booking_id_fkey"
            columns: ["linked_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_locations: {
        Row: {
          bus_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed: number | null
          trip_id: string | null
        }
        Insert: {
          bus_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string | null
        }
        Update: {
          bus_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_locations_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          capacity: number
          created_at: string
          current_driver_id: string | null
          fuel_type: string | null
          id: string
          last_maintenance_date: string | null
          manufacturer: string | null
          mileage: number | null
          model: string
          next_maintenance_date: string | null
          notes: string | null
          registration_number: string
          status: Database["public"]["Enums"]["bus_status"]
          traccar_device_id: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          current_driver_id?: string | null
          fuel_type?: string | null
          id?: string
          last_maintenance_date?: string | null
          manufacturer?: string | null
          mileage?: number | null
          model: string
          next_maintenance_date?: string | null
          notes?: string | null
          registration_number: string
          status?: Database["public"]["Enums"]["bus_status"]
          traccar_device_id?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          capacity?: number
          created_at?: string
          current_driver_id?: string | null
          fuel_type?: string | null
          id?: string
          last_maintenance_date?: string | null
          manufacturer?: string | null
          mileage?: number | null
          model?: string
          next_maintenance_date?: string | null
          notes?: string | null
          registration_number?: string
          status?: Database["public"]["Enums"]["bus_status"]
          traccar_device_id?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_buses_driver"
            columns: ["current_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_buses_driver"
            columns: ["current_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_operational"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          subject: string
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject: string
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          driver_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          driver_id: string
          end_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          driver_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_leaves_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_leaves_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_operational"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          hire_date: string | null
          id: string
          license_expiry: string
          license_number: string
          rating: number | null
          status: string | null
          total_trips: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          hire_date?: string | null
          id?: string
          license_expiry: string
          license_number: string
          rating?: number | null
          status?: string | null
          total_trips?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          hire_date?: string | null
          id?: string
          license_expiry?: string
          license_number?: string
          rating?: number | null
          status?: string | null
          total_trips?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          bus_id: string | null
          created_at: string
          description: string
          driver_id: string
          id: string
          incident_type: string
          latitude: number | null
          location_description: string | null
          longitude: number | null
          reported_at: string
          resolution: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: string | null
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          bus_id?: string | null
          created_at?: string
          description: string
          driver_id: string
          id?: string
          incident_type: string
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          reported_at?: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: string | null
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          bus_id?: string | null
          created_at?: string
          description?: string
          driver_id?: string
          id?: string
          incident_type?: string
          latitude?: number | null
          location_description?: string | null
          longitude?: number | null
          reported_at?: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: string | null
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_operational"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          min_quantity: number | null
          name: string
          quantity: number
          sku: string | null
          supplier: string | null
          supplier_id: string | null
          unit: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          name: string
          quantity?: number
          sku?: string | null
          supplier?: string | null
          supplier_id?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          name?: string
          quantity?: number
          sku?: string | null
          supplier?: string | null
          supplier_id?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_card_faults: {
        Row: {
          created_at: string
          description: string
          diagnosis: string | null
          fault_category: string
          fault_code: string | null
          id: string
          job_card_id: string
          labor_hours: number | null
          logged_by: string
          parts_used: Json | null
          repair_action: string | null
          repair_status: Database["public"]["Enums"]["fault_repair_status"]
          severity: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          diagnosis?: string | null
          fault_category: string
          fault_code?: string | null
          id?: string
          job_card_id: string
          labor_hours?: number | null
          logged_by: string
          parts_used?: Json | null
          repair_action?: string | null
          repair_status?: Database["public"]["Enums"]["fault_repair_status"]
          severity?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          diagnosis?: string | null
          fault_category?: string
          fault_code?: string | null
          id?: string
          job_card_id?: string
          labor_hours?: number | null
          logged_by?: string
          parts_used?: Json | null
          repair_action?: string | null
          repair_status?: Database["public"]["Enums"]["fault_repair_status"]
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_card_faults_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cards: {
        Row: {
          actual_completion: string | null
          bus_id: string
          created_at: string
          customer_complaint: string | null
          driver_id: string | null
          estimated_completion: string | null
          id: string
          job_card_number: string
          mechanic_id: string
          notes: string | null
          odometer_reading: number
          priority: string
          reason_for_visit: string
          status: Database["public"]["Enums"]["job_card_status"]
          total_cost: number | null
          total_labor_hours: number | null
          updated_at: string
        }
        Insert: {
          actual_completion?: string | null
          bus_id: string
          created_at?: string
          customer_complaint?: string | null
          driver_id?: string | null
          estimated_completion?: string | null
          id?: string
          job_card_number: string
          mechanic_id: string
          notes?: string | null
          odometer_reading: number
          priority?: string
          reason_for_visit: string
          status?: Database["public"]["Enums"]["job_card_status"]
          total_cost?: number | null
          total_labor_hours?: number | null
          updated_at?: string
        }
        Update: {
          actual_completion?: string | null
          bus_id?: string
          created_at?: string
          customer_complaint?: string | null
          driver_id?: string | null
          estimated_completion?: string | null
          id?: string
          job_card_number?: string
          mechanic_id?: string
          notes?: string | null
          odometer_reading?: number
          priority?: string
          reason_for_visit?: string
          status?: Database["public"]["Enums"]["job_card_status"]
          total_cost?: number | null
          total_labor_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_operational"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          bus_id: string
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          mechanic_id: string | null
          notes: string | null
          odometer_reading: number | null
          scheduled_date: string
          status: Database["public"]["Enums"]["maintenance_status"]
          type: string
          updated_at: string
        }
        Insert: {
          bus_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          mechanic_id?: string | null
          notes?: string | null
          odometer_reading?: number | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          type: string
          updated_at?: string
        }
        Update: {
          bus_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          mechanic_id?: string | null
          notes?: string | null
          odometer_reading?: number | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "drivers_operational"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          from_user_id: string
          id: string
          is_read: boolean | null
          sent_at: string
          subject: string | null
          to_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          from_user_id: string
          id?: string
          is_read?: boolean | null
          sent_at?: string
          subject?: string | null
          to_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          from_user_id?: string
          id?: string
          is_read?: boolean | null
          sent_at?: string
          subject?: string | null
          to_user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parts_usage: {
        Row: {
          id: string
          issued_at: string
          issued_by: string | null
          item_id: string
          quantity: number
          work_order_id: string
        }
        Insert: {
          id?: string
          issued_at?: string
          issued_by?: string | null
          item_id: string
          quantity: number
          work_order_id: string
        }
        Update: {
          id?: string
          issued_at?: string
          issued_by?: string | null
          item_id?: string
          quantity?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_usage_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          paid_at: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          base_salary: number
          bonus: number | null
          created_at: string
          deductions: number | null
          driver_id: string
          id: string
          net_amount: number
          paid_at: string | null
          period_end: string
          period_start: string
          status: string | null
        }
        Insert: {
          base_salary: number
          bonus?: number | null
          created_at?: string
          deductions?: number | null
          driver_id: string
          id?: string
          net_amount: number
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string | null
        }
        Update: {
          base_salary?: number
          bonus?: number | null
          created_at?: string
          deductions?: number | null
          driver_id?: string
          id?: string
          net_amount?: number
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_operational"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      route_stations: {
        Row: {
          created_at: string
          distance_from_origin_km: number | null
          estimated_time_minutes: number | null
          fare_from_origin: number | null
          id: string
          route_id: string
          station_id: string
          stop_order: number
        }
        Insert: {
          created_at?: string
          distance_from_origin_km?: number | null
          estimated_time_minutes?: number | null
          fare_from_origin?: number | null
          id?: string
          route_id: string
          station_id: string
          stop_order: number
        }
        Update: {
          created_at?: string
          distance_from_origin_km?: number | null
          estimated_time_minutes?: number | null
          fare_from_origin?: number | null
          id?: string
          route_id?: string
          station_id?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stations_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stations_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          created_at: string
          distance_from_origin_km: number | null
          estimated_time_from_origin_minutes: number | null
          fare_from_origin: number | null
          id: string
          latitude: number | null
          longitude: number | null
          route_id: string
          stop_name: string
          stop_order: number
        }
        Insert: {
          created_at?: string
          distance_from_origin_km?: number | null
          estimated_time_from_origin_minutes?: number | null
          fare_from_origin?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          route_id: string
          stop_name: string
          stop_order: number
        }
        Update: {
          created_at?: string
          distance_from_origin_km?: number | null
          estimated_time_from_origin_minutes?: number | null
          fare_from_origin?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          route_id?: string
          stop_name?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          base_fare: number
          created_at: string
          destination: string
          distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          origin: string
          updated_at: string
        }
        Insert: {
          base_fare: number
          created_at?: string
          destination: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          origin: string
          updated_at?: string
        }
        Update: {
          base_fare?: number
          created_at?: string
          destination?: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          origin?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          arrival_time: string
          bus_id: string | null
          created_at: string
          days_of_week: number[] | null
          departure_time: string
          driver_id: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_active: boolean | null
          route_id: string
          updated_at: string
        }
        Insert: {
          arrival_time: string
          bus_id?: string | null
          created_at?: string
          days_of_week?: number[] | null
          departure_time: string
          driver_id?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          route_id: string
          updated_at?: string
        }
        Update: {
          arrival_time?: string
          bus_id?: string | null
          created_at?: string
          days_of_week?: number[] | null
          departure_time?: string
          driver_id?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          route_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_operational"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          bus_id: string
          created_at: string
          deck: number | null
          id: string
          is_available: boolean | null
          seat_number: string
          seat_row: number | null
          seat_type: string | null
        }
        Insert: {
          bus_id: string
          created_at?: string
          deck?: number | null
          id?: string
          is_available?: boolean | null
          seat_number: string
          seat_row?: number | null
          seat_type?: string | null
        }
        Update: {
          bus_id?: string
          created_at?: string
          deck?: number | null
          id?: string
          is_available?: boolean | null
          seat_number?: string
          seat_row?: number | null
          seat_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seats_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          accessed_at: string | null
          action: string
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string | null
          action: string
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string | null
          action?: string
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      stations: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          created_at: string
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          state_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          state_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          state_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          item_id: string
          notes: string | null
          quantity_approved: number | null
          quantity_requested: number
          requested_by: string
          status: Database["public"]["Enums"]["stock_request_status"]
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity_approved?: number | null
          quantity_requested: number
          requested_by: string
          status?: Database["public"]["Enums"]["stock_request_status"]
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity_approved?: number | null
          quantity_requested?: number
          requested_by?: string
          status?: Database["public"]["Enums"]["stock_request_status"]
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_requests_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          actual_arrival_time: string | null
          actual_departure_time: string | null
          arrival_time: string
          available_seats: number | null
          bus_id: string | null
          created_at: string
          departure_time: string
          driver_id: string | null
          id: string
          notes: string | null
          route_id: string
          schedule_id: string | null
          status: string | null
          trip_date: string
          updated_at: string
        }
        Insert: {
          actual_arrival_time?: string | null
          actual_departure_time?: string | null
          arrival_time: string
          available_seats?: number | null
          bus_id?: string | null
          created_at?: string
          departure_time: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          route_id: string
          schedule_id?: string | null
          status?: string | null
          trip_date: string
          updated_at?: string
        }
        Update: {
          actual_arrival_time?: string | null
          actual_departure_time?: string | null
          arrival_time?: string
          available_seats?: number | null
          bus_id?: string | null
          created_at?: string
          departure_time?: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          route_id?: string
          schedule_id?: string | null
          status?: string | null
          trip_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers_operational"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_inspections: {
        Row: {
          battery_condition: string | null
          created_at: string
          exterior_condition: Json | null
          fluid_levels: Json | null
          fuel_level: string | null
          horn_working: boolean | null
          id: string
          inspected_at: string
          inspected_by: string
          inspection_type: string
          interior_condition: string | null
          job_card_id: string
          lights_working: boolean | null
          mirrors_condition: string | null
          notes: string | null
          personal_items: string | null
          photos: Json | null
          spare_tire: Json | null
          tire_front_left: Json | null
          tire_front_right: Json | null
          tire_rear_left: Json | null
          tire_rear_right: Json | null
          wipers_working: boolean | null
        }
        Insert: {
          battery_condition?: string | null
          created_at?: string
          exterior_condition?: Json | null
          fluid_levels?: Json | null
          fuel_level?: string | null
          horn_working?: boolean | null
          id?: string
          inspected_at?: string
          inspected_by: string
          inspection_type?: string
          interior_condition?: string | null
          job_card_id: string
          lights_working?: boolean | null
          mirrors_condition?: string | null
          notes?: string | null
          personal_items?: string | null
          photos?: Json | null
          spare_tire?: Json | null
          tire_front_left?: Json | null
          tire_front_right?: Json | null
          tire_rear_left?: Json | null
          tire_rear_right?: Json | null
          wipers_working?: boolean | null
        }
        Update: {
          battery_condition?: string | null
          created_at?: string
          exterior_condition?: Json | null
          fluid_levels?: Json | null
          fuel_level?: string | null
          horn_working?: boolean | null
          id?: string
          inspected_at?: string
          inspected_by?: string
          inspection_type?: string
          interior_condition?: string | null
          job_card_id?: string
          lights_working?: boolean | null
          mirrors_condition?: string | null
          notes?: string | null
          personal_items?: string | null
          photos?: Json | null
          spare_tire?: Json | null
          tire_front_left?: Json | null
          tire_front_right?: Json | null
          tire_rear_left?: Json | null
          tire_rear_right?: Json | null
          wipers_working?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          assigned_to: string | null
          bus_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          job_card_id: string | null
          maintenance_id: string | null
          priority: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          bus_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          job_card_id?: string | null
          maintenance_id?: string | null
          priority?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          bus_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          job_card_id?: string | null
          maintenance_id?: string | null
          priority?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      drivers_operational: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          hire_date: string | null
          id: string | null
          rating: number | null
          status: string | null
          total_trips: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_payroll_authorized: { Args: { _user_id: string }; Returns: boolean }
      notify_leave_expiring: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin"
        | "driver"
        | "passenger"
        | "storekeeper"
        | "mechanic"
        | "staff"
        | "accounts"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      booking_type: "one_way" | "round_trip"
      bus_status: "active" | "maintenance" | "out_of_service"
      complaint_status: "open" | "in_progress" | "resolved" | "closed"
      fault_repair_status: "pending" | "in_progress" | "completed" | "deferred"
      incident_severity: "low" | "medium" | "high" | "critical"
      job_card_status:
        | "draft"
        | "inspection_complete"
        | "in_progress"
        | "awaiting_parts"
        | "completed"
        | "closed"
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      stock_request_status:
        | "pending"
        | "approved"
        | "admin_approved"
        | "rejected"
        | "fulfilled"
      work_order_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "driver",
        "passenger",
        "storekeeper",
        "mechanic",
        "staff",
        "accounts",
      ],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      booking_type: ["one_way", "round_trip"],
      bus_status: ["active", "maintenance", "out_of_service"],
      complaint_status: ["open", "in_progress", "resolved", "closed"],
      fault_repair_status: ["pending", "in_progress", "completed", "deferred"],
      incident_severity: ["low", "medium", "high", "critical"],
      job_card_status: [
        "draft",
        "inspection_complete",
        "in_progress",
        "awaiting_parts",
        "completed",
        "closed",
      ],
      maintenance_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      stock_request_status: [
        "pending",
        "approved",
        "admin_approved",
        "rejected",
        "fulfilled",
      ],
      work_order_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
