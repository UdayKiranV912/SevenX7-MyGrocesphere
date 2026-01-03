
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
    orders, addOrder
  } = useStore();

  const [initializing, setInitializing] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  
  const [pendingOrderDetails, setPendingOrderDetails] = useState<{ 
    deliveryType: DeliveryType; 
    scheduledTime?: string;
    splits?: any;
    storeName?: string;
    mode?: 'DELIVERY' | 'PICKUP';
    amount?: number;
  } | null>(null);

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

  // Real-time Approval Sync
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
          showToast("Access Granted! Welcome to Grocesphere 🚀");
          setUser(prev => ({ 
            ...prev, 
            verificationStatus: 'approved',
            name: updatedProfile.full_name,
            address: updatedProfile.address
          }));
          setCurrentView('SHOP');
        } else if (updatedProfile.approval_status === 'rejected') {
          setUser(prev => ({ ...prev, verificationStatus: 'rejected' }));
          showToast("Profile Rejected. Contact Admin support.");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, user.verificationStatus, setUser, setCurrentView, showToast]);

  const navigateTo = (view: typeof currentView) => {
    if (currentView === view) return;
    setCurrentView(view);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const handleProceedToPay = (details: { deliveryType: DeliveryType; scheduledTime?: string; splits: any }) => {
      setPendingOrderDetails({ ...details, storeName: activeStore?.name, mode: orderMode, amount: details.splits.storeAmount + details.splits.deliveryFee + details.splits.handlingFee });
      setShowPaymentGateway(true);
  };

  const finalizeOrder = async (paymentMethodString: string) => {
    if (!pendingOrderDetails) return;
    
    const order: Order = {
        id: 'ORD' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        date: new Date().toISOString(),
        items: cart,
        total: pendingOrderDetails.amount || 0,
        status: 'Pending',
        paymentStatus: 'PAID',
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

  if (!user.isAuthenticated) {
    return <Auth onLoginSuccess={(userData) => { setUser(userData); }} onDemoLogin={() => {
        setUser({ isAuthenticated: true, id: 'demo-user', name: 'Demo Customer', phone: '9999999999', location: { lat: 12.9716, lng: 77.5946 }, isLiveGPS: false, verificationStatus: 'approved' });
        navigateTo('SHOP');
    }} />;
  }

  // Handle waiting screen
  if (user.verificationStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"></div>
          <SevenX7Logo size="large" hideBrandName={true} />
          <div className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] shadow-2xl space-y-8 max-w-sm mt-12 backdrop-blur-md animate-scale-in">
              <div className="relative w-20 h-20 mx-auto">
                 <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                 <div className="relative w-full h-full bg-white rounded-3xl flex items-center justify-center text-4xl shadow-lg">🛡️</div>
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Access Locked</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-4 leading-loose">
                  Your profile has been broadcast to HQ. <br/>
                  Admin is verifying your credentials...
                </p>
              </div>
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-center gap-2 py-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Live Syncing with HQ</span>
                </div>
                <button onClick={() => window.location.reload()} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Refresh Status</button>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-white font-sans text-slate-900 overflow-hidden flex flex-col relative selection:bg-emerald-100">
      <Toast message={toast.message} isVisible={toast.show} onClose={hideToast} action={toast.action} />

      {!showPaymentGateway && (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-4 flex items-center justify-between shrink-0">
            <SevenX7Logo size="xs" hideBrandName={true} />
            <button className="flex flex-col items-center group active:scale-95 transition-transform" onClick={detectLocation}>
                <span className="text-[11px] font-black text-slate-900 tracking-tighter uppercase">{user.neighborhood || 'Finding Stores'}</span>
                <span className="text-emerald-500 text-[9px] font-black tracking-widest uppercase flex items-center gap-1">📍 Near You</span>
            </button>
            <button 
              onClick={() => navigateTo('PROFILE')}
              className={`w-10 h-10 rounded-[14px] flex items-center justify-center text-white text-[11px] font-black uppercase shadow-xl transition-all active:scale-90 ring-2 ring-white overflow-hidden ${isBackendConnected ? 'bg-emerald-600' : 'bg-slate-900'}`}
            >
                {user.name?.charAt(0) || 'U'}
            </button>
        </header>
      )}

      <main ref={mainRef} className="flex-1 max-w-md mx-auto w-full relative overflow-y-auto overflow-x-hidden hide-scrollbar">
        {currentView === 'SHOP' && <ShopPage />}
        {currentView === 'ORDERS' && <MyOrders userLocation={user.location} />}
        {currentView === 'CART' && (
           <CartSheet 
              cart={cart} onProceedToPay={handleProceedToPay} onUpdateQuantity={updateQuantity} onAddProduct={(p) => addToCart(p)}
              mode={orderMode} onModeChange={setOrderMode} deliveryAddress={deliveryAddress} onAddressChange={setDeliveryAddress}
              activeStore={activeStore} stores={availableStores} userLocation={user.location} isPage={true} onClose={() => navigateTo('SHOP')} 
           />
        )}
        {currentView === 'PROFILE' && <ProfilePage onBack={() => navigateTo('SHOP')} />}

        {showPaymentGateway && pendingOrderDetails && (
          <PaymentGateway 
             amount={pendingOrderDetails.amount || 0}
             onSuccess={(method) => finalizeOrder(method)} onCancel={() => setShowPaymentGateway(false)}
             isDemo={user.id === 'demo-user'} storeName={pendingOrderDetails.storeName} splits={pendingOrderDetails.splits} orderMode={pendingOrderDetails.mode}
          />
        )}
      </main>

      {!showPaymentGateway && currentView !== 'PROFILE' && (
        <nav className="fixed bottom-0 left-0 right-0 z-[45] safe-bottom border-t border-slate-100 bg-white/95 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
            {[
              { id: 'SHOP', icon: '🏠', label: 'Marts' },
              { id: 'ORDERS', icon: '🧾', label: 'History' },
              { id: 'CART', icon: '🛒', label: 'Cart', badge: cart.reduce((a,b)=>a+b.quantity,0) }
            ].map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button key={item.id} onClick={() => navigateTo(item.id as any)} className={`flex flex-col items-center justify-center flex-1 h-full transition-all group relative ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`relative flex items-center justify-center transition-all duration-300 group-active:scale-90`}>
                          <span className={`text-xl block transition-all ${isActive ? 'scale-110' : 'grayscale opacity-60'}`}>{item.icon}</span>
                          {item.badge ? (
                              <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                                  {item.badge}
                              </span>
                          ) : null}
                      </div>
                      <span className={`text-[7px] font-black uppercase tracking-[0.2em] mt-1.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>•</span>
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
