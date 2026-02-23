import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, Payment } from '@/types/database';
import { toast } from 'sonner';

/** Fetch taken seat numbers and capacity for a trip (for seat picker and availability check) */
export async function getTakenSeatsForTrip(tripId: string): Promise<{ takenSeats: number[]; capacity: number }> {
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, bus_id, bus:buses(capacity)')
    .eq('id', tripId)
    .single();
  if (tripError || !trip) return { takenSeats: [], capacity: 40 };
  const capacity = (trip.bus as { capacity?: number })?.capacity ?? 40;

  const { data: bookings, error: bookError } = await supabase
    .from('bookings')
    .select('seat_numbers')
    .eq('trip_id', tripId)
    .not('status', 'eq', 'cancelled');
  if (bookError) return { takenSeats: [], capacity };
  const takenSeats = (bookings ?? []).flatMap((b) => b.seat_numbers ?? []);
  return { takenSeats, capacity };
}

export function useTakenSeatsForTrip(tripId: string | null) {
  return useQuery({
    queryKey: ['taken-seats', tripId],
    queryFn: () => getTakenSeatsForTrip(tripId!),
    enabled: !!tripId,
  });
}

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
      if (!user) return [];
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
      const { takenSeats: outboundTaken } = await getTakenSeatsForTrip(params.outbound_trip_id);
      const outboundSet = new Set(outboundTaken);
      const overlapOutbound = params.seat_numbers.some((s) => outboundSet.has(s));
      if (overlapOutbound) {
        throw new Error('One or more selected seats are no longer available for the outbound trip. Please choose different seats.');
      }

      if (params.booking_type === 'round_trip' && params.return_trip_id) {
        const { takenSeats: returnTaken } = await getTakenSeatsForTrip(params.return_trip_id);
        const returnSet = new Set(returnTaken);
        const overlapReturn = params.seat_numbers.some((s) => returnSet.has(s));
        if (overlapReturn) {
          throw new Error('One or more selected seats are no longer available for the return trip. Please choose different seats.');
        }
      }

      const baseBookingNumber = `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data: outboundBooking, error: outboundError } = await supabase
        .from('bookings')
        .insert({
          user_id: params.user_id,
          trip_id: params.outbound_trip_id,
          seat_numbers: params.seat_numbers,
          passenger_count: params.passenger_count,
          total_fare: params.outbound_fare,
          status: 'confirmed' as const,
          payment_status: 'pending',
          booking_type: params.booking_type,
          is_return_leg: false,
          payment_method: params.payment_method ?? null,
          booking_number: params.booking_type === 'round_trip' ? `${baseBookingNumber}-A` : baseBookingNumber,
        })
        .select()
        .single();

      if (outboundError) throw outboundError;

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
            payment_status: 'pending',
            booking_type: 'round_trip' as const,
            is_return_leg: true,
            linked_booking_id: outboundBooking.id,
            payment_method: params.payment_method ?? null,
            booking_number: `${baseBookingNumber}-B`,
          })
          .select()
          .single();

        if (returnError) throw returnError;

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
      queryClient.invalidateQueries({ queryKey: ['taken-seats'] });
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
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record payment: ' + error.message);
    },
  });
}

/** Mark a booking as paid (e.g. pay at terminal). Updates payment_status and creates a payment record. */
export function useMarkBookingPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, amount, method = 'cash' }: { bookingId: string; amount: number; method?: string }) => {
      const { data: booking, error: fetchErr } = await supabase
        .from('bookings')
        .select('id, total_fare, payment_status')
        .eq('id', bookingId)
        .single();
      if (fetchErr || !booking) throw new Error('Booking not found');
      if (booking.payment_status === 'completed') throw new Error('Booking is already paid');

      const { error: updateErr } = await supabase
        .from('bookings')
        .update({ payment_status: 'completed', payment_method: method })
        .eq('id', bookingId);
      if (updateErr) throw updateErr;

      const { error: payErr } = await supabase.from('payments').insert({
        booking_id: bookingId,
        amount: amount ?? booking.total_fare,
        payment_method: method,
        status: 'completed',
        paid_at: new Date().toISOString(),
      });
      if (payErr) throw payErr;

      return { bookingId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment recorded. Booking is now paid.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    },
  });
}
