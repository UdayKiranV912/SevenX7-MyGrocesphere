
import React, { useState } from 'react';
import { UserState } from '../types';
import SevenX7Logo from './SevenX7Logo';
import AdsBanner from './AdsBanner';
import { MOCK_ADS } from '../constants';

interface UserProfileProps {
  user: UserState;
  onUpdateUser: (updatedData: Partial<UserState>) => void;
  onLogout: () => void;
  onBack?: () => void;
}

type ProfileSection = 'MENU' | 'PAYMENT' | 'LEGAL';

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onBack }) => {
  const [activeSection, setActiveSection] = useState<ProfileSection>('MENU');
  const [showLegalModal, setShowLegalModal] = useState(false);
  
  const featuredAd = MOCK_ADS.find(ad => ad.partnerName.toLowerCase().includes('seven')) || MOCK_ADS[0];

  return (
    <div className="min-h-screen bg-slate-50 relative animate-fade-in">
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
                <button onClick={() => activeSection === 'MENU' ? onBack?.() : setActiveSection('MENU')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <h1 className="font-black text-lg text-slate-900 uppercase tracking-tight">
                    {activeSection === 'MENU' ? 'My Profile' : activeSection === 'PAYMENT' ? 'Payment methods' : 'Ecosystem Legal'}
                </h1>
            </div>
            <SevenX7Logo size="xs" hideBrandName={true} />
        </div>

        <div className="px-6 py-6 pb-40 space-y-6">
            {activeSection === 'MENU' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-[22px] flex items-center justify-center text-2xl text-white shadow-lg border-2 border-white">
                            {user.name?.charAt(0) || '👤'}
                        </div>
                        <div className="flex-1">
                            <h2 className="font-black text-lg text-slate-900 leading-tight">{user.name || 'Member'}</h2>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Verified Ecosystem Account</p>
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                        <span className="text-xl">🛡️</span>
                        <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-relaxed">
                            Profile details are managed by <span className="underline">HQ System Admin</span>. <br/>
                            Contact support to request changes.
                        </p>
                    </div>

                    <AdsBanner ad={featuredAd} />

                    <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                        {[
                            { label: 'Registered Email', icon: '📧', value: user.email || 'Not verified' },
                            { label: 'Mobile Number', icon: '📱', value: user.phone || 'Not provided' },
                            { label: 'Primary Address', icon: '📍', value: user.address || 'Local Neighborhood' },
                            { label: 'Legal & Terms', icon: '📜', value: 'SevenX7 Policies', action: () => setShowLegalModal(true) },
                            { label: 'Logout', icon: '🚪', value: 'Exit application', action: onLogout, destructive: true },
                        ].map((item, i) => {
                            const Comp = item.action ? 'button' : 'div';
                            return (
                                <Comp key={i} onClick={item.action} className={`w-full p-5 flex items-center gap-4 transition-colors text-left ${item.action ? 'hover:bg-slate-50 active:bg-slate-100' : ''}`}>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-lg">{item.icon}</div>
                                    <div className="flex-1">
                                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${item.destructive ? 'text-red-600' : 'text-slate-400'}`}>{item.label}</h4>
                                        <p className="text-sm font-black text-slate-900 mt-0.5">{item.value}</p>
                                    </div>
                                    {item.action && <span className="text-slate-300">›</span>}
                                </Comp>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>

        {showLegalModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowLegalModal(false)} />
                <div className="relative bg-white w-full max-w-md rounded-[32px] p-8 max-h-[80vh] overflow-y-auto">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Ecosystem Policy</h2>
                    <div className="space-y-6 text-xs text-slate-600 font-medium leading-relaxed">
                        <p>1. Service: Local commerce facilitation strictly for verified members.</p>
                        <p>2. Payments: Admin Escrow handles all transaction settlements.</p>
                        <p>3. GPS: Location data is strictly used for real-time logistics.</p>
                        <p>4. Data: Profiles are managed by Admin to ensure trust & safety.</p>
                    </div>
                    <button onClick={() => setShowLegalModal(false)} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Close</button>
                </div>
            </div>
        )}
    </div>
  );
};
