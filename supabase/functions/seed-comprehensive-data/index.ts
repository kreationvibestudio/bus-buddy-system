import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'driver' | 'passenger' | 'storekeeper' | 'mechanic' | 'staff' | 'accounts';
}

const testUsers: TestUser[] = [
  { email: 'admin@eagleline.com', password: 'Admin123!', full_name: 'Admin User', phone: '+234 801 234 5678', role: 'admin' },
  { email: 'staff@eagleline.com', password: 'Staff123!', full_name: 'Staff Manager', phone: '+234 802 234 5678', role: 'staff' },
  { email: 'storekeeper@eagleline.com', password: 'Store123!', full_name: 'Store Keeper', phone: '+234 803 234 5678', role: 'storekeeper' },
  { email: 'driver1@eagleline.com', password: 'Driver123!', full_name: 'John Driver', phone: '+234 804 234 5678', role: 'driver' },
  { email: 'driver2@eagleline.com', password: 'Driver123!', full_name: 'Musa Driver', phone: '+234 805 234 5678', role: 'driver' },
  { email: 'driver3@eagleline.com', password: 'Driver123!', full_name: 'Chukwu Driver', phone: '+234 806 234 5678', role: 'driver' },
  { email: 'passenger1@eagleline.com', password: 'Pass123!', full_name: 'Adebayo Passenger', phone: '+234 807 234 5678', role: 'passenger' },
  { email: 'passenger2@eagleline.com', password: 'Pass123!', full_name: 'Fatima Passenger', phone: '+234 808 234 5678', role: 'passenger' },
  { email: 'mechanic1@eagleline.com', password: 'Mech123!', full_name: 'Emeka Mechanic', phone: '+234 809 234 5678', role: 'mechanic' },
  { email: 'mechanic2@eagleline.com', password: 'Mech123!', full_name: 'Ibrahim Mechanic', phone: '+234 810 234 5678', role: 'mechanic' },
  { email: 'accounts@eagleline.com', password: 'Acct123!', full_name: 'Accounts Manager', phone: '+234 811 234 5678', role: 'accounts' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results: string[] = [];

    // Step 1: Create users
    const createdUsers: Map<string, string> = new Map(); // email -> user_id
    
    for (const user of testUsers) {
      try {
        // Check if user exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === user.email);

        if (existingUser) {
          createdUsers.set(user.email, existingUser.id);
          // Update profile and role
          await supabase.from('profiles').upsert({
            user_id: existingUser.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
          }, { onConflict: 'user_id' });
          await supabase.from('user_roles').upsert({
            user_id: existingUser.id,
            role: user.role,
          }, { onConflict: 'user_id' });
          results.push(`User ${user.email}: Already exists, updated`);
          continue;
        }

        // Create new user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

        if (authError) {
          results.push(`User ${user.email}: Failed - ${authError.message}`);
          continue;
        }

        createdUsers.set(user.email, authData.user.id);
        
        // Update role (trigger creates profile with default role)
        await supabase.from('user_roles').update({ role: user.role }).eq('user_id', authData.user.id);
        await supabase.from('profiles').update({ phone: user.phone }).eq('user_id', authData.user.id);
        
        results.push(`User ${user.email}: Created successfully`);
      } catch (err) {
        results.push(`User ${user.email}: Error - ${String(err)}`);
      }
    }

    // Step 2: Create driver profiles
    const driverUserIds = Array.from(createdUsers.entries())
      .filter(([email]) => email.startsWith('driver'))
      .map(([, userId]) => userId);
    
    const licenseNumbers = ['LG-DL-001234', 'KN-DL-002345', 'AB-DL-003456'];
    const driverProfiles = [];
    
    for (let i = 0; i < driverUserIds.length && i < licenseNumbers.length; i++) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);
      
      driverProfiles.push({
        user_id: driverUserIds[i],
        license_number: licenseNumbers[i],
        license_expiry: expiryDate.toISOString().split('T')[0],
        status: 'active',
        rating: 4.5 + Math.random() * 0.5,
        total_trips: Math.floor(Math.random() * 200) + 50,
        hire_date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 2).toISOString().split('T')[0],
      });
    }

    if (driverProfiles.length > 0) {
      const { error: driverError } = await supabase.from('drivers').upsert(driverProfiles, { onConflict: 'user_id' });
      results.push(driverError ? `Drivers: Error - ${driverError.message}` : `Drivers: Created ${driverProfiles.length} driver profiles`);
    }

    // Step 3: Get trips and create bookings
    const { data: trips } = await supabase.from('trips')
      .select('id, trip_date, route_id, bus_id, available_seats, route:routes(base_fare)')
      .gte('trip_date', new Date().toISOString().split('T')[0])
      .limit(50);

    const { data: passengers } = await supabase.from('profiles')
      .select('user_id')
      .in('user_id', Array.from(createdUsers.values()))
      .limit(5);

    if (trips && trips.length > 0 && passengers && passengers.length > 0) {
      const bookings = [];
      const payments = [];
      
      for (let i = 0; i < Math.min(20, trips.length); i++) {
        const trip = trips[i];
        const passenger = passengers[Math.floor(Math.random() * passengers.length)];
        const baseFare = (trip.route as any)?.base_fare || 5000;
        const seatCount = Math.floor(Math.random() * 2) + 1;
        const totalFare = baseFare * seatCount;
        const bookingNumber = `BKG-${Date.now()}-${i}`;
        
        const seatNumbers = Array.from({ length: seatCount }, (_, idx) => idx + 1);
        const bookingStatus = i < 15 ? 'confirmed' : 'pending';
        const paymentStatus = bookingStatus === 'confirmed' ? 'completed' : 'pending';

        bookings.push({
          booking_number: bookingNumber,
          user_id: passenger.user_id,
          trip_id: trip.id,
          seat_numbers: seatNumbers,
          passenger_count: seatCount,
          total_fare: totalFare,
          status: bookingStatus,
          payment_status: paymentStatus,
          payment_method: paymentStatus === 'completed' ? (Math.random() > 0.5 ? 'card' : 'cash') : null,
          booked_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (paymentStatus === 'completed') {
          payments.push({
            booking_id: bookingNumber, // We'll update this after booking is created
            amount: totalFare,
            payment_method: bookingStatus === 'confirmed' ? (Math.random() > 0.5 ? 'card' : 'cash') : 'cash',
            status: 'completed',
            paid_at: new Date().toISOString(),
            transaction_id: `TXN-${Date.now()}-${i}`,
          });
        }
      }

      // Insert bookings
      const { data: createdBookings, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookings)
        .select('id, booking_number');
      
      results.push(bookingError ? `Bookings: Error - ${bookingError.message}` : `Bookings: Created ${bookings.length} bookings`);

      // Create payments for completed bookings
      if (createdBookings && createdBookings.length > 0) {
        const completedBookings = createdBookings.filter(b => 
          bookings.find(bk => bk.booking_number === b.booking_number)?.payment_status === 'completed'
        );
        
        const paymentRecords = completedBookings.map(booking => ({
          booking_id: booking.id,
          amount: bookings.find(bk => bk.booking_number === booking.booking_number)?.total_fare || 0,
          payment_method: bookings.find(bk => bk.booking_number === booking.booking_number)?.payment_method || 'cash',
          status: 'completed',
          paid_at: new Date().toISOString(),
          transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));

        const { error: paymentError } = await supabase.from('payments').insert(paymentRecords);
        results.push(paymentError ? `Payments: Error - ${paymentError.message}` : `Payments: Created ${paymentRecords.length} payments`);
      }
    }

    // Step 4: Create maintenance records
    const { data: buses } = await supabase.from('buses').select('id').limit(5);
    const { data: drivers } = await supabase.from('drivers').select('id').limit(2);

    if (buses && buses.length > 0) {
      const maintenanceRecords = [];
      const maintenanceTypes = ['Routine Service', 'Oil Change', 'Tire Replacement', 'Brake Repair', 'AC Service'];
      
      for (let i = 0; i < Math.min(10, buses.length * 2); i++) {
        const bus = buses[Math.floor(Math.random() * buses.length)];
        const mechanic = drivers && drivers.length > 0 ? drivers[Math.floor(Math.random() * drivers.length)].id : null;
        const statuses: Array<'scheduled' | 'in_progress' | 'completed'> = ['scheduled', 'in_progress', 'completed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 30));
        
        maintenanceRecords.push({
          bus_id: bus.id,
          type: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
          description: `Regular maintenance for ${maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)]}`,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          completed_date: status === 'completed' ? scheduledDate.toISOString().split('T')[0] : null,
          status: status,
          cost: status === 'completed' ? Math.floor(Math.random() * 50000) + 10000 : null,
          mechanic_id: mechanic,
          odometer_reading: Math.floor(Math.random() * 100000) + 50000,
        });
      }

      const { error: maintenanceError } = await supabase.from('maintenance_records').insert(maintenanceRecords);
      results.push(maintenanceError ? `Maintenance: Error - ${maintenanceError.message}` : `Maintenance: Created ${maintenanceRecords.length} records`);
    }

    // Step 5: Create work orders
    const { data: mechanics } = await supabase.from('user_roles')
      .select('user_id')
      .eq('role', 'mechanic')
      .limit(2);

    if (buses && buses.length > 0 && mechanics && mechanics.length > 0) {
      const workOrders = [];
      
      for (let i = 0; i < 8; i++) {
        const bus = buses[Math.floor(Math.random() * buses.length)];
        const mechanic = mechanics[Math.floor(Math.random() * mechanics.length)];
        const statuses: Array<'pending' | 'assigned' | 'in_progress' | 'completed'> = ['pending', 'assigned', 'in_progress', 'completed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priorities = ['low', 'medium', 'high'];
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1);
        
        workOrders.push({
          bus_id: bus.id,
          assigned_to: mechanic.user_id,
          title: `Work Order #${i + 1}`,
          description: `Maintenance work required for bus ${bus.id}`,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          status: status,
          due_date: dueDate.toISOString().split('T')[0],
          completed_at: status === 'completed' ? dueDate.toISOString() : null,
        });
      }

      const { error: workOrderError } = await supabase.from('work_orders').insert(workOrders);
      results.push(workOrderError ? `Work Orders: Error - ${workOrderError.message}` : `Work Orders: Created ${workOrders.length} work orders`);
    }

    // Step 6: Create stock requests
    const { data: inventoryItems } = await supabase.from('inventory_items').select('id, name').limit(10);
    const { data: storekeepers } = await supabase.from('user_roles')
      .select('user_id')
      .eq('role', 'storekeeper')
      .limit(1);

    if (inventoryItems && inventoryItems.length > 0 && storekeepers && storekeepers.length > 0) {
      const stockRequests = [];
      
      for (let i = 0; i < 5; i++) {
        const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
        const storekeeper = storekeepers[0];
        const statuses: Array<'pending' | 'approved' | 'rejected' | 'fulfilled'> = ['pending', 'approved', 'fulfilled'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        stockRequests.push({
          item_id: item.id,
          requested_by: storekeeper.user_id,
          quantity_requested: Math.floor(Math.random() * 20) + 5,
          status: status,
          notes: `Stock replenishment for ${item.name}`,
        });
      }

      const { error: stockError } = await supabase.from('stock_requests').insert(stockRequests);
      results.push(stockError ? `Stock Requests: Error - ${stockError.message}` : `Stock Requests: Created ${stockRequests.length} requests`);
    }

    // Step 7: Create transactions
    const { data: accounts } = await supabase.from('user_roles')
      .select('user_id')
      .eq('role', 'accounts')
      .limit(1);

    if (accounts && accounts.length > 0) {
      const transactions = [];
      const transactionTypes = ['income', 'expense'];
      
      for (let i = 0; i < 15; i++) {
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        const categories = type === 'income' 
          ? ['Ticket Sales', 'Service Fees', 'Other Income']
          : ['Fuel', 'Maintenance', 'Salaries', 'Supplies', 'Other Expenses'];
        
        transactions.push({
          type: type,
          category: categories[Math.floor(Math.random() * categories.length)],
          amount: type === 'income' 
            ? Math.floor(Math.random() * 500000) + 100000
            : Math.floor(Math.random() * 200000) + 10000,
          description: `${type === 'income' ? 'Revenue' : 'Expense'} transaction`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_by: accounts[0].user_id,
        });
      }

      const { error: transError } = await supabase.from('transactions').insert(transactions);
      results.push(transError ? `Transactions: Error - ${transError.message}` : `Transactions: Created ${transactions.length} transactions`);
    }

    // Step 8: Create complaints
    if (passengers && passengers.length > 0) {
      const complaints = [];
      const complaintTypes = ['delay', 'service', 'comfort', 'safety', 'other'];
      const statuses: Array<'open' | 'in_progress' | 'resolved' | 'closed'> = ['open', 'in_progress', 'resolved'];
      
      for (let i = 0; i < 5; i++) {
        const passenger = passengers[Math.floor(Math.random() * passengers.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        complaints.push({
          user_id: passenger.user_id,
          category: complaintTypes[Math.floor(Math.random() * complaintTypes.length)],
          subject: `Complaint #${i + 1}`,
          description: `Customer complaint regarding service quality`,
          status: status,
          priority: status === 'open' ? 'medium' : 'low',
          created_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      const { error: complaintError } = await supabase.from('complaints').insert(complaints);
      results.push(complaintError ? `Complaints: Error - ${complaintError.message}` : `Complaints: Created ${complaints.length} complaints`);
    }

    // Step 9: Create incidents
    if (drivers && drivers.length > 0) {
      const incidents = [];
      const incidentTypes = ['accident', 'breakdown', 'theft', 'vandalism', 'other'];
      const severities = ['low', 'medium', 'high'];
      
      for (let i = 0; i < 3; i++) {
        const driver = drivers[Math.floor(Math.random() * drivers.length)];
        
        incidents.push({
          driver_id: driver.id,
          incident_type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
          description: `Incident report #${i + 1}`,
          location_description: 'Lagos-Ibadan Expressway',
          severity: severities[Math.floor(Math.random() * severities.length)],
          status: 'open',
          reported_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      const { error: incidentError } = await supabase.from('incidents').insert(incidents);
      results.push(incidentError ? `Incidents: Error - ${incidentError.message}` : `Incidents: Created ${incidents.length} incidents`);
    }

    // Step 10: Create notifications
    const allUserIds = Array.from(createdUsers.values());
    if (allUserIds.length > 0) {
      const notifications = [];
      const notificationTypes = ['booking', 'maintenance', 'payment', 'system'];
      
      for (let i = 0; i < 20; i++) {
        const userId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        
        notifications.push({
          user_id: userId,
          title: `Notification #${i + 1}`,
          message: `You have a new ${type} notification`,
          type: type,
          is_read: Math.random() > 0.5,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      const { error: notifError } = await supabase.from('notifications').insert(notifications);
      results.push(notifError ? `Notifications: Error - ${notifError.message}` : `Notifications: Created ${notifications.length} notifications`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comprehensive sample data created successfully!',
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
