
import React, { useState, useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { Order, DeliveryType, UserState, OrderType } from './types';
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

  useEffect(() => {
    if (user.address) {
        setDeliveryAddress(user.address);
    }
  }, [user.address]);

  useEffect(() => {
    if (pendingStoreSwitch) {
        const cartHasItemsFromOtherStore = cart.length > 0 && cart[0].storeId !== pendingStoreSwitch.id;
        const message = cartHasItemsFromOtherStore 
            ? `Closer to ${pendingStoreSwitch.name}. Switch Mart? (Clears Cart)`
            : `Closer to ${pendingStoreSwitch.name}. Switch?`;

        showToast(message, {
            label: 'Switch',
            onClick: () => resolveStoreSwitch(true)
        });
    }
  }, [pendingStoreSwitch, cart, showToast, resolveStoreSwitch]);

  useEffect(() => {
    if (user.isAuthenticated && navigator.geolocation) {
        detectLocation();
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUser(prev => {
                    if (!prev.location) return { ...prev, location: { lat: latitude, lng: longitude } };
                    const latDiff = Math.abs(prev.location.lat - latitude);
                    const lngDiff = Math.abs(prev.location.lng - longitude);
                    if (latDiff > 0.0002 || lngDiff > 0.0002) { 
                        return { ...prev, location: { lat: latitude, lng: longitude } };
                    }
                    return prev;
                });
            },
            (err) => console.warn("Watch position error:", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
        );
    }
    return () => {
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [user.isAuthenticated, detectLocation, setUser]);

  // --- Driver Simulation ---
  useEffect(() => {
    orders.forEach(async (order) => {
      if (order.status === 'Pending' && order.paymentStatus === 'PAID') {
          setTimeout(() => updateOrderStatus(order.id, 'Preparing'), 3000);
      }
      if (order.status === 'Preparing') {
          setTimeout(() => updateOrderStatus(order.id, 'On the way'), 6000);
      }
      if (order.status === 'On the way' && order.storeLocation && order.userLocation && !simulationIntervals.current[order.id]) {
          const path = await getRoute(order.storeLocation.lat, order.storeLocation.lng, order.userLocation.lat, order.userLocation.lng);
          let currentNodeIndex = 0;
          let nodeProgress = 0;
          const speed = 0.15; 
          simulationIntervals.current[order.id] = window.setInterval(() => {
            if (currentNodeIndex >= path.length - 1) {
              window.clearInterval(simulationIntervals.current[order.id]);
              delete simulationIntervals.current[order.id];
              updateOrderStatus(order.id, order.mode === 'DELIVERY' ? 'Delivered' : 'Ready');
              setDriverLocations(prev => {
                const next = { ...prev };
                delete next[order.id];
                return next;
              });
              showToast(`Order from ${order.storeName} is ready!`);
              return;
            }
            nodeProgress += speed;
            if (nodeProgress >= 1) {
              nodeProgress = 0;
              currentNodeIndex++;
            }
            if (currentNodeIndex < path.length - 1) {
              const pos = interpolatePosition(path[currentNodeIndex], path[currentNodeIndex + 1], nodeProgress);
              setDriverLocations(prev => ({
                ...prev,
                [order.id]: { lat: pos[0], lng: pos[1] }
              }));
            }
          }, 1000);
      }
    });
  }, [orders, updateOrderStatus, setDriverLocations, showToast]);

  useEffect(() => {
    if (user.isAuthenticated && !window.history.state) {
       window.history.replaceState({ view: 'SHOP' }, '');
    }
    const handlePopState = (event: PopStateEvent) => {
       if (showPaymentGateway) {
           setShowPaymentGateway(false);
           return;
       }
       if (event.state && event.state.view) {
           setCurrentView(event.state.view);
       } else {
           setCurrentView('SHOP');
       }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user.isAuthenticated, showPaymentGateway, setCurrentView]);

  const navigateTo = (view: typeof currentView) => {
      if (currentView === view) return;
      window.history.pushState({ view }, '');
      setCurrentView(view);
  };

  const handleLoginSuccess = (userData: UserState) => {
    setUser(userData);
    window.history.replaceState({ view: 'SHOP' }, '');
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
  };

  const handleProceedToPay = (details: { deliveryType: DeliveryType; scheduledTime?: string; isPayLater?: boolean; splits: any }) => {
      setPendingOrderDetails({ ...details, storeName: activeStore?.name });
      window.history.pushState({ view: currentView, modal: 'PAYMENT' }, '');
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
        const subTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const deliveryFee = pendingOrderDetails.splits?.deliveryFee || 0;
        const sourceStore = availableStores.find(s => s.id === storeId) || (activeStore?.id === storeId ? activeStore : null);
        
        return {
            id: 'ORD' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            date: new Date().toISOString(),
            items: items,
            total: subTotal + deliveryFee,
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
    if (showPaymentGateway) window.history.back();
    setShowPaymentGateway(false);
    setPendingOrderDetails(null);
    navigateTo('ORDERS');
  };

  if (!user.isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} onDemoLogin={handleDemoLogin} />;
  }

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Toast message={toast.message} isVisible={toast.show} onClose={hideToast} action={toast.action} />

      {/* Optimized Layout Header */}
      {currentView !== 'PROFILE' && currentView !== 'CART' && (
        <header className="sticky top-0 z-[60] bg-white border-b border-slate-100 px-5 py-3 shadow-sm">
            <div className="max-w-md mx-auto grid grid-cols-3 items-center">
                {/* Logo Section Left */}
                <div className="justify-self-start">
                    <SevenX7Logo size="xs" />
                </div>

                {/* Store Name Section Center */}
                <div className="justify-self-center text-center px-2">
                    <span 
                        className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate block max-w-[120px] cursor-pointer active:opacity-60 transition-opacity" 
                        onClick={detectLocation}
                    >
                        {activeStore ? activeStore.name : 'Locating...'}
                    </span>
                </div>

                {/* Profile Section Right */}
                <div className="justify-self-end">
                    <button 
                        onClick={() => navigateTo('PROFILE')} 
                        className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black uppercase shadow-lg active:scale-90"
                    >
                        {user.name?.charAt(0) || 'U'}
                    </button>
                </div>
            </div>
        </header>
      )}

      <main className={`max-w-md mx-auto relative ${currentView === 'CART' ? 'h-screen overflow-hidden' : 'pb-24'}`}>
        {currentView === 'SHOP' && <ShopPage />}
        {currentView === 'ORDERS' && <MyOrders userLocation={user.location} userId={user.id} />}
        {currentView === 'PROFILE' && <ProfilePage onBack={() => navigateTo('SHOP')} />}
        {currentView === 'CART' && (
           <CartSheet 
              cart={cart}
              onProceedToPay={handleProceedToPay}
              onUpdateQuantity={updateQuantity}
              onAddProduct={(p) => addToCart(p)}
              mode={orderMode}
              onModeChange={setOrderMode}
              deliveryAddress={deliveryAddress}
              onAddressChange={setDeliveryAddress}
              activeStore={activeStore}
              stores={availableStores}
              userLocation={user.location}
              isPage={true}
              onClose={() => navigateTo('SHOP')} 
           />
        )}

        {showPaymentGateway && pendingOrderDetails && (
          <PaymentGateway 
             amount={pendingOrderDetails.amount || (pendingOrderDetails.splits ? (pendingOrderDetails.splits.storeAmount + (pendingOrderDetails.splits.deliveryFee || 0)) : 0)}
             savedCards={user.savedCards || []}
             onSuccess={(method) => finalizeOrder(method)}
             onCancel={() => {
                 window.history.back();
                 setShowPaymentGateway(false);
             }}
             isDemo={user.id === 'demo-user'}
             storeName={pendingOrderDetails.storeName}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {currentView !== 'PROFILE' && !showPaymentGateway && currentView !== 'CART' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-[100] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
           <div className="max-w-md mx-auto flex justify-around items-center px-4 py-3">
            {[
              { id: 'SHOP', icon: '🏠', label: 'Home' },
              { id: 'CART', icon: '🛒', label: 'Cart', badge: totalCartItems },
              { id: 'ORDERS', icon: '🧾', label: 'Orders' }
            ].map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button 
                      key={item.id}
                      onClick={() => navigateTo(item.id as any)}
                      className={`flex flex-col items-center justify-center w-20 transition-all ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
                  >
                      <div className="relative mb-1">
                          <span className="text-xl block">{item.icon}</span>
                          {item.badge ? (
                              <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] bg-emerald-500 text-white text-[7px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                  {item.badge}
                              </span>
                          ) : null}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
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
