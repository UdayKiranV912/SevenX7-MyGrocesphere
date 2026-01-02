
import React, { useState, useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { Order, DeliveryType, UserState } from './types';
import { Auth } from './components/OTPVerification';
import { CartSheet } from './components/CartSheet';
import { PaymentGateway } from './components/PaymentGateway';
import SevenX7Logo from './components/SevenX7Logo';
import { Toast } from './components/Toast';
import { ShopPage } from './pages/Shop';
import { MyOrders } from './components/MyOrders';
import { ProfilePage } from './pages/Profile';
import { getRoute, interpolatePosition, calculateHaversineDistance, AVG_DELIVERY_SPEED_MPS } from './services/routingService';
import { supabase } from './services/supabase';

const AppContent: React.FC = () => {
  const { 
    user, setUser, cart, clearCart, 
    activeStore, availableStores, 
    orderMode, setOrderMode,
    addToCart, updateQuantity,
    detectLocation,
    isLoading, isBackendConnected,
    toast, hideToast, showToast,
    currentView, setCurrentView,
    orders, addOrder, updateOrder, updateOrderStatus,
    driverLocations, setDriverLocations
  } = useStore();

  const [initializing, setInitializing] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const prevCartCount = useRef(0);
  
  const [pendingOrderDetails, setPendingOrderDetails] = useState<{ 
    deliveryType: DeliveryType; 
    scheduledTime?: string;
    splits?: any;
    storeName?: string;
    mode?: 'DELIVERY' | 'PICKUP';
    amount?: number;
  } | null>(null);

  const watchIdRef = useRef<number | null>(null);

  /* ============================================================
     1️⃣ INITIALIZE SESSION & REAL-TIME MONITORING
  ============================================================ */
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await (supabase.auth as any).getSession();
      
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            setUser({
              isAuthenticated: true,
              id: profile.id,
              name: profile.full_name,
              phone: profile.phone,
              email: profile.email,
              location: profile.current_lat ? { lat: profile.current_lat, lng: profile.current_lng } : null,
              address: profile.address,
              neighborhood: profile.neighborhood,
              verificationStatus: profile.approval_status,
              isLiveGPS: false
            });
          }
        } catch (err) {
          console.error("Profile sync failed:", err);
        }
      }
      setInitializing(false);
    };

    initSession();
  }, [setUser]);

  /* ============================================================
     2️⃣ REAL-TIME APPROVAL SYNC
  ============================================================ */
  useEffect(() => {
    if (!user.id || user.id === 'demo-user' || user.verificationStatus === 'approved') return;

    const channel = supabase
      .channel(`approval-sync-${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user.id}` 
      }, (payload) => {
        const updatedProfile = payload.new as any;
        if (updatedProfile.approval_status === 'approved') {
          showToast("Profile Verified! Access Granted 🚀");
          setUser(prev => ({ 
            ...prev, 
            verificationStatus: 'approved' 
          }));
          setCurrentView('SHOP');
        } else if (updatedProfile.approval_status === 'rejected') {
          setUser(prev => ({ ...prev, verificationStatus: 'rejected' }));
          showToast("Access Denied: Please contact support.");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, user.verificationStatus, setUser, setCurrentView, showToast]);

  /* ============================================================
     3️⃣ UI NAVIGATION & LOGIC
  ============================================================ */
  const navigateTo = (view: typeof currentView) => {
    if (currentView === view) return;
    window.history.pushState({ view }, '');
    setCurrentView(view);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const handleProceedToPay = (details: { deliveryType: DeliveryType; scheduledTime?: string; splits: any }) => {
      setPendingOrderDetails({ ...details, storeName: activeStore?.name, mode: orderMode });
      setShowPaymentGateway(true);
  };

  const finalizeOrder = async (paymentMethodString: string) => {
    if (!pendingOrderDetails) return;
    const itemsTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const isPop = paymentMethodString.includes('POP');
    
    const order: Order = {
        id: 'ORD' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        date: new Date().toISOString(),
        items: cart,
        total: itemsTotal + (pendingOrderDetails.splits?.deliveryFee || 0),
        status: 'Pending',
        paymentStatus: isPop ? 'PENDING' : 'PAID',
        paymentMethod: paymentMethodString,
        mode: orderMode,
        deliveryType: pendingOrderDetails.deliveryType,
        order_type: 'grocery',
        storeName: pendingOrderDetails.storeName || 'Store',
        storeLocation: activeStore ? { lat: activeStore.lat, lng: activeStore.lng } : undefined,
        userLocation: user.location || undefined,
        deliveryAddress: deliveryAddress,
        splits: pendingOrderDetails.splits
    };
    
    await addOrder(order);
    clearCart();
    setShowPaymentGateway(false);
    setPendingOrderDetails(null);
    navigateTo('ORDERS');
    showToast("Order Placed Successfully! 🛒");
  };

  if (initializing) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <SevenX7Logo size="large" hideBrandName={true} />
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mt-12 mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Ecosystem...</p>
      </div>
    );
  }

  // State 1: Not Logged In
  if (!user.isAuthenticated) {
    return (
      <Auth 
        onLoginSuccess={(userData) => { setUser(userData); }} 
        onDemoLogin={() => {
          setUser({
            isAuthenticated: true,
            id: 'demo-user',
            name: 'Demo User',
            phone: '9999999999',
            location: { lat: 12.9716, lng: 77.5946 },
            isLiveGPS: false,
            verificationStatus: 'approved'
          });
          navigateTo('SHOP');
        }} 
      />
    );
  }

  // State 2: Logged In but Awaiting Approval
  if (user.verificationStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="mb-12 relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
              <SevenX7Logo size="large" hideBrandName={true} />
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl space-y-8 max-w-sm animate-scale-in">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto border border-emerald-500/30">⏳</div>
              <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Review in Progress</h2>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      Your profile is being reviewed by HQ. <br/>
                      <span className="text-emerald-400">Super Admin</span> approval window is 2 minutes.
                  </p>
              </div>
              
              <div className="pt-6 space-y-4">
                  <div className="flex items-center justify-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">Live Syncing with HQ...</span>
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Refresh Status
                  </button>
                  <button 
                    onClick={() => setUser({ isAuthenticated: false, phone: '', location: null })}
                    className="text-[9px] font-black text-slate-500 uppercase tracking-widest"
                  >
                    Sign Out
                  </button>
              </div>
          </div>
          
          <p className="mt-12 text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] opacity-40">System will unlock automatically</p>
      </div>
    );
  }

  // State 3: Approved & Main App
  return (
    <div className="h-[100dvh] bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col selection:bg-emerald-100 relative">
      <Toast message={toast.message} isVisible={toast.show} onClose={hideToast} action={toast.action} />

      {!showPaymentGateway && (
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-1.5 shadow-sm shrink-0 safe-top h-14 flex items-center">
            <div className="max-w-md mx-auto flex items-center justify-between w-full">
                <div className="flex-shrink-0 flex justify-start items-center min-w-[70px] relative">
                    <SevenX7Logo size="xs" hideBrandName={true} />
                    <div className={`absolute -right-1 -top-1 w-2 h-2 rounded-full border border-white ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                </div>
                <button className="flex-1 flex flex-col items-center group active:scale-95 transition-transform px-2 overflow-hidden" onClick={detectLocation}>
                    <div className="flex flex-col items-center">
                        <span className="text-[12px] font-black text-slate-900 tracking-tight leading-none truncate max-w-[160px]">{user.neighborhood || 'Finding Marts'}</span>
                    </div>
                </button>
                <div className="flex-shrink-0 flex justify-end min-w-[40px]">
                    <button onClick={() => navigateTo('PROFILE')} className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[9px] font-black uppercase shadow-lg transition-transform active:scale-90 ring-2 ring-white">
                        {user.name?.charAt(0) || 'U'}
                    </button>
                </div>
            </div>
        </header>
      )}

      <main ref={mainRef} className="flex-1 max-w-md mx-auto w-full relative overflow-y-auto overflow-x-hidden scroll-smooth hide-scrollbar pb-32">
        {currentView === 'SHOP' && <ShopPage />}
        {currentView === 'ORDERS' && <MyOrders userLocation={user.location} userId={user.id} />}
        {currentView === 'PROFILE' && <ProfilePage onBack={() => navigateTo('SHOP')} />}
        {currentView === 'CART' && (
           <CartSheet 
              cart={cart} onProceedToPay={handleProceedToPay} onUpdateQuantity={updateQuantity} onAddProduct={(p) => addToCart(p)}
              mode={orderMode} onModeChange={setOrderMode} deliveryAddress={deliveryAddress} onAddressChange={setDeliveryAddress}
              activeStore={activeStore} stores={availableStores} userLocation={user.location} isPage={true} onClose={() => navigateTo('SHOP')} 
           />
        )}

        {showPaymentGateway && pendingOrderDetails && (
          <PaymentGateway 
             amount={pendingOrderDetails.amount || (pendingOrderDetails.splits ? (pendingOrderDetails.splits.storeAmount + (pendingOrderDetails.splits.deliveryFee || 0)) : 0)}
             savedCards={user.savedCards || []} onSuccess={(method) => finalizeOrder(method)} onCancel={() => setShowPaymentGateway(false)}
             isDemo={user.id === 'demo-user'} storeName={pendingOrderDetails.storeName} splits={pendingOrderDetails.splits} orderMode={pendingOrderDetails.mode}
          />
        )}
      </main>

      {!showPaymentGateway && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom border-t border-slate-100 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
           <div className="max-w-md mx-auto flex justify-around items-center h-13 px-2">
            {[
              { id: 'SHOP', icon: '🏠', label: 'Home' },
              { id: 'ORDERS', icon: '🧾', label: 'Orders' },
              { id: 'CART', icon: '🛒', label: 'Cart', badge: cart.reduce((a,b)=>a+b.quantity,0), animation: animateCart }
            ].map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button key={item.id} onClick={() => navigateTo(item.id as any)} className={`flex flex-col items-center justify-center w-1/3 transition-all group relative h-full ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`relative flex items-center justify-center transition-all duration-300 ${item.animation ? 'scale-110' : 'scale-100'} group-active:scale-90`}>
                          <span className={`text-lg block transition-all ${isActive ? 'filter-none' : 'grayscale opacity-50'}`}>{item.icon}</span>
                          {item.badge ? (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[12px] h-[12px] bg-emerald-500 text-white text-[6px] font-black flex items-center justify-center rounded-full border border-white shadow-sm px-0.5">
                                  {item.badge}
                              </span>
                          ) : null}
                      </div>
                      <span className={`text-[6px] font-black uppercase tracking-[0.1em] mt-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>{isActive ? '•' : item.label}</span>
                  </button>
                );
            })}
           </div>
        </nav>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
