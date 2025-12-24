
import { UserState } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export const registerUser = async (email: string, pass: string, name: string, phone: string) => {
    if (!isSupabaseConfigured) {
        throw new Error("Backend not configured.");
    }

    const { data, error } = await supabase.auth.signUp({
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

    if (error) throw error;

    if (data.user) {
        // Create profile with 'pending' status. Only super-admin can change this to 'verified' via dashboard.
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            phone_number: phone,
            email: email,
            role: 'customer',
            verificationStatus: 'pending' 
        });
        if (profileError) console.error("Profile sync error:", profileError);
    }

    return data.user;
};

export const submitAccessCode = async (userId: string, code: string) => {
    if (!isSupabaseConfigured) return true;
    
    // Updates the profile with the code for admin review
    const { error } = await supabase
        .from('profiles')
        .update({ submitted_verification_code: code })
        .eq('id', userId);
    
    if (error) throw error;
    return true;
};

export const loginUser = async (email: string, pass: string): Promise<UserState> => {
    if (!isSupabaseConfigured) {
        throw new Error("Backend not configured.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass
    });

    if (error) throw error;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    // The core logic: block login if not verified by Super Admin
    if (!profile || profile.verificationStatus === 'pending') {
        throw new Error("AWAITING_APPROVAL");
    }
    
    if (profile.verificationStatus === 'rejected') {
        throw new Error("Account rejected by administrator.");
    }

    return {
        isAuthenticated: true,
        id: data.user.id,
        name: profile.full_name || email.split('@')[0],
        phone: profile.phone_number || '',
        email: email,
        location: null,
        address: profile.address || '',
        savedCards: [],
        verificationStatus: profile.verificationStatus
    };
};

export const updateUserProfile = async (id: string, updates: any) => {
    if (!isSupabaseConfigured) return true;
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
    if (error) throw error;
    return true;
};
