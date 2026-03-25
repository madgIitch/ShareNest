export function hashAddress(lat: number, lng: number, precision = 3): string {
  return `${lat.toFixed(precision)}_${lng.toFixed(precision)}`;
}
