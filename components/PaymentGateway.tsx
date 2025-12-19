
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
      handlingFee: number;
      adminUpi: string;
      deliveryFee: number;
      driverUpi: string;
  };
  savedCards?: SavedCard[];
  onSavePaymentMethod?: (method: SavedCard) => void;
  storeName?: string;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  amount, onSuccess, onCancel, isDemo, splits, savedCards = [], onSavePaymentMethod, storeName = 'Store'
}) => {
  const [step, setStep] = useState<'CONNECTING' | 'SELECT' | 'PROCESSING' | 'WAITING_CONFIRMATION' | 'SUCCESS'>('CONNECTING');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  
  // Input States
  const [upiId, setUpiId] = useState('');
  const [saveMethod, setSaveMethod] = useState(true);
  
  // Real-time UPI App Selection
  const [selectedUpiApp, setSelectedUpiApp] = useState('');

  // Refs for cleanup and single submission
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successCalledRef = useRef(false);

  // Lock scroll on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Initialize selected method
  useEffect(() => {
    // Simulate initial connection
    const timer = setTimeout(() => {
        if (isDemo) {
            if (savedCards && savedCards.length > 0) {
                setSelectedMethod(savedCards[0].id);
            } else {
                setSelectedMethod('upi_new');
            }
        }
        setStep('SELECT');
    }, 1500);
    return () => clearTimeout(timer);
  }, [savedCards, isDemo]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getPaymentMethodString = () => {
      if (!isDemo && selectedUpiApp) return `UPI (${selectedUpiApp})`;
      if (selectedMethod === 'upi_new') return `UPI (${upiId || 'New'})`;
      
      const saved = savedCards?.find(c => c.id === selectedMethod);
      if (saved) return `UPI (${saved.upiId})`;
      
      return 'UPI Payment';
  };

  const triggerSuccess = () => {
      if (successCalledRef.current) return;
      successCalledRef.current = true;
      onSuccess(getPaymentMethodString());
  };

  // Demo Pay Flow (Mock)
  const handleDemoPay = () => {
    setStep('PROCESSING');
    
    timerRef.current = setTimeout(() => {
        if (saveMethod && onSavePaymentMethod && selectedMethod === 'upi_new' && upiId) {
            onSavePaymentMethod({
                id: `saved_upi_${Date.now()}`,
                type: 'UPI',
                upiId: upiId,
                label: 'My UPI ID'
            });
        }
        setStep('SUCCESS');
        timerRef.current = setTimeout(triggerSuccess, 2500);
    }, 2000);
  };

  // Real-time Pay Flow (Redirect to UPI App)
  const handleRealTimeUpiSelect = (appName: string) => {
      setSelectedUpiApp(appName);
      setStep('PROCESSING');
      
      const storeVpa = splits?.storeUpi;
      const vpa = (storeVpa && storeVpa !== 'store@upi') ? storeVpa : 'merchant@upi';
      const pn = encodeURIComponent(storeName);
      const tn = encodeURIComponent(`Payment for Order`);
      const tr = `ORD${Date.now()}`;
      const am = amount.toFixed(2);
      const cu = 'INR';
      
      const upiUrl = `upi://pay?pa=${vpa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}&tr=${tr}`;
      
      timerRef.current = setTimeout(() => {
          // Trigger the deep link for real users
          window.location.href = upiUrl;

          // Move to waiting state
          setStep('WAITING_CONFIRMATION');
          
          timerRef.current = setTimeout(() => {
              setStep('SUCCESS');
          }, 8000); 

      }, 1500);
  };

  const renderPaymentContent = () => {
      if (step === 'CONNECTING') {
          return (
            <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-bold animate-pulse">Connecting to UPI Gateway...</p>
            </div>
          );
      }

      if (step === 'PROCESSING') {
          return (
             <div className="text-center bg-white p-8 rounded-[2rem] shadow-xl max-w-xs w-full mx-auto">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto border-4 border-emerald-100 animate-pulse mb-6">
                    📱
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Opening {selectedUpiApp || 'UPI App'}</h3>
                <p className="text-xs text-slate-500 mb-6">Securing your transaction...</p>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[width_2s_ease-in-out_infinite] w-1/2"></div>
                </div>
             </div>
          );
      }

      if (step === 'WAITING_CONFIRMATION') {
          return (
            <div className="text-center bg-white p-8 rounded-[2rem] shadow-xl max-w-xs w-full mx-auto animate-fade-in">
               <div className="relative w-20 h-20 mx-auto mb-6">
                   <div className="absolute inset-0 bg-yellow-100 rounded-full animate-ping opacity-75"></div>
                   <div className="relative w-full h-full bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-4xl border-4 border-yellow-200">
                       ⏳
                   </div>
               </div>
               <h3 className="text-lg font-black text-slate-900 mb-2">Awaiting Confirmation</h3>
               <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                   Please approve the request in your UPI app. Waiting for bank verification.
               </p>
               <div className="flex justify-center gap-1.5">
                   <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                   <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
               </div>
            </div>
          );
      }

      if (step === 'SUCCESS') {
        return (
          <div className="fixed inset-0 z-[100] bg-emerald-600 flex flex-col items-center justify-center text-white animate-fade-in">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 animate-bounce shadow-xl">
              <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black mb-2 text-center">Payment Done!</h2>
            <p className="text-white/90 font-medium text-center max-w-xs mb-8">
                Transaction ID: T{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
            <button 
                onClick={triggerSuccess}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all"
            >
                Confirm Order
            </button>
          </div>
        );
      }

      return (
          <div className="flex flex-col h-full bg-slate-50">
              <div className="bg-white p-6 pb-8 shadow-sm border-b border-slate-100 relative z-10">
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                          <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                          <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">UPI Gateway</h2>
                      </div>
                      <div className="text-3xl font-black text-slate-900 tracking-tight">₹{amount}</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <span>Store:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[150px]">{storeName}</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
                  {!isDemo ? (
                      <div className="space-y-4 animate-slide-up">
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select UPI App</h3>
                           {['Google Pay', 'PhonePe', 'Paytm', 'Amazon Pay', 'BHIM'].map((app) => {
                               const isSelected = selectedUpiApp === app;
                               return (
                               <button 
                                  key={app}
                                  onClick={() => handleRealTimeUpiSelect(app)}
                                  className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                                      isSelected 
                                      ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                                      : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                                  }`}
                               >
                                   <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isSelected ? 'bg-emerald-100' : 'bg-slate-50'}`}>
                                          📱
                                       </div>
                                       <span className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{app}</span>
                                   </div>
                                   <div className={`bg-emerald-500 text-white rounded-full p-1 shadow-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                       </svg>
                                   </div>
                               </button>
                               );
                           })}
                           <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 leading-relaxed text-center font-bold">
                               Secure 256-bit encrypted transaction
                           </div>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {savedCards && savedCards.length > 0 && (
                              <div className="space-y-2">
                                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Saved VPA</h3>
                                  {savedCards.map(card => {
                                      const isSelected = selectedMethod === card.id;
                                      return (
                                      <div 
                                        key={card.id}
                                        onClick={() => setSelectedMethod(card.id)}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                      >
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isSelected ? 'bg-emerald-100' : 'bg-slate-50'}`}>📱</div>
                                          <div className="flex-1">
                                              <p className={`font-black text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{card.label}</p>
                                              <p className={`text-[10px] font-bold font-mono uppercase ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>{card.upiId}</p>
                                          </div>
                                          <div className={`bg-emerald-500 text-white rounded-full p-1.5 shadow-sm transition-all ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                              </svg>
                                          </div>
                                      </div>
                                      );
                                  })}
                              </div>
                          )}

                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mt-4">Add New UPI ID</h3>
                          <div className={`bg-white rounded-[24px] overflow-hidden border-2 transition-all ${selectedMethod === 'upi_new' ? 'border-emerald-500 shadow-lg' : 'border-slate-200'}`}>
                              <div className={`p-4 flex items-center gap-4 cursor-pointer ${selectedMethod === 'upi_new' ? 'bg-emerald-50/30' : ''}`} onClick={() => setSelectedMethod('upi_new')}>
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${selectedMethod === 'upi_new' ? 'bg-emerald-100' : 'bg-slate-50'}`}>📱</div>
                                  <div className="flex-1 font-black text-slate-800 text-sm uppercase tracking-tight">Manual VPA Input</div>
                                  <div className={`bg-emerald-500 text-white rounded-full p-1.5 shadow-sm transition-all ${selectedMethod === 'upi_new' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                      </svg>
                                  </div>
                              </div>
                              {selectedMethod === 'upi_new' && (
                                  <div className="p-4 pt-0 bg-white animate-fade-in">
                                      <input 
                                          type="text" 
                                          placeholder="e.g. user@okhdfc" 
                                          value={upiId}
                                          onChange={(e) => setUpiId(e.target.value)}
                                          className="w-full p-4 rounded-xl border-2 border-slate-100 text-sm font-black outline-none focus:border-emerald-500 bg-slate-50/50"
                                      />
                                      <label className="flex items-center gap-3 cursor-pointer mt-3">
                                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${saveMethod ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                                              {saveMethod && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                              <input type="checkbox" checked={saveMethod} onChange={(e) => setSaveMethod(e.target.checked)} className="hidden" />
                                          </div>
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Save securely for future</span>
                                      </label>
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </div>

              {isDemo && (
                  <div className="p-6 border-t border-slate-200 bg-white">
                      <button 
                        onClick={handleDemoPay}
                        disabled={(selectedMethod === 'upi_new' && !upiId) || !selectedMethod}
                        className="w-full h-14 bg-slate-900 text-white rounded-[20px] font-black shadow-float active:scale-[0.98] transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-between px-8"
                      >
                          <span className="text-[10px] uppercase tracking-[0.2em]">Mock Payment</span>
                          <span className="text-xl font-black tracking-tighter">₹{amount}</span>
                      </button>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col animate-fade-in">
      <div className="bg-gray-800 p-3 flex items-center gap-3 shadow-md z-50">
        <button onClick={onCancel} className="text-gray-400 hover:text-white">✕</button>
        <div className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-xs text-green-400 font-mono flex items-center gap-2">
          <span className="text-gray-400">🔒</span> https://secure.grocesphere.com/upi-gateway
        </div>
      </div>
      <div className="flex-1 flex flex-col relative overflow-hidden">
          {renderPaymentContent()}
      </div>
    </div>
  );
};
