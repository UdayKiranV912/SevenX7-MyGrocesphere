
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
            className={`bg-white rounded-3xl p-4 shadow-sm border border-slate-100 transition-all active:scale-[0.99] animate-slide-up ${isExpanded ? 'ring-2 ring-emerald-500/20' : ''}`}
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
          >
            <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                    <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-widest">{order.storeName}</h3>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">₹{order.total} • {order.mode}</span>
                    {etaText && <span className="text-[10px] font-bold text-emerald-600 mt-1">{etaText}</span>}
                </div>
                <div className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${badgeColor}`}>
                   {order.status}
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
                {order.items.slice(0, 5).map((item, i) => {
                    return (
                        <div key={i} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg border border-slate-100 shrink-0 shadow-inner overflow-hidden">
                            {item.emoji}
                        </div>
                    );
                })}
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    {isReadyForPickup && isPop && (
                        <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-dashed border-emerald-200 mb-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl mx-auto shadow-sm border border-emerald-100">🏪</div>
                            <div>
                                <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Ready for Collection</h4>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Token: <span className="text-emerald-600">{order.id.slice(-6)}</span></p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-2xl shadow-inner flex flex-col items-center">
                                <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-4xl mb-2 grayscale opacity-30">
                                    QR
                                </div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Show this at the counter</p>
                            </div>

                            <button 
                                onClick={() => handleFinalizePickup(order.id)}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                            >
                                Confirm Pickup & Pay
                            </button>
                        </div>
                    )}

                    {!isCancelled && !isCompleted && !isReadyForPickup && order.storeLocation && (
                        <div className="mb-4">
                            <div className="h-44 rounded-[28px] overflow-hidden border border-slate-100 relative shadow-inner isolate">
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
                                {isLiveDelivery && (
                                    <div className="absolute top-3 left-3 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[8px] font-black shadow-xl z-[1000] animate-pulse uppercase tracking-[0.2em]">
                                        Tracking Delivery
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2.5 px-1">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-xs overflow-hidden">
                                        {item.emoji}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{item.quantity} x {item.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-900 tabular-nums">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100 mb-6 px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Total</span>
                        <span className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">₹{order.total}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {isCompleted ? (
                            <>
                                <button 
                                    onClick={() => setSelectedRatingOrder(order)}
                                    className="py-4 bg-slate-100 text-slate-700 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                >
                                    ⭐ Rate
                                </button>
                                <button 
                                    onClick={() => setSelectedInvoiceOrder(order)}
                                    className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                                >
                                    📄 Invoice
                                </button>
                            </>
                        ) : (
                            !isReadyForPickup && (
                                <button 
                                    className="col-span-2 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest cursor-not-allowed"
                                >
                                    Help & Support
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
