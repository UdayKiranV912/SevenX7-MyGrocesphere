
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, DeliveryType, Store, Product } from '../types';
import { useStore } from '../contexts/StoreContext';
import { INITIAL_PRODUCTS } from '../constants';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  index: number;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onUpdateQuantity, index }) => {
  return (
    <div 
       className="p-3 rounded-2xl flex items-center gap-4 bg-white border border-slate-100 animate-slide-up"
       style={{ animationDelay: `${index * 30}ms` }}
     >
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-slate-100">
            {item.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
           <h3 className="font-black text-slate-900 text-xs truncate uppercase tracking-tight">{item.name}</h3>
           <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[11px] font-black text-emerald-600">₹{item.price}</span>
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                   {item.selectedBrand}
               </span>
           </div>
        </div>
        
        <div className="flex items-center bg-slate-900 rounded-xl p-0.5 h-8">
            <button 
              onClick={() => onUpdateQuantity(item.id, -1)}
              className="w-7 h-full flex items-center justify-center text-white rounded-lg font-black text-xs active:scale-90"
            >
              −
            </button>
            <span className="w-4 text-center text-[10px] font-black text-white">
                {item.quantity}
            </span>
            <button 
              onClick={() => onUpdateQuantity(item.id, 1)}
              className="w-7 h-full flex items-center justify-center text-white rounded-lg font-black text-xs active:scale-90"
            >
              +
            </button>
        </div>
     </div>
  );
};

export interface CartDetailsProps {
  cart: CartItem[];
  onProceedToPay: (details: { deliveryType: DeliveryType; scheduledTime?: string; splits: any }) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onAddProduct: (product: Product) => void;
  mode: 'DELIVERY' | 'PICKUP';
  onModeChange: (mode: 'DELIVERY' | 'PICKUP') => void;
  deliveryAddress: string;
  onAddressChange: (address: string) => void;
  activeStore: Store | null;
  stores: Store[]; 
  userLocation: { lat: number; lng: number } | null;
  isPage?: boolean;
  onClose?: () => void;
}

export const CartDetails: React.FC<CartDetailsProps> = ({
  cart,
  onProceedToPay,
  onUpdateQuantity,
  onAddProduct,
  mode,
  onModeChange,
  deliveryAddress,
  onAddressChange,
  activeStore,
  onClose
}) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  const ITEMS_TOTAL = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const HANDLING_FEE = 15;
  const DELIVERY_FEE = mode === 'DELIVERY' ? 35 : 0;
  const GRAND_TOTAL = ITEMS_TOTAL + HANDLING_FEE + DELIVERY_FEE;

  const suggestions = INITIAL_PRODUCTS
    .filter(p => !cart.some(c => c.originalProductId === p.id))
    .slice(0, 4);

  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    setScheduledTime(now.toISOString().slice(0, 16));
  }, []);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-10 bg-white">
        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-6xl mb-6 shadow-inner animate-float">🛒</div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cart Empty</h3>
        <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Select items to start your ecosystem order.</p>
        <button onClick={onClose} className="mt-8 bg-slate-900 text-white font-black py-4 px-10 rounded-2xl shadow-xl active:scale-95 transition-all text-[10px] uppercase tracking-widest">Discover Stores</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-40">
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-20">
         <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-all">✕</button>
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Your Basket</h2>
         </div>
         <span className="text-xl font-black text-slate-900">₹{GRAND_TOTAL}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 hide-scrollbar">
         {/* Method Selection */}
         <div className="bg-white p-2 rounded-2xl border border-slate-100 flex shadow-sm">
            <button onClick={() => onModeChange('DELIVERY')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'DELIVERY' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>🚚 Delivery</button>
            <button onClick={() => onModeChange('PICKUP')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'PICKUP' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>🚶 Pickup</button>
         </div>

         {/* Items */}
         <div className="space-y-3">
             <div className="flex items-center justify-between px-1">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</h4>
                 <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Ordered from {activeStore?.name}</span>
             </div>
             {cart.map((item, idx) => (
                <CartItemRow key={idx} item={item} index={idx} onUpdateQuantity={onUpdateQuantity} />
             ))}
         </div>

         {/* Suggested Products */}
         <div className="space-y-4 pt-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Suggested for you</h4>
             <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                 {suggestions.map(p => (
                    <button key={p.id} onClick={() => onAddProduct(p)} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm shrink-0 min-w-[180px] active:scale-95 transition-all">
                        <span className="text-2xl">{p.emoji}</span>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">{p.name}</p>
                            <p className="text-[9px] font-black text-emerald-600">₹{p.price}</p>
                        </div>
                        <span className="ml-auto bg-slate-100 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">+</span>
                    </button>
                 ))}
             </div>
         </div>

         {/* Timing */}
         <div className="bg-white p-5 rounded-[28px] border border-slate-100 space-y-4 shadow-sm">
             <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Order?</label>
                 <div onClick={() => setIsScheduled(!isScheduled)} className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${isScheduled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isScheduled ? 'translate-x-5' : ''}`} />
                 </div>
             </div>
             {isScheduled && (
                <input type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-black text-xs outline-none" />
             )}
             {!isScheduled && (
                <div className="flex items-center gap-3 text-emerald-600">
                    <span className="text-xl">⚡</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Instant {mode === 'DELIVERY' ? 'Dispatch' : 'Pickup'}</span>
                </div>
             )}
         </div>

         {/* Bill Details */}
         <div className="bg-slate-900 p-6 rounded-[32px] text-white space-y-4 shadow-xl">
             <div className="flex justify-between text-[11px] font-bold text-slate-400">
                 <span>Items Total</span>
                 <span className="text-white">₹{ITEMS_TOTAL}</span>
             </div>
             <div className="flex justify-between text-[11px] font-bold text-slate-400">
                 <span>Handling Fee</span>
                 <span className="text-white">₹{HANDLING_FEE}</span>
             </div>
             {mode === 'DELIVERY' && (
                 <div className="flex justify-between text-[11px] font-bold text-slate-400">
                     <span>Delivery Fee</span>
                     <span className="text-white">₹{DELIVERY_FEE}</span>
                 </div>
             )}
             <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase tracking-widest">Total Payable</span>
                 <span className="text-2xl font-black tracking-tighter tabular-nums">₹{GRAND_TOTAL}</span>
             </div>
         </div>
      </div>

      <div className="fixed bottom-[80px] left-0 right-0 max-w-md mx-auto px-5 z-40">
          <button 
            onClick={() => onProceedToPay({
                deliveryType: isScheduled ? 'SCHEDULED' : 'INSTANT',
                scheduledTime: isScheduled ? scheduledTime : undefined,
                splits: { storeAmount: ITEMS_TOTAL, deliveryFee: DELIVERY_FEE, handlingFee: HANDLING_FEE, storeUpi: activeStore?.upiId }
            })}
            className="w-full h-14 bg-slate-900 text-white rounded-[22px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
              Confirm & Pay ₹{GRAND_TOTAL}
          </button>
      </div>
    </div>
  );
};

export const CartSheet: React.FC<CartDetailsProps> = (props) => {
  return <CartDetails {...props} onClose={props.onClose} />;
};
