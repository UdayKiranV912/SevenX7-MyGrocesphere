import { Store } from '../types';
import { supabase } from './supabase';

export const fetchVerifiedStores = async (lat: number, lng: number): Promise<Store[]> => {
    // Queries verified partners strictly from the Supabase backend.
    // This represents the "Real-Time" partner network of registered local marts.
    const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_verified', true)
        .eq('is_open', true);

    if (error) {
        console.error("Partner sync failed:", error);
        return [];
    }

    if (!stores || stores.length === 0) return [];

    // Map database structure to UI Store type
    return stores.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        rating: s.rating || 4.5,
        distance: 'Nearby',
        lat: parseFloat(s.lat) || 12.9716,
        lng: parseFloat(s.lng) || 77.5946,
        isOpen: s.is_open,
        type: (s.category as any) || 'general',
        store_type: (s.store_type as any) || 'grocery',
        availableProductIds: [], 
        upiId: s.upi_id,
        isRegistered: true
    }));
};

export const fetchStoreInventory = async (storeId: string) => {
    const { data, error } = await supabase
        .from('inventory')
        .select('product_id, price, in_stock')
        .eq('store_id', storeId)
        .eq('in_stock', true);
    
    if (error) {
        console.error("Inventory sync failed:", error);
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