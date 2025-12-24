
import { Store } from '../types';
import { supabase } from './supabase';

export const fetchVerifiedStores = async (lat: number, lng: number): Promise<Store[]> => {
    // Queries verified and currently open stores
    // Note: In production, we'd use a PostGIS spatial query for 'around:radius'.
    // Here we fetch verified partners and will filter by distance client-side for simplicity.
    const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_verified', true)
        .eq('is_open', true);

    if (error) {
        console.error("Fetch stores error:", error);
        return [];
    }

    if (!stores || stores.length === 0) return [];

    return stores.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        rating: 4.5,
        distance: 'Nearby',
        lat: parseFloat(s.lat) || 12.9716,
        lng: parseFloat(s.lng) || 77.5946,
        isOpen: s.is_open,
        type: (s.category as any) || 'general',
        store_type: 'grocery',
        availableProductIds: [], 
        upiId: s.upi_id
    }));
};

export const fetchStoreInventory = async (storeId: string) => {
    const { data, error } = await supabase
        .from('inventory')
        .select('product_id, price, in_stock')
        .eq('store_id', storeId)
        .eq('in_stock', true);
    
    if (error) {
        console.error("Inventory error:", error);
        return [];
    }
    return data;
};

export const submitSellerRating = async (customerId: string, storeId: string, orderId: string, rating: number, comment: string) => {
    const { error } = await supabase
        .from('seller_ratings')
        .insert({
            customer_id: customerId,
            store_id: storeId,
            order_id: orderId,
            rating: rating,
            review: comment
        });
    return { error };
};
