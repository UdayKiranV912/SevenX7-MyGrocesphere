
import React from 'react';
import { useStore } from '../contexts/StoreContext';
import { UserProfile } from '../components/UserProfile';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, setUser, setCurrentView } = useStore();
  
  const handleLogout = () => {
    setUser({ isAuthenticated: false, phone: '', location: null });
    setCurrentView('SHOP');
  };

  const handleUpdate = (data: any) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="animate-fade-in">
      <UserProfile 
        user={user} 
        onUpdateUser={handleUpdate} 
        onLogout={handleLogout} 
        onBack={onBack} 
      />
    </div>
  );
};
