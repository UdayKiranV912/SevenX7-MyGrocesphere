
import React, { useState, useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { Order, DeliveryType, UserState, DriverLocationState } from './types';
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
    isPayLater?: boolean;
    existingOrderId?: string; 
    amount?: number;
    splits?: any;
    storeName?: string;
    mode?: 'DELIVERY' | 'PICKUP';
  } | null>(null);

  const watchIdRef = useRef<number | null>(null);
  
  // Simulation tracking references
  const simulationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const simulationIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const simulationLocks = useRef<Record<string, string>>({}); 

  /* ============================================================
     1️⃣ INITIALIZE ECOSYSTEM SESSION & REALTIME VERIFICATION
  ============================================================ */
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            const isVerified = profile.verification_status === 'verified';
            
            setUser({
              isAuthenticated: isVerified,
              id: profile.id,
              name: profile.full_name,
              phone: profile.phone_number,
              email: profile.email,
              location: profile.current_lat ? { lat: profile.current_lat, lng: profile.current_lng } : null,
              address: profile.address,
              neighborhood: profile.neighborhood,
              verificationStatus: profile.verification_status,
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
     2️⃣ REALTIME VERIFICATION MONITOR
  ============================================================ */
  useEffect(() => {
    if (!user.id || user.id === 'demo-user' || user.isAuthenticated) return;

    // Listen for verification status changes in real-time
    const channel = supabase
      .channel(`verification-sync-${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${user.id}` 
      }, (payload) => {
        const updatedProfile = payload.new as any;
        if (updatedProfile.verification_status === 'verified') {
          showToast("Account Approved! Welcome to Grocesphere 🚀");
          setUser(prev => ({ 
            ...prev, 
            isAuthenticated: true, 
            verificationStatus: 'verified' 
          }));
          setCurrentView('SHOP');
        } else if (updatedProfile.verification_status === 'rejected') {
          setUser(prev => ({ ...prev, verificationStatus: 'rejected' }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, user.isAuthenticated, setUser, setCurrentView, showToast]);

  /* ============================================================
     3️⃣ REAL-TIME ORDERS SUBSCRIPTIONS
  ============================================================ */
  useEffect(() => {
    if (!user.id || user.id === 'demo-user' || !user.isAuthenticated) return;

    const channel = supabase
      .channel(`customer-orders-realtime-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders', 
        filter: `customer_id=eq.${user.id}` 
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          updateOrder(payload.new);
          showToast(`Ecosystem Update: Order is ${payload.new.status} 🚀`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, user.isAuthenticated, updateOrder, showToast]);

  /* ============================================================
     4️⃣ NAVIGATION & UI SYNC
  ============================================================ */
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        setCurrentView('SHOP');
      }
    };

    window.addEventListener('popstate', handlePopState);
    if (!window.history.state) {
      window.history.replaceState({ view: 'SHOP' }, '');
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentView]);

  const navigateTo = (view: typeof currentView) => {
    if (currentView === view) return;
    window.history.pushState({ view }, '');
    setCurrentView(view);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  useEffect(() => {
    const currentCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (currentCount > prevCartCount.current) {
      setAnimateCart(true);
      if ('vibrate' in navigator) navigator.vibrate(15);
      const timer = setTimeout(() => setAnimateCart(false), 600);
      prevCartCount.current = currentCount;
      return () => clearTimeout(timer);
    }
    prevCartCount.current = currentCount;
  }, [cart]);

  useEffect(() => {
    if (user.address) setDeliveryAddress(user.address);
  }, [user.address]);

  useEffect(() => {
    if (user.isAuthenticated && navigator.geolocation) {
        detectLocation();
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setUser(prev => ({ 
                  ...prev, 
                  location: { lat: latitude, lng: longitude },
                  accuracy: accuracy,
                  isLiveGPS: true 
                }));
            },
            (err) => {
               setUser(prev => ({ ...prev, isLiveGPS: false }));
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
        );
    }
    return () => {
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [user.isAuthenticated, detectLocation, setUser]);

  /* ============================================================
     5️⃣ DEMO SIMULATION ENGINE
  ============================================================ */
  useEffect(() => {
    if (user.id !== 'demo-user') return;

    orders.forEach(async (order) => {
      const isTerminal = order.status === 'Delivered' || order.status === 'Picked Up' || order.status === 'Cancelled' || order.status === 'Ready';
      
      if (isTerminal) {
          if (simulationTimers.current[order.id]) {
              clearTimeout(simulationTimers.current[order.id]);
              delete simulationTimers.current[order.id];
          }
          if (simulationIntervals.current[order.id]) {
              clearInterval(simulationIntervals.current[order.id]);
              delete simulationIntervals.current[order.id];
          }
          delete simulationLocks.current[order.id];
          return;
      }

      if (order.status === 'Pending' && !simulationLocks.current[order.id]) {
          simulationLocks.current[order.id] = 'Preparing';
          simulationTimers.current[order.id] = setTimeout(() => {
              updateOrderStatus(order.id, 'Preparing');
              delete simulationLocks.current[order.id];
          }, 3000);
      }

      if (order.status === 'Preparing' && !simulationLocks.current[order.id]) {
          const nextStatus = order.mode === 'DELIVERY' ? 'On the way' : 'Ready';
          simulationLocks.current[order.id] = nextStatus;
          simulationTimers.current[order.id] = setTimeout(() => {
              updateOrderStatus(order.id, nextStatus);
              delete simulationLocks.current[order.id];
          }, 6000);
      }

      if (order.status === 'On the way' && order.mode === 'DELIVERY' && !simulationIntervals.current[order.id]) {
          const userLat = user.location?.lat || 12.9716;
          const userLng = user.location?.lng || 77.5946;
          const storeLat = order.storeLocation?.lat || 12.9784;
          const storeLng = order.storeLocation?.lng || 77.6408;
          
          const routeResult = await getRoute(storeLat, storeLng, userLat, userLng);
          const path = routeResult.coordinates;
          if (path.length < 2) return;

          let currentNodeIndex = 0;
          let nodeProgress = 0;
          const tickRate = 500; 
          const simulationSpeed = 0.12; 

          simulationIntervals.current[order.id] = setInterval(() => {
            if (currentNodeIndex >= path.length - 1) {
              clearInterval(simulationIntervals.current[order.id]);
              delete simulationIntervals.current[order.id];
              updateOrderStatus(order.id, 'Delivered');
              setDriverLocations(prev => { const next = { ...prev }; delete next[order.id]; return next; });
              showToast(`Demo order delivered! 🛵`);
              return;
            }

            nodeProgress += simulationSpeed;
            if (nodeProgress >= 1) { nodeProgress = 0; currentNodeIndex++; }

            if (currentNodeIndex < path.length - 1) {
              const pos = interpolatePosition(path[currentNodeIndex], path[currentNodeIndex + 1], nodeProgress);
              const distRem = calculateHaversineDistance(pos[0], pos[1], userLat, userLng);
              const timeRem = distRem / AVG_DELIVERY_SPEED_MPS;

              setDriverLocations(prev => ({ 
                ...prev, 
                [order.id]: { 
                  lat: pos[0], 
                  lng: pos[1],
                  distanceRemaining: distRem,
                  timeRemaining: timeRem
                } 
              }));
            }
          }, tickRate);
      }
    });
  }, [orders, user.id, user.location, updateOrderStatus, setDriverLocations, showToast]);

  /* ============================================================
     6️⃣ ORDER LIFECYCLE
  ============================================================ */
  const handleProceedToPay = (details: { deliveryType: DeliveryType; scheduledTime?: string; isPayLater?: boolean; splits: any }) => {
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Ecosystem Awakening...</p>
      </div>
    );
  }

  // If user is not authenticated OR they are pending verification
  if (!user.isAuthenticated) {
    return (
      <Auth 
        onLoginSuccess={(userData) => { setUser(userData); navigateTo('SHOP'); }} 
        onDemoLogin={() => {
          setUser({
            isAuthenticated: true,
            id: 'demo-user',
            name: 'Demo User',
            phone: '9999999999',
            location: null,
            isLiveGPS: false,
            savedCards: []
          });
          navigateTo('SHOP');
        }} 
      />
    );
  }

  const renderHeaderCenter = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center animate-fade-in">
         <span className="text-[11px] font-black text-emerald-600 tracking-tight leading-none uppercase animate-pulse">Syncing...</span>
      </div>
    );

    if (activeStore) return (
      <div className="flex flex-col items-center animate-fade-in">
         <div className="flex items-center gap-1.5 mb-0.5">
           <div className={`w-1 h-1 rounded-full ${user.isLiveGPS ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></div>
           <span className={`text-[6px] font-black uppercase tracking-[0.2em] ${user.isLiveGPS ? 'text-emerald-500' : 'text-slate-400'}`}>
              {user.isLiveGPS ? 'Live Now' : 'Shopping At'}
           </span>
         </div>
         <span className="text-[12px] font-black text-slate-900 tracking-tight leading-none truncate max-w-[140px]">
            {activeStore.name}
         </span>
      </div>
    );

    return (
      <div className="flex flex-col items-center animate-fade-in">
         <span className="text-[12px] font-black text-slate-900 tracking-tight leading-none uppercase truncate max-w-[160px]">{user.neighborhood || 'Finding Marts'}</span>
      </div>
    );
  };

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
                    {renderHeaderCenter()}
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
