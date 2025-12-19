
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, DeliveryType, Store, Product } from '../types';

// --- Compact Cart Item Row ---
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
       className={`p-2.5 rounded-2xl flex items-center gap-3 animate-slide-up transition-all duration-300 border ${
           isHighlighted 
             ? 'bg-emerald-50 border-emerald-200 scale-[1.01]' 
             : 'bg-white border-slate-100 shadow-sm'
       }`}
       style={{ animationDelay: `${index * 30}ms` }}
     >
        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl shrink-0 border border-slate-100">
            {item.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
           <h3 className="font-bold text-slate-800 text-[10px] truncate leading-tight">{item.name}</h3>
           <div className="flex items-center gap-2 mt-0.5">
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
              className="w-6 h-full flex items-center justify-center text-slate-600 hover:bg-white rounded font-black text-xs active:scale-90"
            >
              −
            </button>
            <span className="w-4 text-center text-[9px] font-black text-slate-900">
                {item.quantity}
            </span>
            <button 
              onClick={() => onUpdateQuantity(item.id, 1)}
              className="w-6 h-full flex items-center justify-center text-slate-600 hover:bg-white rounded font-black text-xs active:scale-90"
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
  hideButton?: boolean;
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-10 animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center text-5xl mb-6 shadow-inner border border-white">🛒</div>
        <h3 className="text-xl font-black text-slate-800">Your Cart is Empty</h3>
        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest leading-relaxed">Add some items from local marts to get started.</p>
        <button onClick={onClose} className="mt-8 bg-slate-900 text-white font-black py-4 px-10 rounded-2xl shadow-lg active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em]">
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
         <div className="flex flex-col">
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Cart Summary</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {cart.reduce((a, b) => a + b.quantity, 0)} Items from {numStores} Marts
            </span>
         </div>
         {onClose && <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-800 border border-slate-100">✕</button>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-40 hide-scrollbar">
         {/* Mart Sections */}
         {Object.entries(groupedItems).map(([storeId, items]) => {
            const storeItems = items as CartItem[];
            const storeInfo = storeItems[0];
            return (
                <div key={storeId} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                         <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                             storeInfo.storeType === 'produce' ? 'bg-emerald-500 text-white' : 
                             storeInfo.storeType === 'dairy' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                         }`}>
                              {storeInfo.storeType === 'produce' ? '🥦' : storeInfo.storeType === 'dairy' ? '🥛' : '🏪'}
                         </div>
                         <h3 className="font-black text-slate-900 text-[9px] uppercase tracking-widest opacity-60">{storeInfo.storeName}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {storeItems.map((item, idx) => (
                          <CartItemRow key={item.id} item={item} index={idx} onUpdateQuantity={onUpdateQuantity} />
                        ))}
                    </div>
                </div>
            );
         })}

         {/* Options Card */}
         <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 space-y-5">
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Order Method</label>
                <div className="flex bg-slate-50 p-1 rounded-xl">
                    <button 
                        onClick={() => onModeChange('DELIVERY')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'DELIVERY' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                    >
                        Delivery
                    </button>
                    <button 
                        onClick={() => onModeChange('PICKUP')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'PICKUP' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400'}`}
                    >
                        Self Pickup
                    </button>
                </div>
            </div>

            {mode === 'DELIVERY' && (
                <div className="space-y-3 animate-fade-in pt-1">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deliver to</label>
                        <button onClick={handleUseCurrentLocation} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                            {isLocatingAddress ? <div className="w-2 h-2 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : '📍 Use Current'}
                        </button>
                    </div>
                    <textarea
                        value={deliveryAddress}
                        onChange={(e) => onAddressChange(e.target.value)}
                        placeholder="Flat No, Street Name, Landmark..."
                        className="w-full bg-slate-50 rounded-xl p-4 text-[11px] font-black text-slate-700 resize-none focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all outline-none border border-slate-200"
                        rows={2}
                    />
                </div>
            )}
         </div>

         {/* Bill Summary */}
         <div className="bg-slate-900 p-6 rounded-[28px] shadow-lg text-white space-y-4">
             <div className="flex justify-between text-[11px] font-bold text-slate-400">
                 <span>Items Subtotal</span>
                 <span className="text-white">₹{itemsTotal}</span>
             </div>
             {mode === 'DELIVERY' && (
                 <div className="flex justify-between text-[11px] font-bold text-slate-400">
                     <span>Delivery Partner Fee</span>
                     <span className={isMovMet ? 'text-emerald-400 font-black' : 'text-white'}>
                         {isMovMet ? 'FREE' : `₹${deliveryFee}`}
                     </span>
                 </div>
             )}
             <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Payable</span>
                <span className="text-2xl font-black tracking-tighter">₹{totalAmount}</span>
             </div>
         </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-slate-100 p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30 sticky bottom-0 left-0 right-0 pb-8">
         <div className="max-w-md mx-auto">
             <button 
                onClick={() => onProceedToPay({ deliveryType: 'INSTANT', splits: { storeAmount: totalAmount, deliveryFee: deliveryFee, storeUpi: activeStore?.upiId } })}
                className="w-full h-14 bg-slate-900 text-white rounded-[22px] font-black shadow-xl active:scale-[0.98] transition-all flex items-center justify-between px-7"
             >
                <span className="text-[10px] uppercase tracking-[0.2em]">Proceed to Pay</span>
                <span className="text-lg tracking-tighter pl-5 border-l border-white/10">₹{totalAmount}</span>
             </button>
         </div>
      </div>
    </div>
  );
};

export const CartSheet: React.FC<CartDetailsProps> = (props) => {
  // Removed Floating button logic completely.
  // This component now acts as the direct Cart View container.
  return <CartDetails {...props} onClose={props.onClose} />;
};
