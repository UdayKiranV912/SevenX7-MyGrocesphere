
import { UserState } from '../types';

export const registerUser = async (email: string, pass: string, name: string, phone: string) => {
    // Mock registration
    return { id: 'user_' + Date.now(), email, name, phone };
};

export const loginUser = async (email: string, pass: string): Promise<UserState> => {
    // Mock login
    return {
        isAuthenticated: true,
        id: 'user_123',
        name: 'John Doe',
        phone: '9876543210',
        email: email,
        location: { lat: 12.9716, lng: 77.5946 },
        address: 'MG Road, Bengaluru',
        savedCards: []
    };
};

export const updateUserProfile = async (id: string, updates: any) => {
    // Mock update
    return true;
};
