
import React, { useState } from 'react';
import { Product, Variant } from '../types';
import { useStore } from '../contexts/StoreContext';

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
  const [justAdded, setJustAdded] = useState(false);

  const hasMultipleBrands = product.brands && product.brands.length > 0;
  const hasVariants = product.variants && product.variants.length > 0;
  const isComplex = hasMultipleBrands || hasVariants;

  const markupFactor = 1.2 + (parseInt(product.id.replace(/\D/g, '')) % 3) * 0.1;
  const mrp = Math.ceil(product.price * markupFactor);
  const discount = Math.round(((mrp - product.price) / mrp) * 100);

  const handleQuickAddClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isComplex) {
          setShowQuickSelect(true);
      } else {
          onAdd(product);
          triggerAddEffect();
      }
  };

  const triggerAddEffect = () => {
    setJustAdded(true);
    if ('vibrate' in navigator) navigator.vibrate(15);
    setTimeout(() => setJustAdded(false), 400);
  };

  const handleVariantSelect = (e: React.MouseEvent, variant: Variant) => {
      e.stopPropagation();
      const defaultBrand = product.brands?.[0];
      const basePrice = defaultBrand ? defaultBrand.price : product.price;
      const brandName = defaultBrand ? defaultBrand.name : 'Generic';
      const finalPrice = Math.ceil(basePrice * variant.multiplier);
      onAdd(product, 1, brandName, finalPrice, variant);
      setShowQuickSelect(false);
      triggerAddEffect();
  };

  const handleBrandSelect = (e: React.MouseEvent, brand: {name: string, price: number}) => {
      e.stopPropagation();
      onAdd(product, 1, brand.name, brand.price);
      setShowQuickSelect(false);
      triggerAddEffect();
  };

  return (
    <div 
      className={`group relative bg-white rounded-[28px] p-3.5 flex flex-col shadow-soft transition-all duration-500 active:scale-[0.97] cursor-pointer border-2 ${count > 0 ? 'border-emerald-500/50 shadow-soft-xl' : 'border-transparent'} ${justAdded ? 'scale-105' : 'scale-100'}`}
      onClick={() => onClick(product)}
    >
      {/* Quick Select Overlay */}
      {showQuickSelect && (
         <div 
            className="absolute inset-0 bg-white/98 backdrop-blur-xl z-[60] rounded-[28px] p-4 flex flex-col animate-scale-in border-2 border-emerald-500 shadow-2xl overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
         >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 shrink-0">
               <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                  Choose Format
               </span>
               <button onClick={() => setShowQuickSelect(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs active:scale-90 transition-transform">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2.5">
               {hasVariants ? (
                  product.variants?.map((v, i) => (
                      <button key={i} onClick={(e) => handleVariantSelect(e, v)} className="w-full flex justify-between items-center p-4 rounded-2xl bg-slate-50 hover:bg-emerald-500 hover:text-white transition-all border border-slate-100 active:scale-95 text-left">
                          <span className="text-[10px] font-black uppercase tracking-tight">{v.name}</span>
                          <span className="text-[10px] font-black tabular-nums">₹{Math.ceil((product.brands?.[0]?.price || product.price) * v.multiplier)}</span>
                      </button>
                  ))
               ) : (
                  product.brands?.map((b, i) => (
                      <button key={i} onClick={(e) => handleBrandSelect(e, b)} className="w-full flex justify-between items-center p-4 rounded-2xl bg-slate-50 hover:bg-emerald-500 hover:text-white transition-all border border-slate-100 active:scale-95 text-left">
                          <span className="text-[10px] font-black uppercase tracking-tight">{b.name}</span>
                          <span className="text-[10px] font-black tabular-nums">₹{b.price}</span>
                      </button>
                  ))
               )}
            </div>
         </div>
       )}

      <div className="absolute top-2.5 left-2.5 bg-slate-900 text-white text-[8px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm">
          {discount}% OFF
      </div>

      <div className="relative aspect-square mb-4 rounded-[24px] bg-slate-50/80 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
        <div className={`text-6xl transform transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] emoji-3d ${count > 0 ? 'scale-110 rotate-3' : ''}`}>
          {product.emoji}
        </div>
        
        {count > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-black w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 animate-scale-in">
            {count}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div className="mb-2">
          <h3 className="font-black text-slate-900 text-[11px] leading-[1.3] line-clamp-2 mb-1">{product.name}</h3>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">{product.category}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 line-through mb-0.5 font-bold">₹{mrp}</span>
              <span className="font-black text-slate-900 text-[15px] tracking-tighter tabular-nums">₹{product.price}</span>
          </div>
          
          <div className="h-9">
            {count === 0 ? (
              <button 
                onClick={handleQuickAddClick} 
                className="px-4 h-full rounded-xl bg-slate-900 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-90 font-black text-[9px] uppercase tracking-[0.15em]"
              >
                <span>Add</span>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              </button>
            ) : (
              <div className="flex items-center bg-slate-900 rounded-xl p-0.5 h-full shadow-lg animate-scale-in border border-white/10 ring-2 ring-emerald-500/20">
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, -1); }} 
                    className="w-7 h-full flex items-center justify-center text-white rounded-lg font-black text-lg active:scale-90 transition-transform"
                >
                    −
                </button>
                <div className="w-5 text-center text-white font-black text-[10px] tabular-nums">{count}</div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, 1); triggerAddEffect(); }} 
                    className="w-7 h-full flex items-center justify-center text-white rounded-lg font-black text-lg active:scale-90 transition-transform"
                >
                    +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
