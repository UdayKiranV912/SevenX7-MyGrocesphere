
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserState, CartItem, Store, Product, Order, OrderMode } from '../types';
import { INITIAL_PRODUCTS, MOCK_STORES } from '../constants';
import { fetchRealStores } from '../services/overpassService';

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
    return availableStores.reduce((prev, curr) => {
        const dPrev = Math.sqrt(Math.pow(prev.lat - user.location!.lat, 2) + Math.pow(prev.lng - user.location!.lng, 2));
        const dCurr = Math.sqrt(Math.pow(curr.lat - user.location!.lat, 2) + Math.pow(curr.lng - user.location!.lng, 2));
        return dCurr < dPrev ? curr : prev;
    });
  }, [user.location, availableStores]);

  const activeStore = manualStore || nearestStore;

  const setActiveStore = (store: Store) => {
      if (cart.length > 0 && store.id !== activeStore?.id) {
          setPendingStoreSwitch(store);
      } else {
          setManualStore(store);
      }
  };

  const loadStores = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
        const stores = await fetchRealStores(lat, lng);
        if (user.id === 'demo-user') {
            setAvailableStores(stores.length > 0 ? [...stores, ...MOCK_STORES] : MOCK_STORES);
        } else {
            setAvailableStores(stores);
        }
    } catch (e) {
        if (user.id === 'demo-user') setAvailableStores(MOCK_STORES);
        else setAvailableStores([]);
    } finally {
        setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user.location) {
      loadStores(user.location.lat, user.location.lng);
    }
  }, [user.location, loadStores]);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      showToast("GPS not supported");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const neighborhood = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || 'My Area';
          setUser(prev => ({ 
            ...prev, 
            location: { lat: latitude, lng: longitude },
            address: data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
            neighborhood: neighborhood
          }));
        } catch (e) {
          setUser(prev => ({ ...prev, location: { lat: latitude, lng: longitude } }));
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setIsLoading(false);
        showToast("Location denied");
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 // Disable cache to improve pinpoint accuracy
      }
    );
  }, [showToast]);

  const addToCart = useCallback((product: Product, quantity = 1, brand?: string, price?: number, variant?: any) => {
    setCart(prev => {
      const storeId = activeStore?.id || 'default';
      const storeName = activeStore?.name || 'Local Store';
      const storeType = activeStore?.type || 'general';
      
      const existing = prev.find(item => item.id === product.id && item.selectedBrand === (brand || 'Generic') && item.selectedVariant?.name === variant?.name);
      
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedBrand === (brand || 'Generic') && item.selectedVariant?.name === variant?.name)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      const newItem: CartItem = {
        ...product,
        quantity,
        selectedBrand: brand || 'Generic',
        selectedVariant: variant,
        price: price || product.price,
        originalProductId: product.id,
        storeId,
        storeName,
        storeType
      };
      return [...prev, newItem];
    });
    showToast(`${product.name} added to cart`);
  }, [activeStore, showToast]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (!existing) return prev;
      if (existing.quantity + delta <= 0) {
        return prev.filter(item => item.id !== productId);
      }
      return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item);
    });
  }, []);

  const addOrder = useCallback(async (order: Order) => {
    setOrders(prev => [order, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  const resolveStoreSwitch = useCallback((accept: boolean) => {
    if (accept && pendingStoreSwitch) {
      clearCart();
      setManualStore(pendingStoreSwitch);
    }
    setPendingStoreSwitch(null);
  }, [pendingStoreSwitch, clearCart]);

  return (
    <StoreContext.Provider value={{
      user, setUser, cart, setCart, clearCart, activeStore, setActiveStore, availableStores,
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
