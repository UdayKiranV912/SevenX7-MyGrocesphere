
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

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  amount, onSuccess, onCancel, isDemo, savedCards = [], storeName = 'Store', orderMode
}) => {
  const [step, setStep] = useState<'CONNECTING' | 'SELECT' | 'PROCESSING' | 'WAITING_CONFIRMATION' | 'SUCCESS' | 'FAILURE'>('CONNECTING');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successCalledRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => {
        if (isDemo) {
            if (savedCards && savedCards.length > 0) setSelectedMethod(savedCards[0].id);
            else setSelectedMethod('upi_new');
        }
        setStep('SELECT');
    }, 1200);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [savedCards, isDemo]);

  const getPaymentMethodString = () => {
      if (selectedMethod === 'pay_at_store') return `POP: Pickup and Pay (Direct Store)`;
      if (selectedUpiApp) return `UPI (${selectedUpiApp} to Admin)`;
      if (selectedMethod === 'upi_manual') return `Direct UPI Transfer (Manual)`;
      const saved = savedCards?.find(c => c.id === selectedMethod);
      return saved ? `UPI (${saved.upiId})` : 'UPI Transfer to Admin';
  };

  const triggerSuccess = () => {
      if (successCalledRef.current) return;
      successCalledRef.current = true;
      onSuccess(getPaymentMethodString());
  };

  const handlePayAtStore = () => {
      setStep('PROCESSING');
      setTimeout(() => {
          setStep('SUCCESS');
          setTimeout(triggerSuccess, 1500);
      }, 1000);
  };

  const handleDemoPay = () => {
    setStep('PROCESSING');
    timerRef.current = setTimeout(() => {
        setStep('SUCCESS');
        timerRef.current = setTimeout(triggerSuccess, 2000);
    }, 2000);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(ADMIN_UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRealTimeUpiSelect = (appName: string) => {
      setSelectedUpiApp(appName);
      setStep('PROCESSING');
      
      const pn = encodeURIComponent("SevenX7 Admin");
      const tn = encodeURIComponent(`Grocesphere: ${storeName}`);
      const tr = `ORD${Date.now()}`;
      const upiUrl = `upi://pay?pa=${ADMIN_UPI_ID}&pn=${pn}&am=${amount.toFixed(2)}&cu=INR&tn=${tn}&tr=${tr}`;
      
      timerRef.current = setTimeout(() => {
          // In real environment, attempt deep link on mobile
          if (!isDemo && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
              window.location.href = upiUrl;
          }
          setStep('WAITING_CONFIRMATION');
      }, 1500);
  };

  const renderContent = () => {
      if (step === 'CONNECTING') return (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Securing Connection...</p>
          </div>
      );

      if (step === 'PROCESSING') return (
          <div className="text-center p-8 bg-white rounded-[2.5rem] shadow-2xl animate-scale-in max-w-xs mx-auto">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl">📱</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Processing</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Initializing secure transaction...
              </p>
          </div>
      );

      if (step === 'WAITING_CONFIRMATION') return (
          <div className="text-center p-10 bg-white rounded-[3rem] shadow-2xl animate-scale-in max-w-sm mx-auto space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 border-4 border-emerald-100 animate-pulse">⏳</div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">App Confirmation</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Confirm the ₹{amount} payment in your UPI app.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Paying to Admin</p>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 font-mono">{ADMIN_UPI_ID}</span>
                    <button onClick={handleCopyUpi} className="text-[9px] font-black text-emerald-600 uppercase">
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                    onClick={() => setStep('SUCCESS')}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                    I have paid
                </button>
                <button onClick={() => setStep('SELECT')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Back to Methods</button>
              </div>
          </div>
      );

      if (step === 'SUCCESS') return (
          <div className="fixed inset-0 z-[200] bg-emerald-600 flex flex-col items-center justify-center text-white animate-fade-in p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 animate-logo-x shadow-2xl">
                  <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-3xl font-black mb-3">{selectedMethod === 'pay_at_store' ? 'Order Placed' : 'Payment Sent'}</h2>
              <p className="text-emerald-100 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed">
                  {selectedMethod === 'pay_at_store' 
                    ? 'Visit mart for collection' 
                    : 'Amount sent to SevenX7 Admin for processing.'}
              </p>
              <button onClick={triggerSuccess} className="w-full max-w-xs bg-white text-emerald-700 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Continue</button>
          </div>
      );

      return (
          <div className="flex flex-col h-full animate-fade-in">
              <div className="bg-white p-6 pb-10 border-b border-slate-100 flex justify-between items-end shrink-0">
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Payment</p>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{orderMode === 'PICKUP' ? 'Store Pickup' : 'Express Delivery'}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Admin: SevenX7 Innovations</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Payable</p>
                      <span className="text-3xl font-black tracking-tighter tabular-nums text-slate-900">₹{amount}</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-40 hide-scrollbar">
                  {/* ADMIN VPA DISPLAY CARD */}
                  <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all"></div>
                      <div className="relative z-10">
                          <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-3">Recipient: SevenX7 Admin</p>
                          <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fixed Admin VPA</span>
                              <div className="flex items-center justify-between">
                                  <h4 className="text-lg font-black tracking-tight">{ADMIN_UPI_ID}</h4>
                                  <button onClick={handleCopyUpi} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all">
                                      {copied ? 'Copied' : 'Copy ID'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>

                  {orderMode === 'PICKUP' && (
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local Pickup Option</h3>
                        <button 
                            onClick={() => { setSelectedMethod('pay_at_store'); handlePayAtStore(); }}
                            className="w-full p-5 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-between shadow-sm transition-all active:scale-[0.98] group hover:border-emerald-500"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">🤝</div>
                                <div className="text-left">
                                    <span className="font-black text-sm uppercase tracking-tight block text-slate-900">POP / Pickup and Pay</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Pay Directly at Mart</span>
                                </div>
                            </div>
                            <span className="text-slate-300">→</span>
                        </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct App Transfer</h3>
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                          <button 
                            key={app} 
                            onClick={() => handleRealTimeUpiSelect(app)}
                            className="w-full p-5 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-between hover:border-slate-900 transition-all active:scale-[0.98] group shadow-sm"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📱</div>
                                  <span className="font-black text-sm text-slate-800 uppercase tracking-tight">{app}</span>
                              </div>
                              <span className="text-slate-200 group-hover:text-slate-900 transition-colors">→</span>
                          </button>
                      ))}
                  </div>

                  {isDemo && (
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sandbox Simulation</h3>
                          <button 
                            onClick={handleDemoPay}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
                          >
                              Confirm Demo Payment
                          </button>
                      </div>
                  )}
              </div>
              
              <button onClick={onCancel} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Cancel Checkout</button>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-fade-in overflow-hidden">
      {renderContent()}
    </div>
  );
};
