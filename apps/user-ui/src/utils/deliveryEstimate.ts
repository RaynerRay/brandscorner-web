export type DeliveryHubKey = "harare" | "bulawayo";

export type DeliveryHubInfo = {
  key: DeliveryHubKey;
  lat: number;
  lon: number;
  referenceLabel: string;
};

export const DELIVERY_HUBS: Record<DeliveryHubKey, DeliveryHubInfo> = {
  harare: {
    key: "harare",
    lat: -17.82587,
    lon: 31.04952,
    referenceLabel: "Chinhoyi Street & Albion Street, Harare, Zimbabwe",
  },
  bulawayo: {
    key: "bulawayo",
    lat: -20.15495,
    lon: 28.58485,
    referenceLabel: "Corner Fort Street & 6th Avenue, Bulawayo CBD, Zimbabwe",
  },
};

/** Match Harare / Bulawayo for hub-based distance (allows common variants like “Harare CBD”). */
export function deliveryHubForCity(city: string): DeliveryHubKey | null {
  const n = city.trim().toLowerCase();
  if (!n) return null;
  if (n === "harare" || n.startsWith("harare ") || n.endsWith(" harare"))
    return "harare";
  if (n === "bulawayo" || n.startsWith("bulawayo ") || n.endsWith(" bulawayo"))
    return "bulawayo";
  return null;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Approximate road distance from crow-flight km (urban winding). */
export function approxRoadKmFromStraightLine(straightKm: number): number {
  return straightKm * 1.35;
}

/** Typical dispatch + driving band shown to shoppers (not a guarantee). */
export function formatAvgDeliveryTimeRange(roadKmApprox: number): string {
  const prepMin = 22;
  const travelMin = (roadKmApprox / 21) * 60;
  const mid = prepMin + travelMin;
  const lo = Math.max(25, Math.round(mid * 0.88));
  const hi = Math.max(lo + 10, Math.round(mid * 1.15));
  return `${lo}–${hi} min`;
}

export function buildGeocodeQuery(street: string, city: string, country: string) {
  const parts = [street.trim(), city.trim(), country.trim() || "Zimbabwe"].filter(
    Boolean,
  );
  return parts.join(", ");
}
