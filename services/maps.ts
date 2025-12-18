
export interface MapSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export const geocode = async (query: string): Promise<MapSearchResult[]> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
    if (!response.ok) throw new Error("Geocoding failed");
    return await response.json();
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<MapSearchResult | null> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    if (!response.ok) throw new Error("Reverse geocoding failed");
    return await response.json();
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};
