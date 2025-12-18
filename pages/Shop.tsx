
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { PRODUCT_FAMILIES, INITIAL_PRODUCTS, MOCK_STORES } from '../constants';
import { StickerProduct } from '../components/StickerProduct';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { MapVisualizer } from '../components/MapVisualizer';

export const ShopPage: React.FC = () => {
  const { 
    activeStore, setActiveStore, cart, addToCart, updateQuantity,
    viewingProduct, setViewingProduct, user, detectLocation
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

  return (
    <div className="pb-32 animate-fade-in">
      <div className="relative h-[220px] mb-6 overflow-hidden shadow-soft-xl rounded-b-[40px]">
        <MapVisualizer 
          stores={MOCK_STORES}
          userLat={user.location?.lat || null}
          userLng={user.location?.lng || null}
          selectedStore={activeStore}
          onSelectStore={setActiveStore}
          mode="DELIVERY"
          className="h-full"
          onRequestLocation={detectLocation}
        />
        <div className="absolute top-4 left-4 z-[500] animate-slide-up">
           <div className="bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-float border border-white/50 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                activeStore?.type === 'produce' ? 'bg-emerald-100 text-emerald-600' : 
                activeStore?.type === 'dairy' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {activeStore?.type === 'produce' ? '🥦' : activeStore?.type === 'dairy' ? '🥛' : '🏪'}
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Store Context</span>
                <span className="text-xs font-black text-slate-900 leading-tight">{activeStore?.name}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="px-5 mb-8">
        <div className="relative group">
          <input 
            type="text" 
            placeholder={`Search ${activeStore?.name}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-white rounded-3xl px-14 text-sm font-bold shadow-soft border border-slate-100 outline-none focus:ring-4 focus:ring-brand-light focus:border-brand-DEFAULT transition-all"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
        </div>
      </div>

      <div className="mb-8 overflow-hidden">
        <div className="px-6 flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Shop by Department</h2>
          <div className="h-[2px] flex-1 bg-slate-100 mx-4 opacity-50"></div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{availableCategories.length} Found</span>
        </div>
        
        <div className="overflow-x-auto hide-scrollbar px-6 pb-2">
           <div className="flex flex-col gap-4 w-max">
              <div className="flex gap-4">
                 {availableCategories.filter((_, i) => i % 2 === 0).map(family => (
                    <CategoryButton key={family.id} family={family} isSelected={selectedCategory === family.id} onClick={() => setSelectedCategory(family.id)} />
                 ))}
              </div>
              <div className="flex gap-4">
                 {availableCategories.filter((_, i) => i % 2 !== 0).map(family => (
                    <CategoryButton key={family.id} family={family} isSelected={selectedCategory === family.id} onClick={() => setSelectedCategory(family.id)} />
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="px-5">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-1.5 h-6 bg-brand-DEFAULT rounded-full"></div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em] leading-tight">
                {PRODUCT_FAMILIES.find(f => f.id === selectedCategory)?.title || 'Curated Picks'}
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                {PRODUCT_FAMILIES.find(f => f.id === selectedCategory)?.description}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-5">
          {filteredProducts.map(product => {
            const count = cart.find(item => item.originalProductId === product.id)?.quantity || 0;
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
          {filteredProducts.length === 0 && (
            <div className="col-span-2 py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 shadow-soft">
               <div className="text-6xl mb-4 grayscale opacity-10">🛍️</div>
               <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">No Stock Found</p>
               <p className="text-[10px] text-slate-400 font-bold mt-2">Try another store for more variety</p>
            </div>
          )}
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

const CategoryButton: React.FC<{ family: any, isSelected: boolean, onClick: () => void }> = ({ family, isSelected, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 pr-6 pl-2 py-2 rounded-2xl transition-all duration-300 min-w-[155px] group ${
            isSelected 
            ? 'bg-slate-900 text-white shadow-soft-xl translate-y-[-2px]' 
            : 'bg-white text-slate-600 border border-slate-100 hover:border-slate-300 hover:shadow-soft'
        }`}
    >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-inner transition-transform group-active:scale-90 ${
            isSelected ? 'bg-white/10' : family.theme
        }`}>
            <span className="filter drop-shadow-sm">{family.emoji}</span>
        </div>
        <div className="flex flex-col items-start overflow-hidden">
            <span className={`text-[11px] font-black uppercase tracking-tight truncate w-full leading-tight`}>{family.title}</span>
            <span className={`text-[8px] font-bold opacity-40 truncate w-full uppercase tracking-tighter`}>{family.description}</span>
        </div>
    </button>
);
