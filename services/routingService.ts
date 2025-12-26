
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
  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
    if (!response.ok) throw new Error("Routing failed");
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        // OSRM returns [lng, lat], we need [lat, lng]
        coordinates: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
        distance: route.distance,
        duration: route.duration
      };
    }
    
    // Fallback to straight line if OSRM fails
    const dist = calculateHaversineDistance(startLat, startLng, endLat, endLng);
    return {
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distance: dist,
      duration: dist / AVG_DELIVERY_SPEED_MPS
    };
  } catch (error) {
    console.error("Routing error:", error);
    const dist = calculateHaversineDistance(startLat, startLng, endLat, endLng);
    return {
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distance: dist,
      duration: dist / AVG_DELIVERY_SPEED_MPS
    };
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
