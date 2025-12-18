
import React, { useState, useEffect, useRef } from 'react';
import { CartItem, DeliveryType, Store, Product } from '../types';
import { MapVisualizer } from './MapVisualizer';
import { INITIAL_PRODUCTS, MOCK_STORES } from '../constants';

// --- Improved Cart Item Row ---
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

  const mrp = Math.ceil(item.price * 1.25);
  const savings = (mrp - item.price) * item.quantity;

  return (
    <div 
       className={`p-3 rounded-[20px] flex items-center gap-3 animate-slide-up transition-all duration-500 border-2 ${
           isHighlighted 
             ? 'bg-brand-light/50 border-brand-DEFAULT shadow-soft scale-[1.02]' 
             : 'bg-white border-slate-50 shadow-soft'
       }`}
       style={{ animationDelay: `${index * 40}ms` }}
     >
        <div className="w-14 h-14 bg-slate-50/50 rounded-xl flex items-center justify-center text-3xl shrink-0 emoji-3d shadow-inner border border-white">
            {item.emoji}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
           <h3 className="font-black text-slate-800 text-xs truncate leading-tight mb-0.5">{item.name}</h3>
           <div className="flex items-center gap-1.5 mb-1">
               {item.selectedBrand && item.selectedBrand !== 'Generic' && (
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.selectedBrand}</span>
               )}
               {item.selectedVariant && (
                   <span className="text-[8px] font-black text-brand-dark bg-brand-light px-1 py-0.5 rounded-full uppercase tracking-tighter">
                       {item.selectedVariant.name}
                   </span>
               )}
           </div>
           <div className="flex items-baseline gap-1.5">
               <span className="text-xs font-black text-slate-900 tracking-tight">₹{item.price}</span>
               <span className="text-[9px] text-slate-300 line-through font-bold">₹{mrp}</span>
           </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 shadow-md border border-white/10">
                <button 
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 rounded transition-all font-black text-base active:scale-90"
                >
                  −
                </button>
                <span className="w-5 text-center text-[10px] font-black text-white">
                    {item.quantity}
                </span>
                <button 
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 rounded transition-all font-black text-base active:scale-90"
                >
                  +
                </button>
            </div>
            <div className="text-[9px] font-black text-slate-400 uppercase">₹{item.price * item.quantity}</div>
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
  onAddProduct,
  mode,
  onModeChange,
  deliveryAddress,
  onAddressChange,
  activeStore,
  stores,
  userLocation,
  isPage = false,
  onClose
}) => {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('INSTANT');
  const [scheduledTime, setScheduledTime] = useState('');
  const [minScheduledTime, setMinScheduledTime] = useState('');
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  
  const MINIMUM_ORDER_VALUE = 1000; 
  const BASE_DELIVERY_FEE = 30;

  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const isoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setMinScheduledTime(isoString);
    if (!scheduledTime) setScheduledTime(isoString);
  }, []);

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CartItem[]> = {};
    cart.forEach(item => {
        if (!groups[item.storeId]) groups[item.storeId] = [];
        groups[item.storeId].push(item);
    });
    return groups;
  }, [cart]);

  const itemsTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalMRP = cart.reduce((acc, item) => acc + (Math.ceil(item.price * 1.25) * item.quantity), 0);
  const totalSavings = totalMRP - itemsTotal;
  
  const numStores = Object.keys(groupedItems).length;
  const isMovMet = itemsTotal >= MINIMUM_ORDER_VALUE;
  const deliveryFee = mode === 'DELIVERY' ? (isMovMet ? 0 : BASE_DELIVERY_FEE * numStores) : 0;
  const onlinePayableTotal = itemsTotal + deliveryFee;

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

  const preparePaymentData = (isPayLater: boolean) => {
      onProceedToPay({ 
          deliveryType: showSchedulePicker ? 'SCHEDULED' : 'INSTANT', 
          scheduledTime: showSchedulePicker ? scheduledTime : undefined, 
          isPayLater,
          splits: {
              storeAmount: onlinePayableTotal,
              storeUpi: activeStore?.upiId || 'store@upi',
              handlingFee: 0, 
              adminUpi: 'uday@admin',
              deliveryFee: deliveryFee,
              driverUpi: 'driver@upi'
          }
      });
  };

  if (cart.length === 0 && isPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-8 animate-fade-in">
        <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center text-6xl mb-6 shadow-soft transform -rotate-6 border-4 border-white">🛒</div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Basket is Empty</h3>
        <p className="text-[10px] text-slate-400 font-bold mt-2 mb-8 max-w-xs mx-auto leading-relaxed">Add some local fresh products to continue.</p>
        <button onClick={onClose} className="bg-slate-900 text-white font-black py-4 px-10 rounded-[20px] shadow-float active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]">
          Browse Stores
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className={`px-5 py-4 bg-white/80 backdrop-blur-xl flex justify-between items-end sticky top-0 z-20 border-b border-slate-100 shadow-sm ${!isPage && 'rounded-t-[32px]'}`}>
         {!isPage && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-100 rounded-full" />}
         <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Checkout</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {cart.reduce((a, b) => a + b.quantity, 0)} Items from {numStores} Store{numStores > 1 ? 's' : ''}
            </span>
         </div>
         {isPage && <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-slate-800 border border-slate-100">✕</button>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar space-y-5 pb-40">
         <div className="space-y-4">
           {Object.entries(groupedItems).map(([storeId, items]) => {
              const storeItems = items as CartItem[];
              const storeInfo = storeItems[0];
              return (
                  <div key={storeId} className="space-y-2 animate-fade-in-up">
                      <div className="flex items-center gap-2 px-1">
                           <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-soft ${
                               storeInfo.storeType === 'produce' ? 'bg-emerald-50 text-emerald-600' : 
                               storeInfo.storeType === 'dairy' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                           }`}>
                                {storeInfo.storeType === 'produce' ? '🥦' : storeInfo.storeType === 'dairy' ? '🥛' : '🏪'}
                           </div>
                           <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-wider">{storeInfo.storeName}</h3>
                      </div>
                      <div className="space-y-2">
                          {storeItems.map((item, idx) => (
                            <CartItemRow key={item.id} item={item} index={idx} onUpdateQuantity={onUpdateQuantity} />
                          ))}
                      </div>
                  </div>
              );
           })}
         </div>

         <div className="bg-white p-4 rounded-[24px] shadow-soft border border-slate-50 space-y-4">
            <div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Logistics</h4>
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-1 rounded-xl">
                    <button 
                        onClick={() => onModeChange('DELIVERY')}
                        className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'DELIVERY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                        🚚 Delivery
                    </button>
                    <button 
                        onClick={() => onModeChange('PICKUP')}
                        className={`py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'PICKUP' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                    >
                        🚶 Pickup
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-[16px] border-2 transition-all ${showSchedulePicker ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${showSchedulePicker ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        ⏰
                    </div>
                    <div className="flex-1">
                        <span className="block text-[10px] font-black text-slate-800 uppercase tracking-widest">Schedule Order</span>
                        <span className="block text-[8px] font-bold text-slate-400">Arrive at your chosen time</span>
                    </div>
                    <input 
                        type="checkbox" 
                        checked={showSchedulePicker} 
                        onChange={(e) => setShowSchedulePicker(e.target.checked)}
                        className="w-5 h-5 rounded text-indigo-600 border-slate-200" 
                    />
                </label>

                {showSchedulePicker && (
                    <div className="animate-scale-in">
                         <input 
                            type="datetime-local" 
                            value={scheduledTime}
                            min={minScheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full p-3 bg-slate-50 border-2 border-indigo-50 rounded-xl text-xs font-black text-slate-700 outline-none"
                         />
                    </div>
                )}
            </div>

            {mode === 'DELIVERY' && (
                <div className="space-y-2 animate-fade-in border-t border-slate-50 pt-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                        <button onClick={handleUseCurrentLocation} className="text-[8px] font-black text-blue-600 uppercase tracking-[0.1em] flex items-center gap-1">
                            {isLocatingAddress ? <div className="w-2 h-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : '📍 Detect'}
                        </button>
                    </div>
                    <textarea
                        value={deliveryAddress}
                        onChange={(e) => onAddressChange(e.target.value)}
                        placeholder="House No, Street, Landmark..."
                        className="w-full bg-slate-50 rounded-xl p-3 text-[10px] font-black text-slate-700 resize-none focus:bg-white focus:ring-2 focus:ring-brand-light transition-all outline-none"
                        rows={2}
                    />
                </div>
            )}
         </div>

         <div className="bg-slate-900 p-6 rounded-[32px] shadow-soft space-y-4 text-white relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-DEFAULT/10 rounded-full blur-2xl"></div>
             <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Bill Summary</h3>
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-white">₹{itemsTotal}</span>
                </div>
                {mode === 'DELIVERY' && (
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Delivery Fee</span>
                        <span className={isMovMet ? 'text-brand-DEFAULT' : 'text-white'}>
                            {isMovMet ? 'FREE' : `₹${deliveryFee}`}
                        </span>
                    </div>
                )}
                {totalSavings > 0 && (
                    <div className="flex justify-between text-[10px] font-black text-brand-DEFAULT bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="uppercase tracking-[0.1em]">Savings</span>
                        <span>- ₹{totalSavings}</span>
                    </div>
                )}
             </div>
             <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Payable</span>
                    <span className="text-2xl font-black tracking-tight">₹{onlinePayableTotal}</span>
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl border border-white/5">💸</div>
             </div>
         </div>
      </div>

      <div className={`bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 shadow-soft z-30 ${isPage ? 'fixed bottom-14 left-0 right-0 pb-safe' : 'sticky bottom-0 pb-safe'}`}>
         <div className="max-w-md mx-auto">
             <button 
                onClick={() => preparePaymentData(false)}
                className="w-full h-14 bg-slate-900 text-white rounded-[20px] font-black shadow-float active:scale-[0.98] transition-all flex items-center justify-between px-6 group"
             >
                <span className="text-[10px] uppercase tracking-[0.2em]">Proceed to Payment</span>
                <div className="flex items-center gap-3">
                    <span className="text-base">₹{onlinePayableTotal}</span>
                    <div className="bg-brand-DEFAULT text-white p-1.5 rounded-lg group-hover:translate-x-1 transition-transform">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </div>
             </button>
         </div>
      </div>
    </div>
  );
};

export const CartSheet: React.FC<CartDetailsProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalItems = props.cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (isExpanded) {
        window.history.pushState({ modal: 'CART' }, '');
        document.body.style.overflow = 'hidden';
        const handlePopState = () => { setIsExpanded(false); };
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            document.body.style.overflow = '';
        };
    }
  }, [isExpanded]);

  const handleClose = () => {
      setIsExpanded(false);
      if (window.history.state?.modal === 'CART') window.history.back();
  };

  if (props.isPage) return <CartDetails {...props} />;
  if (props.cart.length === 0 && !isExpanded) return null;

  return (
    <>
      {!isExpanded && !props.hideButton && props.cart.length > 0 && (
        <div className="fixed bottom-20 right-4 z-50 animate-scale-in">
          <button 
            onClick={() => setIsExpanded(true)}
            className="bg-slate-900 text-white pl-5 pr-2 py-2 rounded-full shadow-float flex items-center gap-3 hover:scale-105 active:scale-95 transition-all border-2 border-white/20 touch-manipulation"
          >
             <span className="font-black text-[10px] uppercase tracking-widest">Basket</span>
             <div className="bg-brand-DEFAULT text-white text-[10px] font-black h-9 w-9 flex items-center justify-center rounded-full border-4 border-slate-900 shadow-soft">
                 {totalItems}
             </div>
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end isolate">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={handleClose} />
           <div className="relative w-full max-w-lg mx-auto h-[90vh] bg-[#F8FAFC] rounded-t-[32px] shadow-2xl overflow-hidden animate-slide-up border-t border-white/20">
              <CartDetails {...props} isPage={false} onClose={handleClose} />
           </div>
        </div>
      )}
    </>
  );
};
