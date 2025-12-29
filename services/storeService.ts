
import { Store, Product } from '../types';
import { supabase } from './supabase';
import { INITIAL_PRODUCTS } from '../constants';

export const fetchVerifiedStores = async (lat: number, lng: number): Promise<Store[]> => {
    // Aligned with 'customer_stores' view provided in the SQL schema.
    // Removed 'store_type' and 'upi_id' as they are not present in the view definition and causing errors.
    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, address, lat, lng, is_open')
        .eq('is_open', true);

    if (error) {
        console.error("Partner sync failed:", error.message || error);
        return [];
    }

    if (!stores || stores.length === 0) return [];

    return stores.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        rating: 4.5, 
        distance: 'Nearby',
        lat: parseFloat(s.lat as any) || 12.9716,
        lng: parseFloat(s.lng as any) || 77.5946,
        isOpen: s.is_open,
        type: 'general',
        store_type: 'grocery', // Defaulting as it's missing from the current schema
        availableProductIds: [], 
        upiId: 'merchant@upi', // Fallback default
        isRegistered: true
    }));
};

export const fetchStoreInventory = async (store_id: string) => {
    // Aligned with 'customer_store_products' logic in SQL schema
    const { data, error } = await supabase
        .from('inventory')
        .select(`
            product_id, 
            price, 
            in_stock,
            products:product_id (
                name,
                brand,
                mrp,
                emoji,
                brand_logo_url,
                category
            )
        `)
        .eq('store_id', store_id)
        .eq('in_stock', true);
    
    if (error) {
        console.error("Inventory sync failed:", error.message || error);
        return [];
    }

    // Mapping to our internal Product structure
    return data.map(item => {
        const p = item.products as any;
        return {
            product_id: item.product_id,
            price: item.price,
            in_stock: item.in_stock,
            details: {
                id: item.product_id,
                name: p?.name,
                brand: p?.brand,
                mrp: p?.mrp,
                emoji: p?.emoji || '📦',
                brand_logo_url: p?.brand_logo_url,
                category: p?.category || 'General',
                price: item.price
            }
        };
    });
};

export const submitSellerRating = async (customerId: string, storeId: string, orderId: string, rating: number, comment: string) => {
    const { error } = await supabase
        .from('seller_ratings')
        .insert({
            customer_id: customerId,
            store_id: storeId,
            order_id: orderId,
            rating: rating,
            review: comment,
            created_at: new Date().toISOString()
        });
    return { error };
};
