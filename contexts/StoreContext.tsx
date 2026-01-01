
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserState, CartItem, Store, Product, Order, OrderMode } from '../types';
import { MOCK_STORES, INITIAL_PRODUCTS } from '../constants';
import { fetchVerifiedStores, fetchStoreInventory } from '../services/storeService';
import { supabase } from '../services/supabase';

interface StoreContextType {
  user: UserState;
  setUser: React.Dispatch<React.SetStateAction<UserState>>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  clearCart: () => void;
  activeStore: Store | null;
  setActiveStore: (store: Store) => void;
  availableStores: Store[];
  orderMode: OrderMode;
  setOrderMode: (mode: OrderMode) => void;
  addToCart: (product: Product, quantity?: number, brand?: string, price?: number, variant?: any) => void;
  updateQuantity: (productId: string, delta: number) => void;
  detectLocation: () => Promise<void>;
  isLoading: boolean;
  isBackendConnected: boolean;
  toast: { message: string; show: boolean; action?: { label: string; onClick: () => void } };
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  hideToast: () => void;
  currentView: 'SHOP' | 'CART' | 'ORDERS' | 'PROFILE';
  setCurrentView: (view: 'SHOP' | 'CART' | 'ORDERS' | 'PROFILE') => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (order: any) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  pendingStoreSwitch: Store | null;
  resolveStoreSwitch: (accept: boolean) => void;
  viewingProduct: Product | null;
  setViewingProduct: (product: Product | null) => void;
  driverLocations: Record<string, { lat: number; lng: number; timeRemaining?: number; distanceRemaining?: number }>;
  setDriverLocations: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  storeProducts: Product[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>({
    isAuthenticated: false,
    phone: '',
    location: null,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>('DELIVERY');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [currentView, setCurrentView] = useState<'SHOP' | 'CART' | 'ORDERS' | 'PROFILE'>('SHOP');
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [storeProducts, setStoreProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [toast, setToast] = useState<{ message: string; show: boolean; action?: { label: string; onClick: () => void } }>({
    message: '',
    show: false,
  });
  const [pendingStoreSwitch, setPendingStoreSwitch] = useState<Store | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [driverLocations, setDriverLocations] = useState<Record<string, any>>({});
  const [manualStore, setManualStore] = useState<Store | null>(null);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const showToast = useCallback((message: string, action?: { label: string; onClick: () => void }) => {
    setToast({ message, show: true, action });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const nearestStore = useMemo(() => {
    if (availableStores.length === 0) return null;
    if (!user.location) return availableStores[0];
    const sorted = [...availableStores].sort((a, b) => {
        const dA = Math.sqrt(Math.pow(a.lat - user.location!.lat, 2) + Math.pow(a.lng - user.location!.lng, 2));
        const dB = Math.sqrt(Math.pow(b.lat - user.location!.lat, 2) + Math.pow(b.lng - user.location!.lng, 2));
        return dA - dB;
    });
    return sorted[0];
  }, [user.location, availableStores]);

  const activeStore = manualStore || nearestStore;

  const loadStores = useCallback(async (lat?: number, lng?: number) => {
    if (isLoading) return;
    setIsLoading(true);
    const searchLat = lat || 12.9716;
    const searchLng = lng || 77.5946;

    try {
        const stores = await fetchVerifiedStores(searchLat, searchLng);
        const hydratedStores = await Promise.all(stores.map(async (s) => {
            const inventory = await fetchStoreInventory(s.id);
            return { ...s, availableProductIds: inventory.map(i => i.product_id) };
        }));
        setAvailableStores(hydratedStores.length > 0 ? hydratedStores : MOCK_STORES);
    } catch (e) {
        setAvailableStores(MOCK_STORES);
    } finally {
        setIsLoading(false);
    }
  }, [isLoading]);

  // Load Inventory for Active Store
  useEffect(() => {
    if (activeStore && activeStore.id && !activeStore.id.startsWith('blr-')) {
        fetchStoreInventory(activeStore.id).then(items => {
            if (items.length > 0) {
                setStoreProducts(items.map(i => i.details as Product));
            }
        });
    } else {
        setStoreProducts(INITIAL_PRODUCTS);
    }
  }, [activeStore]);

  useEffect(() => {
    if (user.isAuthenticated) {
        loadStores(user.location?.lat, user.location?.lng);
    }
  }, [user.location?.lat, user.location?.lng, user.isAuthenticated]);

  useEffect(() => {
    if (user.isAuthenticated && user.id && user.id !== 'demo-user') {
        const storeChannel = supabase
            .channel('store-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => {
                loadStores(userRef.current.location?.lat, userRef.current.location?.lng);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setIsBackendConnected(true);
            });

        return () => { 
            supabase.removeChannel(storeChannel); 
            setIsBackendConnected(false);
        };
    }
  }, [user.isAuthenticated, user.id, loadStores]);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) { showToast("GPS Disabled"); return; }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const neighborhood = data.address?.suburb || data.address?.neighbourhood || 'Nearby Area';
          
          setUser(prev => ({ 
            ...prev, 
            location: { lat: latitude, lng: longitude },
            accuracy: accuracy,
            isLiveGPS: true,
            address: data.display_name,
            neighborhood: neighborhood
          }));

          if (userRef.current.isAuthenticated && userRef.current.id) {
              await supabase.from('profiles').update({
                  current_lat: latitude,
                  current_lng: longitude,
                  updated_at: new Date().toISOString()
              }).eq('id', userRef.current.id);
          }
        } catch (e) {
          setUser(prev => ({ ...prev, location: { lat: latitude, lng: longitude }, accuracy, isLiveGPS: true }));
        } finally { setIsLoading(false); }
      },
      () => { 
          setIsLoading(false);
          if (userRef.current.id === 'demo-user') {
              setUser(prev => ({ ...prev, location: { lat: 12.9716, lng: 77.5946 }, neighborhood: 'Indiranagar' }));
          }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [showToast]);

  const addToCart = useCallback((product: Product, quantity = 1, brand?: string, price?: number, variant?: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedBrand === (brand || 'Generic'));
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedBrand === (brand || 'Generic')) ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, {
        ...product, quantity, selectedBrand: brand || 'Generic', selectedVariant: variant,
        price: price || product.price, originalProductId: product.id,
        storeId: activeStore?.id || 'def', storeName: activeStore?.name || 'Store', storeType: activeStore?.type || 'general'
      }];
    });
    showToast(`Added ${product.name}`);
  }, [activeStore, showToast]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (!existing) return prev;
      if (existing.quantity + delta <= 0) return prev.filter(item => item.id !== productId);
      return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item);
    });
  }, []);

  const addOrder = useCallback(async (order: Order) => {
      // Direct insertion for real-time users
      if (user.id && user.id !== 'demo-user') {
          try {
              const { data: orderData, error: orderError } = await supabase.from('orders').insert({
                  customer_id: user.id,
                  store_id: order.items[0].storeId,
                  status: 'placed',
                  total_amount: order.total,
                  delivery_address: order.deliveryAddress,
                  order_mode: order.mode,
                  payment_status: order.paymentStatus,
                  created_at: new Date().toISOString()
              }).select().single();

              if (orderError) throw orderError;

              if (orderData) {
                  order.id = orderData.id;
                  // Handle order items for Super Admin itemized view
                  const { error: itemsError } = await supabase.from('order_items').insert(
                      order.items.map(item => ({
                          order_id: orderData.id,
                          product_id: item.originalProductId,
                          unit_price: item.price,
                          quantity: item.quantity
                      }))
                  );
                  if (itemsError) console.error("Item sync failed:", itemsError);
              }
          } catch (e: any) {
              console.error("Cloud Sync Failed:", e.message || e);
              showToast("Ecosystem Offline. Order saved locally.");
          }
      }
      
      // Update local state
      setOrders(prev => {
          if (prev.find(o => o.id === order.id)) return prev;
          return [order, ...prev];
      });
  }, [user.id, showToast]);

  const updateOrder = useCallback((updatedOrder: any) => {
      setOrders(prev => prev.map(o => {
          if (o.id === updatedOrder.id) {
              return { 
                  ...o, 
                  status: updatedOrder.status,
                  paymentStatus: updatedOrder.payment_status === 'PAID' ? 'PAID' : o.paymentStatus
              };
          }
          return o;
      }));
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => {
        const isComplete = status === 'Delivered' || status === 'Picked Up';
        return prev.map(o => {
            if (o.id !== orderId) return o;
            return { 
                ...o, 
                status, 
                paymentStatus: isComplete ? 'PAID' as const : o.paymentStatus 
            };
        });
    });
  }, []);

  const resolveStoreSwitch = useCallback((accept: boolean) => {
    if (accept && pendingStoreSwitch) { clearCart(); setManualStore(pendingStoreSwitch); }
    setPendingStoreSwitch(null);
  }, [pendingStoreSwitch, clearCart]);

  return (
    <StoreContext.Provider value={{
      user, setUser, cart, setCart, clearCart, activeStore, setActiveStore: setManualStore, availableStores,
      orderMode, setOrderMode, addToCart, updateQuantity, detectLocation,
      isLoading, isBackendConnected, toast, showToast, hideToast, currentView, setCurrentView,
      orders, setOrders, addOrder, updateOrder, updateOrderStatus, pendingStoreSwitch, resolveStoreSwitch,
      viewingProduct, setViewingProduct, driverLocations, setDriverLocations, storeProducts
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
