
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Store, OrderMode, DriverLocationState, StoreCategory } from '../types';
import { getRoute } from '../services/routingService';

interface MapVisualizerProps {
  stores: Store[];
  userLat: number | null;
  userLng: number | null;
  userInitial?: string;
  userAccuracy?: number;
  isLiveGPS?: boolean;
  selectedStore: Store | null;
  onSelectStore: (store: Store) => void;
  className?: string;
  mode: OrderMode; 
  showRoute?: boolean;
  enableExternalNavigation?: boolean;
  onRequestLocation?: () => void;
  driverLocation?: DriverLocationState; 
}

export const MapVisualizer: React.FC<MapVisualizerProps> = ({ 
  stores, 
  userLat, 
  userLng, 
  userInitial = '👤',
  userAccuracy,
  isLiveGPS = false,
  selectedStore, 
  onSelectStore, 
  className = "h-48",
  mode,
  showRoute = false,
  enableExternalNavigation = false,
  onRequestLocation,
  driverLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const routeLineGlowRef = useRef<any>(null);
  
  const [isLocating, setIsLocating] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  
  const prevBoundsHash = useRef<string>("");

  const getEmojiForStore = (category: StoreCategory) => {
    switch(category) {
      case 'dairy': return '🥛';
      case 'vegetables':
      case 'fruits': return '🥬';
      case 'mini_mart': return '🏪';
      case 'super_mart': return '🏬';
      default: return '🏪';
    }
  };

  const getMarkerHtml = (category: StoreCategory, isSelected: boolean, storeName: string) => {
    const emoji = getEmojiForStore(category);
    const bgColor = isSelected ? 'bg-slate-900' : 'bg-white';
    const borderColor = isSelected ? 'border-brand-DEFAULT scale-110' : 'border-slate-200';
    const textColor = isSelected ? 'text-white' : 'text-slate-900';
    
    return `
      <div class="relative flex flex-col items-center justify-center transition-all duration-300">
         ${isSelected ? `<div class="absolute -top-12 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-xl whitespace-nowrap uppercase tracking-widest z-20 animate-bounce-soft">${storeName}</div>` : ''}
         <div class="${bgColor} w-10 h-10 rounded-[18px] flex items-center justify-center shadow-xl border-2 ${borderColor} transition-transform ${isSelected ? 'scale-110' : ''}">
            <span class="text-2xl leading-none select-none">${emoji}</span>
         </div>
      </div>
    `;
  };

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLocating(true);
    setFollowUser(true);
    if (onRequestLocation) onRequestLocation();
    if (userLat && userLng && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([userLat, userLng], 17, { animate: true });
    }
    setTimeout(() => setIsLocating(false), 1500);
  };

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [userLat || 12.9716, userLng || 77.5946],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });
    }

    const streetTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    
    if (!mapInstanceRef.current._tileLayer) {
      mapInstanceRef.current._tileLayer = L.tileLayer(streetTiles).addTo(mapInstanceRef.current);
    }

    if (userLat && userLng) {
      const userMarkerHtml = `
            <div class="relative flex flex-col items-center justify-center">
               <div class="relative flex items-center justify-center w-8 h-8">
                  <div class="absolute w-full h-full bg-emerald-500/20 rounded-full animate-ping"></div>
                  <div class="relative w-6 h-6 bg-white rounded-full border-2 border-emerald-500 shadow-lg flex items-center justify-center text-slate-900 text-[8px] font-black">
                     ${userInitial}
                  </div>
               </div>
            </div>
          `;

      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'user-marker',
          html: userMarkerHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
      } else {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      }

      if (userAccuracy) {
          if (!accuracyCircleRef.current) {
            accuracyCircleRef.current = L.circle([userLat, userLng], {
                radius: userAccuracy,
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.05,
                weight: 1,
                interactive: false
            }).addTo(mapInstanceRef.current);
          } else {
            accuracyCircleRef.current.setLatLng([userLat, userLng]);
            accuracyCircleRef.current.setRadius(userAccuracy);
          }
      }
    }

    if (driverLocation) {
        if (!driverMarkerRef.current) {
             const driverIcon = L.divIcon({
                 className: 'driver-marker',
                 html: `<div class="text-3xl animate-bounce-soft transform -scale-x-100">🛵</div>`,
                 iconSize: [32, 32],
                 iconAnchor: [16, 16]
             });
             driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon, zIndexOffset: 2000 }).addTo(mapInstanceRef.current);
        } else {
             driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
        }
    }

    markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];

    stores.forEach(store => {
        const isSelected = selectedStore?.id === store.id;
        const icon = L.divIcon({
            className: 'custom-marker',
            html: getMarkerHtml(store.store_type, isSelected, store.name),
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([store.lat, store.lng], { icon, zIndexOffset: isSelected ? 1000 : 100 }).on('click', (e: any) => {
            L.DomEvent.stopPropagation(e);
            onSelectStore(store);
        }).addTo(mapInstanceRef.current);

        markersRef.current.push(marker);
    });

    const boundsHash = JSON.stringify(stores.map(s => s.id)) + (selectedStore?.id || "") + (userLat || 0) + (userLng || 0);
    if (boundsHash !== prevBoundsHash.current && stores.length > 0 && mapInstanceRef.current) {
        const points: [number, number][] = stores.map(s => [s.lat, s.lng]);
        if (userLat && userLng) points.push([userLat, userLng]);
        const bounds = L.latLngBounds(points);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
        prevBoundsHash.current = boundsHash;
    }
  }, [stores, userLat, userLng, selectedStore, isLiveGPS, userInitial, userAccuracy, driverLocation, onSelectStore]);

  return (
    <div className={`relative ${className} bg-slate-100 overflow-hidden`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-2">
         <button 
           onClick={handleRecenter}
           className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center transition-all border border-slate-100 active:scale-90"
         >
           {isLocating ? (
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
             </svg>
           )}
         </button>
      </div>
    </div>
  );
};
