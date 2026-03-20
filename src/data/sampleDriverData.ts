// Sample data for driver pages when no real data exists

export const sampleTrips = [
  {
    id: 'sample-trip-1',
    trip_date: new Date().toISOString().split('T')[0],
    departure_time: '06:30',
    arrival_time: '10:45',
    status: 'scheduled',
    available_seats: 38,
    route: {
      name: 'Lagos - Ibadan Express',
      origin: 'Lagos (Jibowu)',
      destination: 'Ibadan (Challenge)',
      distance_km: 128,
      estimated_duration_minutes: 135,
    },
    bus: {
      registration_number: 'LAG-234-XY',
      model: 'Toyota Coaster',
      capacity: 42,
    },
  },
  {
    id: 'sample-trip-2',
    trip_date: new Date().toISOString().split('T')[0],
    departure_time: '14:00',
    arrival_time: '18:30',
    status: 'scheduled',
    available_seats: 25,
    route: {
      name: 'Lagos - Benin Route',
      origin: 'Lagos (Ojota)',
      destination: 'Benin City (Ring Road)',
      distance_km: 312,
      estimated_duration_minutes: 270,
    },
    bus: {
      registration_number: 'LAG-567-AB',
      model: 'Mercedes Sprinter',
      capacity: 32,
    },
  },
  {
    id: 'sample-trip-3',
    trip_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    departure_time: '07:00',
    arrival_time: '09:30',
    status: 'scheduled',
    available_seats: 45,
    route: {
      name: 'Lagos - Abeokuta',
      origin: 'Lagos (Berger)',
      destination: 'Abeokuta (Panseke)',
      distance_km: 77,
      estimated_duration_minutes: 90,
    },
    bus: {
      registration_number: 'LAG-890-CD',
      model: 'Higer Bus',
      capacity: 49,
    },
  },
];

// Individual passenger entries for the manifest
export interface PassengerManifestEntry {
  id: string;
  firstName: string;
  lastName: string;
  seatNumber: number;
  phone: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  boardingStop: string;
  alightingStop: string;
}

export const samplePassengerManifest: PassengerManifestEntry[] = [
  {
    id: 'pax-1',
    firstName: 'Adebayo',
    lastName: 'Okonkwo',
    seatNumber: 5,
    phone: '0803 456 7890',
    nextOfKinName: 'Funke Okonkwo',
    nextOfKinPhone: '0802 345 6789',
    boardingStop: 'Lagos (Jibowu)',
    alightingStop: 'Ibadan (Challenge)',
  },
  {
    id: 'pax-2',
    firstName: 'Chioma',
    lastName: 'Okonkwo',
    seatNumber: 6,
    phone: '0803 456 7891',
    nextOfKinName: 'Funke Okonkwo',
    nextOfKinPhone: '0802 345 6789',
    boardingStop: 'Lagos (Jibowu)',
    alightingStop: 'Ibadan (Challenge)',
  },
  {
    id: 'pax-3',
    firstName: 'Emeka',
    lastName: 'Nwosu',
    seatNumber: 12,
    phone: '0705 123 4567',
    nextOfKinName: 'Grace Nwosu',
    nextOfKinPhone: '0706 234 5678',
    boardingStop: 'Lagos (Jibowu)',
    alightingStop: 'Sagamu Junction',
  },
  {
    id: 'pax-4',
    firstName: 'Fatima',
    lastName: 'Ibrahim',
    seatNumber: 18,
    phone: '0810 987 6543',
    nextOfKinName: 'Ahmed Ibrahim',
    nextOfKinPhone: '0811 876 5432',
    boardingStop: 'Berger',
    alightingStop: 'Ibadan (Challenge)',
  },
  {
    id: 'pax-5',
    firstName: 'Yusuf',
    lastName: 'Ibrahim',
    seatNumber: 19,
    phone: '0810 987 6544',
    nextOfKinName: 'Ahmed Ibrahim',
    nextOfKinPhone: '0811 876 5432',
    boardingStop: 'Berger',
    alightingStop: 'Ibadan (Challenge)',
  },
  {
    id: 'pax-6',
    firstName: 'Amina',
    lastName: 'Ibrahim',
    seatNumber: 20,
    phone: '0810 987 6545',
    nextOfKinName: 'Ahmed Ibrahim',
    nextOfKinPhone: '0811 876 5432',
    boardingStop: 'Berger',
    alightingStop: 'Ibadan (Challenge)',
  },
  {
    id: 'pax-7',
    firstName: 'Oluwaseun',
    lastName: 'Adeyemi',
    seatNumber: 25,
    phone: '0902 111 2222',
    nextOfKinName: 'Biodun Adeyemi',
    nextOfKinPhone: '0903 222 3333',
    boardingStop: 'Lagos (Jibowu)',
    alightingStop: 'Ibadan (Iwo Road)',
  },
  {
    id: 'pax-8',
    firstName: 'Ngozi',
    lastName: 'Eze',
    seatNumber: 30,
    phone: '0814 555 6666',
    nextOfKinName: 'Chidi Eze',
    nextOfKinPhone: '0815 666 7777',
    boardingStop: 'Mowe',
    alightingStop: 'Ibadan (Challenge)',
  },
  {
    id: 'pax-9',
    firstName: 'Kelechi',
    lastName: 'Eze',
    seatNumber: 31,
    phone: '0814 555 6667',
    nextOfKinName: 'Chidi Eze',
    nextOfKinPhone: '0815 666 7777',
    boardingStop: 'Mowe',
    alightingStop: 'Ibadan (Challenge)',
  },
  {
    id: 'pax-10',
    firstName: 'Obinna',
    lastName: 'Eze',
    seatNumber: 32,
    phone: '0814 555 6668',
    nextOfKinName: 'Chidi Eze',
    nextOfKinPhone: '0815 666 7777',
    boardingStop: 'Mowe',
    alightingStop: 'Ibadan (Challenge)',
  },
  {
    id: 'pax-11',
    firstName: 'Adaeze',
    lastName: 'Eze',
    seatNumber: 33,
    phone: '0814 555 6669',
    nextOfKinName: 'Chidi Eze',
    nextOfKinPhone: '0815 666 7777',
    boardingStop: 'Mowe',
    alightingStop: 'Ibadan (Challenge)',
  },
];

export const samplePassengers = [
  {
    id: 'booking-1',
    booking_number: 'BK20251225001',
    passenger_count: 2,
    seat_numbers: [5, 6],
    status: 'confirmed',
    boarding_stop: { stop_name: 'Lagos (Jibowu)' },
    alighting_stop: { stop_name: 'Ibadan (Challenge)' },
  },
  {
    id: 'booking-2',
    booking_number: 'BK20251225002',
    passenger_count: 1,
    seat_numbers: [12],
    status: 'confirmed',
    boarding_stop: { stop_name: 'Lagos (Jibowu)' },
    alighting_stop: { stop_name: 'Sagamu Junction' },
  },
  {
    id: 'booking-3',
    booking_number: 'BK20251225003',
    passenger_count: 3,
    seat_numbers: [18, 19, 20],
    status: 'confirmed',
    boarding_stop: { stop_name: 'Berger' },
    alighting_stop: { stop_name: 'Ibadan (Challenge)' },
  },
  {
    id: 'booking-4',
    booking_number: 'BK20251225004',
    passenger_count: 1,
    seat_numbers: [25],
    status: 'confirmed',
    boarding_stop: { stop_name: 'Lagos (Jibowu)' },
    alighting_stop: { stop_name: 'Ibadan (Iwo Road)' },
  },
  {
    id: 'booking-5',
    booking_number: 'BK20251225005',
    passenger_count: 4,
    seat_numbers: [30, 31, 32, 33],
    status: 'confirmed',
    boarding_stop: { stop_name: 'Mowe' },
    alighting_stop: { stop_name: 'Ibadan (Challenge)' },
  },
];

export const sampleIncidents = [
  {
    id: 'incident-1',
    incident_type: 'traffic_delay',
    description: 'Heavy traffic congestion at Third Mainland Bridge due to an accident ahead. Delayed by approximately 45 minutes.',
    severity: 'medium',
    status: 'resolved',
    reported_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    location_description: 'Third Mainland Bridge, Lagos',
    latitude: 6.4541,
    longitude: 3.4082,
    bus: { registration_number: 'LAG-234-XY' },
  },
  {
    id: 'incident-2',
    incident_type: 'breakdown',
    description: 'Engine overheating warning light came on. Pulled over safely and called for roadside assistance. Coolant leak detected.',
    severity: 'high',
    status: 'resolved',
    reported_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    location_description: 'Near Sagamu Interchange',
    latitude: 6.8289,
    longitude: 3.6369,
    bus: { registration_number: 'LAG-567-AB' },
  },
  {
    id: 'incident-3',
    incident_type: 'passenger_issue',
    description: 'Passenger became unwell during journey. Stopped at nearest clinic in Ore town for medical attention. Passenger later continued journey.',
    severity: 'medium',
    status: 'resolved',
    reported_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    location_description: 'Ore Town, Ondo State',
    latitude: 6.7510,
    longitude: 4.8757,
    bus: { registration_number: 'LAG-890-CD' },
  },
  {
    id: 'incident-4',
    incident_type: 'fuel_issue',
    description: 'Low fuel warning despite recent fill-up. Suspected fuel gauge malfunction. Proceeded to nearest fuel station to top up as precaution.',
    severity: 'low',
    status: 'reported',
    reported_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    location_description: 'Along Lagos-Ibadan Expressway',
    latitude: 6.7089,
    longitude: 3.5126,
    bus: { registration_number: 'LAG-234-XY' },
  },
];

export const sampleCurrentTrip = {
  id: 'current-trip',
  trip_date: new Date().toISOString().split('T')[0],
  departure_time: '06:30',
  status: 'in_progress',
  route: {
    name: 'Lagos - Ibadan Express',
    origin: 'Lagos (Jibowu)',
    destination: 'Ibadan (Challenge)',
  },
  bus: {
    registration_number: 'LAG-234-XY',
    capacity: 42,
  },
  bookings: samplePassengers,
};