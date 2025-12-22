
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
import { getRoute, interpolatePosition } from './services/routingService';

const AppContent: React.FC = () => {
  const { 
    user, setUser, cart, clearCart, 
    activeStore, availableStores, 
    orderMode, setOrderMode,
    addToCart, updateQuantity,
    detectLocation,
    toast, hideToast, showToast,
    currentView, setCurrentView,
    orders, addOrder, updateOrderStatus,
    pendingStoreSwitch, resolveStoreSwitch,
    driverLocations, setDriverLocations
  } = useStore();

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
  } | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const simulationIntervals = useRef<Record<string, number>>({});

  // Handle Cart Badge Animation
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
    if (user.address) {
        setDeliveryAddress(user.address);
    }
  }, [user.address]);

  useEffect(() => {
    if (user.isAuthenticated && navigator.geolocation) {
        detectLocation();
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUser(prev => ({ ...prev, location: { lat: latitude, lng: longitude } }));
            },
            (err) => console.warn("Watch GPS error:", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
    }
    return () => {
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [user.isAuthenticated, detectLocation, setUser]);

  // Order Simulation Logic
  useEffect(() => {
    orders.forEach(async (order) => {
      if (order.status === 'Pending' && order.paymentStatus === 'PAID') {
          setTimeout(() => updateOrderStatus(order.id, 'Preparing'), 3000);
      }
      if (order.status === 'Preparing') {
          setTimeout(() => updateOrderStatus(order.id, 'On the way'), 6000);
      }
      if (order.status === 'On the way' && order.mode === 'DELIVERY' && !simulationIntervals.current[order.id]) {
          const targetLocation = user.location;
          if (!targetLocation || !order.storeLocation) return;
          const path = await getRoute(order.storeLocation.lat, order.storeLocation.lng, targetLocation.lat, targetLocation.lng);
          let currentNodeIndex = 0;
          let nodeProgress = 0;
          simulationIntervals.current[order.id] = window.setInterval(() => {
            if (currentNodeIndex >= path.length - 1) {
              window.clearInterval(simulationIntervals.current[order.id]);
              delete simulationIntervals.current[order.id];
              updateOrderStatus(order.id, 'Delivered');
              setDriverLocations(prev => { const next = { ...prev }; delete next[order.id]; return next; });
              showToast(`Order delivered! 🛵`);
              return;
            }
            nodeProgress += 0.15;
            if (nodeProgress >= 1) { nodeProgress = 0; currentNodeIndex++; }
            if (currentNodeIndex < path.length - 1) {
              const pos = interpolatePosition(path[currentNodeIndex], path[currentNodeIndex + 1], nodeProgress);
              setDriverLocations(prev => ({ ...prev, [order.id]: { lat: pos[0], lng: pos[1] } }));
            }
          }, 1000);
      }
    });
  }, [orders, updateOrderStatus, setDriverLocations, showToast, user.location]);

  useEffect(() => {
    if (user.isAuthenticated && !window.history.state) window.history.replaceState({ view: 'SHOP' }, '');
    const handlePopState = (event: PopStateEvent) => {
       if (showPaymentGateway) { setShowPaymentGateway(false); return; }
       if (event.state && event.state.view) setCurrentView(event.state.view);
       else setCurrentView('SHOP');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user.isAuthenticated, showPaymentGateway, setCurrentView]);

  const navigateTo = (view: typeof currentView) => {
      if (currentView === view) return;
      window.history.pushState({ view }, '');
      setCurrentView(view);
      if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  const handleLoginSuccess = (userData: UserState) => {
    setUser(userData);
    window.history.replaceState({ view: 'SHOP' }, '');
    setCurrentView('SHOP');
    detectLocation();
  };

  const handleDemoLogin = () => {
    setUser({
      isAuthenticated: true,
      id: 'demo-user',
      name: 'Demo User',
      phone: '9999999999',
      location: { lat: 12.9784, lng: 77.6408 }, 
      address: 'Indiranagar, Bengaluru',         
      savedCards: []
    });
    window.history.replaceState({ view: 'SHOP' }, '');
    setCurrentView('SHOP');
  };

  const handleProceedToPay = (details: { deliveryType: DeliveryType; scheduledTime?: string; isPayLater?: boolean; splits: any }) => {
      setPendingOrderDetails({ ...details, storeName: activeStore?.name });
      setShowPaymentGateway(true);
  };

  const finalizeOrder = async (paymentMethodString: string) => {
    if (!pendingOrderDetails) return;
    const itemsByStore: Record<string, typeof cart> = {};
    cart.forEach(item => {
        if (!itemsByStore[item.storeId]) itemsByStore[item.storeId] = [];
        itemsByStore[item.storeId].push(item);
    });
    const newOrders: Order[] = Object.entries(itemsByStore).map(([storeId, items]) => {
        const storeItem = items[0];
        const sourceStore = availableStores.find(s => s.id === storeId) || (activeStore?.id === storeId ? activeStore : null);
        return {
            id: 'ORD' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            date: new Date().toISOString(),
            items: items,
            total: items.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (pendingOrderDetails.splits?.deliveryFee || 0),
            status: 'Pending',
            paymentStatus: 'PAID',
            paymentMethod: paymentMethodString,
            mode: orderMode,
            deliveryType: pendingOrderDetails.deliveryType,
            scheduledTime: pendingOrderDetails.scheduledTime,
            order_type: 'grocery',
            storeName: storeItem.storeName,
            storeLocation: sourceStore ? { lat: sourceStore.lat, lng: sourceStore.lng } : { lat: 0, lng: 0 }, 
            userLocation: user.location || undefined,
            deliveryAddress: orderMode === 'DELIVERY' ? deliveryAddress : undefined
        };
    });
    for (const order of newOrders) { await addOrder(order); }
    clearCart();
    setShowPaymentGateway(false);
    setPendingOrderDetails(null);
    setCurrentView('ORDERS');
    window.history.replaceState({ view: 'ORDERS' }, '');
  };

  if (!user.isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} onDemoLogin={handleDemoLogin} />;
  }

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Persistence: Navigation is visible across Shop, Orders, and Cart.
  // Profile is in the top right, so it's removed from bottom nav for space.
  const canShowNav = !showPaymentGateway;

  return (
    <div className="h-[100dvh] bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col selection:bg-emerald-100 relative">
      <Toast message={toast.message} isVisible={toast.show} onClose={hideToast} action={toast.action} />

      {/* Persistent Header */}
      {!showPaymentGateway && (
        <header className="sticky top-0 z-[60] bg-white border-b border-slate-100 px-5 py-3 shadow-sm shrink-0 safe-top">
            <div className="max-w-md mx-auto grid grid-cols-3 items-center">
                <div className="justify-self-start"><SevenX7Logo size="xs" /></div>
                <div className="justify-self-center text-center">
                    <button className="flex flex-col items-center group active:scale-95 transition-transform" onClick={detectLocation}>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate max-w-[140px] leading-none">
                            {activeStore ? activeStore.name : 'Verified Marts'}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{(user as any).neighborhood || 'Locating...'}</span>
                        </div>
                    </button>
                </div>
                <div className="justify-self-end">
                    <button onClick={() => navigateTo('PROFILE')} className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black uppercase shadow-lg transition-transform active:scale-90 ring-2 ring-white">
                        {user.name?.charAt(0) || 'U'}
                    </button>
                </div>
            </div>
        </header>
      )}

      {/* Main Container */}
      <main ref={mainRef} className="flex-1 max-w-md mx-auto w-full relative overflow-y-auto overflow-x-hidden scroll-smooth hide-scrollbar">
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
             isDemo={user.id === 'demo-user'} storeName={pendingOrderDetails.storeName} splits={pendingOrderDetails.splits}
          />
        )}
      </main>

      {/* Optimized 3-Item Persistent Bottom Navigation */}
      {canShowNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/98 backdrop-blur-2xl border-t border-slate-100 z-[100] pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)] animate-slide-up"
        >
           <div className="flex justify-around items-center px-4 py-2.5">
            {[
              { id: 'SHOP', icon: '🏠', label: 'Home' },
              { id: 'ORDERS', icon: '🧾', label: 'Orders' },
              { id: 'CART', icon: '🛒', label: 'Cart', badge: totalCartItems, animation: animateCart }
            ].map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button key={item.id} onClick={() => navigateTo(item.id as any)} className={`flex flex-col items-center justify-center w-1/3 py-1.5 transition-all group relative ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>
                      <div className={`relative mb-1 transition-all duration-300 ${item.animation ? 'scale-[1.4] -translate-y-2' : 'scale-100'} group-active:scale-90`}>
                          <span className={`text-2xl block transition-all ${isActive ? 'scale-110' : 'opacity-70'}`}>{item.icon}</span>
                          {item.badge ? (
                              <span className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm px-0.5 transition-all ${item.animation ? 'scale-125 bg-emerald-400' : 'scale-100'}`}>
                                  {item.badge}
                              </span>
                          ) : null}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
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
