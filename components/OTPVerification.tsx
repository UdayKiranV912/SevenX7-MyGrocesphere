
import React, { useState, useEffect } from 'react';
import { registerUser, loginUser } from '../services/userService';
import { UserState } from '../types';
import SevenX7Logo from './SevenX7Logo';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLoginSuccess: (user: UserState) => void;
  onDemoLogin: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'AWAITING_APPROVAL';

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onDemoLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      phone: '',
      password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-check for approval when in AWAITING_APPROVAL mode
  useEffect(() => {
    if (authMode === 'AWAITING_APPROVAL' && currentUserId && currentUserId !== 'demo-user') {
        const profileSubscription = supabase
            .channel(`approval-poll-${currentUserId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'profiles', 
                filter: `id=eq.${currentUserId}` 
            }, async (payload) => {
                const updated = payload.new as any;
                if (updated.approval_status === 'approved') {
                    try {
                        const user = await loginUser(formData.email, formData.password);
                        onLoginSuccess(user);
                    } catch (e) {
                        setAuthMode('LOGIN');
                    }
                }
            })
            .subscribe();

        const heartbeat = setInterval(async () => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('approval_status')
                    .eq('id', currentUserId)
                    .single();
                
                if (profile?.approval_status === 'approved') {
                    const user = await loginUser(formData.email, formData.password);
                    onLoginSuccess(user);
                }
            } catch (e: any) {}
        }, 10000);

        return () => {
            supabase.removeChannel(profileSubscription);
            clearInterval(heartbeat);
        };
    }
  }, [authMode, currentUserId, formData.email, formData.password, onLoginSuccess]);

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setLoading(true);
      setStatusMsg('Broadcasting Profile to HQ...');

      try {
          const user = await registerUser(formData.email, formData.password, formData.fullName, formData.phone);
          if (user) setCurrentUserId(user.id);
          setLoading(false);
          setAuthMode('AWAITING_APPROVAL'); 
      } catch (err: any) {
          setErrorMsg(err.message || 'Registration failed');
          setLoading(false);
      }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setLoading(true);
      setStatusMsg('Authenticating...');

      try {
          const user = await loginUser(formData.email, formData.password);
          if (user.verificationStatus === 'approved') {
            onLoginSuccess(user);
          } else {
            setCurrentUserId(user.id || null);
            setAuthMode('AWAITING_APPROVAL');
            setLoading(false);
          }
      } catch (err: any) {
          setLoading(false);
          setErrorMsg(err.message || 'Login failed.');
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>

      <div className="z-10 w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-scale-in">
        <div className="p-10 pb-4 text-center">
            <SevenX7Logo size="large" />
        </div>

        <div className="p-8 pt-4">
            {(authMode === 'LOGIN' || authMode === 'REGISTER') && !loading && (
                <div className="flex border-b border-slate-100 mb-8 p-1 bg-slate-50 rounded-2xl">
                    <button onClick={() => setAuthMode('LOGIN')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Log In</button>
                    <button onClick={() => setAuthMode('REGISTER')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'REGISTER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Sign Up</button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center py-12">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">{statusMsg || 'Connecting...'}</p>
                </div>
            ) : (
                <div className="animate-fade-in space-y-6">
                    {authMode === 'LOGIN' && (
                        <form onSubmit={handleStandardLogin} className="space-y-4">
                            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold outline-none focus:ring-4 focus:ring-emerald-50" required />
                            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold outline-none focus:ring-4 focus:ring-emerald-50" required />
                            {errorMsg && <p className="text-[10px] text-red-500 font-black text-center bg-red-50 p-3 rounded-xl uppercase leading-relaxed">{errorMsg}</p>}
                            <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all">Log In</button>
                        </form>
                    )}

                    {authMode === 'REGISTER' && (
                        <form onSubmit={handleRegister} className="space-y-3">
                            <input type="text" placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold outline-none" required />
                            <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold outline-none" required />
                            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold outline-none" required />
                            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-base font-bold outline-none" required />
                            {errorMsg && <p className="text-[10px] text-red-500 font-black text-center bg-red-50 p-3 rounded-xl uppercase">{errorMsg}</p>}
                            <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">Join Ecosystem</button>
                        </form>
                    )}

                    {authMode === 'AWAITING_APPROVAL' && (
                        <div className="text-center space-y-8 py-4 animate-fade-in">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-pulse-glow"></div>
                                <div className="relative w-full h-full bg-white rounded-[2.5rem] border-4 border-emerald-5 flex items-center justify-center text-5xl shadow-xl">🛡️</div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Review Pending</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3 px-2 leading-loose">
                                    Profile received at HQ. <br/>
                                    <span className="text-emerald-600">Super Admin</span> is currently reviewing your access. <br/>
                                    Approval usually takes <span className="text-slate-900 underline underline-offset-4">2 minutes</span>.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-center gap-3 py-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">Real-time HQ Sync Active</span>
                                </div>
                                <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Manual Sync</button>
                                <button onClick={onDemoLogin} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl">Bypass for Demo</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                <button type="button" onClick={onDemoLogin} className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">Demo Ecosystem →</button>
            </div>
        )}
      </div>
    </div>
  );
};
