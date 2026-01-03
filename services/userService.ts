
import { UserState } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * CUSTOMER REGISTRATION
 * Strictly assigns 'customer' role and creates the profile record.
 */
export const registerUser = async (email: string, pass: string, name: string, phone: string) => {
    if (!isSupabaseConfigured) {
        throw new Error("Backend not configured.");
    }

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
        // Create initial profile record
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            phone: phone,
            email: email,
            role: 'customer',
            approval_status: 'pending', 
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        if (profileError) console.error("Profile creation failed:", profileError.message);
    }

    return data.user;
};

/**
 * CUSTOMER LOGIN
 * Fetches profile details with improved resiliency and fallback for new users.
 */
export const loginUser = async (email: string, pass: string): Promise<UserState> => {
    if (!isSupabaseConfigured) throw new Error("Ecosystem connection not initialized.");

    const { data, error } = await (supabase.auth as any).signInWithPassword({
        email,
        password: pass
    });

    if (error) throw error;

    // Retry logic for profile fetch to handle signup race conditions
    let profileData = null;
    let retries = 3;
    
    while (retries > 0) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        if (profile) {
            profileData = profile;
            break;
        }
        
        // Wait 1 second before retry
        await new Promise(r => setTimeout(r, 1000));
        retries--;
    }

    // Final fallback if profile row is completely missing after retries
    if (!profileData) {
        console.warn("Profile row missing after retries. Creating temporary session stub.");
        const { data: stub, error: stubError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            full_name: email.split('@')[0],
            role: 'customer',
            approval_status: 'pending'
        }).select().single();
        
        if (stubError) throw new Error("Authentication successful but profile initialization failed. Please try again.");
        profileData = stub;
    }

    return {
        isAuthenticated: true,
        id: data.user.id,
        name: profileData?.full_name || email.split('@')[0],
        phone: profileData?.phone || '',
        email: email,
        location: profileData?.current_lat ? { lat: profileData.current_lat, lng: profileData.current_lng } : null,
        address: profileData?.address || '',
        neighborhood: profileData?.neighborhood || '',
        savedCards: [],
        verificationStatus: profileData?.approval_status || 'pending',
        isLiveGPS: false,
        role: 'customer'
    };
};

export const updateUserProfile = async (id: string, updates: any) => {
    // Customers can't update profiles directly in this version - read only.
    console.warn("User update blocked. Profiles are strictly managed by Admin.");
    return true;
};
