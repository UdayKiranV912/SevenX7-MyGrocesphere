
import { UserState } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export const registerUser = async (email: string, pass: string, name: string, phone: string) => {
    if (!isSupabaseConfigured) {
        throw new Error("Backend not configured.");
    }

    // Cast to any to handle potential local SDK type mismatches
    const { data, error: authError } = await (supabase.auth as any).signUp({
        email,
        password: pass,
        options: {
            data: {
                full_name: name,
                phone: phone,
                role: 'customer'
            }
        }
    });

    if (authError) throw authError;

    if (data.user) {
        // Aligned with SQL: profiles(id, role, full_name, email, phone, approval_status)
        // No more verification_codes table used in this flow
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            phone: phone,
            email: email,
            role: 'customer',
            approval_status: 'pending', 
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        if (profileError) console.error("Profile sync failed:", profileError.message);
    }

    return data.user;
};

export const loginUser = async (email: string, pass: string): Promise<UserState> => {
    if (!isSupabaseConfigured) throw new Error("Ecosystem connection not initialized.");

    const { data, error } = await (supabase.auth as any).signInWithPassword({
        email,
        password: pass
    });

    if (error) throw error;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError) {
        // If profile doesn't exist yet, we might still be in the signup-sync race
        throw new Error("Profile initializing. Please wait 60 seconds.");
    }

    return {
        isAuthenticated: true,
        id: data.user.id,
        name: profile?.full_name || email.split('@')[0],
        phone: profile?.phone || '',
        email: email,
        location: profile?.current_lat ? { lat: profile.current_lat, lng: profile.current_lng } : null,
        address: profile?.address || '',
        neighborhood: profile?.neighborhood || '',
        savedCards: [],
        verificationStatus: profile?.approval_status || 'pending',
        isLiveGPS: false
    };
};

export const submitAccessCode = async (userId: string, code: string) => {
    // This is now a legacy function as the user requested "no other verification code"
    // and manual approval within 2 minutes instead.
    return true;
};

export const updateUserProfile = async (id: string, updates: any) => {
    if (!isSupabaseConfigured) return true;

    const dbUpdates: any = { ...updates };
    if (updates.location) {
        dbUpdates.current_lat = updates.location.lat;
        dbUpdates.current_lng = updates.location.lng;
        delete dbUpdates.location;
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            ...dbUpdates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw error;
    return true;
};
