
import React, { useEffect, useRef, useState } from 'react';
import { Store, OrderMode } from '../types';
import { getRoute } from '../services/routingService';

interface MapVisualizerProps {
  stores: Store[];
  userLat: number | null;
  userLng: number | null;
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
  const [mapType, setMapType] = useState<'STREET' | 'DARK'>('STREET');
  
  const prevBoundsHash = useRef<string>("");
  const prevRouteKey = useRef<string>("");
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  const getMarkerHtml = (type: Store['type'], isSelected: boolean) => {
    const emoji = type === 'produce' ? '🥦' : type === 'dairy' ? '🥛' : '🏪';
    const bgColor = type === 'produce' ? 'bg-emerald-500' : type === 'dairy' ? 'bg-blue-500' : 'bg-orange-500';
    const borderColor = isSelected ? 'border-slate-900' : 'border-white';
    
    if (isSelected) {
        const triangleColor = type === 'produce' ? 'border-t-emerald-500' : type === 'dairy' ? 'border-t-blue-500' : 'border-t-orange-500';
        return `
          <div class="relative flex flex-col items-center justify-center transition-all duration-300 z-50 -translate-y-6">
             <div class="${bgColor} w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-[3px] ${borderColor} z-20">
                <span class="text-2xl leading-none select-none filter drop-shadow-sm">${emoji}</span>
             </div>
             <div class="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] ${triangleColor} -mt-[1px] z-10"></div>
             <div class="absolute -bottom-1 w-4 h-1.5 bg-black/20 blur-[2px] rounded-full"></div>
          </div>
        `;
    }

    return `
      <div class="relative flex items-center justify-center transition-transform duration-300 hover:scale-110 z-10">
         <div class="${bgColor} w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white opacity-90">
            <span class="text-sm leading-none select-none">${emoji}</span>
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
        mapInstanceRef.current.flyTo([userLat, userLng], 18, { animate: true, duration: 1.2 });
    }
    setTimeout(() => setIsLocating(false), 2000);
  };

  const toggleMapType = (e: React.MouseEvent) => {
      e.stopPropagation();
      setMapType(prev => prev === 'STREET' ? 'DARK' : 'STREET');
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
        zoomDelta: 1
      });

      mapInstanceRef.current.on('movestart', (e: any) => {
          if (!isLocating && e.hard === undefined) {
             setFollowUser(false);
          }
      });
    }

    const streetTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    
    if (mapInstanceRef.current._tileLayer) mapInstanceRef.current.removeLayer(mapInstanceRef.current._tileLayer);
    mapInstanceRef.current._tileLayer = L.tileLayer(mapType === 'STREET' ? streetTiles : darkTiles, {
        maxZoom: 21
    }).addTo(mapInstanceRef.current);

    if (userLat && userLng) {
      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'user-marker-container',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8">
               <div class="absolute w-full h-full bg-emerald-500/30 rounded-full animate-ping"></div>
               <div class="relative w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          `,
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
                fillOpacity: 0.12,
                weight: 1.5,
                interactive: false
            }).addTo(mapInstanceRef.current);
          } else {
            accuracyCircleRef.current.setLatLng([userLat, userLng]);
            accuracyCircleRef.current.setRadius(userAccuracy);
          }
      }

      if (followUser && !showRoute) {
          mapInstanceRef.current.panTo([userLat, userLng], { animate: true, duration: 0.6 });
      }
    }

    if (driverLocation) {
        if (!driverMarkerRef.current) {
             const driverIcon = L.divIcon({
                 className: 'driver-marker-container',
                 html: `
                    <div class="relative flex flex-col items-center justify-center transition-all duration-300">
                       <div class="absolute -top-10 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-[60] border border-white/10 uppercase tracking-widest">Delivery Partner 🛵</div>
                       <div class="relative w-14 h-14 flex items-center justify-center z-50">
                          <div class="absolute inset-0 bg-emerald-500 rounded-full opacity-25 animate-ping"></div>
                          <div class="relative w-11 h-11 bg-white rounded-full border-[3px] border-emerald-500 shadow-2xl flex items-center justify-center transition-transform hover:scale-110">
                              <span class="text-2xl transform -scale-x-100 filter drop-shadow-sm">🛵</span>
                          </div>
                       </div>
                    </div>
                 `,
                 iconSize: [56, 56],
                 iconAnchor: [28, 28]
             });
             driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon, zIndexOffset: 10000 }).addTo(mapInstanceRef.current);
        } else {
             driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
        }
    } else if (driverMarkerRef.current) {
        mapInstanceRef.current.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
    }

    markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];

    stores.forEach(store => {
      const isSelected = selectedStore?.id === store.id;
      const icon = L.divIcon({
        className: 'custom-store-marker',
        html: getMarkerHtml(store.type, isSelected),
        iconSize: isSelected ? [48, 60] : [32, 32],
        iconAnchor: isSelected ? [24, 60] : [16, 16] 
      });

      const marker = L.marker([store.lat, store.lng], { icon, zIndexOffset: isSelected ? 900 : 100 })
        .addTo(mapInstanceRef.current);
      
      marker.on('click', () => {
        onSelectStore(store);
        prevBoundsHash.current = "";
        setFollowUser(false);
        mapInstanceRef.current.flyTo([store.lat, store.lng], 17, { animate: true, duration: 1 });
      });
      markersRef.current.push(marker);
    });

    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (routePath.length > 0) {
       routeLineRef.current = L.polyline(routePath, {
         color: mapType === 'STREET' ? '#10b981' : '#34d399',
         weight: 6,
         opacity: 0.9,
         lineCap: 'round',
         lineJoin: 'round'
       }).addTo(mapInstanceRef.current);

       const boundsHash = `route-${routePath[0][0]}-${routePath[routePath.length-1][0]}`;
       if (prevBoundsHash.current !== boundsHash) {
           const bounds = L.latLngBounds(routePath);
           mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 17, animate: true });
           prevBoundsHash.current = boundsHash;
           setFollowUser(false);
       }
    } else if (stores.length > 0 && userLat && userLng && !showRoute) {
        const boundsHash = `stores-${stores.length}-${userLat}-${userLng}`;
        if (prevBoundsHash.current !== boundsHash) {
            const allPoints = stores.map(s => L.latLng(s.lat, s.lng));
            allPoints.push(L.latLng(userLat, userLng));
            const bounds = L.latLngBounds(allPoints);
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            prevBoundsHash.current = boundsHash;
        }
    }

  }, [stores, userLat, userLng, userAccuracy, selectedStore, showRoute, mode, driverLocation, routePath, mapType, followUser, isLocating]);

  useEffect(() => {
    let isActive = true;
    const fetchPath = async () => {
        if (showRoute && userLat && userLng) {
            const startNode = driverLocation || selectedStore;
            if (startNode) {
                try {
                    const points = await getRoute(startNode.lat, startNode.lng, userLat, userLng);
                    if (isActive) {
                        if (points.length > 0) {
                            setRoutePath(points);
                        } else {
                            setRoutePath([[startNode.lat, startNode.lng], [userLat, userLng]]);
                        }
                    }
                } catch (e) {
                    if (isActive) setRoutePath([[startNode.lat, startNode.lng], [userLat, userLng]]);
                }
            }
        } else {
            if (isActive) setRoutePath([]);
        }
    };
    fetchPath();
    return () => { isActive = false; };
  }, [userLat, userLng, selectedStore?.id, driverLocation?.lat, driverLocation?.lng, showRoute]);

  return (
    <div className={`relative w-full bg-slate-100 rounded-[32px] overflow-hidden shadow-inner border border-white isolate ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0 transition-opacity duration-700" />
      
      <div className="absolute bottom-4 left-4 right-4 z-[500] flex items-center justify-between pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
              <button 
                onClick={toggleMapType}
                className="w-11 h-11 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-slate-800 border border-white/50 transition-all active:scale-90"
              >
                  {mapType === 'STREET' ? '🌙' : '☀️'}
              </button>
          </div>

          <button 
            onClick={handleRecenter}
            className={`w-11 h-11 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-90 border pointer-events-auto ${
                followUser ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/90 text-slate-800 border-white/50'
            }`}
          >
            {isLocating ? (
               <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                 <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
               </svg>
            )}
          </button>
      </div>
    </div>
  );
};
