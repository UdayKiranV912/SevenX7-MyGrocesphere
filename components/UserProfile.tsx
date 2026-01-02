
import React, { useState } from 'react';
import { UserState, SavedCard } from '../types';
import { updateUserProfile } from '../services/userService';
import SevenX7Logo from './SevenX7Logo';
import AdsBanner from './AdsBanner';
import { MOCK_ADS } from '../constants';

interface UserProfileProps {
  user: UserState;
  onUpdateUser: (updatedData: Partial<UserState>) => void;
  onLogout: () => void;
  onBack?: () => void;
}

type ProfileSection = 'MENU' | 'PAYMENT' | 'LEGAL' | 'SUPPORT';

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser, onLogout, onBack }) => {
  const [activeSection, setActiveSection] = useState<ProfileSection>('MENU');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  
  const featuredAd = MOCK_ADS.find(ad => ad.partnerName.toLowerCase().includes('seven')) || MOCK_ADS[0];

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || ''
  });

  const [newPayment, setNewPayment] = useState({
    type: 'UPI' as 'UPI',
    upiId: '',
    label: ''
  });

  const handleSaveProfile = async () => {
    if (!user.id) return;
    try {
      await updateUserProfile(user.id, { 
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
      });
      onUpdateUser(formData);
      setIsEditing(false);
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  const handleAddPayment = () => {
    if (!newPayment.label || !newPayment.upiId) return;
    const card: SavedCard = { id: `pay_${Date.now()}`, ...newPayment, type: 'UPI' };
    onUpdateUser({ savedCards: [...(user.savedCards || []), card] });
    setShowAddPayment(false);
    setNewPayment({ type: 'UPI', upiId: '', label: '' });
  };

  const handleDeletePayment = (id: string) => {
    onUpdateUser({ savedCards: user.savedCards?.filter(c => c.id !== id) });
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
                <button onClick={() => activeSection === 'MENU' ? onBack?.() : setActiveSection('MENU')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <h1 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                    {activeSection === 'MENU' ? 'My Profile' : 'Settings'}
                </h1>
            </div>
            <SevenX7Logo size="xs" />
        </div>

        <div className="px-6 py-6 pb-40 space-y-6">
            {activeSection === 'MENU' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-2xl text-white shadow-lg border-2 border-white">
                            {user.name?.charAt(0) || '👤'}
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <input className="font-black text-base text-slate-900 border-b-2 border-emerald-500 w-full outline-none bg-transparent py-1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            ) : (
                                <h2 className="font-black text-lg text-slate-900 leading-tight">{user.name || 'Member'}</h2>
                            )}
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Verified Customer</p>
                        </div>
                        <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                            {isEditing ? 'Save' : 'Edit'}
                        </button>
                    </div>

                    <AdsBanner ad={featuredAd} />

                    {!isEditing && (
                        <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                            {[
                                { label: 'Addresses', icon: '📍', value: user.address || 'Manage location', action: () => setIsEditing(true) },
                                { label: 'Payments', icon: '📱', value: `${user.savedCards?.length || 0} Saved VPAs`, action: () => setActiveSection('PAYMENT') },
                                { label: 'Legal', icon: '📜', value: 'Terms & Privacy', action: () => setShowLegalModal(true) },
                                { label: 'Logout', icon: '🚪', value: 'Exit application', action: onLogout, destructive: true },
                            ].map((item, i) => (
                                <button key={i} onClick={item.action} className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl">{item.icon}</div>
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-black ${item.destructive ? 'text-red-600' : 'text-slate-900'}`}>{item.label}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.value}</p>
                                    </div>
                                    <span className="text-slate-300">›</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeSection === 'PAYMENT' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-widest">Saved VPA</h3>
                        <button onClick={() => setShowAddPayment(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Add VPA</button>
                    </div>
                    <div className="space-y-3">
                        {user.savedCards?.map(card => (
                            <div key={card.id} className="bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl border border-slate-100">📱</div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">{card.label}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 font-mono mt-0.5">{card.upiId}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeletePayment(card.id)} className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full">✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {showLegalModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowLegalModal(false)} />
                <div className="relative bg-white w-full max-w-md rounded-[32px] p-8 max-h-[80vh] overflow-y-auto">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Customer Terms</h2>
                    <div className="space-y-6 text-xs text-slate-600 font-medium leading-relaxed">
                        <p>1. Service: Facilitating local grocery commerce.</p>
                        <p>2. Payments: Secured by admin escrow.</p>
                        <p>3. Privacy: Location data is strictly used for order fulfillment.</p>
                    </div>
                    <button onClick={() => setShowLegalModal(false)} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Close</button>
                </div>
            </div>
        )}
    </div>
  );
};
