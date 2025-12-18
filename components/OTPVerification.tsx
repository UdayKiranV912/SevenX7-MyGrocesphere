
import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/userService';
import { UserState } from '../types';
import SevenX7Logo from './SevenX7Logo';

interface AuthProps {
  onLoginSuccess: (user: UserState) => void;
  onDemoLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onDemoLogin }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY'>('LOGIN');
  
  // Form State
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
      setStatusMsg('Creating Profile...');

      try {
          // Register user in Supabase (returns user object)
          // In this new flow, we don't auto-login. We go to VERIFY state.
          // Note: In a real app, you might want to call registerUser here.
          // For now, we simulate the "Pending Admin Approval" state locally.
          
          await registerUser(formData.email, formData.password, formData.fullName, formData.phone);
          
          setLoading(false);
          setAuthMode('VERIFY'); // Switch to Verify Screen
      } catch (err: any) {
          console.error(err);
          setErrorMsg(err.message || 'Registration failed');
          setLoading(false);
      }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg('');

      // Simulate verification against "Admin Manual OTP"
      // In real backend, this would check the 'otp_code' column in profiles table
      setTimeout(() => {
          if (formData.otp === '1234' || formData.otp === '0000') { // Mock correct OTP
             // Success - Proceed to Login logic
             loginUser(formData.email, formData.password)
                .then(user => onLoginSuccess(user))
                .catch(err => setErrorMsg(err.message));
          } else {
             setLoading(false);
             setErrorMsg("Invalid OTP. Please contact Admin (Uday) for the correct code.");
          }
      }, 1500);
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setLoading(true);
      setStatusMsg('Logging in...');

      try {
          const user = await loginUser(formData.email, formData.password);
          onLoginSuccess(user);
      } catch (err: any) {
          setErrorMsg(err.message || 'Invalid credentials');
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-brand flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Shapes */}
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 bg-brand-accent/20 rounded-full blur-3xl"></div>

      <div className="z-10 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header Section */}
        <div className="bg-brand-light/30 p-8 pb-6 text-center">
            <div className="mb-4 flex justify-center">
                <SevenX7Logo size="large" isWelcome />
            </div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Grocesphere</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">Local Commerce, Reimagined</p>
        </div>

        {/* Auth Content */}
        <div className="p-8 pt-6">
            {/* Tab Switcher (Only show if not verifying) */}
            {authMode !== 'VERIFY' && (
                <div className="flex border-b border-gray-100 mb-6">
                    <button 
                        onClick={() => setAuthMode('LOGIN')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${authMode === 'LOGIN' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
                    >
                        Log In
                    </button>
                    <button 
                        onClick={() => setAuthMode('REGISTER')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${authMode === 'REGISTER' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
                    >
                        Sign Up
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center py-8">
                    <div className="w-14 h-14 border-4 border-gray-100 border-t-brand rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-gray-700 animate-pulse">{statusMsg || 'Processing...'}</p>
                </div>
            ) : (
                <div className="animate-fade-in-up space-y-6">
                    
                    {/* LOGIN VIEW */}
                    {authMode === 'LOGIN' && (
                        <form onSubmit={handleStandardLogin} className="space-y-4">
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 ring-brand/20 outline-none"
                                required
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 ring-brand/20 outline-none"
                                required
                            />
                            {errorMsg && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg">{errorMsg}</p>}
                            <button type="submit" className="w-full bg-brand text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-dark transition-all">
                                Log In
                            </button>
                        </form>
                    )}

                    {/* REGISTER VIEW */}
                    {authMode === 'REGISTER' && (
                        <form onSubmit={handleRegister} className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={formData.fullName}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 ring-brand/20 outline-none"
                                required
                            />
                            <input 
                                type="tel" 
                                placeholder="Phone Number" 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 ring-brand/20 outline-none"
                                required
                            />
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 ring-brand/20 outline-none"
                                required
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold focus:ring-2 ring-brand/20 outline-none"
                                required
                            />
                            {errorMsg && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg">{errorMsg}</p>}
                            <button type="submit" className="w-full bg-brand text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-dark transition-all">
                                Register
                            </button>
                        </form>
                    )}

                    {/* VERIFY VIEW (Manual OTP) */}
                    {authMode === 'VERIFY' && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl mx-auto">
                                🔒
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Verification Pending</h3>
                                <p className="text-xs text-slate-500 px-4 mt-2">
                                    Your account has been created. For security, please contact the Admin to receive your verification code.
                                </p>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Admin</p>
                                <p className="font-bold text-slate-800">sevenx7@sevenx7.com</p>
                            </div>

                            <form onSubmit={handleVerifyOTP} className="space-y-3 pt-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter OTP from Admin" 
                                    value={formData.otp}
                                    onChange={(e) => setFormData({...formData, otp: e.target.value})}
                                    className="w-full text-center tracking-[0.5em] text-xl font-black bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 ring-brand/20 outline-none"
                                    required
                                />
                                {errorMsg && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{errorMsg}</p>}
                                <button type="submit" className="w-full bg-brand text-white py-3 rounded-xl font-bold shadow-lg hover:bg-brand-dark transition-all">
                                    Verify & Login
                                </button>
                            </form>
                            <button onClick={() => setAuthMode('LOGIN')} className="text-xs text-slate-400 font-bold">Back to Login</button>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {/* Footer */}
        {authMode !== 'VERIFY' && (
            <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                <button 
                    type="button" 
                    onClick={onDemoLogin}
                    className="text-xs font-bold text-brand hover:text-brand-dark transition-colors flex items-center justify-center gap-1 group"
                >
                    <span>Skip Login & Try Demo</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
