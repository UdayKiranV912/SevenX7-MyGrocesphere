
import React, { useState, useEffect } from 'react';
import { registerUser, loginUser, submitAccessCode } from '../services/userService';
import { UserState } from '../types';
import SevenX7Logo from './SevenX7Logo';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLoginSuccess: (user: UserState) => void;
  onDemoLogin: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'VERIFY' | 'AWAITING_APPROVAL';

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onDemoLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      otp: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-check for approval when in AWAITING_APPROVAL mode
  useEffect(() => {
    if (authMode === 'AWAITING_APPROVAL' && currentUserId) {
        // Real-time listener for the user's own profile approval
        const profileSubscription = supabase
            .channel(`approval-poll-${currentUserId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'profiles', 
                filter: `id=eq.${currentUserId}` 
            }, async (payload) => {
                const updated = payload.new as any;
                if (updated.verification_status === 'approved') {
                    // Approved! Automatically attempt login
                    try {
                        const user = await loginUser(formData.email, formData.password);
                        onLoginSuccess(user);
                    } catch (e) {
                        setAuthMode('LOGIN');
                    }
                }
            })
            .subscribe();

        // Heartbeat fallback (polls every 10s in case websocket drops)
        const heartbeat = setInterval(async () => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('verification_status')
                    .eq('id', currentUserId)
                    .single();
                
                if (profile?.verification_status === 'approved') {
                    const user = await loginUser(formData.email, formData.password);
                    onLoginSuccess(user);
                }
            } catch (e: any) {
                // Silently ignore poll errors
            }
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
      setStatusMsg('Broadcasting to Ecosystem...');

      try {
          const user = await registerUser(formData.email, formData.password, formData.fullName, formData.phone);
          if (user) setCurrentUserId(user.id);
          setLoading(false);
          setAuthMode('VERIFY'); 
      } catch (err: any) {
          setErrorMsg(err.message || 'Registration failed');
          setLoading(false);
      }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg('');
      setStatusMsg('Securing Profile Entry...');

      try {
          if (currentUserId) {
              await submitAccessCode(currentUserId, formData.otp);
          }
          setLoading(false);
          setAuthMode('AWAITING_APPROVAL');
      } catch (err: any) {
          setLoading(false);
          setErrorMsg(err.message || "Could not submit code.");
      }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setLoading(true);
      setStatusMsg('Authenticating...');

      try {
          const user = await loginUser(formData.email, formData.password);
          onLoginSuccess(user);
      } catch (err: any) {
          setLoading(false);
          if (err.message === "AWAITING_APPROVAL") {
              // Fix: Cast supabase.auth to any to bypass type mismatch for getUser
              const { data: { user } } = await (supabase.auth as any).getUser();
              if (user) setCurrentUserId(user.id);
              setAuthMode('AWAITING_APPROVAL');
          } else {
              setErrorMsg(err.message || 'Login failed.');
          }
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
                            {errorMsg && <p className="text-[10px] text-red-500 font-black text-center bg-red-50 p-3 rounded-xl uppercase">{errorMsg}</p>}
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
                            <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">Register Profile</button>
                        </form>
                    )}

                    {authMode === 'VERIFY' && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto border border-emerald-100">🔐</div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Access Token</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-4">Provide the invite token given by Super Admin to initialize verification.</p>
                            </div>
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <input type="text" placeholder="Token" value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} className="w-full text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-emerald-50 transition-all" required />
                                <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">Initialize</button>
                            </form>
                        </div>
                    )}

                    {authMode === 'AWAITING_APPROVAL' && (
                        <div className="text-center space-y-8 py-4 animate-fade-in">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-pulse-glow"></div>
                                <div className="relative w-full h-full bg-white rounded-[2.5rem] border-4 border-emerald-5 flex items-center justify-center text-5xl shadow-xl">🛡️</div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Review In Progress</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3 px-2 leading-loose">
                                    Profile received at HQ. <br/>
                                    <span className="text-emerald-600">Super Admin</span> is validating your credentials. <br/>
                                    <span className="text-[8px] opacity-40 uppercase">System will auto-unlock on approval</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Manual Sync</button>
                                <button onClick={() => setAuthMode('LOGIN')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl">Back to Login</button>
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
