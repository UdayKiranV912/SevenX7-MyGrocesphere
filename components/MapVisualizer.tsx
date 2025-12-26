import React, { useEffect, useRef, useState } from 'react';
import { Store, OrderMode } from '../types';
import { getRoute } from '../services/routingService';

interface MapVisualizerProps {
  stores: Store[];
  userLat: number | null;
  userLng: number | null;
  userInitial?: string;
  userAccuracy?: number;
  selectedStore: Store | null;
  onSelectStore: (store: Store) => void;
  className?: string;
  mode: OrderMode; 
  showRoute?: boolean;
  enableExternalNavigation?: boolean;
  onRequestLocation?: () => void;
  driverLocation?: { lat: number; lng: number }; 
}

export const MapVisualizer: React.FC<MapVisualizerProps> = ({ 
  stores, 
  userLat, 
  userLng, 
  userInitial = '👤',
  userAccuracy,
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
  
  const [isLocating, setIsLocating] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  
  const prevBoundsHash = useRef<string>("");
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

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

    // Personalized User Marker with "You are here" label
    if (userLat && userLng) {
      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'user-marker-radar-personalized',
          html: `
            <div class="relative flex flex-col items-center justify-center">
               <div class="absolute -top-12 bg-emerald-600 text-white text-[8px] font-black px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-white/20 uppercase tracking-widest z-[60] animate-bounce-soft">
                  You are here
               </div>
               <div class="relative flex items-center justify-center w-12 h-12">
                  <div class="absolute w-full h-full bg-emerald-500/10 rounded-full animate-ping"></div>
                  <div class="absolute w-8 h-8 bg-emerald-500/20 rounded-full animate-pulse"></div>
                  <div class="relative w-8 h-8 bg-emerald-600 rounded-full border-[3px] border-white shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center text-white text-[10px] font-black uppercase overflow-hidden">
                     ${userInitial}
                  </div>
               </div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });
        userMarkerRef.current = L.marker([userLat, userLng], { 
            icon: userIcon, 
            zIndexOffset: 1000 
        }).addTo(mapInstanceRef.current);
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
                dashArray: '8, 8',
                interactive: false
            }).addTo(mapInstanceRef.current);
          } else {
            accuracyCircleRef.current.setLatLng([userLat, userLng]);
            accuracyCircleRef.current.setRadius(userAccuracy);
          }
      }

      if (followUser && !showRoute && !selectedStore) {
          mapInstanceRef.current.panTo([userLat, userLng], { animate: true, duration: 0.5 });
      }
    }

    if (driverLocation) {
        if (!driverMarkerRef.current) {
             const driverIcon = L.divIcon({
                 className: 'driver-marker-live',
                 html: `
                    <div class="relative flex flex-col items-center justify-center animate-fade-in">
                       <div class="absolute -top-12 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-2xl z-[60] border border-white/20 uppercase tracking-widest whitespace-nowrap">
                          Partner 🛵
                       </div>
                       <div class="w-12 h-12 bg-white rounded-3xl border-[3px] border-brand-DEFAULT shadow-2xl flex items-center justify-center animate-float">
                          <span class="text-2xl transform -scale-x-100">🛵</span>
                       </div>
                       <div class="w-2 h-2 bg-brand-DEFAULT rounded-full mt-2 animate-ping shadow-glow"></div>
                    </div>
                 `,
                 iconSize: [48, 48],
                 iconAnchor: [24, 24]
             });
             driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { 
                 icon: driverIcon, 
                 zIndexOffset: 10000 
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
        className: 'custom-store-pin',
        html: getMarkerHtml(store.type, isSelected, store.name),
        iconSize: isSelected ? [56, 70] : [36, 36],
        iconAnchor: isSelected ? [28, 70] : [18, 18] 
      });

      const marker = L.marker([store.lat, store.lng], { 
          icon, 
          zIndexOffset: isSelected ? 900 : 100 
      }).addTo(mapInstanceRef.current);
      
      marker.on('click', () => {
        onSelectStore(store);
        prevBoundsHash.current = "";
        setFollowUser(false);
        mapInstanceRef.current.flyTo([store.lat, store.lng], 18, { 
            animate: true, 
            duration: 1,
            padding: [50, 50]
        });
      });
      markersRef.current.push(marker);
    });

    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (routePath.length > 0) {
       routeLineRef.current = L.polyline(routePath, {
         color: '#10b981',
         weight: 6,
         opacity: 0.9,
         lineCap: 'round',
         lineJoin: 'round',
         dashArray: '1, 10'
       }).addTo(mapInstanceRef.current);

       const boundsHash = `route-${routePath[0][0]}-${routePath[routePath.length-1][0]}`;
       if (prevBoundsHash.current !== boundsHash) {
           const bounds = L.latLngBounds(routePath);
           mapInstanceRef.current.fitBounds(bounds, { 
               padding: [80, 80], 
               maxZoom: 17.5, 
               animate: true 
           });
           prevBoundsHash.current = boundsHash;
           setFollowUser(false);
       }
    } else if (stores.length > 0 && userLat && userLng && !showRoute) {
        const boundsHash = `view-${stores.length}-${userLat}-${userLng}`;
        if (prevBoundsHash.current !== boundsHash) {
            const allPoints = stores.map(s => L.latLng(s.lat, s.lng));
            allPoints.push(L.latLng(userLat, userLng));
            const bounds = L.latLngBounds(allPoints);
            mapInstanceRef.current.fitBounds(bounds, { 
                padding: [60, 60], 
                maxZoom: 16,
                animate: true
            });
            prevBoundsHash.current = boundsHash;
        }
    }

  }, [stores, userLat, userLng, userInitial, userAccuracy, selectedStore, showRoute, mode, driverLocation, routePath, followUser, isLocating]);

  useEffect(() => {
    let isActive = true;
    const fetchPath = async () => {
        if (showRoute && userLat && userLng) {
            const startNode = driverLocation || selectedStore;
            if (startNode) {
                try {
                    const points = await getRoute(startNode.lat, startNode.lng, userLat, userLng);
                    if (isActive) {
                        setRoutePath(points.length > 0 ? points : [[startNode.lat, startNode.lng], [userLat, userLng]]);
                    }
                } catch (e) {
                    if (isActive) setRoutePath([[startNode.lat, startNode.lng], [userLat, userLng]]);
                }
            }
        } else if (isActive) {
            setRoutePath([]);
        }
    };
    fetchPath();
    return () => { isActive = false; };
  }, [userLat, userLng, selectedStore?.id, driverLocation?.lat, driverLocation?.lng, showRoute]);

  return (
    <div className={`relative w-full bg-slate-50 rounded-[32px] overflow-hidden shadow-inner border border-white isolate ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0 grayscale-[0.2] transition-all duration-700" />
      
      <div className="absolute top-4 right-4 z-[500] pointer-events-none flex flex-col gap-2">
         <div className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white shadow-xl pointer-events-auto flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-glow"></div>
             <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Precision Live</span>
         </div>
      </div>

      <div className="absolute bottom-6 right-6 z-[500] pointer-events-none">
          <button 
            onClick={handleRecenter}
            className={`w-14 h-14 backdrop-blur-md rounded-[22px] shadow-2xl flex items-center justify-center transition-all active:scale-90 border-2 pointer-events-auto group ${
                followUser ? 'bg-slate-900 text-white border-slate-700' : 'bg-white/90 text-slate-900 border-white'
            }`}
          >
            {isLocating ? (
               <div className="w-6 h-6 border-[3px] border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-7 h-7 transition-transform group-hover:scale-110 ${followUser ? 'animate-pulse' : ''}`}>
                 <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
               </svg>
            )}
          </button>
      </div>
    </div>
  );
};