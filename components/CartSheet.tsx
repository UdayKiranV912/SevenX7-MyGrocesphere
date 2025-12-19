
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, DeliveryType, Store, Product } from '../types';

// --- Compact Refined Cart Item Row ---
interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  index: number;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onUpdateQuantity, index }) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const prevQty = useRef(item.quantity);

  useEffect(() => {
    if (prevQty.current !== item.quantity) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 300);
      prevQty.current = item.quantity;
      return () => clearTimeout(timer);
    }
  }, [item.quantity]);

  return (
    <div 
       className={`p-2 rounded-xl flex items-center gap-3 animate-slide-up transition-all duration-300 ${
           isHighlighted 
             ? 'bg-emerald-50 scale-[1.01]' 
             : 'bg-white'
       }`}
       style={{ animationDelay: `${index * 30}ms` }}
     >
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg shrink-0 border border-slate-200 shadow-sm">
            {item.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
           <h3 className="font-bold text-slate-900 text-[10px] truncate leading-tight">{item.name}</h3>
           <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[10px] font-black text-slate-900">₹{item.price}</span>
               {item.selectedVariant && (
                   <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
                       • {item.selectedVariant.name}
                   </span>
               )}
           </div>
        </div>
        
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 h-7">
            <button 
              onClick={() => onUpdateQuantity(item.id, -1)}
              className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-md font-black text-xs active:scale-90 transition-all"
            >
              −
            </button>
            <span className="w-4 text-center text-[10px] font-black text-slate-900">
                {item.quantity}
            </span>
            <button 
              onClick={() => onUpdateQuantity(item.id, 1)}
              className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-md font-black text-xs active:scale-90 transition-all"
            >
              +
            </button>
        </div>
     </div>
  );
};

export interface CartDetailsProps {
  cart: CartItem[];
  onProceedToPay: (details: { deliveryType: DeliveryType; scheduledTime?: string; isPayLater?: boolean; splits: any }) => void;
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
  mode,
  onModeChange,
  deliveryAddress,
  onAddressChange,
  activeStore,
  isPage = false,
  onClose
}) => {
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    // Set default scheduled time to 2 hours from now
    const now = new Date();
    now.setHours(now.getHours() + 2);
    setScheduledTime(now.toISOString().slice(0, 16));
  }, []);
  
  const MINIMUM_ORDER_VALUE = 1000; 
  const BASE_DELIVERY_FEE = 30;

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CartItem[]> = {};
    cart.forEach(item => {
        if (!groups[item.storeId]) groups[item.storeId] = [];
        groups[item.storeId].push(item);
    });
    return groups;
  }, [cart]);

  const itemsTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const numStores = Object.keys(groupedItems).length;
  const isMovMet = itemsTotal >= MINIMUM_ORDER_VALUE;
  const deliveryFee = mode === 'DELIVERY' ? (isMovMet ? 0 : BASE_DELIVERY_FEE * numStores) : 0;
  const totalAmount = itemsTotal + deliveryFee;

  const handleUseCurrentLocation = async () => {
    setIsLocatingAddress(true);
    if (!navigator.geolocation) { alert("Not supported"); setIsLocatingAddress(false); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
         const { latitude, longitude } = pos.coords;
         try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            if (data?.display_name) onAddressChange(data.display_name);
         } catch(e) { console.error(e); }
         setIsLocatingAddress(false);
    }, () => setIsLocatingAddress(false));
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-10 animate-fade-in bg-white">
        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-6xl mb-6 shadow-inner border border-slate-100 animate-float">🛒</div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h3>
        <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-widest leading-relaxed">Let's find some great local products together.</p>
        <button 
          onClick={onClose} 
          className="mt-8 bg-slate-900 text-white font-black py-4 px-12 rounded-2xl shadow-float active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em]"
        >
          Explore Marts
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Dynamic Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-20">
         <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Your Cart</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                {cart.reduce((a, b) => a + b.quantity, 0)} Items • ₹{totalAmount} Total
            </span>
         </div>
         {onClose && (
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-800 border border-slate-100 transition-all active:scale-90">✕</button>
         )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-48 hide-scrollbar">
         {/* Store Groups */}
         <div className="space-y-4">
           {Object.entries(groupedItems).map(([storeId, items]) => {
              const storeItems = items as CartItem[];
              const storeInfo = storeItems[0];
              return (
                  <div key={storeId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-50 flex items-center gap-3">
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${
                               storeInfo.storeType === 'produce' ? 'bg-emerald-500 text-white' : 
                               storeInfo.storeType === 'dairy' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                           }`}>
                                {storeInfo.storeType === 'produce' ? '🥦' : storeInfo.storeType === 'dairy' ? '🥛' : '🏪'}
                           </div>
                           <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest truncate">{storeInfo.storeName}</h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                          {storeItems.map((item, idx) => (
                            <CartItemRow key={item.id} item={item} index={idx} onUpdateQuantity={onUpdateQuantity} />
                          ))}
                      </div>
                  </div>
              );
           })}
         </div>

         {/* Timing & Preferences */}
         <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 space-y-5">
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Receive Method</label>
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button 
                        onClick={() => onModeChange('DELIVERY')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'DELIVERY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                        🚚 Delivery
                    </button>
                    <button 
                        onClick={() => onModeChange('PICKUP')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'PICKUP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                        🚶 Pickup
                    </button>
                </div>
            </div>

            {/* Schedule Option for BOTH modes */}
            <div className="pt-2">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Timing Preference</label>
                    <div 
                      onClick={() => setIsScheduled(!isScheduled)}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${isScheduled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isScheduled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
                
                {isScheduled ? (
                    <div className="animate-fade-in">
                        <input 
                            type="datetime-local" 
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] font-black outline-none focus:bg-white focus:ring-4 focus:ring-emerald-50/50"
                        />
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-2 ml-1">Schedule your preferred {mode.toLowerCase()} slot</p>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                        <span className="text-lg">⚡</span>
                        <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase">Instant {mode === 'DELIVERY' ? 'Delivery' : 'Pickup'}</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Earliest possible arrival</p>
                        </div>
                    </div>
                )}
            </div>

            {mode === 'DELIVERY' && (
                <div className="space-y-3 animate-fade-in pt-2">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Details</label>
                        <button onClick={handleUseCurrentLocation} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                            {isLocatingAddress ? <div className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : '📍 Use GPS'}
                        </button>
                    </div>
                    <textarea
                        value={deliveryAddress}
                        onChange={(e) => onAddressChange(e.target.value)}
                        placeholder="Flat No, Wing, Floor, Landmark..."
                        className="w-full bg-slate-50 rounded-2xl p-4 text-[11px] font-black text-slate-700 resize-none focus:bg-white focus:ring-4 focus:ring-emerald-50/50 transition-all outline-none border border-slate-200"
                        rows={2}
                    />
                </div>
            )}
         </div>

         {/* Bill Details */}
         <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl text-white space-y-4">
             <div className="flex justify-between text-[11px] font-bold text-slate-400">
                 <span>Subtotal</span>
                 <span className="text-white">₹{itemsTotal}</span>
             </div>
             {mode === 'DELIVERY' && (
                 <div className="flex justify-between text-[11px] font-bold text-slate-400">
                     <span>Fee ({numStores} Marts)</span>
                     <span className={isMovMet ? 'text-emerald-400 font-black' : 'text-white'}>
                         {isMovMet ? 'FREE' : `₹${deliveryFee}`}
                     </span>
                 </div>
             )}
             <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                  <span className="text-[8px] text-emerald-400 font-bold uppercase mt-0.5">Incl. all taxes</span>
                </div>
                <span className="text-3xl font-black tracking-tighter">₹{totalAmount}</span>
             </div>
         </div>
      </div>

      {/* Redesigned Fixed Action Area */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-100 p-5 shadow-[0_-15px_40px_rgba(0,0,0,0.06)] z-30 sticky bottom-0 left-0 right-0 pb-10">
         <div className="max-w-md mx-auto">
             <button 
                onClick={() => onProceedToPay({ 
                    deliveryType: isScheduled ? 'SCHEDULED' : 'INSTANT', 
                    scheduledTime: isScheduled ? scheduledTime : undefined,
                    splits: { 
                        storeAmount: itemsTotal, 
                        deliveryFee: deliveryFee, 
                        storeUpi: activeStore?.upiId 
                    } 
                })}
                className="group w-full h-16 bg-slate-900 text-white rounded-[24px] font-black shadow-float active:scale-[0.98] transition-all flex items-center justify-between px-7 relative overflow-hidden"
             >
                <div className="absolute inset-0 bg-emerald-600 translate-y-full group-active:translate-y-0 transition-transform duration-300"></div>
                
                <div className="relative flex flex-col items-start z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-60">Complete Order</span>
                    <span className="text-xs font-black">Secure Checkout</span>
                </div>
                
                <div className="relative flex items-center gap-3 z-10">
                    <span className="text-xl font-black tracking-tighter tabular-nums border-l border-white/20 pl-4">₹{totalAmount}</span>
                    <svg className="w-5 h-5 translate-x-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </div>
             </button>
         </div>
      </div>
    </div>
  );
};

export const CartSheet: React.FC<CartDetailsProps> = (props) => {
  return <CartDetails {...props} onClose={props.onClose} />;
};
