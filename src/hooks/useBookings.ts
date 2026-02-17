import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, Payment } from '@/types/database';
import { toast } from 'sonner';

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(
            *,
            route:routes(*),
            bus:buses(*)
          )
        `)
        .order('booked_at', { ascending: false });
      
      if (error) throw error;
      return data as Booking[];
    },
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(
            *,
            route:routes(*),
            bus:buses(*)
          )
        `)
        .eq('user_id', user.id)
        .order('booked_at', { ascending: false });
      
      if (error) throw error;
      return data as Booking[];
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (booking: {
      user_id: string;
      trip_id: string;
      seat_numbers: number[];
      passenger_count: number;
      total_fare: number;
      status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
      booking_type?: 'one_way' | 'round_trip';
      linked_booking_id?: string;
      is_return_leg?: boolean;
      boarding_stop_id?: string;
      alighting_stop_id?: string;
      payment_method?: string;
    }) => {
      // Generate a unique booking number
      const booking_number = `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({ 
          ...booking, 
          booking_number,
          booking_type: booking.booking_type || 'one_way',
          is_return_leg: booking.is_return_leg || false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Booking created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create booking: ' + error.message);
    },
  });
}

export function useCreateRoundTripBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      user_id: string;
      outbound_trip_id: string;
      return_trip_id?: string;
      seat_numbers: number[];
      passenger_count: number;
      outbound_fare: number;
      return_fare?: number;
      booking_type: 'one_way' | 'round_trip';
      payment_method?: string;
    }) => {
      const baseBookingNumber = `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Create outbound booking
      const { data: outboundBooking, error: outboundError } = await supabase
        .from('bookings')
        .insert({
          user_id: params.user_id,
          trip_id: params.outbound_trip_id,
          seat_numbers: params.seat_numbers,
          passenger_count: params.passenger_count,
          total_fare: params.outbound_fare,
          status: 'confirmed' as const,
          booking_type: params.booking_type,
          is_return_leg: false,
          payment_method: params.payment_method,
          booking_number: params.booking_type === 'round_trip' ? `${baseBookingNumber}-A` : baseBookingNumber,
        })
        .select()
        .single();
      
      if (outboundError) throw outboundError;

      // If round trip, create return booking and link them
      if (params.booking_type === 'round_trip' && params.return_trip_id) {
        const { data: returnBooking, error: returnError } = await supabase
          .from('bookings')
          .insert({
            user_id: params.user_id,
            trip_id: params.return_trip_id,
            seat_numbers: params.seat_numbers,
            passenger_count: params.passenger_count,
            total_fare: params.return_fare || 0,
            status: 'confirmed' as const,
            booking_type: 'round_trip' as const,
            is_return_leg: true,
            linked_booking_id: outboundBooking.id,
            payment_method: params.payment_method,
            booking_number: `${baseBookingNumber}-B`,
          })
          .select()
          .single();

        if (returnError) throw returnError;

        // Update outbound booking to link to return
        await supabase
          .from('bookings')
          .update({ linked_booking_id: returnBooking.id })
          .eq('id', outboundBooking.id);

        return { outbound: outboundBooking, return: returnBooking };
      }

      return { outbound: outboundBooking };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Booking confirmed successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create booking: ' + error.message);
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...booking }: Partial<Booking> & { id: string }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update(booking)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Booking updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update booking: ' + error.message);
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason, isAdmin = false }: { id: string; reason?: string; isAdmin?: boolean }) => {
      // First check if the booking is paid (passengers cannot cancel paid bookings)
      if (!isAdmin) {
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('payment_status')
          .eq('id', id)
          .single();
        
        if (fetchError) throw fetchError;
        
        if (booking?.payment_status === 'completed') {
          throw new Error('Cannot cancel a paid booking. Please contact support for refund requests.');
        }
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Booking cancelled successfully');
    },
    onError: (error) => {
      toast.error('Failed to cancel booking: ' + error.message);
    },
  });
}

// Payments
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'booking'>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record payment: ' + error.message);
    },
  });
}
