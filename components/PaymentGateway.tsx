
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

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  amount, onSuccess, onCancel, isDemo, splits, savedCards = [], onSavePaymentMethod, storeName = 'Store', orderMode
}) => {
  const [step, setStep] = useState<'CONNECTING' | 'SELECT' | 'PROCESSING' | 'WAITING_CONFIRMATION' | 'SUCCESS' | 'FAILURE'>('CONNECTING');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');

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
      if (selectedMethod === 'pay_at_store') return `Pay at Store (Cash/QR)`;
      if (!isDemo && selectedUpiApp) return `UPI (${selectedUpiApp})`;
      if (selectedMethod === 'upi_new') return `UPI (${upiId || 'New'})`;
      const saved = savedCards?.find(c => c.id === selectedMethod);
      return saved ? `UPI (${saved.upiId})` : 'UPI Transfer';
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
        if (Math.random() < 0.1) {
            setStep('FAILURE');
            return;
        }
        setStep('SUCCESS');
        timerRef.current = setTimeout(triggerSuccess, 2000);
    }, 2000);
  };

  const handleRealTimeUpiSelect = (appName: string) => {
      setSelectedUpiApp(appName);
      setStep('PROCESSING');
      
      const pn = encodeURIComponent("SevenX7 Admin");
      const tn = encodeURIComponent(`Order - ${storeName}`);
      const tr = `ORD${Date.now()}`;
      const upiUrl = `upi://pay?pa=${ADMIN_UPI_ID}&pn=${pn}&am=${amount.toFixed(2)}&cu=INR&tn=${tn}&tr=${tr}`;
      
      timerRef.current = setTimeout(() => {
          if (!isDemo) window.location.href = upiUrl;
          setStep('WAITING_CONFIRMATION');
          timerRef.current = setTimeout(() => {
              setStep('SUCCESS');
          }, 6000); 
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
                  Finalizing secure transaction details
              </p>
          </div>
      );

      if (step === 'WAITING_CONFIRMATION') return (
          <div className="text-center p-8 bg-white rounded-[2.5rem] shadow-2xl animate-scale-in max-w-xs mx-auto">
              <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 border-4 border-yellow-100 animate-pulse">⏳</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Awaiting Approval</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Please confirm the payment on your device to proceed.
              </p>
          </div>
      );

      if (step === 'SUCCESS') return (
          <div className="fixed inset-0 z-[200] bg-emerald-600 flex flex-col items-center justify-center text-white animate-fade-in p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 animate-logo-x shadow-2xl">
                  <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-3xl font-black mb-3">{selectedMethod === 'pay_at_store' ? 'Order Confirmed' : 'Payment Accepted'}</h2>
              <p className="text-emerald-100 font-bold uppercase tracking-widest text-[10px] mb-12">
                  {selectedMethod === 'pay_at_store' ? 'Proceed to mart for collection' : 'Funds received by platform admin'}
              </p>
              <button onClick={triggerSuccess} className="w-full max-w-xs bg-white text-emerald-700 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Continue</button>
          </div>
      );

      if (step === 'FAILURE') return (
          <div className="fixed inset-0 z-[200] bg-red-600 flex flex-col items-center justify-center text-white animate-fade-in p-8 text-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 shadow-2xl">
                  <span className="text-5xl">❌</span>
              </div>
              <h2 className="text-3xl font-black mb-3">Transaction Failed</h2>
              <p className="text-red-100 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed">Please try an alternative payment method.</p>
              <button onClick={() => setStep('SELECT')} className="w-full max-w-xs bg-white text-red-700 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Retry</button>
          </div>
      );

      return (
          <div className="flex flex-col h-full animate-fade-in">
              <div className="bg-white p-6 pb-10 border-b border-slate-100 flex justify-between items-end shrink-0">
                  <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local Settlement</p>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{orderMode === 'PICKUP' ? 'Store Pickup' : 'Home Delivery'}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Store: {storeName}</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Due</p>
                      <span className="text-3xl font-black tracking-tighter tabular-nums text-slate-900">₹{amount}</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-40">
                  {orderMode === 'PICKUP' && (
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Physical Payment</h3>
                        <button 
                            onClick={() => { setSelectedMethod('pay_at_store'); handlePayAtStore(); }}
                            className="w-full p-5 bg-emerald-500 text-white rounded-2xl border-2 border-emerald-400 flex items-center justify-between shadow-lg transition-all active:scale-[0.98] group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤝</div>
                                <div className="text-left">
                                    <span className="font-black text-sm uppercase tracking-tight block">Pay at Store</span>
                                    <span className="text-[8px] font-bold opacity-80 uppercase">Cash or Direct QR</span>
                                </div>
                            </div>
                            <span className="text-white/40">→</span>
                        </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Online Payment</h3>
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                          <button 
                            key={app} 
                            onClick={() => handleRealTimeUpiSelect(app)}
                            className="w-full p-5 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-between hover:border-slate-900 transition-all active:scale-[0.98] group"
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
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sandbox Terminal</h3>
                          <div className={`p-5 rounded-[2rem] border-2 transition-all ${selectedMethod === 'upi_new' ? 'bg-emerald-50 border-emerald-500 shadow-lg' : 'bg-white border-slate-100'}`} onClick={() => setSelectedMethod('upi_new')}>
                              <input 
                                  placeholder="Enter UPI ID (user@bank)"
                                  className="w-full bg-transparent text-sm font-black outline-none placeholder:text-slate-300"
                                  value={upiId}
                                  onChange={e => setUpiId(e.target.value)}
                              />
                          </div>
                          <button 
                            onClick={handleDemoPay}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-float active:scale-95 transition-all"
                          >
                              Verify Sandbox Payment
                          </button>
                      </div>
                  )}
              </div>
              
              <button onClick={onCancel} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Discard Order</button>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-fade-in overflow-hidden">
      {renderContent()}
    </div>
  );
};
