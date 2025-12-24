import React, { useState } from 'react';
import { registerUser, loginUser, submitAccessCode } from '../services/userService';
import { UserState } from '../types';
import SevenX7Logo from './SevenX7Logo';

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

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setLoading(true);
      setStatusMsg('Submitting Application...');

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
      setStatusMsg('Validating Code...');

      try {
          if (currentUserId) {
              await submitAccessCode(currentUserId, formData.otp);
          }
          // After submitting code, they move to the final waiting gate
          setTimeout(() => {
              setLoading(false);
              setAuthMode('AWAITING_APPROVAL');
          }, 1500);
      } catch (err: any) {
          setLoading(false);
          setErrorMsg(err.message || "Could not submit code.");
      }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setLoading(true);
      setStatusMsg('Secure Login...');

      try {
          const user = await loginUser(formData.email, formData.password);
          onLoginSuccess(user);
      } catch (err: any) {
          setLoading(false);
          if (err.message === "AWAITING_APPROVAL") {
              setAuthMode('AWAITING_APPROVAL');
          } else {
              setErrorMsg(err.message || 'Check your credentials and try again.');
          }
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>

      <div className="z-10 w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-scale-in">
        
        <div className="p-10 pb-4 text-center">
            <div className="flex justify-center transform scale-110 mb-4">
                <SevenX7Logo size="large" />
            </div>
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
                            <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all" required />
                            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all" required />
                            {errorMsg && <p className="text-[10px] text-red-500 font-black text-center bg-red-50 p-3 rounded-xl uppercase tracking-tight">{errorMsg}</p>}
                            <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all">Log In</button>
                        </form>
                    )}

                    {authMode === 'REGISTER' && (
                        <form onSubmit={handleRegister} className="space-y-3">
                            <input type="text" placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none" required />
                            <input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none" required />
                            <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none" required />
                            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none" required />
                            {errorMsg && <p className="text-[10px] text-red-500 font-black text-center bg-red-50 p-3 rounded-xl uppercase">{errorMsg}</p>}
                            <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">Request Access</button>
                        </form>
                    )}

                    {authMode === 'VERIFY' && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto border border-emerald-100 shadow-inner">🔐</div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Access Code</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-3 px-4 leading-relaxed">Enter the specific verification code sent by the Super Admin to proceed.</p>
                            </div>
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <input type="text" placeholder="####" maxLength={6} value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} className="w-full text-center tracking-[1em] text-2xl font-black bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all" required />
                                {errorMsg && <p className="text-[10px] text-red-500 font-black bg-red-50 p-3 rounded-xl uppercase">{errorMsg}</p>}
                                <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">Submit Code</button>
                            </form>
                        </div>
                    )}

                    {authMode === 'AWAITING_APPROVAL' && (
                        <div className="text-center space-y-8 py-4 animate-fade-in">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-pulse-glow"></div>
                                <div className="relative w-full h-full bg-white rounded-[2.5rem] border-4 border-emerald-50 flex items-center justify-center text-5xl shadow-xl">🛡️</div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pending Approval</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3 px-2 leading-loose">
                                    Your application has been received. <br/>
                                    <span className="text-emerald-600">Super Admin</span> is now verifying your credentials. 
                                    You will be able to log in once approved.
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verification Status</p>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>
                                    <span className="text-[10px] font-black text-slate-700 uppercase">Review In Progress</span>
                                </div>
                            </div>
                            <button onClick={() => setAuthMode('LOGIN')} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">Return to Login</button>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                <button type="button" onClick={onDemoLogin} className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em] hover:text-emerald-700 transition-colors flex items-center justify-center gap-2 group mx-auto">
                    <span>Explore Demo Mode</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};