
import React, { useRef, useEffect } from 'react';
import { Order } from '../types';
import SevenX7Logo from './SevenX7Logo';

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Background Scroll Lock
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxRate = 0.05; // 5% GST
  const taxableValue = subtotal / (1 + taxRate);
  const taxAmount = subtotal - taxableValue;
  
  const deliveryFee = order.splits?.deliveryFee || 0;

  const handlePrint = () => {
      const content = contentRef.current;
      if (!content) return;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
          alert("Please allow popups to download the invoice.");
          return;
      }

      const tailwindConfig = `
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                brand: {
                  light: '#ecfdf5',
                  DEFAULT: '#10b981',
                  medium: '#059669',
                  dark: '#047857',
                  accent: '#84cc16',
                },
                slate: {
                  50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 
                  400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 
                  800: '#1e293b', 900: '#0f172a'
                }
              }
            }
          }
        }
      `;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice-${order.id.toUpperCase().slice(-5)}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
              ${tailwindConfig}
            </script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lexend:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
              body { 
                font-family: 'Inter', sans-serif; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                padding: 40px;
                background-color: white;
              }
              @page { size: A4; margin: 0; }
              ::-webkit-scrollbar { display: none; }
            </style>
          </head>
          <body>
            ${content.innerHTML}
            <script>
              setTimeout(() => {
                window.print();
              }, 800);
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 isolate">
      {/* Backdrop with higher z-index to mask app nav */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in border border-white/20">
        
        {/* Header Indicator */}
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0 bg-white">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
            <div ref={contentRef} className="flex flex-col bg-white text-slate-900 pb-8">
                {/* Invoice Meta */}
                <div className="p-6 pb-2 flex justify-between items-start">
                    <div>
                        <div className="scale-90 origin-top-left grayscale mb-3">
                            <SevenX7Logo size="small" />
                        </div>
                        <h2 className="font-black text-2xl text-slate-900 tracking-tight">Tax Invoice</h2>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">INV-{order.id.toUpperCase().slice(-8)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                           {order.paymentStatus}
                        </span>
                    </div>
                </div>

                <div className="px-6 py-4 flex justify-between text-xs border-y border-slate-50 bg-slate-50/30 mt-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Issued On</p>
                        <p className="font-bold text-slate-900">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                        <p className="font-bold text-slate-900 uppercase tracking-tighter">{order.mode}</p>
                    </div>
                </div>

                {/* Info & Items */}
                <div className="p-6 space-y-8">
                    {/* Store & Customer Info */}
                    <div className="grid grid-cols-2 gap-8 text-xs">
                        <div>
                            <p className="font-black text-slate-400 uppercase text-[9px] mb-2 tracking-widest">Bill To</p>
                            <p className="font-black text-slate-900 text-sm">Customer</p>
                            <p className="text-slate-500 mt-1 leading-relaxed">{order.deliveryAddress || 'Verified Store Pickup'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-slate-400 uppercase text-[9px] mb-2 tracking-widest">Sold By</p>
                            <p className="font-black text-slate-900 text-sm">{order.storeName}</p>
                            <p className="text-slate-500 mt-1">Local Mart Partner<br/>Bengaluru, IN</p>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="pt-2">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-widest">
                                    <th className="pb-3 font-black">Particulars</th>
                                    <th className="pb-3 font-black text-center">Qty</th>
                                    <th className="pb-3 font-black text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4 pr-2">
                                            <p className="font-black text-slate-900 leading-tight">{item.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{item.selectedBrand}</p>
                                        </td>
                                        <td className="py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                                        <td className="py-4 text-right font-black text-slate-900 tabular-nums">₹{item.price * item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span className="uppercase tracking-widest">Taxable Value</span>
                            <span className="tabular-nums">₹{taxableValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span className="uppercase tracking-widest">GST (5% Integrated)</span>
                            <span className="tabular-nums">₹{taxAmount.toFixed(2)}</span>
                        </div>
                        {deliveryFee > 0 && (
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span className="uppercase tracking-widest">Service Fee</span>
                                <span className="tabular-nums">₹{deliveryFee.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-5 border-t border-slate-200 mt-2">
                            <span className="font-black text-[11px] uppercase tracking-widest text-slate-900">Total Payable</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] pt-4">
                        <span className="w-8 h-[1px] bg-slate-100"></span>
                        <span>Official Receipt</span>
                        <span className="w-8 h-[1px] bg-slate-100"></span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3 shrink-0 z-10">
            <button 
                onClick={onClose}
                className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-500 text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
                Close
            </button>
            <button 
                onClick={handlePrint}
                className="flex-[1.5] h-12 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                PDF / Print
            </button>
        </div>
      </div>
    </div>
  );
};
