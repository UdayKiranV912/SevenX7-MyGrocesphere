
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
    detectLocation, isLoading,
    toast, hideToast, showToast,
    currentView, setCurrentView,
    orders, addOrder, updateOrderStatus,
    pendingStoreSwitch, resolveStoreSwitch,
    viewingProduct,
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
            ? `Closer to ${pendingStoreSwitch.name}. Switch? (Clears Cart)`
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

  // --- Order Lifecycle & Real-Road Driver Simulation ---
  useEffect(() => {
    orders.forEach(async (order) => {
      // 1. Progress Pending to Preparing
      if (order.status === 'Pending' && order.paymentStatus === 'PAID') {
          setTimeout(() => updateOrderStatus(order.id, 'Preparing'), 4000);
      }

      // 2. Progress Preparing to On the way
      if (order.status === 'Preparing') {
          setTimeout(() => updateOrderStatus(order.id, 'On the way'), 8000);
      }

      // 3. Realistic Driver Movement along OSRM Path
      if (order.status === 'On the way' && order.storeLocation && order.userLocation && !simulationIntervals.current[order.id]) {
          const path = await getRoute(order.storeLocation.lat, order.storeLocation.lng, order.userLocation.lat, order.userLocation.lng);
          
          let currentNodeIndex = 0;
          let nodeProgress = 0;
          const speed = 0.2; // Speed factor

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
              showToast(`Order from ${order.storeName} has ${order.mode === 'DELIVERY' ? 'arrived!' : 'been prepared!'}`);
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

    return () => {
      // We don't clear all intervals here to avoid stopping animations on re-renders,
      // but the useEffect dependency on 'orders' length or status ensures we don't duplicate.
    };
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
      if (details.isPayLater) {
          finalizeOrder('Pay Later', { ...details, storeName: activeStore?.name }); 
      } else {
          window.history.pushState({ view: currentView, modal: 'PAYMENT' }, '');
          setShowPaymentGateway(true);
      }
  };

  const handlePayForExistingOrder = (order: Order) => {
     setPendingOrderDetails({
         deliveryType: order.deliveryType,
         scheduledTime: order.scheduledTime,
         existingOrderId: order.id,
         amount: order.total,
         storeName: order.storeName
     });
     window.history.pushState({ view: currentView, modal: 'PAYMENT' }, '');
     setShowPaymentGateway(true);
  };

  const finalizeOrder = async (paymentMethodString: string, directDetails?: typeof pendingOrderDetails) => {
    const details = directDetails || pendingOrderDetails;
    if (!details) return;
    if (details.existingOrderId) {
        if (showPaymentGateway) window.history.back();
        setShowPaymentGateway(false);
        setPendingOrderDetails(null);
        navigateTo('ORDERS');
        return;
    }
    const itemsByStore: Record<string, typeof cart> = {};
    cart.forEach(item => {
        if (!itemsByStore[item.storeId]) itemsByStore[item.storeId] = [];
        itemsByStore[item.storeId].push(item);
    });
    const newOrders: Order[] = Object.entries(itemsByStore).map(([storeId, items]) => {
        const storeItem = items[0];
        const subTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const deliveryFee = details.splits?.deliveryFee || 0;
        const handlingFee = details.splits?.handlingFee || 0;
        const sourceStore = availableStores.find(s => s.id === storeId) || (activeStore?.id === storeId ? activeStore : null);
        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            date: new Date().toISOString(),
            items: items,
            total: subTotal + deliveryFee + handlingFee,
            status: 'Pending',
            paymentStatus: details.isPayLater ? 'PENDING' : 'PAID',
            paymentMethod: details.isPayLater ? 'Pay Later' : paymentMethodString,
            mode: orderMode,
            deliveryType: details.deliveryType,
            order_type: (sourceStore?.store_type || activeStore?.store_type || 'grocery') as OrderType,
            scheduledTime: details.scheduledTime,
            deliveryAddress: orderMode === 'DELIVERY' ? deliveryAddress : undefined,
            storeName: storeItem.storeName,
            storeLocation: sourceStore ? { lat: sourceStore.lat, lng: sourceStore.lng } : { lat: 0, lng: 0 }, 
            userLocation: user.location || undefined,
            splits: details.splits
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-brand-light selection:text-brand-dark overflow-x-hidden">
      <Toast message={toast.message} isVisible={toast.show} onClose={hideToast} action={toast.action} />

      {currentView !== 'PROFILE' && (
        <header className={`sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all duration-300 ${currentView !== 'SHOP' ? 'hidden md:block' : ''}`}>
          <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex flex-col items-start">
                  <div className="flex flex-col items-start">
                     <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Grocesphere</h1>
                     <div className="mt-0.5 flex justify-start">
                       <SevenX7Logo size="xs" />
                     </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5" onClick={detectLocation}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm ${
                          activeStore?.type === 'produce' ? 'bg-emerald-500' : 
                          activeStore?.type === 'dairy' ? 'bg-blue-500' : 'bg-orange-500'
                      }`}>
                          {activeStore?.type === 'produce' ? '🥦' : activeStore?.type === 'dairy' ? '🥛' : '🏪'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 truncate max-w-[140px] cursor-pointer hover:text-brand-dark transition-colors">
                          {activeStore ? activeStore.name : (user.address || 'Locating...')}
                      </span>
                  </div>
              </div>

              <button 
                onClick={() => navigateTo('PROFILE')}
                className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-base hover:bg-slate-200 transition-colors active:scale-90"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </button>
          </div>
        </header>
      )}

      <main className={`max-w-md mx-auto relative ${currentView === 'PROFILE' ? 'bg-[#F8FAFC]' : ''}`}>
        {currentView === 'SHOP' && <ShopPage />}
        {currentView === 'ORDERS' && (
          <div className="animate-fade-in">
            <MyOrders userLocation={user.location} onPayNow={handlePayForExistingOrder} userId={user.id} />
          </div>
        )}
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
             amount={pendingOrderDetails.amount || (pendingOrderDetails.splits ? (pendingOrderDetails.splits.storeAmount + pendingOrderDetails.splits.deliveryFee + pendingOrderDetails.splits.handlingFee) : 0)}
             splits={pendingOrderDetails.splits}
             savedCards={user.savedCards || []}
             onSavePaymentMethod={(method) => {
                 setUser(prev => ({ 
                     ...prev, 
                     savedCards: [...(prev.savedCards || []), method] 
                 }));
             }}
             onSuccess={(method) => finalizeOrder(method)}
             onCancel={() => {
                 window.history.back();
                 setShowPaymentGateway(false);
             }}
             isDemo={user.id === 'demo-user'}
             storeName={pendingOrderDetails.storeName}
          />
        )}

        {currentView === 'SHOP' && (
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
              hideButton={showPaymentGateway || !!viewingProduct}
           />
        )}
      </main>

      {currentView !== 'PROFILE' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/60 pb-safe z-50 shadow-soft">
           <div className="max-w-md mx-auto flex justify-between items-center px-8 py-1">
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
                      className={`flex flex-col items-center justify-center w-16 h-10 transition-all duration-200 active:scale-95 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
                  >
                      <div className="relative">
                          <span className={`text-lg mb-0.5 block ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                              {item.icon}
                          </span>
                          {item.badge ? (
                              <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-brand-DEFAULT text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                                  {item.badge}
                              </span>
                          ) : null}
                      </div>
                      <span className={`text-[8px] font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                          {item.label}
                      </span>
                  </button>
                );
            })}
           </div>
        </nav>
      )}
      <div className="h-4 w-full bg-[#F8FAFC] pointer-events-none"></div>
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
