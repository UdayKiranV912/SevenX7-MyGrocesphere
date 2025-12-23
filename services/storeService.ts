
import { Store } from '../types';
import { supabase } from './supabase';

export const fetchVerifiedStores = async (lat: number, lng: number): Promise<Store[]> => {
    // Queries verified and currently open stores
    const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_verified', true)
        .eq('is_open', true);

    if (error) {
        console.error("Fetch stores error:", error);
        return [];
    }

    return stores.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        rating: 4.5, // Default rating or join from seller_ratings
        distance: 'Nearby',
        lat: s.lat || 12.9716, // Use lat/lng if columns exist, otherwise default center
        lng: s.lng || 77.5946,
        isOpen: s.is_open,
        type: 'general',
        store_type: 'grocery',
        availableProductIds: [], // To be populated via fetchStoreInventory
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
