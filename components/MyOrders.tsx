
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
  const { orders, driverLocations } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Modal States
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

  const handleRatingSubmit = (rating: number, comment: string) => {
      console.log(`Rating submitted: ${rating} stars`);
      alert("Thank you for your feedback!");
  };

  const handleNavigate = (lat: number, lng: number) => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
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
         <h2 className="font-black text-slate-800 text-2xl">My Orders</h2>
      </div>
      
      {orders.map((order, idx) => {
        const isLive = order.status === 'On the way';
        const isExpanded = expandedOrderId === order.id || (idx === 0 && !expandedOrderId && isLive);
        const isCompleted = order.status === 'Delivered' || order.status === 'Picked Up';
        const isCancelled = order.status === 'Cancelled';
        
        let badgeColor = 'bg-blue-100 text-blue-700';
        if (isCompleted) badgeColor = 'bg-green-100 text-green-700';
        if (isCancelled) badgeColor = 'bg-red-100 text-red-700';
        if (order.status === 'Pending') badgeColor = 'bg-yellow-100 text-yellow-700';

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
            className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-all active:scale-[0.99] animate-slide-up ${isExpanded ? 'ring-2 ring-brand-light' : ''}`}
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
          >
            <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                    <h3 className="font-bold text-slate-900 text-sm">{order.storeName}</h3>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(order.date).toLocaleDateString()} • ₹{order.total}</span>
                    {etaText && <span className="text-[10px] font-bold text-emerald-600 mt-0.5">{etaText}</span>}
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${badgeColor}`}>
                   {order.status}
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
                {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm border border-slate-100 shrink-0">
                        {item.emoji}
                    </div>
                ))}
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-50 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    {!isCancelled && !isCompleted && order.storeLocation && (
                        <div className="mb-4">
                            <div className="h-44 rounded-xl overflow-hidden border border-slate-100 relative shadow-inner">
                                <MapVisualizer
                                    stores={[mapStore]}
                                    selectedStore={mapStore}
                                    userLat={userLocation?.lat || 0}
                                    userLng={userLocation?.lng || 0}
                                    mode={order.mode}
                                    onSelectStore={() => {}}
                                    showRoute={true}
                                    className="h-full"
                                    driverLocation={isLive ? driverLocations[order.id] : undefined}
                                    enableExternalNavigation={false} 
                                />
                                {isLive && (
                                    <div className="absolute top-2 left-2 bg-slate-900 text-white px-2 py-1 rounded-lg text-[8px] font-black shadow-lg z-[1000] animate-pulse">
                                        ● TRACKING DRIVER
                                    </div>
                                )}
                            </div>
                            
                            {/* Navigation Actions */}
                            <div className="grid grid-cols-1 gap-2 mt-3">
                                {order.mode === 'PICKUP' ? (
                                    <button 
                                        onClick={() => handleNavigate(order.storeLocation!.lat, order.storeLocation!.lng)}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                                    >
                                        <span>📍</span> Navigate to Store
                                    </button>
                                ) : (
                                    isLive && driverLocations[order.id] && (
                                        <button 
                                            onClick={() => handleNavigate(order.storeLocation!.lat, order.storeLocation!.lng)}
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                                        >
                                            <span>🏪</span> View Store on Google Maps
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                                <span className="font-medium text-slate-600">{item.quantity} x {item.name}</span>
                                <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-100 mb-4">
                        <span className="font-bold text-xs text-slate-500">Total Bill</span>
                        <span className="font-black text-sm text-slate-900">₹{order.total}</span>
                    </div>

                    {isCompleted && (
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setSelectedRatingOrder(order)}
                                className="py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                            >
                                ⭐ Rate Order
                            </button>
                            <button 
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-soft"
                            >
                                📄 Invoice
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        );
      })}

      {selectedInvoiceOrder && <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />}
      {selectedRatingOrder && <OrderRatingModal order={selectedRatingOrder} onClose={() => setSelectedRatingOrder(null)} onSubmit={handleRatingSubmit} />}
    </div>
  );
};
