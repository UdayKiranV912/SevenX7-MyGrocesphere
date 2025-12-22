
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { PRODUCT_FAMILIES, INITIAL_PRODUCTS } from '../constants';
import { StickerProduct } from '../components/StickerProduct';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { MapVisualizer } from '../components/MapVisualizer';

export const ShopPage: React.FC = () => {
  const { 
    activeStore, setActiveStore, availableStores, cart, addToCart, updateQuantity,
    viewingProduct, setViewingProduct, user, detectLocation, isLoading
  } = useStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const availableCategories = useMemo(() => {
    if (!activeStore) return PRODUCT_FAMILIES;
    return PRODUCT_FAMILIES.filter(family => 
      INITIAL_PRODUCTS.some(p => family.filter(p) && activeStore.availableProductIds.includes(p.id))
    );
  }, [activeStore]);

  useEffect(() => {
    if (availableCategories.length > 0) {
      const isSelectedStillValid = availableCategories.some(c => c.id === selectedCategory);
      if (!isSelectedStillValid || !selectedCategory) {
        setSelectedCategory(availableCategories[0].id);
      }
    }
  }, [availableCategories, selectedCategory]);

  const filteredProducts = INITIAL_PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const family = PRODUCT_FAMILIES.find(f => f.id === selectedCategory);
    const matchesCategory = family ? family.filter(p) : true;
    const isAvailable = activeStore?.availableProductIds.includes(p.id);
    return matchesSearch && matchesCategory && isAvailable;
  });

  if (!isLoading && availableStores.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-10 text-center animate-fade-in bg-white/50 backdrop-blur-md">
        <div className="relative mb-10">
            <div className="w-40 h-40 bg-slate-50 rounded-[48px] flex items-center justify-center text-7xl shadow-inner border border-slate-100 animate-float">
              🏬
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white text-xl animate-pulse shadow-xl">
                ✨
            </div>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-4 uppercase">
            Marts Coming Soon
        </h2>
        <p className="text-slate-500 font-bold text-[9px] leading-relaxed max-w-[220px] mb-10 mx-auto uppercase tracking-[0.2em]">
            Onboarding verified community marts in your locality. Stay tuned!
        </p>
        <button 
            onClick={detectLocation}
            className="w-full max-w-xs bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-float active:scale-95 transition-all flex items-center justify-center gap-3"
        >
            <span>📍</span> Refresh GPS
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 animate-fade-in bg-slate-50/30">
      
      {/* Sticky Search */}
      <div className="sticky top-0 z-[50] bg-white/95 backdrop-blur-xl border-b border-slate-100 px-5 py-3 shadow-sm">
        <div className="relative group max-w-md mx-auto">
            <input 
                type="text" 
                placeholder={activeStore ? `Search in ${activeStore.name}...` : "Find goods..."} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-slate-100 rounded-2xl px-11 text-xs font-bold border-2 border-transparent outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base opacity-40">🔍</span>
        </div>
      </div>

      {/* Interactive Map Context */}
      <div className="relative h-[160px] mb-4 overflow-hidden border-b border-slate-100 isolate">
        <MapVisualizer 
          stores={availableStores}
          userLat={user.location?.lat || null}
          userLng={user.location?.lng || null}
          selectedStore={activeStore}
          onSelectStore={setActiveStore}
          mode="DELIVERY"
          className="h-full"
          onRequestLocation={detectLocation}
        />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10" />
        
        {activeStore && (
            <div className="absolute top-3 left-3 z-[500] animate-slide-up">
              <div className="bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-xl shadow-float border border-white/50 flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] shadow-sm ${
                      activeStore.type === 'produce' ? 'bg-emerald-500 text-white' : 
                      activeStore.type === 'dairy' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                      {activeStore.type === 'produce' ? '🥦' : activeStore.type === 'dairy' ? '🥛' : '🏪'}
                  </div>
                  <span className="text-[8px] font-black text-slate-900 leading-tight truncate max-w-[120px] uppercase tracking-wider">{activeStore.name}</span>
              </div>
            </div>
        )}
      </div>

      {/* Category Scroller */}
      <div className="mb-6">
        <div className="px-5 mb-2">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</h2>
        </div>
        <div className="overflow-x-auto hide-scrollbar px-4 flex gap-2">
           {availableCategories.map((family) => (
             <button 
                key={family.id}
                onClick={() => setSelectedCategory(family.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border shrink-0 ${
                  selectedCategory === family.id 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-600'
                }`}
             >
                <span className="text-xl">{family.emoji}</span>
                <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">{family.title}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-4">
             <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
             <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                 {PRODUCT_FAMILIES.find(f => f.id === selectedCategory)?.title || 'All Goods'}
             </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(product => {
            const count = cart.filter(item => item.originalProductId === product.id).reduce((acc, curr) => acc + curr.quantity, 0);
            return (
              <StickerProduct 
                key={product.id}
                product={product}
                count={count}
                onAdd={(p, q, b, pr, v) => addToCart(p, q, b, pr, v)}
                onUpdateQuantity={updateQuantity}
                onClick={setViewingProduct}
              />
            );
          })}
        </div>
      </div>

      {viewingProduct && (
        <ProductDetailsModal 
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
          onAdd={(p, q, b, pr, v) => addToCart(p, q, b, pr, v)}
        />
      )}
    </div>
  );
};
