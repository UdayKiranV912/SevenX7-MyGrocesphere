import { UserState } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export const registerUser = async (email: string, pass: string, name: string, phone: string) => {
    if (!isSupabaseConfigured) {
        throw new Error("Backend not configured. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
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
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            phone_number: phone,
            email: email,
            role: 'customer',
            verificationStatus: 'pending' // Force initial state
        });
        if (profileError) console.error("Profile sync error:", profileError);
    }

    return data.user;
};

export const submitAccessCode = async (userId: string, code: string) => {
    if (!isSupabaseConfigured) return true;
    
    // In a real production environment, this would verify against a generated code.
    // Here we simulate the handshake by updating a 'submitted_code' field or similar.
    const { error } = await supabase
        .from('profiles')
        .update({ last_access_code: code })
        .eq('id', userId);
    
    if (error) throw error;
    return true;
};

export const loginUser = async (email: string, pass: string): Promise<UserState> => {
    if (!isSupabaseConfigured) {
        throw new Error("Backend not configured. Please use Demo Mode or configure environment variables.");
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

    if (profile?.verificationStatus === 'pending') {
        throw new Error("AWAITING_APPROVAL");
    }
    
    if (profile?.verificationStatus === 'rejected') {
        throw new Error("Your registration request was declined by the Admin.");
    }

    return {
        isAuthenticated: true,
        id: data.user.id,
        name: profile?.full_name || email.split('@')[0],
        phone: profile?.phone_number || '',
        email: email,
        location: null,
        address: profile?.address || '',
        savedCards: [],
        verificationStatus: profile?.verificationStatus || 'pending'
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
