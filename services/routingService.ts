
export interface RouteData {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Average delivery speed in m/s (approx 25 km/h)
 */
export const AVG_DELIVERY_SPEED_MPS = 6.94;

export const getRoute = async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<RouteData> => {
  // Defensive check for identical points to prevent division by zero or empty routes
  if (startLat === endLat && startLng === endLng) {
    return {
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distance: 0,
      duration: 0
    };
  }

  const fallbackDist = calculateHaversineDistance(startLat, startLng, endLat, endLng);
  const fallbackData: RouteData = {
    coordinates: [[startLat, startLng], [endLat, endLng]],
    distance: fallbackDist,
    duration: fallbackDist / AVG_DELIVERY_SPEED_MPS
  };

  try {
    // We use a shorter timeout for the routing service to ensure the UI feels responsive even when the routing server is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
        return fallbackData;
    }
    
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // Ensure we have valid coordinates
      if (route.geometry && route.geometry.coordinates && route.geometry.coordinates.length > 0) {
        return {
          // OSRM returns [lng, lat], we convert to [lat, lng] for Leaflet
          coordinates: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
          distance: route.distance,
          duration: route.duration
        };
      }
    }
    
    return fallbackData;
  } catch (error) {
    // Silent fallback to avoid alarming logs for what is a standard resilience strategy
    return fallbackData;
  }
};

/**
 * Calculates the straight-line distance between two points in meters
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates a point on a line between two points at a given percentage (0-1)
 */
export const interpolatePosition = (p1: [number, number], p2: [number, number], factor: number): [number, number] => {
  return [
    p1[0] + (p2[0] - p1[0]) * factor,
    p1[1] + (p2[1] - p1[1]) * factor
  ];
};
