
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
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || ''
  });

  // Payment Form State
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', name: '', expiry: '' });
  const [newUpi, setNewUpi] = useState('');

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

  const handleAddCard = (e: React.FormEvent) => {
      e.preventDefault();
      const card: SavedCard = {
          id: `card-${Date.now()}`,
          type: 'VISA', // Mock detection
          last4: newCard.number.slice(-4),
          label: newCard.name || 'Personal Card'
      };
      onUpdateUser({ savedCards: [...(user.savedCards || []), card] });
      setIsAddingCard(false);
      setNewCard({ number: '', name: '', expiry: '' });
  };

  const handleAddUpi = (e: React.FormEvent) => {
      e.preventDefault();
      const card: SavedCard = {
          id: `upi-${Date.now()}`,
          type: 'UPI',
          upiId: newUpi,
          label: 'Unified Payments'
      };
      onUpdateUser({ savedCards: [...(user.savedCards || []), card] });
      setIsAddingCard(false);
      setNewUpi('');
  };

  const removePaymentMethod = (id: string) => {
      const updated = (user.savedCards || []).filter(c => c.id !== id);
      onUpdateUser({ savedCards: updated });
  };

  const handleBackNavigation = () => {
      if (activeSection !== 'MENU') {
          setActiveSection('MENU');
      } else {
          onBack?.();
      }
  };

  const menuItems = [
      { icon: '📍', label: 'My Addresses', value: user.address || 'Not Set', action: () => setIsEditing(true) },
      { icon: '💳', label: 'Payment Methods', value: `${user.savedCards?.length || 0} Saved`, action: () => setActiveSection('PAYMENT') },
      { icon: '💬', label: 'Help & Support', value: 'Chat with us', action: () => window.open('https://wa.me/919483496940', '_blank') },
      { icon: '📜', label: 'Legal & Privacy', value: 'Terms of Service', action: () => setActiveSection('LEGAL') },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
        {/* Sticky Mobile Header */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
                <button 
                    onClick={handleBackNavigation}
                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-transform hover:bg-slate-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="flex flex-col">
                    <h1 className="font-black text-lg text-slate-900 leading-none">
                        {activeSection === 'MENU' ? 'My Profile' : 
                        activeSection === 'PAYMENT' ? 'Payments' : 
                        activeSection === 'LEGAL' ? 'Legal' : 'Profile'}
                    </h1>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wide">GROCESPHERE</span>
                </div>
            </div>
            <div>
               <SevenX7Logo size="xs" />
            </div>
        </div>

        {/* --- MAIN MENU VIEW --- */}
        {activeSection === 'MENU' && (
            <div className="px-4 pt-6 pb-12 space-y-6 animate-fade-in">
                {/* Profile Header Card */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-2xl text-white shadow-lg border-2 border-white">
                        {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="font-black text-lg text-slate-900 border-b border-brand-DEFAULT outline-none bg-transparent w-full"
                                placeholder="Your Name"
                            />
                        ) : (
                            <h2 className="font-black text-xl text-slate-900 truncate">{user.name || 'Guest User'}</h2>
                        )}
                        <p className="text-xs text-slate-500 font-bold">{user.phone}</p>
                    </div>
                    <button 
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(!isEditing)} 
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all shadow-sm active:scale-95 ${isEditing ? 'bg-brand-DEFAULT text-white border-none' : 'bg-slate-900 text-white'}`}
                    >
                        {isEditing ? 'Save' : 'Edit'}
                    </button>
                </div>

                {/* Edit Form (Address/Email) */}
                {isEditing && (
                    <div className="bg-white p-5 rounded-[24px] border-2 border-brand-light shadow-soft space-y-4 animate-slide-up">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Details</label>
                        <input 
                            className="w-full p-4 rounded-xl border border-slate-100 text-sm font-black outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-light transition-all"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                        <textarea 
                            className="w-full p-4 rounded-xl border border-slate-100 text-sm font-black outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-light transition-all resize-none"
                            placeholder="Delivery Address"
                            rows={3}
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                        <button onClick={handleSaveProfile} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-float active:scale-[0.98] transition-all">
                            Update Profile Details
                        </button>
                    </div>
                )}

                {/* Menu List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {menuItems.map((item, idx) => (
                        <button 
                            key={idx}
                            onClick={item.action}
                            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left active:bg-slate-100"
                        >
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0">
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                                <p className="text-xs text-slate-400 font-medium">{item.value}</p>
                            </div>
                            <span className="text-slate-300">›</span>
                        </button>
                    ))}
                </div>

                <button onClick={onLogout} className="w-full py-4 text-red-500 font-black text-sm bg-white rounded-2xl shadow-sm border border-red-50 hover:bg-red-50 transition-colors active:scale-[0.98]">
                    Log Out
                </button>

                <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-4">
                    Grocesphere v1.2.0 • Build 2025
                </p>
            </div>
        )}

        {/* --- PAYMENT METHODS VIEW --- */}
        {activeSection === 'PAYMENT' && (
            <div className="px-4 pt-6 pb-12 space-y-6 animate-slide-up">
                 <div className="space-y-3">
                     {(!user.savedCards || user.savedCards.length === 0) && (
                         <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                             <div className="text-4xl mb-2 opacity-50">💳</div>
                             <p className="text-sm font-bold text-slate-500">No saved payment methods</p>
                         </div>
                     )}
                     
                     {user.savedCards?.map(card => (
                         <div key={card.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                                 {card.type === 'UPI' ? '📱' : '💳'}
                             </div>
                             <div className="flex-1">
                                 <h4 className="font-bold text-slate-900 text-sm">{card.label}</h4>
                                 <p className="text-xs text-slate-500 font-mono">
                                     {card.type === 'UPI' ? card.upiId : `**** **** **** ${card.last4}`}
                                 </p>
                             </div>
                             <button 
                                onClick={() => removePaymentMethod(card.id)}
                                className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs hover:bg-red-100 transition-colors"
                             >
                                 ✕
                             </button>
                         </div>
                     ))}
                 </div>

                 {!isAddingCard ? (
                     <button 
                        onClick={() => setIsAddingCard(true)}
                        className="w-full py-4 border-2 border-dashed border-brand-DEFAULT/30 text-brand-DEFAULT font-bold rounded-2xl hover:bg-brand-light/50 transition-colors flex items-center justify-center gap-2"
                     >
                        <span>+</span> Add New Method
                     </button>
                 ) : (
                     <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 animate-fade-in">
                         <h3 className="font-black text-slate-800 text-sm mb-4">Add New Payment Method</h3>
                         
                         {/* Simple Toggle for Type */}
                         <div className="flex gap-2 mb-4 bg-slate-50 p-1 rounded-xl">
                             <button 
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newUpi === '' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                                onClick={() => setNewUpi('')}
                             >Card</button>
                             <button 
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newUpi !== '' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                                onClick={() => setNewUpi('user@upi')}
                             >UPI</button>
                         </div>

                         {newUpi === '' ? (
                            <form onSubmit={handleAddCard} className="space-y-3">
                                <input 
                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                    placeholder="Card Number"
                                    maxLength={19}
                                    value={newCard.number}
                                    onChange={e => setNewCard({...newCard, number: e.target.value})}
                                    required
                                />
                                <div className="flex gap-3">
                                    <input 
                                        className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                        placeholder="Name on Card"
                                        value={newCard.name}
                                        onChange={e => setNewCard({...newCard, name: e.target.value})}
                                        required
                                    />
                                    <input 
                                        className="w-24 p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                        placeholder="MM/YY"
                                        value={newCard.expiry}
                                        onChange={e => setNewCard({...newCard, expiry: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsAddingCard(false)} className="flex-1 py-3 text-slate-500 font-bold text-xs">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md">Save Card</button>
                                </div>
                            </form>
                         ) : (
                            <form onSubmit={handleAddUpi} className="space-y-3">
                                <input 
                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                    placeholder="UPI ID (e.g. user@okhdfc)"
                                    value={newUpi}
                                    onChange={e => setNewUpi(e.target.value)}
                                    required
                                />
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsAddingCard(false)} className="flex-1 py-3 text-slate-500 font-bold text-xs">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md">Save VPA</button>
                                </div>
                            </form>
                         )}
                     </div>
                 )}
            </div>
        )}

        {/* --- LEGAL VIEW --- */}
        {activeSection === 'LEGAL' && (
            <div className="px-4 pt-6 animate-slide-up pb-20">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                    <div>
                        <h3 className="font-black text-slate-900 mb-2">Terms of Service</h3>
                        <p className="text-xs text-slate-500 leading-relaxed text-justify">
                            By using Grocesphere, you agree to abide by our community commerce standards. We connect you directly with local stores. Prices and availability are managed by store owners. Delivery times are estimates based on traffic and weather conditions.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 mb-2">Privacy Policy</h3>
                        <p className="text-xs text-slate-500 leading-relaxed text-justify">
                            We value your privacy. Your location data is used solely for finding nearby stores and tracking deliveries. Payment information is securely processed by trusted gateways and is not stored on our servers in plain text.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 mb-2">Data & Map Attribution</h3>
                        <p className="text-xs text-slate-500 leading-relaxed text-justify">
                            &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" className="text-blue-500 underline">OpenStreetMap contributors</a>.
                        </p>
                        <div className="mt-2 text-[10px] text-slate-400 font-mono space-y-1">
                            <p>Map Display: Leaflet</p>
                            <p>Map Data: OpenStreetMap</p>
                            <p>Geocoding: Nominatim / Geoapify</p>
                            <p>Routing: OSRM / OpenRouteService</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
