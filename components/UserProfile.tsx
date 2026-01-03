
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

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onBack }) => {
  const [showLegalModal, setShowLegalModal] = useState(false);
  const featuredAd = MOCK_ADS.find(ad => ad.partnerName.toLowerCase().includes('seven')) || MOCK_ADS[0];

  return (
    <div className="min-h-screen bg-slate-50 relative animate-fade-in flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm shrink-0">
             <div className="flex items-center gap-3">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 active:scale-90 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <h1 className="font-black text-lg text-slate-900 uppercase tracking-tight">Ecosystem Profile</h1>
            </div>
            <SevenX7Logo size="xs" hideBrandName={true} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 space-y-6 hide-scrollbar">
            {/* User Hero */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-col items-center text-center gap-4">
                <div className="relative">
                    <div className="w-24 h-24 bg-slate-900 rounded-[30px] flex items-center justify-center text-4xl text-white shadow-xl border-4 border-white rotate-3">
                        {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-[10px] animate-bounce-soft">🛡️</div>
                </div>
                <div>
                    <h2 className="font-black text-2xl text-slate-900 leading-tight">{user.name || 'Member'}</h2>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-2">Verified Ecosystem Member</p>
                </div>
            </div>

            {/* Admin Managed Notice */}
            <div className="bg-emerald-50 p-5 rounded-[24px] border border-emerald-100 flex items-start gap-4">
                <div className="text-2xl pt-1">🛡️</div>
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Admin Managed</h4>
                    <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest leading-loose">
                        Your profile details are verified and managed by <span className="underline">HQ System Admin</span>. 
                        Contact support to request any modifications.
                    </p>
                </div>
            </div>

            <AdsBanner ad={featuredAd} />

            {/* Account Details (Static) */}
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {[
                    { label: 'Registered Name', icon: '👤', value: user.name },
                    { label: 'Ecosystem ID', icon: '🆔', value: user.id?.slice(-8).toUpperCase() },
                    { label: 'Linked Email', icon: '📧', value: user.email },
                    { label: 'Mobile Number', icon: '📱', value: user.phone },
                    { label: 'Primary Region', icon: '📍', value: user.neighborhood || 'Verified Area' },
                    { label: 'Legal Policies', icon: '📜', value: 'View Terms', action: () => setShowLegalModal(true) },
                    { label: 'Session Management', icon: '🚪', value: 'Logout & Exit', action: onLogout, destructive: true },
                ].map((item, i) => {
                    const isClickable = !!item.action;
                    const Comp = isClickable ? 'button' : 'div';
                    return (
                        <Comp 
                            key={i} 
                            onClick={item.action} 
                            className={`w-full p-6 flex items-center gap-5 transition-all text-left ${isClickable ? 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer' : ''}`}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-inner shrink-0">
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-[9px] font-black uppercase tracking-widest ${item.destructive ? 'text-red-500' : 'text-slate-400'}`}>{item.label}</h4>
                                <p className={`text-[13px] font-black mt-1 truncate ${item.destructive ? 'text-red-600 underline' : 'text-slate-900'}`}>{item.value}</p>
                            </div>
                            {isClickable && <span className="text-slate-300 text-xl font-thin">›</span>}
                        </Comp>
                    );
                })}
            </div>
        </div>

        {showLegalModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity" onClick={() => setShowLegalModal(false)} />
                <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in">
                    <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Ecosystem Framework</h2>
                    <div className="space-y-8 text-[11px] text-slate-600 font-bold uppercase tracking-widest leading-loose">
                        <div>
                            <p className="text-slate-900 mb-2">1. Identity Verification</p>
                            <p className="opacity-60">Membership details are locked after Admin approval to ensure ecosystem integrity.</p>
                        </div>
                        <div>
                            <p className="text-slate-900 mb-2">2. Financial Settlements</p>
                            <p className="opacity-60">Admin Escrow handles all settlements to ensure security for both marts and customers.</p>
                        </div>
                        <div>
                            <p className="text-slate-900 mb-2">3. Geolocation Terms</p>
                            <p className="opacity-60">Live tracking is strictly used for real-time logistics and delivery updates.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowLegalModal(false)} className="w-full mt-12 py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl">Close</button>
                </div>
            </div>
        )}
    </div>
  );
};
