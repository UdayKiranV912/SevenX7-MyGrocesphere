
import React, { useEffect, useState } from 'react';
import { Product, Variant } from '../types';
import { generateProductDetails } from '../services/geminiService';
import { useStore } from '../contexts/StoreContext';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product, quantity: number, brand?: string, price?: number, variant?: Variant) => void;
  onUpdateDetails?: (id: string, details: Partial<Product>) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose, onAdd, onUpdateDetails }) => {
  const { cart, setCurrentView } = useStore();
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
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  const brands = product.brands || [{name: 'Generic', price: product.price}];
  const variants = product.variants || [];
  
  const currentBrand = brands[selectedBrandIndex];
  const basePrice = currentBrand.price;
  const variantMultiplier = variants.length > 0 ? variants[selectedVariantIndex].multiplier : 1;
  const finalPrice = Math.ceil(basePrice * variantMultiplier);
  const currentBrandName = currentBrand.name;
  const currentVariant = variants.length > 0 ? variants[selectedVariantIndex] : undefined;

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const renderValue = (val: any) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      try {
        return Object.entries(val)
          .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
          .join(', ');
      } catch (e) { return JSON.stringify(val); }
    }
    return String(val);
  };

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

  const handleAdd = () => {
    onAdd(product, quantity, currentBrandName, finalPrice, currentVariant);
  };

  const handleGoToCart = () => {
    onClose();
    setCurrentView('CART');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-[40px] shadow-2xl animate-slide-up overflow-hidden max-h-[96vh] flex flex-col border-t border-white/10">
        
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 py-2 flex justify-between items-center shrink-0">
            <button onClick={onClose} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors">✕</button>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quality Profile</span>
            <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pt-2 pb-64"> 
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner border-4 border-white mb-6 transform rotate-1 animate-float relative p-8">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-7xl">{product.emoji}</span>
                    )}
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">{product.name}</h2>
                <div className="flex items-center gap-4">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                        {product.category}
                    </span>
                    <span className="font-black text-2xl text-slate-900 tracking-tighter tabular-nums">₹{finalPrice}</span>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Product Description</h3>
                    {loading ? (
                        <div className="space-y-2">
                            <div className="h-2 bg-slate-200 rounded-full w-full animate-pulse" />
                            <div className="h-2 bg-slate-200 rounded-full w-4/5 animate-pulse" />
                        </div>
                    ) : (
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{renderValue(details.description)}</p>
                    )}
                </div>

                {brands.length > 1 && (
                    <div className="animate-fade-in">
                        <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3 block ml-2">Available Brands</label>
                        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
                            {brands.map((brand, idx) => (
                                <button key={idx} onClick={() => setSelectedBrandIndex(idx)} className={`px-5 py-3.5 rounded-2xl text-[11px] font-black transition-all border-2 whitespace-nowrap flex flex-col items-start min-w-[130px] ${selectedBrandIndex === idx ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'}`}>
                                  <span className="uppercase">{brand.name}</span>
                                  <span className={`text-[9px] mt-0.5 ${selectedBrandIndex === idx ? 'text-white/60' : 'text-slate-400'}`}>₹{brand.price}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {variants.length > 0 && (
                    <div className="animate-fade-in">
                        <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-3 block ml-2">Choose Size / Format</label>
                        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
                            {variants.map((v, idx) => (
                                <button key={idx} onClick={() => setSelectedVariantIndex(idx)} className={`px-5 py-4 rounded-2xl text-[11px] font-black transition-all border-2 whitespace-nowrap ${selectedVariantIndex === idx ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-900 border-slate-200'}`}>
                                  {v.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 pb-4">
                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                        <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Ingredients</h4>
                        <p className="text-[10px] font-black text-slate-800 leading-tight">{renderValue(details.ingredients) || 'Community Verified'}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                        <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Nutrition</h4>
                        <p className="text-[10px] font-black text-slate-800 leading-tight">{renderValue(details.nutrition) || 'Organic Standards'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0 shadow-[0_-15px_50px_rgba(0,0,0,0.1)] pb-12 z-[210]">
            {totalCartItems > 0 && (
              <div className="animate-slide-up mb-2">
                <button 
                  onClick={handleGoToCart}
                  className="w-full bg-emerald-500 text-white h-12 rounded-2xl flex items-center justify-between px-6 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-white text-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black animate-pulse">{totalCartItems}</span>
                    <span>View Shopping Cart</span>
                  </div>
                  <span className="tabular-nums">₹{totalCartValue} →</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex-1">
                    <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="w-11 h-11 bg-white rounded-xl shadow-sm text-xl font-black text-slate-900 active:scale-90 flex items-center justify-center border border-slate-100">−</button>
                    <span className="flex-1 text-center text-lg font-black text-slate-900 tabular-nums">{quantity}</span>
                    <button onClick={() => setQuantity(q => q+1)} className="w-11 h-11 bg-white rounded-xl shadow-sm text-xl font-black text-slate-900 active:scale-90 flex items-center justify-center border border-slate-100">+</button>
                </div>
                
                <button 
                    onClick={handleAdd}
                    className="flex-[2] h-14 bg-slate-900 text-white rounded-2xl font-black shadow-float active:scale-[0.98] transition-all flex justify-between items-center px-6"
                >
                    <span className="text-[10px] uppercase tracking-[0.2em]">Add to Basket</span>
                    <span className="text-lg font-black tracking-tighter tabular-nums border-l border-white/20 pl-4 ml-2">₹{finalPrice * quantity}</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
