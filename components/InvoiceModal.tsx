
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
  const handlingFee = order.splits?.handlingFee || 0;

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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in border border-white/20">
        
        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
            <div ref={contentRef} className="flex flex-col bg-white text-slate-900">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <div className="scale-75 origin-top-left">
                            <SevenX7Logo size="small" />
                        </div>
                        <h2 className="font-black text-xl text-slate-800 mt-1">Tax Invoice</h2>
                        <p className="text-[10px] font-mono text-slate-500 mt-1">INV-{order.id.toUpperCase().slice(-8)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Date</p>
                        <p className="text-xs font-bold text-slate-800">{new Date(order.date).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Status</p>
                        <p className="text-xs font-black text-green-600 uppercase">{order.paymentStatus}</p>
                    </div>
                </div>

                {/* Info & Items */}
                <div className="p-6 space-y-6">
                    {/* Store & Customer Info */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <p className="font-bold text-slate-500 uppercase text-[10px] mb-1">Bill To</p>
                            <p className="font-bold text-slate-900">Customer</p>
                            <p className="text-slate-600 mt-0.5 leading-tight">{order.deliveryAddress || 'Store Pickup'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-500 uppercase text-[10px] mb-1">Sold By</p>
                            <p className="font-bold text-slate-900">{order.storeName}</p>
                            <p className="text-slate-600 mt-0.5">Bengaluru, KA, India</p>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                                    <th className="py-2 font-black">Item</th>
                                    <th className="py-2 font-black text-center">Qty</th>
                                    <th className="py-2 font-black text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-3 pr-2">
                                            <p className="font-black text-slate-800 leading-tight">{item.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{item.selectedBrand}</p>
                                        </td>
                                        <td className="py-3 text-center font-bold text-slate-700">{item.quantity}</td>
                                        <td className="py-3 text-right font-black text-slate-900">₹{item.price * item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="border-t border-slate-200 pt-5 space-y-2.5">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>Taxable Value</span>
                            <span>₹{taxableValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>GST (5%)</span>
                            <span>₹{taxAmount.toFixed(2)}</span>
                        </div>
                        {deliveryFee > 0 && (
                            <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                <span>Delivery Fee</span>
                                <span>₹{deliveryFee.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-2xl font-black text-slate-900 pt-4 border-t border-slate-200 mt-3">
                            <span className="tracking-tight">Total</span>
                            <span className="tracking-tighter">₹{order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1">
                            <span>Paid via</span>
                            <span className="text-slate-900">{order.paymentMethod || 'Online'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Persistent Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 flex-shrink-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <button 
                onClick={onClose}
                className="flex-1 h-12 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-600 text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
                Close
            </button>
            <button 
                onClick={handlePrint}
                className="flex-[1.5] h-12 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-float active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PDF / Print
            </button>
        </div>
      </div>
    </div>
  );
};
