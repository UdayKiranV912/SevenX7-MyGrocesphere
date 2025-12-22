
import { UserState } from '../types';

export const registerUser = async (email: string, pass: string, name: string, phone: string) => {
    // In a production app with Supabase, this would be an 'auth.signUp' call.
    // For this environment, we simulate a successful DB write.
    console.log("DB Write: Registering user", { email, name, phone });
    return { id: 'user_' + Math.random().toString(36).substr(2, 9), email, name, phone };
};

export const loginUser = async (email: string, pass: string, providedName?: string, providedPhone?: string): Promise<UserState> => {
    // If name/phone are provided (from a registration flow), use them.
    // Otherwise, derive a name from the email for the session.
    const nameFromEmail = email.split('@')[0];
    const derivedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    
    return {
        isAuthenticated: true,
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: providedName || derivedName, 
        phone: providedPhone || '9XXXXXXXX0',
        email: email,
        location: null, 
        address: '', 
        savedCards: []
    };
};

export const updateUserProfile = async (id: string, updates: any) => {
    // Simulated profile update
    return true;
};
