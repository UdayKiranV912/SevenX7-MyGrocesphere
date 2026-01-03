
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
      handlingFee: number;
  };
  savedCards?: SavedCard[];
  onSavePaymentMethod?: (method: SavedCard) => void;
  storeName?: string;
  orderMode?: 'DELIVERY' | 'PICKUP';
}

const ADMIN_UPI_ID = 'ADMIN_PAY@okicici';

type GatewayStep = 'SELECT' | 'REDIRECTING' | 'WAITING_TRANS_ID' | 'VERIFYING' | 'SUCCESS' | 'FAILURE';

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  amount, onSuccess, onCancel, isDemo, storeName = 'Store', orderMode
}) => {
  const [step, setStep] = useState<GatewayStep>('SELECT');
  const [transactionId, setTransactionId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleUpiRedirect = () => {
    const upiUrl = `upi://pay?pa=${ADMIN_UPI_ID}&pn=SevenX7%20Ecosystem&am=${amount}&cu=INR&tn=Order%20Payment`;
    setStep('REDIRECTING');
    
    setTimeout(() => {
        if (!isDemo) window.location.href = upiUrl;
        setStep('WAITING_TRANS_ID');
    }, 1500);
  };

  const handleVerify = () => {
    if (!transactionId.trim()) {
        setErrorMsg('Please enter the Transaction ID to continue');
        return;
    }
    setStep('VERIFYING');
    
    // Simulate Admin Verification
    setTimeout(() => {
        if (isDemo || transactionId.length > 5) {
            setStep('SUCCESS');
            setTimeout(() => onSuccess('UPI Transfer Verified'), 1500);
        } else {
            setStep('FAILURE');
            setErrorMsg('Invalid Transaction ID. Admin could not verify this payment.');
        }
    }, 2500);
  };

  const renderContent = () => {
    switch(step) {
        case 'SELECT':
            return (
                <div className="flex-1 flex flex-col p-8 space-y-8 animate-fade-in">
                    <div className="text-center pt-8">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto border-4 border-white shadow-soft-xl mb-6">📱</div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Checkout</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Secured by Ecosystem Admin Escrow</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Amount</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{amount}</span>
                        </div>

                        <button onClick={handleUpiRedirect} className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-between px-8 group active:scale-95 transition-all">
                            <span>Pay via UPI App</span>
                            <span className="group-hover:translate-x-2 transition-transform">→</span>
                        </button>

                        <button onClick={onCancel} className="w-full py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cancel Order</button>
                    </div>
                </div>
            );
        case 'REDIRECTING':
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Connecting App</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Opening your default UPI provider...</p>
                </div>
            );
        case 'WAITING_TRANS_ID':
            return (
                <div className="flex-1 flex flex-col p-8 animate-slide-up">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">✍️</div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Enter Payment Ref</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">Please paste the Transaction ID or Ref No. from your payment app for Admin verification.</p>
                    </div>
                    <div className="space-y-4">
                        <input type="text" value={transactionId} onChange={e => {setTransactionId(e.target.value); setErrorMsg('');}} placeholder="Transaction ID (e.g. 1234...)" className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 text-center text-base font-black uppercase outline-none focus:border-slate-900 transition-all" />
                        {errorMsg && <p className="text-[9px] font-black text-red-500 uppercase text-center">{errorMsg}</p>}
                        <button onClick={handleVerify} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Confirm & Submit</button>
                    </div>
                </div>
            );
        case 'VERIFYING':
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">🛡️</div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Admin Checking</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Verifying funds in Escrow Vault...</p>
                </div>
            );
        case 'SUCCESS':
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-10 bg-emerald-600 text-white text-center animate-fade-in">
                    <div className="w-20 h-20 bg-white text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-8 shadow-2xl">✓</div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Verified</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-2">Order Confirmed by Admin</p>
                </div>
            );
        case 'FAILURE':
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-8">✕</div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verification Fail</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{errorMsg}</p>
                    <button onClick={() => setStep('WAITING_TRANS_ID')} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Try Again</button>
                </div>
            );
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-white flex flex-col animate-fade-in">
        {renderContent()}
    </div>
  );
};
