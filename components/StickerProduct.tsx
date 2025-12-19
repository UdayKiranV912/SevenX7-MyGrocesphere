
import React, { useState } from 'react';
import { Product, Variant } from '../types';

interface StickerProductProps {
  product: Product;
  onAdd: (product: Product, quantity?: number, brand?: string, price?: number, variant?: Variant) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClick: (product: Product) => void;
  count: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export const StickerProduct: React.FC<StickerProductProps> = ({ 
    product, onAdd, onUpdateQuantity, onClick, count,
    isFavorite = false, onToggleFavorite 
}) => {
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const hasMultipleBrands = product.brands && product.brands.length > 0;
  const hasVariants = product.variants && product.variants.length > 0;
  const isComplex = hasMultipleBrands || hasVariants;

  const markupFactor = 1.2 + (parseInt(product.id.replace(/\D/g, '')) % 3) * 0.1;
  const mrp = Math.ceil(product.price * markupFactor);
  const discount = Math.round(((mrp - product.price) / mrp) * 100);

  const handleQuickAddClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isComplex) setShowQuickSelect(true);
      else {
          onAdd(product);
          if ('vibrate' in navigator) navigator.vibrate(10);
      }
  };

  const handleVariantSelect = (e: React.MouseEvent, variant: Variant) => {
      e.stopPropagation();
      const defaultBrand = product.brands?.[0];
      const basePrice = defaultBrand ? defaultBrand.price : product.price;
      const brandName = defaultBrand ? defaultBrand.name : 'Generic';
      const finalPrice = Math.ceil(basePrice * variant.multiplier);
      onAdd(product, 1, brandName, finalPrice, variant);
      setShowQuickSelect(false);
  };

  const handleBrandSelect = (e: React.MouseEvent, brand: {name: string, price: number}) => {
      e.stopPropagation();
      onAdd(product, 1, brand.name, brand.price);
      setShowQuickSelect(false);
  };

  return (
    <div 
      className={`group relative bg-white rounded-[24px] p-3 flex flex-col shadow-soft transition-all duration-500 active:scale-[0.97] cursor-pointer border-2 ${count > 0 ? 'border-emerald-500 shadow-soft-xl' : 'border-transparent'}`}
      onClick={() => onClick(product)}
    >
      {/* Quick Select Overlay */}
      {showQuickSelect && (
         <div 
            className="absolute inset-0 bg-white/98 backdrop-blur-xl z-[60] rounded-[24px] p-4 flex flex-col animate-scale-in border-2 border-emerald-500 shadow-2xl overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
         >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 shrink-0">
               <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                  Options
               </span>
               <button onClick={() => setShowQuickSelect(false)} className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2">
               {hasVariants ? (
                  product.variants?.map((v, i) => (
                      <button key={i} onClick={(e) => handleVariantSelect(e, v)} className="w-full flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-500 hover:text-white transition-all border border-slate-100 active:scale-95">
                          <span className="text-[10px] font-bold">{v.name}</span>
                          <span className="text-[10px] font-black">₹{Math.ceil((product.brands?.[0]?.price || product.price) * v.multiplier)}</span>
                      </button>
                  ))
               ) : (
                  product.brands?.map((b, i) => (
                      <button key={i} onClick={(e) => handleBrandSelect(e, b)} className="w-full flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-emerald-500 hover:text-white transition-all border border-slate-100 active:scale-95">
                          <span className="text-[10px] font-bold">{b.name}</span>
                          <span className="text-[10px] font-black">₹{b.price}</span>
                      </button>
                  ))
               )}
            </div>
         </div>
       )}

      <div className="absolute top-2 left-2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full z-10">
          {discount}% OFF
      </div>

      <div className="relative aspect-square mb-3 rounded-[20px] bg-slate-50 flex items-center justify-center overflow-hidden">
        <div className={`text-6xl transform transition-all duration-700 ease-out emoji-3d ${count > 0 ? 'scale-110' : ''}`}>
          {product.emoji}
        </div>
        {count > 0 && (
          <div className="absolute bottom-2 right-2 bg-emerald-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white z-10">
            {count}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-black text-slate-900 text-[11px] leading-tight line-clamp-2 mb-0.5">{product.name}</h3>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 line-through mb-0.5">₹{mrp}</span>
              <span className="font-black text-slate-900 text-base tracking-tighter">₹{product.price}</span>
          </div>
          
          <div className="h-9">
            {count === 0 ? (
              <button onClick={handleQuickAddClick} className="px-4 h-full rounded-xl bg-slate-900 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-90 font-black text-[9px] uppercase tracking-widest">
                <span>Add</span>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              </button>
            ) : (
              <div className="flex items-center bg-slate-900 rounded-xl p-0.5 h-full shadow-md animate-scale-in border border-white/10">
                <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, -1); }} className="w-7 h-full flex items-center justify-center text-white rounded-lg font-black text-lg active:scale-90">−</button>
                <div className="w-5 text-center text-white font-black text-[10px]">{count}</div>
                <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, 1); }} className="w-7 h-full flex items-center justify-center text-white rounded-lg font-black text-lg active:scale-90">+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
