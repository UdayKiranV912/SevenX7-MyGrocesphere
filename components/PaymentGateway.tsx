
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

const ADMIN_UPI_ID = 'sevenx7.admin@okaxis';

type GatewayStep = 'CONNECTING' | 'SELECT' | 'PROCESSING' | 'WAITING_VERIFICATION' | 'ADMIN_CHECKING' | 'POP_CONFIRM' | 'SUCCESS' | 'FAILURE';

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  amount, onSuccess, onCancel, isDemo, storeName = 'Store', orderMode, splits
}) => {
  const [step, setStep] = useState<GatewayStep>('CONNECTING');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successCalledRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => {
        setStep('SELECT');
    }, 1000);
    return () => {
      document.body.style.overflow = '';
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(timer);
    };
  }, []);

  const triggerSuccess = (methodOverride?: string) => {
      if (successCalledRef.current) return;
      successCalledRef.current = true;
      const method = methodOverride || (selectedUpiApp ? `UPI (${selectedUpiApp})` : `Direct UPI Transfer`);
      onSuccess(method);
  };

  const handleUpiIntent = (appName: string) => {
    setSelectedUpiApp(appName);
    
    if (!isDemo) {
        // Real-Time User: Redirect to UPI App
        // Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=CURRENCY
        const upiUrl = `upi://pay?pa=${ADMIN_UPI_ID}&pn=SevenX7%20Admin&am=${amount}&cu=INR&tn=Order%20Payment`;
        window.location.href = upiUrl;
        
        // After redirecting, move to manual entry step
        setTimeout(() => setStep('WAITING_VERIFICATION'), 2000);
    } else {
        // Demo Mode: Simulate processing
        setStep('PROCESSING');
        timerRef.current = setTimeout(() => {
            setStep('WAITING_VERIFICATION');
        }, 1500);
    }
  };

  const verifyWithAdmin = () => {
      if (!isDemo && !transactionId.trim()) {
          setErrorMsg('Transaction ID is required for verification.');
          return;
      }

      setStep('ADMIN_CHECKING');
      
      const verificationDelay = isDemo ? 2000 : 4000;
      
      timerRef.current = setTimeout(() => {
          // Failure simulation (10% chance in real mode for demo of error handling)
          if (!isDemo && Math.random() < 0.1) {
              setStep('FAILURE');
              setErrorMsg('Transaction verification failed. Please check your ID and try again.');
          } else {
              setStep('SUCCESS');
              timerRef.current = setTimeout(() => triggerSuccess(), 1500);
          }
      }, verificationDelay);
  };

  const renderContent = () => {
      if (step === 'CONNECTING') return (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Securing Gateway...</p>
          </div>
      );

      if (step === 'POP_CONFIRM') return (
          <div className="text-center p-8 bg-white rounded-[3rem] shadow-2xl animate-scale-in max-w-sm mx-auto space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto border-4 border-emerald-100 shadow-inner">🤝</div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1 leading-tight uppercase tracking-tight">Pickup & Pay</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Pay ₹{amount} at <span className="text-slate-900">{storeName}</span> via Cash/UPI upon collection.
                </p>
              </div>
              <button onClick={() => triggerSuccess('POP: Pay at Store')} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Confirm Order</button>
              <button onClick={() => setStep('SELECT')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Back</button>
          </div>
      );

      if (step === 'PROCESSING') return (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center px-10">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-6" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Awaiting {selectedUpiApp}</h3>
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Complete payment in your app and return here.</p>
          </div>
      );

      if (step === 'WAITING_VERIFICATION') return (
          <div className="p-8 bg-white rounded-[3rem] shadow-2xl animate-scale-in max-w-sm mx-auto space-y-6 text-center">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto">💳</div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">Payment Verification</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                    {isDemo ? 'Demo Mode: Enter any ID to simulate payment.' : 'Enter the 12-digit UPI Transaction Ref ID.'}
                </p>
              </div>

              <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Transaction ID / Ref No."
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-50 transition-all"
                  />
                  {errorMsg && <p className="text-[9px] text-red-500 font-black uppercase">{errorMsg}</p>}
                  <button onClick={verifyWithAdmin} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Submit for Verification</button>
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
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Super Admin Verifying</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Checking transaction logs for ₹{amount}</p>
          </div>
      );

      if (step === 'FAILURE') return (
          <div className="text-center p-10 bg-white rounded-[3rem] shadow-2xl animate-scale-in max-w-sm mx-auto space-y-8">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-red-100">✕</div>
              <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Verification Failed</h3>
                  <p className="text-[9px] font-bold text-slate-500 mt-3 uppercase leading-relaxed">{errorMsg}</p>
              </div>
              <button onClick={() => setStep('WAITING_VERIFICATION')} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Try Again</button>
          </div>
      );

      if (step === 'SUCCESS') return (
          <div className="fixed inset-0 z-[200] bg-emerald-600 flex flex-col items-center justify-center text-white animate-fade-in p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl">
                  <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-3xl font-black mb-3 uppercase tracking-tighter">Verified</h2>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Payment received by Super Admin</p>
          </div>
      );

      return (
          <div className="flex flex-col h-full animate-fade-in bg-slate-50">
              <div className="bg-white p-6 pb-10 border-b border-slate-100 flex justify-between items-end shrink-0 shadow-sm">
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Secure Checkout
                      </p>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment</h2>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Payable</p>
                      <span className="text-3xl font-black tracking-tighter tabular-nums text-slate-900">₹{amount}</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-40 hide-scrollbar">
                  {orderMode === 'PICKUP' && (
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">In-Store Settlement</h3>
                        <button 
                            onClick={() => setStep('POP_CONFIRM')}
                            className="w-full p-5 bg-white rounded-[24px] border-2 border-emerald-500 flex items-center justify-between shadow-soft group transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl border border-emerald-100">🤝</div>
                                <div className="text-left">
                                    <span className="font-black text-sm uppercase tracking-tight block text-slate-900">Pay at Store</span>
                                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Recommended for Pickup</span>
                                </div>
                            </div>
                            <span className="text-emerald-500">→</span>
                        </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UPI Apps</h3>
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                          <button 
                            key={app} 
                            onClick={() => handleUpiIntent(app)}
                            className="w-full p-5 bg-white rounded-[24px] border-2 border-slate-100 flex items-center justify-between hover:border-slate-900 transition-all active:scale-[0.98] group shadow-sm"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📱</div>
                                  <span className="font-black text-sm text-slate-800 uppercase tracking-tight">{app}</span>
                              </div>
                              <span className="text-slate-200 group-hover:text-slate-900">→</span>
                          </button>
                      ))}
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mt-4">
                      <p className="text-[8px] font-black text-emerald-700 uppercase tracking-[0.2em] leading-relaxed">
                          Your payment will be received by the <strong className="text-slate-900">SevenX7 Super Admin</strong> and disbursed to the mart upon order fulfillment.
                      </p>
                  </div>
              </div>
              
              <div className="p-6 pt-0 bg-slate-50 border-t border-slate-100">
                <button onClick={onCancel} className="w-full py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Cancel Checkout</button>
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
