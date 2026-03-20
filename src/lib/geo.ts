// Utility functions for GPS calculations (distance, bearing, speed)

export type LatLngTime = {
  latitude: number;
  longitude: number;
  timestamp: number; // ms since epoch
};

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function haversineDistanceMeters(a: LatLngTime, b: LatLngTime) {
  const R = 6371000; // meters
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// Returns bearing in degrees [0..360)
export function bearingDegrees(a: LatLngTime, b: LatLngTime) {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Returns speed in km/h or null if cannot compute reliably
export function speedKmhFromSamples(a: LatLngTime, b: LatLngTime) {
  const dtMs = b.timestamp - a.timestamp;
  if (dtMs <= 0) return null;

  const distM = haversineDistanceMeters(a, b);
  // Ignore tiny jitter to avoid bogus high speeds when stationary
  if (distM < 3) return 0;

  const speedMps = distM / (dtMs / 1000);
  const kmh = speedMps * 3.6;

  // Basic sanity clamp (can be adjusted later)
  if (!Number.isFinite(kmh) || kmh < 0 || kmh > 160) return null;
  return kmh;
}
