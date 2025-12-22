
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
  const [showLegalModal, setShowLegalModal] = useState(false);
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || ''
  });

  // Payment Form State
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
    if (!newPayment.label || !newPayment.upiId) return;
    const card: SavedCard = {
      id: `pay_${Date.now()}`,
      ...newPayment,
      type: 'UPI'
    };
    onUpdateUser({ savedCards: [...(user.savedCards || []), card] });
    setShowAddPayment(false);
    setNewPayment({ type: 'UPI', upiId: '', label: '' });
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
    <div className="min-h-screen bg-slate-50 relative">
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

        <div className="px-6 py-6 pb-40 space-y-6">
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

                    {/* Ads Banner Section - Prominent Layout */}
                    <div className="relative overflow-hidden bg-slate-900 rounded-[32px] p-6 shadow-xl group border-2 border-white/10">
                         <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-brand-DEFAULT/20 rounded-full blur-3xl group-hover:bg-brand-DEFAULT/40 transition-colors duration-700"></div>
                         <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">Ads Banner</span>
                                <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">Sponsored</span>
                            </div>
                            <div>
                                <h3 className="text-white font-black text-2xl leading-none tracking-tight">SevenX7 Plus</h3>
                                <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest leading-relaxed">Unlock priority routing, zero handling fees, and exclusive community harvests from top marts.</p>
                            </div>
                            <button className="w-full bg-white text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">Get Plus Now</button>
                         </div>
                    </div>

                    {/* Menu Items */}
                    {!isEditing && (
                        <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                            {[
                                { label: 'Saved Addresses', icon: '📍', value: user.address || 'Click to set address', action: () => setIsEditing(true) },
                                { label: 'Payment Methods', icon: '📱', value: `${user.savedCards?.length || 0} UPI IDs`, action: () => setActiveSection('PAYMENT') },
                                { label: 'Terms & Conditions', icon: '📜', value: 'Privacy Policy', action: () => setShowLegalModal(true) },
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
                                <button onClick={() => handleDeletePayment(card.id)} className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-100">✕</button>
                            </div>
                        ))}
                    </div>

                    {showAddPayment && (
                        <div className="bg-white p-6 rounded-[28px] border-2 border-emerald-500 shadow-xl animate-slide-up space-y-4">
                            <input 
                                placeholder="Label (e.g. My PhonePe)"
                                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-black outline-none"
                                value={newPayment.label}
                                onChange={e => setNewPayment({...newPayment, label: e.target.value})}
                            />
                            <input 
                                placeholder="UPI ID (user@bank)"
                                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-black outline-none"
                                value={newPayment.upiId}
                                onChange={e => setNewPayment({...newPayment, upiId: e.target.value})}
                            />
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowAddPayment(false)} className="flex-1 py-4 text-[11px] font-black uppercase text-slate-500 tracking-widest bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleAddPayment} className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg">Save UPI</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Legal Modal */}
        {showLegalModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowLegalModal(false)} />
                <div className="relative bg-white w-full max-w-md rounded-[32px] p-8 max-h-[80vh] overflow-y-auto animate-scale-in">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Terms & Conditions</h2>
                    <div className="space-y-6 text-xs text-slate-600 font-medium leading-relaxed">
                        <section>
                            <h3 className="text-[10px] font-black text-slate-900 uppercase mb-2 tracking-widest">1. Use of Service</h3>
                            <p>Grocesphere is a platform connecting customers with local marts. We facilitate the delivery and pickup of grocery items.</p>
                        </section>
                        <section>
                            <h3 className="text-[10px] font-black text-slate-900 uppercase mb-2 tracking-widest">2. Payments</h3>
                            <p>All payments are processed securely via UPI intent directly to the platform admin.</p>
                        </section>
                        <section>
                            <h3 className="text-[10px] font-black text-slate-900 uppercase mb-2 tracking-widest">3. Delivery Policy</h3>
                            <p>Delivery times are estimates. A ₹30 delivery fee applies per store on all delivery orders.</p>
                        </section>
                        <section>
                            <h3 className="text-[10px] font-black text-slate-900 uppercase mb-2 tracking-widest">4. Privacy</h3>
                            <p>Your location data is only used for mart discovery and order delivery. We do not sell your personal information.</p>
                        </section>
                        <section className="pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase mb-2 tracking-widest">5. Map Attribution & Credits</h3>
                            <p className="mb-2">Map data and geocoding services are provided by <strong className="text-slate-900">OpenStreetMap</strong> (OSM).</p>
                            <p className="italic">© OpenStreetMap contributors. Map rendering via CartoDB.</p>
                        </section>
                    </div>
                    <button 
                        onClick={() => setShowLegalModal(false)}
                        className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
