
import { Product, Store, AdCampaign } from './types';

const VARIANTS_STAPLES = [
  { name: '1 kg', multiplier: 1 },
  { name: '2 kg', multiplier: 2 },
  { name: '5 kg', multiplier: 4.8 },
  { name: '10 kg', multiplier: 9.5 }
];

const VARIANTS_OILS = [
  { name: '1 L', multiplier: 1 },
  { name: '5 L', multiplier: 4.8 }
];

const VARIANTS_DAIRY = [
  { name: '500 ml', multiplier: 0.5 },
  { name: '1 L', multiplier: 1 }
];

const VARIANTS_SNACKS = [
  { name: 'Small', multiplier: 1 },
  { name: 'Family Pack', multiplier: 2.5 }
];

export const INITIAL_PRODUCTS: Product[] = [
  // Staples
  { id: 's1', name: 'Premium Basmati Rice', price: 110, emoji: '🍚', category: 'Staples', brands: [{name: 'India Gate', price: 140}, {name: 'Fortune', price: 110}], variants: VARIANTS_STAPLES },
  { id: 's2', name: 'Whole Wheat Atta', price: 45, emoji: '🌾', category: 'Staples', brands: [{name: 'Aashirvaad', price: 55}, {name: 'Fortune', price: 45}], variants: VARIANTS_STAPLES },
  { id: 's3', name: 'Toor Dal', price: 160, emoji: '🫘', category: 'Staples', variants: [{ name: '1 kg', multiplier: 1 }] },
  
  // Oils & Spices
  { id: 'o1', name: 'Sunflower Oil', price: 155, emoji: '🌻', category: 'Oils & Spices', brands: [{name: 'Fortune', price: 155}, {name: 'Sunpure', price: 160}], variants: VARIANTS_OILS },
  { id: 'o2', name: 'Turmeric Powder', price: 45, emoji: '🟧', category: 'Oils & Spices', brands: [{name: 'Everest', price: 45}], variants: [{ name: '100g', multiplier: 1 }] },
  
  // Dairy & Breakfast
  { id: 'd1', name: 'Fresh Milk', price: 34, emoji: '🥛', category: 'Dairy & Breakfast', brands: [{name: 'Nandini', price: 34}, {name: 'Amul', price: 54}], variants: VARIANTS_DAIRY },
  { id: 'd2', name: 'Large White Eggs', price: 60, emoji: '🥚', category: 'Dairy & Breakfast', variants: [{ name: '6 pcs', multiplier: 1 }, { name: '12 pcs', multiplier: 1.9 }] },
  
  // Veg & Fruits
  { id: 'v1', name: 'Fresh Potatoes', price: 40, emoji: '🥔', category: 'Veg & Fruits', variants: [{ name: '1 kg', multiplier: 1 }] },
  { id: 'v2', name: 'Red Tomatoes', price: 50, emoji: '🍅', category: 'Veg & Fruits', variants: [{ name: '1 kg', multiplier: 1 }] },
  
  // Snacks & Drinks
  { id: 'sn1', name: 'Potato Chips', price: 20, emoji: '🍟', category: 'Snacks & Drinks', brands: [{name: 'Lays', price: 20}, {name: 'Pringles', price: 110}], variants: VARIANTS_SNACKS },
  { id: 'sn2', name: 'Cola Soda', price: 40, emoji: '🥤', category: 'Snacks & Drinks', brands: [{name: 'Coke', price: 40}], variants: [{ name: '750ml', multiplier: 1 }] },
  
  // Home Care
  { id: 'hc1', name: 'Liquid Detergent', price: 199, emoji: '🧺', category: 'Home Care', brands: [{name: 'Surf Excel', price: 199}, {name: 'Ariel', price: 210}], variants: [{ name: '1 L', multiplier: 1 }] },
  { id: 'hc2', name: 'Floor Cleaner', price: 120, emoji: '🧹', category: 'Home Care', brands: [{name: 'Lizol', price: 120}], variants: [{ name: '500ml', multiplier: 1 }] },
  
  // Personal Care
  { id: 'pc1', name: 'Bathing Soap', price: 45, emoji: '🧼', category: 'Personal Care', brands: [{name: 'Dove', price: 65}, {name: 'Lux', price: 45}] },
  { id: 'pc2', name: 'Herbal Shampoo', price: 180, emoji: '🧴', category: 'Personal Care', brands: [{name: 'Himalaya', price: 180}], variants: [{ name: '200ml', multiplier: 1 }] },
  
  // Meat & Seafood
  { id: 'm1', name: 'Fresh Chicken Curry Cut', price: 240, emoji: '🍗', category: 'Meat & Seafood', variants: [{ name: '500g', multiplier: 1 }, { name: '1 kg', multiplier: 1.9 }] },
  { id: 'm2', name: 'Fresh Rohu Fish', price: 300, emoji: '🐟', category: 'Meat & Seafood', variants: [{ name: '1 kg', multiplier: 1 }] },
  
  // Bakery
  { id: 'b1', name: 'Brown Bread', price: 45, emoji: '🍞', category: 'Bakery', brands: [{name: 'Modern', price: 45}, {name: 'Bonn', price: 50}] },
  { id: 'b2', name: 'Chocolate Cake', price: 450, emoji: '🎂', category: 'Bakery', variants: [{ name: '500g', multiplier: 1 }] },
  
  // Baby Care
  { id: 'bc1', name: 'Baby Diapers', price: 699, emoji: '👶', category: 'Baby Care', brands: [{name: 'Pampers', price: 699}], variants: [{ name: 'S (42)', multiplier: 1 }, { name: 'M (38)', multiplier: 1 }] },
  { id: 'bc2', name: 'Baby Wipes', price: 150, emoji: '🧻', category: 'Baby Care', brands: [{name: 'Johnson\'s', price: 150}] },
  
  // General
  { id: 'g1', name: 'Alkaline Batteries', price: 150, emoji: '🔋', category: 'General', brands: [{name: 'Duracell', price: 180}, {name: 'Eveready', price: 150}] },
  { id: 'g2', name: 'Pet Food (Adult Dog)', price: 450, emoji: '🐕', category: 'General', brands: [{name: 'Pedigree', price: 450}], variants: [{ name: '1 kg', multiplier: 1 }] },
];

export const PRODUCT_FAMILIES = [
  { id: 'staples', title: 'Staples', emoji: '🌾', description: 'Grains & Pulses', theme: 'bg-orange-50/50 border-orange-100 text-orange-900', filter: (p: Product) => p.category === 'Staples' },
  { id: 'oils', title: 'Oils & Spices', emoji: '🏺', description: 'Cooking Needs', theme: 'bg-yellow-50/50 border-yellow-100 text-yellow-900', filter: (p: Product) => p.category === 'Oils & Spices' },
  { id: 'dairy', title: 'Dairy & Breakfast', emoji: '🥛', description: 'Fresh & Chilled', theme: 'bg-blue-50/50 border-blue-100 text-blue-900', filter: (p: Product) => p.category === 'Dairy & Breakfast' },
  { id: 'produce', title: 'Veg & Fruits', emoji: '🥦', description: 'Farm Fresh', theme: 'bg-emerald-50/50 border-emerald-100 text-emerald-900', filter: (p: Product) => p.category === 'Veg & Fruits' },
  { id: 'snacks', title: 'Snacks & Drinks', emoji: '🍿', description: 'Instant Bites', theme: 'bg-purple-50/50 border-purple-100 text-purple-900', filter: (p: Product) => p.category === 'Snacks & Drinks' },
  { id: 'homecare', title: 'Home Care', emoji: '🧺', description: 'Cleaning Essentials', theme: 'bg-cyan-50/50 border-cyan-100 text-cyan-900', filter: (p: Product) => p.category === 'Home Care' },
  { id: 'personal', title: 'Personal Care', emoji: '🧼', description: 'Hygiene & Health', theme: 'bg-pink-50/50 border-pink-100 text-pink-900', filter: (p: Product) => p.category === 'Personal Care' },
  { id: 'meat', title: 'Meat & Seafood', emoji: '🍗', description: 'Protein Rich', theme: 'bg-red-50/50 border-red-100 text-red-900', filter: (p: Product) => p.category === 'Meat & Seafood' },
  { id: 'bakery', title: 'Bakery', emoji: '🥐', description: 'Breads & Cakes', theme: 'bg-amber-50/50 border-amber-100 text-amber-900', filter: (p: Product) => p.category === 'Bakery' },
  { id: 'baby', title: 'Baby Care', emoji: '🍼', description: 'Little One Needs', theme: 'bg-sky-50/50 border-sky-100 text-sky-900', filter: (p: Product) => p.category === 'Baby Care' },
  { id: 'general', title: 'General', emoji: '🏪', description: 'Other Utilities', theme: 'bg-slate-50/50 border-slate-200 text-slate-900', filter: (p: Product) => p.category === 'General' },
];

export const DAIRY_IDS = INITIAL_PRODUCTS.filter(p => p.category === 'Dairy & Breakfast' || p.category === 'Bakery').map(p => p.id);
export const PRODUCE_IDS = INITIAL_PRODUCTS.filter(p => p.category === 'Veg & Fruits' || p.category === 'Meat & Seafood' || p.category === 'Staples').map(p => p.id);
export const GENERAL_IDS = INITIAL_PRODUCTS.map(p => p.id);

export const MOCK_STORES: Store[] = [
  { id: 'blr-ind-1', name: "Nandini Milk Parlour", address: "CMH Road, Indiranagar", rating: 4.8, distance: "0.2 km", lat: 12.9784, lng: 77.6408, isOpen: true, type: 'dairy', store_type: 'grocery', availableProductIds: DAIRY_IDS, upiId: 'nandini.ind@okaxis' },
  { id: 'blr-ind-2', name: "MK Ahmed Bazaar", address: "12th Main, Indiranagar", rating: 4.5, distance: "0.5 km", lat: 12.9700, lng: 77.6380, isOpen: true, type: 'general', store_type: 'grocery', availableProductIds: GENERAL_IDS, upiId: 'mkahmed@okhdfc' },
  { id: 'blr-ind-3', name: "Hopcoms Fresh", address: "Double Road, Indiranagar", rating: 4.6, distance: "0.8 km", lat: 12.9750, lng: 77.6400, isOpen: true, type: 'produce', store_type: 'grocery', availableProductIds: PRODUCE_IDS, upiId: 'hopcoms@okicici' },
  { id: 'blr-korm-1', name: "Organic World", address: "6th Block, Koramangala", rating: 4.7, distance: "1.2 km", lat: 12.9345, lng: 77.6268, isOpen: true, type: 'produce', store_type: 'grocery', availableProductIds: PRODUCE_IDS, upiId: 'organicworld@oksbi' },
];

export const MOCK_ADS: AdCampaign[] = [
  {
    id: 'sevenx7-internal',
    partnerName: 'SevenX7',
    partnerSuffix: 'Innovations',
    description: 'Pioneering the next generation of hyper-local ecosystems. Building technologies that empower community commerce.',
    websiteUrl: 'https://www.sevenx7.com/',
    displayUrl: 'www.sevenx7.com',
    ctaText: 'Visit Website',
    themeColor: 'emerald',
    tag: 'Verified Partner',
    icon: '🚀'
  }
];
