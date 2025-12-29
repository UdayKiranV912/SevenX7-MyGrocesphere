
import { UserState } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export const registerUser = async (email: string, pass: string, name: string, phone: string) => {
    if (!isSupabaseConfigured) {
        throw new Error("Backend not configured. Check VITE_SUPABASE_URL.");
    }

    // 1. Create the Auth User with metadata
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
        console.error("Auth Signup Error:", authError);
        throw authError;
    }

    if (data.user) {
        // 2. Create the Public Profile linked to the Auth ID
        // We use upsert to handle cases where the user might exist in Auth but profile was missed
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            phone_number: phone,
            email: email,
            role: 'customer',
            verificationStatus: 'pending',
            created_at: new Date().toISOString(),
            last_sign_in: new Date().toISOString()
        }, { onConflict: 'id' });
        
        if (profileError) {
            console.error("Critical Profile Sync Error:", profileError);
            // We don't throw here to allow the user to at least reach the verification step
            // but we log it for the developer. 
        }
    }

    return data.user;
};

export const submitAccessCode = async (userId: string, code: string) => {
    if (!isSupabaseConfigured) return true;
    
    // Updates the profile with the code for admin review
    const { error } = await supabase
        .from('profiles')
        .update({ 
            submitted_verification_code: code,
            verification_submitted_at: new Date().toISOString(),
            verificationStatus: 'pending' // Ensure it stays pending for admin check
        })
        .eq('id', userId);
    
    if (error) {
        console.error("Verification Submission Error:", error);
        throw error;
    }
    return true;
};

export const loginUser = async (email: string, pass: string): Promise<UserState> => {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase connection is not initialized.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
    });

    if (error) throw error;

    // Fetch profile data set by Admin or from registration
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (fetchError) {
        console.warn("Profile fetch failed, using Auth metadata fallback:", fetchError);
    }

    // Check verification status set by Super Admin
    if (!profile || profile.verificationStatus === 'pending') {
        throw new Error("AWAITING_APPROVAL");
    }
    
    if (profile.verificationStatus === 'rejected') {
        throw new Error("Account rejected by administrator.");
    }

    return {
        isAuthenticated: true,
        id: data.user.id,
        name: profile.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
        phone: profile.phone_number || data.user.user_metadata?.phone_number || '',
        email: email,
        location: null,
        address: profile.address || '',
        neighborhood: profile.neighborhood || '',
        savedCards: [],
        verificationStatus: profile.verificationStatus,
        isLiveGPS: false
    };
};

export const updateUserProfile = async (id: string, updates: any) => {
    if (!isSupabaseConfigured) return true;
    const { error } = await supabase
        .from('profiles')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);
    if (error) throw error;
    return true;
};
