
import { Store, Product } from '../types';
import { supabase } from './supabase';
import { INITIAL_PRODUCTS } from '../constants';

export const fetchVerifiedStores = async (lat: number, lng: number): Promise<Store[]> => {
    try {
        const { data: stores, error } = await supabase
            .from('stores')
            .select('id, name, address, lat, lng, approved')
            .eq('approved', true); // Aligned with SQL: approved boolean

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
            isOpen: true, // Default to true if not explicitly tracking status in SQL
            type: 'general',
            store_type: 'grocery', 
            availableProductIds: [], 
            upiId: 'merchant@upi',
            isRegistered: true
        }));
    } catch (err) {
        console.error("Failed to fetch stores due to network error:", err);
        return [];
    }
};

export const fetchStoreInventory = async (store_id: string) => {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select(`
                product_id, 
                price, 
                stock,
                active,
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
            .eq('active', true); // Aligned with SQL: active boolean
        
        if (error) {
            console.error("Inventory sync failed:", error.message || error);
            return [];
        }

        return data.map(item => {
            const p = item.products as any;
            return {
                product_id: item.product_id,
                price: item.price,
                stock: item.stock,
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
    } catch (err) {
        console.error("Failed to fetch inventory due to network error:", err);
        return [];
    }
};

export const submitSellerRating = async (customerId: string, storeId: string, orderId: string, rating: number, comment: string) => {
    try {
        const { error } = await supabase
            .from('ratings') // Aligned with SQL: ratings table
            .insert({
                customer_id: customerId,
                order_id: orderId,
                rating: rating,
                review: comment,
                created_at: new Date().toISOString()
            });
        return { error };
    } catch (err) {
        return { error: err };
    }
};
