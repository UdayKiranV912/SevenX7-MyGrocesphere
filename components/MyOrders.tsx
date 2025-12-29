
import React, { useState } from 'react';
import { Order, Store } from '../types';
import { MapVisualizer } from './MapVisualizer';
import { InvoiceModal } from './InvoiceModal';
import { OrderRatingModal } from './OrderRatingModal';
import { useStore } from '../contexts/StoreContext';

interface MyOrdersProps {
  userLocation: { lat: number; lng: number } | null;
  onPayNow?: (order: Order) => void;
  userId?: string;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ userLocation, onPayNow }) => {
  const { orders, driverLocations, user, updateOrderStatus, setOrders } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<Order | null>(null);

  const getExpectedTime = (orderDate: string, status: Order['status']) => {
      if (status === 'Cancelled') return null;
      const date = new Date(orderDate);
      if (status === 'Delivered' || status === 'Picked Up') {
           date.setMinutes(date.getMinutes() + 45);
           return `Completed at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      date.setMinutes(date.getMinutes() + 45);
      return `Arriving by ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleFinalizePickup = (orderId: string) => {
    if (confirm("Have you paid at the store and received your items?")) {
        updateOrderStatus(orderId, 'Picked Up');
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: 'PAID' } : o));
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6 animate-fade-in">
        <div className="text-6xl mb-4 opacity-50">🧾</div>
        <h3 className="text-xl font-black text-slate-800">No Past Orders</h3>
        <p className="text-slate-400 mt-2 text-sm">Your order history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="pb-32 px-4 space-y-4 pt-6">
      <div className="flex items-center justify-between px-2">
         <h2 className="font-black text-slate-800 text-2xl uppercase tracking-tighter">My Orders</h2>
      </div>
      
      {orders.map((order, idx) => {
        const isLiveDelivery = order.status === 'On the way';
        const isReadyForPickup = order.status === 'Ready' && order.mode === 'PICKUP';
        const isExpanded = expandedOrderId === order.id || (idx === 0 && !expandedOrderId && (isLiveDelivery || isReadyForPickup));
        const isCompleted = order.status === 'Delivered' || order.status === 'Picked Up';
        const isCancelled = order.status === 'Cancelled';
        const isPop = order.paymentMethod?.includes('POP') || order.paymentStatus === 'PENDING';
        
        let badgeColor = 'bg-blue-100 text-blue-700';
        if (isCompleted) badgeColor = 'bg-green-100 text-green-700';
        if (isCancelled) badgeColor = 'bg-red-100 text-red-700';
        if (order.status === 'Pending') badgeColor = 'bg-yellow-100 text-yellow-700';
        if (order.status === 'Ready') badgeColor = 'bg-emerald-100 text-emerald-700 animate-pulse';

        const mapStore: Store = {
            id: `order-store-${order.id}`,
            name: order.storeName || 'Store',
            lat: order.storeLocation?.lat || 0,
            lng: order.storeLocation?.lng || 0,
            address: '', rating: 0, distance: '', isOpen: true, type: 'general', 
            store_type: order.order_type || 'grocery',
            availableProductIds: [] as string[]
        };
        
        const etaText = getExpectedTime(order.date, order.status);

        return (
          <div 
            key={order.id} 
            className={`bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 transition-all active:scale-[0.99] animate-slide-up ${isExpanded ? 'ring-2 ring-emerald-500/20 shadow-soft-xl' : ''}`}
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
          >
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h3 className="font-black text-slate-900 text-[12px] uppercase tracking-widest">{order.storeName}</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">₹{order.total} • {order.mode} • {new Date(order.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${badgeColor}`}>
                   {order.status}
                </div>
            </div>

            <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1">
                {order.items.slice(0, 5).map((item, i) => {
                    return (
                        <div key={i} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl border border-slate-100 shrink-0 shadow-inner overflow-hidden p-2">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                            ) : (
                                item.emoji
                            )}
                        </div>
                    );
                })}
                {order.items.length > 5 && (
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 border border-slate-900">
                        +{order.items.length - 5}
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="mt-6 pt-5 border-t border-slate-100 animate-fade-in space-y-5" onClick={(e) => e.stopPropagation()}>
                    {isReadyForPickup && isPop && (
                        <div className="bg-emerald-50 rounded-[28px] p-6 border-2 border-dashed border-emerald-200 text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl mx-auto shadow-sm border border-emerald-100">🏪</div>
                            <div>
                                <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Ready for Collection</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Order Ref: <span className="text-emerald-600 font-black">{order.id.slice(-6)}</span></p>
                            </div>
                            
                            <div className="bg-white p-5 rounded-3xl shadow-inner flex flex-col items-center border border-emerald-100/50">
                                <div className="w-32 h-32 bg-slate-50 rounded-2xl flex items-center justify-center text-5xl mb-3 grayscale opacity-40">
                                    QR
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Scan at counter to pay</p>
                            </div>

                            <button 
                                onClick={() => handleFinalizePickup(order.id)}
                                className="w-full py-5 bg-slate-900 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                            >
                                Confirm Pickup & Pay
                            </button>
                        </div>
                    )}

                    {!isCancelled && !isCompleted && !isReadyForPickup && order.storeLocation && (
                        <div className="space-y-4">
                            <div className="h-64 rounded-[28px] overflow-hidden border border-slate-100 relative shadow-soft isolate bg-slate-50">
                                <MapVisualizer
                                    stores={[mapStore]}
                                    selectedStore={mapStore}
                                    userLat={userLocation?.lat || 0}
                                    userLng={userLocation?.lng || 0}
                                    userInitial={user.name?.charAt(0) || '👤'}
                                    userAccuracy={user.accuracy}
                                    mode={order.mode}
                                    onSelectStore={() => {}}
                                    showRoute={true}
                                    className="h-full"
                                    driverLocation={isLiveDelivery ? driverLocations[order.id] : undefined}
                                />
                                {!isLiveDelivery && (
                                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                        <div className="bg-white/90 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-white">
                                            {order.status === 'Preparing' ? '🍴 Chef is Packing...' : '⏳ Processing Order'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 space-y-3">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Itemized Summary</h4>
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center group">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 w-5 h-5 rounded flex items-center justify-center">{item.quantity}</span>
                                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[180px]">{item.name}</span>
                                </div>
                                <span className="text-[11px] font-black text-slate-900 tabular-nums">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-slate-200 mt-2 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
                            <span className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">₹{order.total}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                        {isCompleted ? (
                            <>
                                <button 
                                    onClick={() => setSelectedRatingOrder(order)}
                                    className="py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    ⭐ Rate
                                </button>
                                <button 
                                    onClick={() => setSelectedInvoiceOrder(order)}
                                    className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                                >
                                    📄 Invoice
                                </button>
                            </>
                        ) : (
                            !isReadyForPickup && (
                                <button 
                                    className="col-span-2 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed border border-slate-200"
                                >
                                    Order ID: {order.id.slice(-8)}
                                </button>
                            )
                        )}
                    </div>
                </div>
            )}
          </div>
        );
      })}

      {selectedInvoiceOrder && <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />}
      {selectedRatingOrder && <OrderRatingModal order={selectedRatingOrder} onClose={() => setSelectedRatingOrder(null)} onSubmit={() => {}} />}
    </div>
  );
};
