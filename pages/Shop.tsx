
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
    if (activeStore.availableProductIds.length > 0) {
        return PRODUCT_FAMILIES.filter(family => 
            INITIAL_PRODUCTS.some(p => family.filter(p) && activeStore.availableProductIds.includes(p.id))
        );
    }
    return PRODUCT_FAMILIES;
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
    const isAvailable = !activeStore || activeStore?.availableProductIds.length === 0 || activeStore?.availableProductIds.includes(p.id);
    return matchesSearch && matchesCategory && isAvailable;
  });

  if (!isLoading && availableStores.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-10 text-center animate-fade-in">
        <div className="relative mb-10 group">
            <div className="w-52 h-52 bg-slate-900 rounded-[48px] flex items-center justify-center text-8xl shadow-2xl transition-transform group-hover:scale-105 duration-500">🏬</div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white text-2xl animate-pulse shadow-2xl">✨</div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-4 uppercase">No Marts Detected</h2>
        <p className="text-slate-500 font-bold text-[10px] leading-relaxed max-w-[240px] mb-12 mx-auto uppercase tracking-[0.2em]">Registered Grocesphere partners are coming soon to <span className="text-slate-900">{user.neighborhood || 'your area'}</span>.</p>
        
        <div className="w-full max-w-xs space-y-3">
          <button onClick={detectLocation} className="w-full bg-slate-900 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">📍 Refine GPS Location</button>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Only verified local marts appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 animate-fade-in bg-slate-50/30">
      <div className="sticky top-0 z-[50] bg-white/95 backdrop-blur-xl border-b border-slate-100 px-5 py-3 shadow-sm">
        <div className="relative group max-w-md mx-auto">
            <input type="text" placeholder="Search registered marts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-11 bg-slate-100 rounded-2xl px-11 text-base font-bold border-2 border-transparent outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white transition-all"/>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base opacity-40">🔍</span>
        </div>
      </div>

      <div className="relative h-[240px] mb-4 overflow-hidden border-b border-slate-100 isolate bg-white">
        <MapVisualizer 
          stores={availableStores} 
          userLat={user.location?.lat || null} 
          userLng={user.location?.lng || null} 
          userInitial={user.name?.charAt(0) || '👤'}
          userAccuracy={user.accuracy}
          isLiveGPS={user.isLiveGPS} 
          selectedStore={activeStore} 
          onSelectStore={setActiveStore} 
          mode="DELIVERY" 
          className="h-full" 
          onRequestLocation={detectLocation}
        />
        {activeStore && (
            <div className="absolute top-4 left-4 z-[40] animate-slide-up">
              <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-inner ${activeStore.type === 'produce' ? 'bg-emerald-500' : activeStore.type === 'dairy' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                      {activeStore.type === 'produce' ? '🥦' : activeStore.type === 'dairy' ? '🥛' : '🏪'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black leading-tight uppercase tracking-widest">Active Partner</span>
                    <span className="text-[11px] font-black truncate max-w-[160px]">{activeStore.name}</span>
                  </div>
              </div>
            </div>
        )}
      </div>

      <div className="mb-8">
        <div className="px-5 mb-3 flex items-center justify-between">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Categories</h2>
            <div className="h-[1px] flex-1 bg-slate-100 ml-4"></div>
        </div>
        <div className="overflow-x-auto hide-scrollbar px-4 flex gap-3">
           {availableCategories.map((family) => (
             <button key={family.id} onClick={() => setSelectedCategory(family.id)} className={`flex items-center gap-2.5 px-6 py-4 rounded-3xl transition-all duration-300 border-2 shrink-0 ${selectedCategory === family.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl -translate-y-1' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}>
                <span className="text-2xl">{family.emoji}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{family.title}</span>
             </button>
           ))}
        </div>
      </div>

      <div className="px-5">
        <div className="flex items-center gap-2 mb-6">
             <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-glow"></div>
             <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">{PRODUCT_FAMILIES.find(f => f.id === selectedCategory)?.title || 'All Goods'}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <StickerProduct key={product.id} product={product} count={cart.filter(item => item.originalProductId === product.id).reduce((acc, curr) => acc + curr.quantity, 0)} onAdd={(p, q, b, pr, v) => addToCart(p, q, b, pr, v)} onUpdateQuantity={updateQuantity} onClick={setViewingProduct}/>
          ))}
        </div>
      </div>

      {viewingProduct && <ProductDetailsModal product={viewingProduct} onClose={() => setViewingProduct(null)} onAdd={(p, q, b, pr, v) => addToCart(p, q, b, pr, v)}/>}
    </div>
  );
};
