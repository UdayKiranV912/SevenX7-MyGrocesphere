
import React, { useState, useEffect, useRef } from 'react';
import { geocode, reverseGeocode, MapSearchResult } from '../services/maps';

interface AddressSearchProps {
  initialAddress?: string;
  onSelect: (address: string, lat: number, lon: number) => void;
  placeholder?: string;
  className?: string;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({ 
  initialAddress = '', 
  onSelect, 
  placeholder = "Search for area, street name...",
  className = ""
}) => {
  const [query, setQuery] = useState(initialAddress);
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(initialAddress);
  }, [initialAddress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const data = await geocode(text);
      setResults(data);
      setLoading(false);
      setShowResults(true);
    }, 1000);
  };

  const handleSelect = (item: MapSearchResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setQuery(item.display_name);
    setShowResults(false);
    onSelect(item.display_name, lat, lon);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const data = await reverseGeocode(latitude, longitude);
        
        setIsLocating(false);
        if (data && data.display_name) {
          setQuery(data.display_name);
          onSelect(data.display_name, latitude, longitude);
        }
      },
      (error) => {
        setIsLocating(false);
        alert("Unable to retrieve location.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-DEFAULT/50 transition-all shadow-inner"
        />
        
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
           {loading ? (
             <div className="w-4 h-4 border-2 border-slate-300 border-t-brand-DEFAULT rounded-full animate-spin"></div>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
             </svg>
           )}
        </div>

        <button
          onClick={handleUseCurrentLocation}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-blue-500 hover:bg-blue-50 transition-colors"
        >
           {isLocating ? (
             <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
             </svg>
           )}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100] max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 flex items-start gap-3"
            >
              <span className="mt-0.5 text-slate-400">📍</span>
              <span className="text-xs font-bold text-slate-600 line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
