
export interface RouteData {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
}

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
    return {
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distance: 0,
      duration: 0
    };
  } catch (error) {
    console.error("Routing error:", error);
    return {
      coordinates: [[startLat, startLng], [endLat, endLng]],
      distance: 0,
      duration: 0
    };
  }
};

/**
 * Calculates a point on a line between two points at a given percentage (0-1)
 */
export const interpolatePosition = (p1: [number, number], p2: [number, number], factor: number): [number, number] => {
  return [
    p1[0] + (p2[0] - p1[0]) * factor,
    p1[1] + (p2[1] - p1[1]) * factor
  ];
};
