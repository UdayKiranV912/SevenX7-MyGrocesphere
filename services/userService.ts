
import { UserState } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export const registerUser = async (email: string, pass: string, name: string, phone: string) => {
    if (!isSupabaseConfigured) {
        throw new Error("Backend not configured.");
    }

    const { data, error: authError } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
            data: {
                full_name: name,
                phone_number: phone,
                role: 'customer'
            }
        }
    });

    if (authError) {
        console.error("Auth Signup Error:", authError.message || authError);
        throw authError;
    }

    if (data.user) {
        // Create profile in the public.profiles table
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            phone_number: phone,
            email: email,
            role: 'customer',
            verification_status: 'pending', 
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        if (profileError) {
            console.error("Profile sync failed:", profileError.message || profileError);
        }
    }

    return data.user;
};

export const submitAccessCode = async (userId: string, code: string) => {
    if (!isSupabaseConfigured) return true;
    
    const { error } = await supabase
        .from('profiles')
        .update({ 
            submitted_verification_code: code,
            verification_submitted_at: new Date().toISOString() 
        })
        .eq('id', userId);
    
    if (error) throw error;
    return true;
};

export const loginUser = async (email: string, pass: string): Promise<UserState> => {
    if (!isSupabaseConfigured) {
        throw new Error("Ecosystem connection not initialized.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
    });

    if (error) throw error;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError || !profile || profile.verification_status !== 'approved') {
        throw new Error("AWAITING_APPROVAL");
    }
    
    if (profile.verification_status === 'rejected') {
        throw new Error("Account access denied by administrator.");
    }

    return {
        isAuthenticated: true,
        id: data.user.id,
        name: profile.full_name || email.split('@')[0],
        phone: profile.phone_number || '',
        email: email,
        location: profile.current_lat ? { lat: profile.current_lat, lng: profile.current_lng } : null,
        address: profile.address || '',
        neighborhood: profile.neighborhood || '',
        savedCards: [],
        verificationStatus: profile.verification_status,
        isLiveGPS: false
    };
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
