
export interface BrandOption {
  name: string;
  price: number; 
}

export interface Variant {
  name: string;
  multiplier: number; 
}

export interface Product {
  id: string;
  name: string;
  price: number; 
  emoji: string;
  category: string;
  description?: string;
  ingredients?: string;
  nutrition?: string;
  brands?: BrandOption[]; 
  variants?: Variant[]; 
}

export interface Store {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: string; 
  lat: number;
  lng: number;
  isOpen: boolean;
  type: 'general' | 'produce' | 'dairy'; 
  store_type: 'grocery' | 'local_ecommerce'; // Added to support new schema
  availableProductIds: string[]; 
  upiId?: string; 
}

export interface CartItem extends Product {
  quantity: number;
  selectedBrand: string;     
  selectedVariant?: Variant; 
  originalProductId: string; 
  storeId: string;
  storeName: string;
  storeType: Store['type'];
}

export type OrderMode = 'DELIVERY' | 'PICKUP';
export type DeliveryType = 'INSTANT' | 'SCHEDULED';
export type OrderType = 'grocery' | 'local_ecommerce'; // Added

export interface SavedCard {
  id: string;
  type: 'VISA' | 'MASTERCARD' | 'UPI';
  last4?: string; 
  upiId?: string; 
  label: string;
}

export interface UserState {
  isAuthenticated: boolean;
  id?: string;
  phone: string;
  email?: string;
  name?: string;
  address?: string;
  location: { lat: number; lng: number } | null;
  savedCards?: SavedCard[];
  role?: 'customer' | 'store_owner' | 'delivery_partner' | 'admin';
  verificationStatus?: 'pending' | 'verified' | 'rejected';
}

export interface LocationResult {
  latitude: number;
  longitude: number;
}

export interface PaymentSplit {
  storeAmount: number;
  storeUpi?: string;
  handlingFee?: number; 
  adminUpi?: string;
  deliveryFee: number; 
  driverUpi?: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Preparing' | 'On the way' | 'Ready' | 'Delivered' | 'Picked Up' | 'Cancelled';
  paymentStatus: 'PAID' | 'PENDING';
  paymentDeadline?: string; 
  paymentMethod?: string; 
  mode: OrderMode;
  deliveryType: DeliveryType;
  order_type: OrderType; // Added
  scheduledTime?: string;
  deliveryAddress?: string;
  storeName: string;
  storeLocation?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
  splits?: PaymentSplit;
}
