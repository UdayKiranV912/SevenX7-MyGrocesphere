
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
  mrp?: number;
  brand?: string;
  brand_logo_url?: string;
  emoji: string;
  imageUrl?: string; 
  category: string;
  description?: string;
  ingredients?: string;
  nutrition?: string;
  brands?: BrandOption[]; 
  variants?: Variant[]; 
}

export interface AdCampaign {
  id: string;
  partnerName: string;
  partnerSuffix?: string;
  description: string;
  websiteUrl?: string;
  displayUrl: string;
  ctaText: string;
  themeColor: 'emerald' | 'blue' | 'orange' | 'purple' | 'amber';
  tag?: string;
  icon?: string;
  internalStoreId?: string; 
  internalView?: 'SHOP' | 'ORDERS' | 'CART'; 
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
  store_type: 'grocery' | 'local_ecommerce' | 'dairy' | 'vegetables' | 'fruits' | 'mini_mart' | 'super_mart';
  availableProductIds: string[]; 
  upiId?: string; 
  isRegistered?: boolean;
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
export type OrderType = 'grocery' | 'local_ecommerce';

export interface SavedCard {
  id: string;
  type: 'UPI'; 
  upiId: string; 
  label: string;
}

export interface UserState {
  isAuthenticated: boolean;
  id?: string;
  phone: string;
  email?: string;
  name?: string;
  address?: string;
  neighborhood?: string;
  location: { lat: number; lng: number } | null;
  accuracy?: number; 
  isLiveGPS?: boolean;
  savedCards?: SavedCard[];
  role?: 'customer' | 'store_owner' | 'delivery_partner' | 'admin';
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'verified';
}

export interface PaymentSplit {
  storeAmount: number;
  storeUpi?: string;
  handlingFee?: number; 
  adminUpi?: string;
  deliveryFee: number; 
  driverUpi?: string;
}

export interface DriverLocationState {
  lat: number;
  lng: number;
  bearing?: number;
  distanceRemaining?: number; 
  timeRemaining?: number; 
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
  order_type: OrderType;
  scheduledTime?: string;
  deliveryAddress?: string;
  storeName: string;
  storeLocation?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number };
  splits?: PaymentSplit;
}
