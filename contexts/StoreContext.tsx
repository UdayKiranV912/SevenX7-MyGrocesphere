
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserState, CartItem, Store, Product, Order, OrderMode } from '../types';
import { MOCK_STORES } from '../constants';
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
  toast: { message: string; show: boolean; action?: { label: string; onClick: () => void } };
  showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
  hideToast: () => void;
  currentView: 'SHOP' | 'CART' | 'ORDERS' | 'PROFILE';
  setCurrentView: (view: 'SHOP' | 'CART' | 'ORDERS' | 'PROFILE') => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  pendingStoreSwitch: Store | null;
  resolveStoreSwitch: (accept: boolean) => void;
  viewingProduct: Product | null;
  setViewingProduct: (product: Product | null) => void;
  driverLocations: Record<string, { lat: number; lng: number }>;
  setDriverLocations: React.Dispatch<React.SetStateAction<Record<string, { lat: number; lng: number }>>>;
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
  const [currentView, setCurrentView] = useState<'SHOP' | 'CART' | 'ORDERS' | 'PROFILE'>('SHOP');
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [toast, setToast] = useState<{ message: string; show: boolean; action?: { label: string; onClick: () => void } }>({
    message: '',
    show: false,
  });
  const [pendingStoreSwitch, setPendingStoreSwitch] = useState<Store | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [driverLocations, setDriverLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  const [manualStore, setManualStore] = useState<Store | null>(null);

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
    setIsLoading(true);
    
    // DEMO MODE: Load all Mock Bengaluru stores
    if (user.id === 'demo-user') {
        setAvailableStores(MOCK_STORES);
        setIsLoading(false);
        return;
    }

    // REAL TIME: Load only DB-registered stores
    if (!lat || !lng) {
        setIsLoading(false);
        return;
    }

    try {
        const stores = await fetchVerifiedStores(lat, lng);
        if (stores.length === 0) {
            setAvailableStores([]);
        } else {
            const hydratedStores = await Promise.all(stores.map(async (s) => {
                const inventory = await fetchStoreInventory(s.id);
                return { ...s, availableProductIds: inventory.map(i => i.product_id) };
            }));
            setAvailableStores(hydratedStores);
        }
    } catch (e) {
        console.error("Store loading failed", e);
        setAvailableStores([]);
    } finally {
        setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user.isAuthenticated) {
        loadStores(user.location?.lat, user.location?.lng);
    }
  }, [user.location, user.isAuthenticated, loadStores]);

  useEffect(() => {
    if (user.isAuthenticated && user.id && user.id !== 'demo-user') {
        const channel = supabase
            .channel(`public:orders:customer:${user.id}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'orders', 
                filter: `customer_id=eq.${user.id}` 
            }, (payload) => {
                const updatedOrder = payload.new as any;
                setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
                showToast(`Order status updated: ${updatedOrder.status}`);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }
  }, [user.isAuthenticated, user.id, showToast]);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) { showToast("GPS not supported"); return; }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const neighborhood = data.address?.suburb || data.address?.neighbourhood || 'Nearby';
          setUser(prev => ({ 
            ...prev, 
            location: { lat: latitude, lng: longitude },
            accuracy: accuracy,
            address: data.display_name,
            neighborhood: neighborhood
          }));
        } catch (e) {
          setUser(prev => ({ ...prev, location: { lat: latitude, lng: longitude }, accuracy }));
        } finally {
          setIsLoading(false);
        }
      },
      () => { 
        setIsLoading(false); 
        if (user.id === 'demo-user') {
            setUser(prev => ({ ...prev, location: { lat: 12.9716, lng: 77.5946 }, neighborhood: 'Indiranagar' }));
        } else {
            showToast("Location denied. Please enable GPS for real-time marts."); 
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [showToast, user.id]);

  const addToCart = useCallback((product: Product, quantity = 1, brand?: string, price?: number, variant?: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedBrand === (brand || 'Generic') && item.selectedVariant?.name === variant?.name);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedBrand === (brand || 'Generic')) ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, {
        ...product, quantity, selectedBrand: brand || 'Generic', selectedVariant: variant,
        price: price || product.price, originalProductId: product.id,
        storeId: activeStore?.id || 'def', storeName: activeStore?.name || 'Store', storeType: activeStore?.type || 'general'
      }];
    });
    showToast(`${product.name} added`);
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
      if (user.id && user.id !== 'demo-user') {
          const { data: orderData, error: orderError } = await supabase.from('orders').insert({
              customer_id: user.id,
              store_id: order.items[0].storeId,
              status: 'placed',
              items: order.items,
              total_amount: order.total,
              delivery_address: order.deliveryAddress
          }).select().single();

          if (orderError) {
              showToast("Failed to place order in database.");
              return;
          }

          if (orderData) {
              const itemsToInsert = order.items.map(item => ({
                  order_id: orderData.id,
                  product_id: item.originalProductId,
                  quantity: item.quantity,
                  unit_price: item.price
              }));
              await supabase.from('order_items').insert(itemsToInsert);

              await supabase.from('payment_splits').insert({
                  order_id: orderData.id,
                  store_amount: order.splits?.storeAmount || 0,
                  delivery_fee: order.splits?.deliveryFee || 0,
                  admin_amount: 5,
                  store_upi: order.splits?.storeUpi || '',
                  admin_upi: 'sevenx7.admin@okaxis',
                  total_paid: order.total
              });

              order.id = orderData.id;
          }
      }
      setOrders(prev => [order, ...prev]);
  }, [user.id, showToast]);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  const resolveStoreSwitch = useCallback((accept: boolean) => {
    if (accept && pendingStoreSwitch) { clearCart(); setManualStore(pendingStoreSwitch); }
    setPendingStoreSwitch(null);
  }, [pendingStoreSwitch, clearCart]);

  return (
    <StoreContext.Provider value={{
      user, setUser, cart, setCart, clearCart, activeStore, setActiveStore: setManualStore, availableStores,
      orderMode, setOrderMode, addToCart, updateQuantity, detectLocation,
      isLoading, toast, showToast, hideToast, currentView, setCurrentView,
      orders, setOrders, addOrder, updateOrderStatus, pendingStoreSwitch, resolveStoreSwitch,
      viewingProduct, setViewingProduct, driverLocations, setDriverLocations
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
