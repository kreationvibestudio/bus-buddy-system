/**
 * Nigerian city coordinates for fallback map positions when GPS is unavailable.
 * Used to show in-progress trips on live tracking before driver enables GPS.
 */
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Abuja': { lat: 9.0579, lng: 7.4951 },
  'Abakaliki': { lat: 6.3249, lng: 8.1137 },
  'Abeokuta': { lat: 7.1475, lng: 3.3619 },
  'Ado Ekiti': { lat: 7.6211, lng: 5.2215 },
  'Akure': { lat: 7.2526, lng: 5.1931 },
  'Asaba': { lat: 6.1983, lng: 6.7289 },
  'Awka': { lat: 6.2104, lng: 7.0696 },
  'Bauchi': { lat: 10.3158, lng: 9.8442 },
  'Benin City': { lat: 6.3350, lng: 5.6270 },
  'Birnin Kebbi': { lat: 12.4539, lng: 4.1975 },
  'Calabar': { lat: 4.9517, lng: 8.3220 },
  'Damaturu': { lat: 11.7470, lng: 11.9608 },
  'Dutse': { lat: 11.7561, lng: 9.3390 },
  'Enugu': { lat: 6.4584, lng: 7.5464 },
  'Gombe': { lat: 10.2897, lng: 11.1673 },
  'Gusau': { lat: 12.1628, lng: 6.6642 },
  'Ibadan': { lat: 7.3775, lng: 3.9470 },
  'Ilorin': { lat: 8.4799, lng: 4.5418 },
  'Jalingo': { lat: 8.8933, lng: 11.3683 },
  'Jos': { lat: 9.8965, lng: 8.8583 },
  'Kaduna': { lat: 10.5222, lng: 7.4383 },
  'Kano': { lat: 12.0022, lng: 8.5920 },
  'Katsina': { lat: 13.0059, lng: 7.6000 },
  'Lafia': { lat: 8.4966, lng: 8.5150 },
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Lokoja': { lat: 7.7969, lng: 6.7433 },
  'Maiduguri': { lat: 11.8311, lng: 13.1510 },
  'Makurdi': { lat: 7.7333, lng: 8.5333 },
  'Minna': { lat: 9.6139, lng: 6.5569 },
  'Onitsha': { lat: 6.1498, lng: 6.7857 },
  'Osogbo': { lat: 7.7827, lng: 4.5418 },
  'Owerri': { lat: 5.4836, lng: 7.0334 },
  'Port Harcourt': { lat: 4.8156, lng: 7.0498 },
  'Sokoto': { lat: 13.0059, lng: 5.2476 },
  'Umuahia': { lat: 5.5249, lng: 7.4946 },
  'Uyo': { lat: 5.0513, lng: 7.9335 },
  'Yenagoa': { lat: 4.9261, lng: 6.2642 },
  'Yola': { lat: 9.2035, lng: 12.4954 },
};

const NIGERIA_CENTER = { lat: 9.0820, lng: 8.6753 };

export function getCityCoords(cityName: string | null | undefined): { lat: number; lng: number } {
  if (!cityName?.trim()) return NIGERIA_CENTER;
  const normalized = cityName.trim();
  return CITY_COORDS[normalized] ?? NIGERIA_CENTER;
}
