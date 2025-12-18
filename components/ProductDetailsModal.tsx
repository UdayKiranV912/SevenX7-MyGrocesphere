
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none sm:p-6 sm:items-center">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fade-in pointer-events-auto" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#F8FAFC] rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] flex flex-col pointer-events-auto border-t border-white/20">
        
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 sm:px-6 pb-28">
            <div className="flex flex-col items-center text-center pt-1 pb-6">
                <div className="w-28 h-28 bg-white rounded-[32px] flex items-center justify-center text-7xl shadow-soft border-4 border-white mb-4 transform rotate-1">
                    {product.emoji}
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-1.5">{product.name}</h2>
                <div className="flex items-center gap-2">
                    <div className="bg-brand-light text-brand-dark px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                        {product.category}
                    </div>
                    <div className="font-black text-xl text-slate-900 tracking-tighter">₹{finalPrice}</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-5 rounded-[24px] shadow-soft border border-slate-50">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Product Notes</h3>
                    {loading ? (
                        <div className="space-y-2.5">
                            <div className="h-2.5 bg-slate-100 rounded-full w-full animate-pulse" />
                            <div className="h-2.5 bg-slate-100 rounded-full w-5/6 animate-pulse" />
                        </div>
                    ) : (
                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed">{details.description}</p>
                    )}
                </div>

                <div className="space-y-3">
                    {variants.length > 0 && (
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Size</label>
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                {variants.map((v, idx) => (
                                    <button key={idx} onClick={() => setSelectedVariantIndex(idx)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 whitespace-nowrap ${selectedVariantIndex === idx ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-100'}`}>{v.name}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {product.brands && product.brands.length > 0 && (
                        <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Brand</label>
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                {brands.map((brand, idx) => (
                                    <button key={idx} onClick={() => setSelectedBrandIndex(idx)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 whitespace-nowrap ${selectedBrandIndex === idx ? 'bg-brand-DEFAULT text-white border-brand-DEFAULT shadow-md' : 'bg-white text-slate-500 border-slate-100'}`}>{brand.name}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 p-4 rounded-[20px] border border-emerald-100/50">
                        <h4 className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Source</h4>
                        <p className="text-[10px] font-black text-slate-800 leading-tight">{details.ingredients || 'Natural'}</p>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-[20px] border border-blue-100/50">
                        <h4 className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5">Info</h4>
                        <p className="text-[10px] font-black text-slate-800 leading-tight">{details.nutrition || 'Standard'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center gap-3 z-20 shadow-soft">
            <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="w-10 h-10 bg-white rounded-lg shadow-sm text-xl font-black text-slate-700 active:scale-90 flex items-center justify-center">−</button>
                <span className="text-base font-black text-slate-900 w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q+1)} className="w-10 h-10 bg-white rounded-lg shadow-sm text-xl font-black text-slate-700 active:scale-90 flex items-center justify-center">+</button>
            </div>
            
            <button 
                onClick={() => { onAdd(product, quantity, currentBrandName, finalPrice, currentVariant); onClose(); }}
                className="flex-1 h-12 bg-slate-900 text-white rounded-[16px] font-black shadow-float active:scale-[0.98] transition-all flex justify-center items-center gap-2 text-[10px] uppercase tracking-[0.2em]"
            >
                Add To Cart <span className="w-px h-3 bg-white/20 mx-1" /> ₹{finalPrice * quantity}
            </button>
        </div>
      </div>
    </div>
  );
};
