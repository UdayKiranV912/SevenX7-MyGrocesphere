
import { Store } from '../types';
import { DAIRY_IDS, PRODUCE_IDS, GENERAL_IDS } from '../constants';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter'
];

/**
 * SIMULATED PARTNER DATABASE
 * In a real scenario, this matches OSM nodes against your Supabase SQL table.
 */
const VERIFIED_PARTNER_IDS = [
  'osm-node/28362678',
  'osm-way/4952778',
  'osm-node/53234234',
  'osm-node/12345678',
  'osm-node/245842103'
];

export const fetchRealStores = async (lat: number, lng: number, radius: number = 5000): Promise<Store[]> => {
  const query = `
    [out:json][timeout:25];
    (
      node["shop"~"supermarket|convenience|dairy|greengrocer|bakery|butcher"](around:${radius},${lat},${lng});
      way["shop"~"supermarket|convenience|dairy|greengrocer|bakery|butcher"](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (!data.elements) return [];

      return data.elements
        .filter((el: any) => el.tags && el.tags.name)
        .map((el: any) => {
          const shopType = el.tags.shop;
          let type: 'general' | 'dairy' | 'produce' = 'general';
          let availableProductIds = GENERAL_IDS;

          if (shopType === 'dairy' || shopType === 'bakery') {
            type = 'dairy';
            availableProductIds = DAIRY_IDS;
          } else if (shopType === 'greengrocer' || shopType === 'butcher') {
            type = 'produce';
            availableProductIds = PRODUCE_IDS;
          }

          const id = `osm-${el.id}`;
          
          // VERIFICATION LOGIC: 
          // Check if this OSM ID exists in our Partner Database.
          // For this simulation, we also auto-verify nodes divisible by 5.
          const isVerifiedInDB = VERIFIED_PARTNER_IDS.includes(id) || (el.id % 5 === 0);

          return {
            id,
            name: el.tags.name,
            address: el.tags['addr:street'] || el.tags['addr:full'] || 'Local Mart Partner',
            rating: 4.2 + (Math.random() * 0.7),
            distance: 'Nearby',
            lat: el.lat || el.center?.lat,
            lng: el.lon || el.center?.lon,
            isOpen: true,
            type: type,
            store_type: 'grocery',
            availableProductIds: availableProductIds,
            upiId: `${el.tags.name.toLowerCase().replace(/\s/g, '')}@okaxis`,
            isRegistered: isVerifiedInDB
          };
        })
        .filter((s: any) => s.lat && s.lng && s.isRegistered); // ONLY RETURN REGISTERED MARTS
    } catch (error) {
      console.warn(`Node ${endpoint} failed, trying secondary...`);
      continue;
    }
  }

  return []; 
};
