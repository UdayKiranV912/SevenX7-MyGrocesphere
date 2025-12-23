
import React, { useEffect, useState, useRef } from 'react';
import { SavedCard } from '../types';

interface PaymentGatewayProps {
  amount: number;
  onSuccess: (method: string) => void;
  onCancel: () => void;
  isDemo: boolean;
  splits?: {
      storeAmount: number;
      storeUpi: string;
      deliveryFee: number;
  };
  savedCards?: SavedCard[];
  onSavePaymentMethod?: (method: SavedCard) => void;
  storeName?: string;
  orderMode?: 'DELIVERY' | 'PICKUP';
}

// THE FIXED ADMIN UPI ID FOR ALL TRANSACTIONS
const ADMIN_UPI_ID = 'sevenx7.admin@okaxis';

type GatewayStep = 'CONNECTING' | 'SELECT' | 'PROCESSING' | 'APP_REDIRECT' | 'WAITING_VERIFICATION' | 'ADMIN_CHECKING' | 'SUCCESS' | 'FAILURE';

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  amount, onSuccess, onCancel, isDemo, savedCards = [], storeName = 'Store', orderMode
}) => {
  const [step, setStep] = useState<GatewayStep>('CONNECTING');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorReason, setErrorReason] = useState('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successCalledRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => {
        setStep('SELECT');
    }, 1200);
    return () => {
      document.body.style.overflow = '';
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(timer);
    };
  }, []);

  const getPaymentMethodString = () => {
      if (selectedMethod === 'pay_at_store') return `POP: Pickup and Pay (Direct Store)`;
      if (selectedUpiApp) return `UPI (${selectedUpiApp} to SevenX7 Admin)`;
      return `Direct UPI Transfer to SevenX7 Admin`;
  };

  const triggerSuccess = () => {
      if (successCalledRef.current) return;
      successCalledRef.current = true;
      onSuccess(getPaymentMethodString());
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(ADMIN_UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentInitiated = (appName: string) => {
      setSelectedUpiApp(appName);
      setStep('PROCESSING');
      
      const pn = encodeURIComponent("SevenX7 Innovations");
      const tn = encodeURIComponent(`Grocesphere Order: ${storeName}`);
      const tr = `GS${Date.now()}`;
      const upiUrl = `upi://pay?pa=${ADMIN_UPI_ID}&pn=${pn}&am=${amount.toFixed(2)}&cu=INR&tn=${tn}&tr=${tr}`;
      
      timerRef.current = setTimeout(() => {
          if (!isDemo && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
              window.location.href = upiUrl;
          }
          setStep('WAITING_VERIFICATION');
      }, 1500);
  };

  const verifyWithAdmin = () => {
      setStep('ADMIN_CHECKING');
      
      // Simulate Super Admin checking the payment receipt
      timerRef.current = setTimeout(() => {
          // If demo mode, it always succeeds. In real mode, we simulate a 90% success rate for UX.
          const isSuccessful = isDemo || Math.random() > 0.1;
          
          if (isSuccessful) {
              setStep('SUCCESS');
              timerRef.current = setTimeout(triggerSuccess, 2000);
          } else {
              setStep('FAILURE');
              setErrorReason('SevenX7 Super Admin could not verify this transaction. Please try again or check your bank statement.');
          }
      }, 4000);
  };

  const renderContent = () => {
      if (step === 'CONNECTING') return (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Securing Gateway...</p>
          </div>
      );

      if (step === 'PROCESSING') return (
          <div className="text-center p-10 bg-white rounded-[3rem] shadow-2xl animate-scale-in max-w-xs mx-auto">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl animate-bounce-soft">📱</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Redirecting</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Opening {selectedUpiApp}...
              </p>
          </div>
      );

      if (step === 'WAITING_VERIFICATION') return (
          <div className="text-center p-8 bg-white rounded-[3rem] shadow-2xl animate-scale-in max-w-sm mx-auto space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto border-4 border-blue-100 shadow-inner">📤</div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1">Transfer Complete?</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Once you finish the payment in your UPI app, click below to notify our Super Admin.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Admin UPI ID</p>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 font-mono tracking-tighter">{ADMIN_UPI_ID}</span>
                    <button onClick={handleCopyUpi} className="text-[9px] font-black text-emerald-600 uppercase">
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                    onClick={verifyWithAdmin}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                    I have paid ₹{amount}
                </button>
                <button onClick={() => setStep('SELECT')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Return to Methods</button>
              </div>
          </div>
      );

      if (step === 'ADMIN_CHECKING') return (
          <div className="text-center p-10 bg-white rounded-[3rem] shadow-2xl animate-scale-in max-w-sm mx-auto space-y-8">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🛡️</div>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Admin Verification</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    SevenX7 Super Admin is verifying your transaction receipt. Please do not close the app.
                </p>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-300"></span>
              </div>
          </div>
      );

      if (step === 'SUCCESS') return (
          <div className="fixed inset-0 z-[200] bg-emerald-600 flex flex-col items-center justify-center text-white animate-fade-in p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 animate-logo-x shadow-2xl">
                  <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-3xl font-black mb-3">Admin Verified</h2>
              <p className="text-emerald-100 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed">
                  Payment successfully received by SevenX7 Innovations. Your order is now live!
              </p>
              <button onClick={triggerSuccess} className="w-full max-w-xs bg-white text-emerald-700 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Go to Orders</button>
          </div>
      );

      if (step === 'FAILURE') return (
          <div className="fixed inset-0 z-[200] bg-red-600 flex flex-col items-center justify-center text-white animate-fade-in p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-8 text-4xl">⚠️</div>
              <h2 className="text-3xl font-black mb-3">Verification Failed</h2>
              <p className="text-red-100 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed max-w-xs">
                  {errorReason}
              </p>
              <div className="w-full max-w-xs space-y-3">
                  <button onClick={() => setStep('SELECT')} className="w-full bg-white text-red-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Try Again</button>
                  <button onClick={onCancel} className="w-full bg-red-700 text-white/70 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px]">Cancel Order</button>
              </div>
          </div>
      );

      return (
          <div className="flex flex-col h-full animate-fade-in bg-slate-50">
              <div className="bg-white p-6 pb-10 border-b border-slate-100 flex justify-between items-end shrink-0 shadow-sm">
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Direct UPI to Admin
                      </p>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h2>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-1">Recipient: SevenX7 Innovations</div>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Payable</p>
                      <span className="text-3xl font-black tracking-tighter tabular-nums text-slate-900">₹{amount}</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-40 hide-scrollbar">
                  {/* ADMIN VPA SPOTLIGHT */}
                  <div className="bg-slate-900 text-white p-7 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/10">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                      <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.4em]">Official Receiver</span>
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Grocesphere Node 01</span>
                          </div>
                          <div className="flex items-center justify-between items-end">
                              <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Super Admin VPA</p>
                                  <h4 className="text-xl font-black tracking-tight font-mono">{ADMIN_UPI_ID}</h4>
                              </div>
                              <button onClick={handleCopyUpi} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-90 transition-all shadow-lg">
                                  {copied ? 'Copied' : 'Copy'}
                              </button>
                          </div>
                      </div>
                  </div>

                  {orderMode === 'PICKUP' && (
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alternative</h3>
                        <button 
                            onClick={() => { setSelectedMethod('pay_at_store'); setStep('WAITING_VERIFICATION'); }}
                            className="w-full p-5 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-between shadow-sm transition-all active:scale-[0.98] group hover:border-emerald-500"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl border border-emerald-100">🤝</div>
                                <div className="text-left">
                                    <span className="font-black text-sm uppercase tracking-tight block text-slate-900">Pickup and Pay</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Pay Directly at Mart</span>
                                </div>
                            </div>
                            <span className="text-slate-300 group-hover:text-slate-900">→</span>
                        </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select UPI App</h3>
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                          <button 
                            key={app} 
                            onClick={() => handlePaymentInitiated(app)}
                            className="w-full p-5 bg-white rounded-[24px] border-2 border-slate-100 flex items-center justify-between hover:border-slate-900 transition-all active:scale-[0.98] group shadow-sm"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📱</div>
                                  <span className="font-black text-sm text-slate-800 uppercase tracking-tight">{app}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Redirect</span>
                                <span className="text-slate-200 group-hover:text-slate-900">→</span>
                              </div>
                          </button>
                      ))}
                  </div>

                  {isDemo && (
                      <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 mt-8 space-y-3">
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest text-center">Demo Environment Active</p>
                          <button 
                            onClick={() => { setSelectedUpiApp('Sandbox'); verifyWithAdmin(); }}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                          >
                              Simulate Complete Flow
                          </button>
                      </div>
                  )}
              </div>
              
              <div className="p-6 pt-0 bg-slate-50 border-t border-slate-100">
                <button onClick={onCancel} className="w-full py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-slate-900 transition-colors">Cancel Checkout</button>
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-fade-in overflow-hidden">
      {renderContent()}
    </div>
  );
};
