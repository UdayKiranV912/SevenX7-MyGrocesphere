
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
      className={`group relative bg-white rounded-[20px] p-3 flex flex-col shadow-soft transition-all duration-500 active:scale-[0.97] cursor-pointer border-2 ${count > 0 ? 'border-brand-DEFAULT shadow-soft-xl' : 'border-transparent'}`}
      onClick={() => onClick(product)}
    >
      {/* Quick Select Overlay */}
      {showQuickSelect && (
         <div 
            className="absolute inset-0 bg-white/98 backdrop-blur-xl z-[60] rounded-[20px] p-3 flex flex-col animate-scale-in border-2 border-brand-DEFAULT shadow-2xl overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
         >
            <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100 shrink-0">
               <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                  {hasVariants ? 'Select Size' : 'Select Brand'}
               </span>
               <button onClick={() => setShowQuickSelect(false)} className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-[10px]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1.5">
               {hasVariants ? (
                  product.variants?.map((v, i) => (
                      <button key={i} onClick={(e) => handleVariantSelect(e, v)} className="w-full flex justify-between items-center p-2.5 rounded-xl bg-slate-50 hover:bg-brand-DEFAULT hover:text-white transition-all border border-slate-100/50 active:scale-95">
                          <span className="text-[10px] font-bold">{v.name}</span>
                          <span className="text-[10px] font-black">₹{Math.ceil((product.brands?.[0]?.price || product.price) * v.multiplier)}</span>
                      </button>
                  ))
               ) : (
                  product.brands?.map((b, i) => (
                      <button key={i} onClick={(e) => handleBrandSelect(e, b)} className="w-full flex justify-between items-center p-2.5 rounded-xl bg-slate-50 hover:bg-brand-DEFAULT hover:text-white transition-all border border-slate-100/50 active:scale-95">
                          <span className="text-[10px] font-bold">{b.name}</span>
                          <span className="text-[10px] font-black">₹{b.price}</span>
                      </button>
                  ))
               )}
            </div>
         </div>
       )}

      <div className="absolute top-1.5 left-1.5 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full z-10 shadow-sm">
          {discount}% OFF
      </div>

      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(product.id); }} className="absolute top-1 right-1 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90">
        <span className={`text-xl ${isFavorite ? 'drop-shadow-sm' : 'grayscale opacity-20'}`}>
            {isFavorite ? '❤️' : '🤍'}
        </span>
      </button>

      <div className="relative aspect-square mb-2.5 rounded-[18px] bg-slate-50/50 flex items-center justify-center overflow-hidden">
        <div className={`text-6xl transform transition-all duration-700 ease-out emoji-3d ${count > 0 ? 'scale-110' : ''}`}>
          {product.emoji}
        </div>
        {count > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-brand-DEFAULT text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white z-10">
            {count}
          </div>
        )}
        {isComplex && count === 0 && (
           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-0.5 rounded-full text-[8px] font-black text-slate-500 shadow-sm border border-white/50 whitespace-nowrap uppercase tracking-tighter">
               Options
           </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-black text-slate-800 text-[11px] leading-tight line-clamp-2 mb-0.5">{product.name}</h3>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</p>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex flex-col leading-none">
              <span className="text-[8px] text-slate-400 line-through mb-0.5">₹{mrp}</span>
              <span className="font-black text-slate-900 text-lg tracking-tighter">₹{product.price}</span>
          </div>
          
          <div className="h-9 flex items-center">
            {count === 0 ? (
              <button onClick={handleQuickAddClick} className="px-3.5 h-9 rounded-xl bg-slate-900 text-white hover:bg-brand-DEFAULT transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-90 font-black text-[9px] uppercase tracking-wider">
                <span>Add</span>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              </button>
            ) : (
              <div className="flex items-center bg-slate-900 rounded-xl p-0.5 h-9 shadow-md animate-scale-in border border-white/10">
                <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, -1); }} className="w-8 h-full flex items-center justify-center text-white hover:bg-white/10 rounded-lg font-black text-lg active:scale-90">−</button>
                <div className="w-6 text-center text-white font-black text-[10px]">{count}</div>
                <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, 1); }} className="w-8 h-full flex items-center justify-center text-white hover:bg-white/10 rounded-lg font-black text-lg active:scale-90">+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
