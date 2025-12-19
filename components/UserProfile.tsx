
import React, { useState } from 'react';
import { UserState, SavedCard } from '../types';
import { updateUserProfile } from '../services/userService';
import SevenX7Logo from './SevenX7Logo';

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
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || ''
  });

  // Payment Form State
  const [newPayment, setNewPayment] = useState({
    type: 'UPI' as 'VISA' | 'MASTERCARD' | 'UPI',
    upiId: '',
    last4: '',
    label: ''
  });

  const handleSaveProfile = async () => {
    if (!user.id) return;
    try {
      await updateUserProfile(user.id, { 
          full_name: formData.name,
          email: formData.email,
          phone_number: formData.phone,
          address: formData.address
      });
      onUpdateUser(formData);
      setIsEditing(false);
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  const handleAddPayment = () => {
    if (!newPayment.label) return;
    const card: SavedCard = {
      id: `pay_${Date.now()}`,
      ...newPayment
    };
    onUpdateUser({ savedCards: [...(user.savedCards || []), card] });
    setShowAddPayment(false);
    setNewPayment({ type: 'UPI', upiId: '', last4: '', label: '' });
  };

  const handleDeletePayment = (id: string) => {
    onUpdateUser({ savedCards: user.savedCards?.filter(c => c.id !== id) });
  };

  const handleBackNavigation = () => {
      if (activeSection !== 'MENU') {
          setActiveSection('MENU');
          setShowAddPayment(false);
      } else {
          onBack?.();
      }
  };

  return (
    <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
                <button onClick={handleBackNavigation} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 active:scale-95 transition-transform border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <h1 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                    {activeSection === 'MENU' ? 'My Profile' : activeSection === 'PAYMENT' ? 'Payments' : 'Profile'}
                </h1>
            </div>
            <SevenX7Logo size="xs" />
        </div>

        <div className="px-6 py-6 pb-24 space-y-6">
            {activeSection === 'MENU' && (
                <div className="space-y-6 animate-fade-in">
                    {/* User Card */}
                    <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-2xl text-white shadow-lg border-2 border-white">
                            {user.name?.charAt(0) || '👤'}
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <input 
                                    className="font-black text-lg text-slate-900 border-b-2 border-emerald-500 w-full outline-none bg-transparent py-1"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Your Name"
                                />
                            ) : (
                                <h2 className="font-black text-lg text-slate-900 leading-tight">{user.name || 'Member'}</h2>
                            )}
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Verified Account</p>
                        </div>
                        <button 
                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                        >
                            {isEditing ? 'Save' : 'Edit'}
                        </button>
                    </div>

                    {/* Editable Fields */}
                    {isEditing && (
                        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm animate-slide-up space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block">Mobile Number</label>
                                <input 
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    type="tel"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                                <input 
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    type="email"
                                />
                            </div>
                            <button 
                                onClick={handleSaveProfile}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all mt-2"
                            >
                                Confirm Updates
                            </button>
                        </div>
                    )}

                    {/* Menu Items */}
                    {!isEditing && (
                        <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                            {[
                                { label: 'Saved Addresses', icon: '📍', value: user.address || 'Click to set address', action: () => setIsEditing(true) },
                                { label: 'Payment Methods', icon: '💳', value: `${user.savedCards?.length || 0} Saved`, action: () => setActiveSection('PAYMENT') },
                                { label: 'Terms & Conditions', icon: '📜', value: 'Privacy Policy', action: () => {} },
                                { label: 'Sign Out', icon: '🚪', value: 'Close secure session', action: onLogout, destructive: true },
                            ].map((item, i) => (
                                <button key={i} onClick={item.action} className="w-full p-5 flex items-center gap-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-black ${item.destructive ? 'text-red-600' : 'text-slate-900'}`}>{item.label}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[200px]">{item.value}</p>
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
                        <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-widest">Saved Methods</h3>
                        <button onClick={() => setShowAddPayment(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Add New</button>
                    </div>

                    <div className="space-y-3">
                        {user.savedCards?.map(card => (
                            <div key={card.id} className="bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl border border-slate-100">
                                        {card.type === 'UPI' ? '📱' : '💳'}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">{card.label}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 font-mono mt-0.5">
                                            {card.type === 'UPI' ? card.upiId : `**** **** **** ${card.last4}`}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeletePayment(card.id)} className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-100">✕</button>
                            </div>
                        ))}
                    </div>

                    {showAddPayment && (
                        <div className="bg-white p-6 rounded-[28px] border-2 border-emerald-500 shadow-xl animate-slide-up space-y-4">
                            <select 
                                className="w-full bg-slate-50 p-4 rounded-xl text-sm font-black outline-none border border-slate-200"
                                value={newPayment.type}
                                onChange={e => setNewPayment({...newPayment, type: e.target.value as any})}
                            >
                                <option value="UPI">UPI ID</option>
                                <option value="VISA">VISA Card</option>
                                <option value="MASTERCARD">Mastercard</option>
                            </select>
                            <input 
                                placeholder="Label (e.g. My PhonePe)"
                                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-black outline-none"
                                value={newPayment.label}
                                onChange={e => setNewPayment({...newPayment, label: e.target.value})}
                            />
                            {newPayment.type === 'UPI' ? (
                                <input 
                                    placeholder="UPI ID (user@bank)"
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-black outline-none"
                                    value={newPayment.upiId}
                                    onChange={e => setNewPayment({...newPayment, upiId: e.target.value})}
                                />
                            ) : (
                                <input 
                                    placeholder="Last 4 Digits"
                                    maxLength={4}
                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-black outline-none"
                                    value={newPayment.last4}
                                    onChange={e => setNewPayment({...newPayment, last4: e.target.value.replace(/\D/g, '')})}
                                />
                            )}
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowAddPayment(false)} className="flex-1 py-4 text-[11px] font-black uppercase text-slate-500 tracking-widest bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleAddPayment} className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg">Save Method</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
