
import React, { useEffect, useState } from 'react';
import { Product, Variant } from '../types';
import { generateProductDetails } from '../services/geminiService';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product, quantity: number, brand?: string, price?: number, variant?: Variant) => void;
  onUpdateDetails?: (id: string, details: Partial<Product>) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose, onAdd, onUpdateDetails }) => {
  const [details, setDetails] = useState<Partial<Product>>({
    description: product.description,
    ingredients: product.ingredients,
    nutrition: product.nutrition
  });
  
  const [loading, setLoading] = useState(!product.description || !product.ingredients || !product.nutrition);
  const [quantity, setQuantity] = useState(1);
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  const brands = product.brands || [{name: 'Generic', price: product.price}];
  const variants = product.variants || [];
  const basePrice = brands[selectedBrandIndex].price;
  const variantMultiplier = variants.length > 0 ? variants[selectedVariantIndex].multiplier : 1;
  const finalPrice = Math.ceil(basePrice * variantMultiplier);
  const currentBrandName = brands[selectedBrandIndex].name;
  const currentVariant = variants.length > 0 ? variants[selectedVariantIndex] : undefined;

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (!product.description || !product.ingredients || !product.nutrition) {
        setLoading(true);
        try {
          const generated = await generateProductDetails(product.name);
          if (isMounted) {
            setDetails(generated);
            setLoading(false);
            if (onUpdateDetails) onUpdateDetails(product.id, generated);
          }
        } catch (error) { if (isMounted) setLoading(false); }
      } else { setLoading(false); }
    };
    fetchDetails();
    return () => { isMounted = false; };
  }, [product, onUpdateDetails]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none sm:p-6 sm:items-center">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md animate-fade-in pointer-events-auto" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#F8FAFC] rounded-t-[40px] sm:rounded-[32px] shadow-2xl animate-slide-up overflow-hidden max-h-[94vh] flex flex-col pointer-events-auto border-t border-white/20">
        
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 py-3 flex justify-between items-center shrink-0">
            <button onClick={onClose} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">✕</button>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Details</span>
            <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pt-2 pb-56"> 
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-36 h-36 bg-white rounded-[40px] flex items-center justify-center text-7xl shadow-soft border-4 border-white mb-5 transform rotate-1">
                    {product.emoji}
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">{product.name}</h2>
                <div className="flex items-center gap-4">
                    <span className="bg-brand-light text-brand-dark px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-brand-DEFAULT/10">
                        {product.category}
                    </span>
                    <span className="font-black text-2xl text-slate-900 tracking-tighter">₹{finalPrice}</span>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-5 rounded-[28px] shadow-soft border border-slate-50">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">About</h3>
                    {loading ? (
                        <div className="space-y-2">
                            <div className="h-2 bg-slate-100 rounded-full w-full animate-pulse" />
                            <div className="h-2 bg-slate-100 rounded-full w-4/5 animate-pulse" />
                        </div>
                    ) : (
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{details.description}</p>
                    )}
                </div>

                {product.brands && product.brands.length > 0 && (
                    <div className="animate-fade-in">
                        <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3 block ml-2">Choose Brand</label>
                        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2">
                            {brands.map((brand, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => setSelectedBrandIndex(idx)} 
                                  className={`px-5 py-3.5 rounded-2xl text-[11px] font-black transition-all border-2 whitespace-nowrap flex flex-col items-start min-w-[120px] ${
                                      selectedBrandIndex === idx 
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                                      : 'bg-white text-slate-700 border-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  <span className="uppercase">{brand.name}</span>
                                  <span className={`text-[9px] mt-0.5 opacity-60`}>₹{brand.price}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {variants.length > 0 && (
                    <div className="animate-fade-in">
                        <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3 block ml-2">Select Quantity</label>
                        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2">
                            {variants.map((v, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => setSelectedVariantIndex(idx)} 
                                  className={`px-5 py-3.5 rounded-2xl text-[11px] font-black transition-all border-2 whitespace-nowrap ${
                                      selectedVariantIndex === idx 
                                      ? 'bg-brand-DEFAULT text-white border-brand-DEFAULT shadow-xl' 
                                      : 'bg-white text-slate-700 border-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  {v.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 p-4 rounded-[20px] border border-emerald-100/20">
                        <h4 className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Origin</h4>
                        <p className="text-[10px] font-black text-slate-700 leading-tight line-clamp-2">{details.ingredients || 'Verified Source'}</p>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-[20px] border border-blue-100/20">
                        <h4 className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Nutrition</h4>
                        <p className="text-[10px] font-black text-slate-700 leading-tight line-clamp-2">{details.nutrition || 'Balanced Grade'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-10 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-slate-100 flex flex-col gap-3 z-[210]">
            <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex-1">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q-1))} 
                      className="w-11 h-11 bg-white rounded-xl shadow-sm text-xl font-black text-slate-800 active:scale-90 flex items-center justify-center border border-slate-100"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-base font-black text-slate-900 tabular-nums">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => q+1)} 
                      className="w-11 h-11 bg-white rounded-xl shadow-sm text-xl font-black text-slate-800 active:scale-90 flex items-center justify-center border border-slate-100"
                    >
                      +
                    </button>
                </div>
                
                <button 
                    onClick={() => { onAdd(product, quantity, currentBrandName, finalPrice, currentVariant); onClose(); }}
                    className="flex-[2] h-14 bg-slate-900 text-white rounded-[22px] font-black shadow-float active:scale-[0.98] transition-all flex justify-between items-center px-6"
                >
                    <span className="text-[10px] uppercase tracking-[0.2em]">Add to Basket</span>
                    <span className="text-base tracking-tighter pl-4 border-l border-white/20">₹{finalPrice * quantity}</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
