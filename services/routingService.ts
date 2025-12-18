
export const getRoute = async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<[number, number][]> => {
  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
    if (!response.ok) throw new Error("Routing failed");
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      // OSRM returns [lng, lat], we need [lat, lng]
      return data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    }
    return [[startLat, startLng], [endLat, endLng]];
  } catch (error) {
    console.error("Routing error:", error);
    return [[startLat, startLng], [endLat, endLng]];
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
