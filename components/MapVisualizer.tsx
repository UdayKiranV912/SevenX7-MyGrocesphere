
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Store, OrderMode, DriverLocationState } from '../types';
import { getRoute, calculateHaversineDistance, AVG_DELIVERY_SPEED_MPS } from '../services/routingService';

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

  const getMarkerHtml = (type: Store['type'], isSelected: boolean, storeName: string) => {
    const emoji = type === 'produce' ? '🥦' : type === 'dairy' ? '🥛' : '🏪';
    const bgColor = type === 'produce' ? 'bg-emerald-500' : type === 'dairy' ? 'bg-blue-500' : 'bg-slate-900';
    const borderColor = isSelected ? 'border-brand-accent scale-110 shadow-emerald-500/40' : 'border-white';
    
    if (isSelected) {
        return `
          <div class="relative flex flex-col items-center justify-center transition-all duration-500 z-50">
             <div class="absolute -top-14 bg-slate-900 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-white/20 uppercase tracking-widest z-[60] animate-bounce-soft">
                ${storeName}
             </div>
             <div class="${bgColor} w-14 h-14 rounded-[22px] flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.3)] border-[3px] ${borderColor} z-20 transform -translate-y-8">
                <span class="text-3xl leading-none select-none filter drop-shadow-md">${emoji}</span>
             </div>
             <div class="w-2.5 h-2.5 bg-slate-900 rounded-full mt-[-24px] shadow-lg border-2 border-white ring-4 ring-slate-900/10"></div>
          </div>
        `;
    }

    return `
      <div class="relative flex items-center justify-center transition-all duration-300 hover:scale-125 hover:z-50 group">
         <div class="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-white text-slate-900 text-[8px] font-black px-2 py-1 rounded-lg shadow-xl border border-slate-100 z-20 whitespace-nowrap uppercase tracking-widest">
            ${storeName}
         </div>
         <div class="${bgColor} w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white opacity-95 group-hover:opacity-100 group-hover:shadow-xl">
            <span class="text-xl leading-none select-none">${emoji}</span>
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
        mapInstanceRef.current.flyTo([userLat, userLng], 17.5, { 
            animate: true, 
            duration: 1.2,
            easeLinearity: 0.2
        });
    }
    setTimeout(() => setIsLocating(false), 2000);
  };

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [userLat || 12.9716, userLng || 77.5946],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.1,
        fadeAnimation: true
      });

      mapInstanceRef.current.on('movestart', (e: any) => {
          if (!isLocating && e.hard === undefined) {
             setFollowUser(false);
          }
      });
    }

    const streetTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    
    if (!mapInstanceRef.current._tileLayer) {
      mapInstanceRef.current._tileLayer = L.tileLayer(streetTiles, {
          maxZoom: 21,
          className: 'map-tiles-custom'
      }).addTo(mapInstanceRef.current);
    }

    if (userLat && userLng) {
      const userMarkerHtml = `
            <div class="relative flex flex-col items-center justify-center">
               <div class="absolute -top-10 bg-slate-900 text-white text-[7px] font-black px-2 py-1 rounded-lg shadow-2xl whitespace-nowrap border border-white/20 uppercase tracking-[0.2em] z-[60] flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full ${isLiveGPS ? 'animate-ping' : ''}"></span> Destination
               </div>
               <div class="relative flex items-center justify-center w-10 h-10">
                  <div class="absolute w-full h-full bg-emerald-500/10 rounded-full animate-ping"></div>
                  <div class="relative w-7 h-7 bg-white rounded-full border-[2.5px] border-emerald-500 shadow-xl flex items-center justify-center text-slate-900 text-[10px] font-black">
                     ${userInitial}
                  </div>
               </div>
            </div>
          `;

      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'user-marker-refined',
          html: userMarkerHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        userMarkerRef.current = L.marker([userLat, userLng], { 
            icon: userIcon, 
            zIndexOffset: 1000 
        }).addTo(mapInstanceRef.current);
      } else {
        userMarkerRef.current.setLatLng([userLat, userLng]);
        userMarkerRef.current.setIcon(L.divIcon({
          className: 'user-marker-refined',
          html: userMarkerHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        }));
      }

      if (userAccuracy) {
          if (!accuracyCircleRef.current) {
            accuracyCircleRef.current = L.circle([userLat, userLng], {
                radius: userAccuracy,
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.05,
                weight: 1,
                dashArray: '5, 5',
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
                 className: 'driver-marker-live',
                 html: `
                    <div class="relative flex flex-col items-center justify-center">
                       <div class="absolute inset-0 w-16 h-16 -m-1 bg-emerald-500/10 rounded-full animate-ping opacity-40"></div>
                       <div class="w-14 h-14 bg-slate-900 rounded-[22px] border-[3px] border-white shadow-2xl flex items-center justify-center relative overflow-hidden z-20">
                          <div class="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent"></div>
                          <span class="text-3xl transform -scale-x-100 z-10 filter drop-shadow-lg">🛵</span>
                       </div>
                       <div class="w-5 h-1.5 bg-black/20 rounded-full mt-1 blur-[2px] animate-pulse"></div>
                    </div>
                 `,
                 iconSize: [56, 56],
                 iconAnchor: [28, 28]
             });
             driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { 
                 icon: driverIcon,
                 zIndexOffset: 2000
             }).addTo(mapInstanceRef.current);
        } else {
             driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
        }
    }

    markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];

    stores.forEach(store => {
        const isSelected = selectedStore?.id === store.id;
        const icon = L.divIcon({
            className: 'custom-store-marker',
            html: getMarkerHtml(store.type, isSelected, store.name),
            iconSize: isSelected ? [60, 60] : [40, 40],
            iconAnchor: isSelected ? [30, 45] : [20, 20]
        });

        const marker = L.marker([store.lat, store.lng], { 
            icon, 
            zIndexOffset: isSelected ? 1000 : 100 
        }).on('click', (e: any) => {
            L.DomEvent.stopPropagation(e);
            onSelectStore(store);
        }).addTo(mapInstanceRef.current);

        markersRef.current.push(marker);
    });

    const boundsHash = JSON.stringify(stores.map(s => s.id)) + (selectedStore?.id || "") + (userLat || 0) + (userLng || 0) + (driverLocation?.lat || 0);
    if (boundsHash !== prevBoundsHash.current && (stores.length > 0 || driverLocation) && mapInstanceRef.current) {
        const points: [number, number][] = stores.map(s => [s.lat, s.lng]);
        if (userLat && userLng) points.push([userLat, userLng]);
        if (driverLocation) points.push([driverLocation.lat, driverLocation.lng]);
        
        if (points.length > 0) {
          const bounds = L.latLngBounds(points);
          mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], animate: true });
          prevBoundsHash.current = boundsHash;
        }
    }
  }, [stores, userLat, userLng, selectedStore, isLiveGPS, userInitial, userAccuracy, driverLocation, onSelectStore, isLocating]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !showRoute) {
        if (routeLineRef.current) mapInstanceRef.current.removeLayer(routeLineRef.current);
        if (routeLineGlowRef.current) mapInstanceRef.current.removeLayer(routeLineGlowRef.current);
        return;
    }

    const drawRoute = async () => {
        const start = driverLocation ? [driverLocation.lat, driverLocation.lng] : (selectedStore ? [selectedStore.lat, selectedStore.lng] : null);
        if (!start || !userLat || !userLng) return;

        try {
            const route = await getRoute(start[0], start[1], userLat, userLng);
            
            if (routeLineGlowRef.current) mapInstanceRef.current.removeLayer(routeLineGlowRef.current);
            if (routeLineRef.current) mapInstanceRef.current.removeLayer(routeLineRef.current);

            // Glowing underlay
            routeLineGlowRef.current = L.polyline(route.coordinates, {
                color: '#10b981',
                weight: 10,
                opacity: 0.1,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(mapInstanceRef.current);

            // Crisp tracking line
            routeLineRef.current = L.polyline(route.coordinates, {
                color: '#10b981',
                weight: 4,
                opacity: 0.8,
                dashArray: '1, 10',
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(mapInstanceRef.current);
        } catch (e) {
            console.error("Route drawing failed", e);
        }
    };

    drawRoute();
  }, [selectedStore, userLat, userLng, showRoute, driverLocation]);

  return (
    <div className={`relative ${className} bg-slate-100 overflow-hidden isolate`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* OSM Attribution - Bottom Left */}
      <div className="absolute bottom-2 left-4 z-[400] pointer-events-none">
          <div className="bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20 shadow-sm flex items-center gap-1.5">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">© OpenStreetMap contributors</span>
          </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-2">
         <button 
           onClick={handleRecenter}
           className={`w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center transition-all border border-slate-100 active:scale-90 ${followUser ? 'text-emerald-500' : 'text-slate-400'}`}
         >
           {isLocating ? (
              <div className="w-5 h-5 border-2 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
             </svg>
           )}
         </button>
      </div>

      {/* Precision Accuracy Indicator */}
      {isLiveGPS && userAccuracy && (
          <div className="absolute top-4 right-4 z-[400] pointer-events-none animate-fade-in">
              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${userAccuracy < 30 ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-white/50 uppercase tracking-[0.2em] leading-none">GPS Fix</span>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest mt-0.5">±{Math.round(userAccuracy)}m Precision</span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
