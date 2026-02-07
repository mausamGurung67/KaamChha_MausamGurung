import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, X } from 'lucide-react';

// Fix default marker icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Types ──────────────────────────────────────────────
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapPickerProps {
  /** Current position (controlled) */
  position: LatLng | null;
  /** Called when user selects a location on the map */
  onLocationSelect: (latlng: LatLng, address: string) => void;
  /** Map center (defaults to Kathmandu) */
  center?: LatLng;
  /** Initial zoom level */
  zoom?: number;
  /** Map container height */
  height?: string;
  /** Optional CSS class */
  className?: string;
}

// ── Reverse-geocode using free Nominatim API ──────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.display_name || '';
  } catch {
    return '';
  }
}

// ── Forward-geocode (address → lat/lng) ───────────────
async function forwardGeocode(query: string): Promise<{ lat: number; lng: number; display: string }[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=np`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.map((item: { lat: string; lon: string; display_name: string }) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display: item.display_name,
    }));
  } catch {
    return [];
  }
}

// ── Sub-component: click handler on map ───────────────
function MapClickHandler({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ── Sub-component: fly to position when it changes ────
function FlyToPosition({ position }: { position: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom(), { duration: 0.8 });
    }
  }, [position, map]);
  return null;
}

// ── Main Component ────────────────────────────────────
const MapPicker: React.FC<MapPickerProps> = ({
  position,
  onLocationSelect,
  center = { lat: 27.7172, lng: 85.3240 },
  zoom = 13,
  height = '260px',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ lat: number; lng: number; display: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced address search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await forwardGeocode(value);
      setSuggestions(results);
      setSearching(false);
    }, 400);
  };

  // When user selects a suggestion
  const handleSuggestionClick = (item: { lat: number; lng: number; display: string }) => {
    setSuggestions([]);
    setSearchQuery(item.display.split(',').slice(0, 3).join(', '));
    onLocationSelect({ lat: item.lat, lng: item.lng }, item.display);
  };

  // When user clicks on the map
  const handleMapClick = async (latlng: LatLng) => {
    const address = await reverseGeocode(latlng.lat, latlng.lng);
    setSearchQuery(address.split(',').slice(0, 3).join(', '));
    onLocationSelect(latlng, address);
  };

  // Use browser geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const address = await reverseGeocode(latlng.lat, latlng.lng);
        setSearchQuery(address.split(',').slice(0, 3).join(', '));
        onLocationSelect(latlng, address);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search input with suggestions */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search location or click on map..."
            className="w-full pl-9 pr-20 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition disabled:opacity-50"
              title="Use my location"
            >
              <Navigation size={14} className={locating ? 'animate-pulse' : ''} />
            </button>
          </div>
        </div>

        {/* Autocomplete suggestions */}
        {suggestions.length > 0 && (
          <ul className="absolute z-[1000] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((item, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition flex items-start gap-2"
                >
                  <MapPin size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{item.display}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {searching && (
          <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
            Searching...
          </div>
        )}
      </div>

      {/* Leaflet Map */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <FlyToPosition position={position} />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>

      {/* Coordinate display */}
      {position && (
        <p className="text-[11px] text-gray-400 flex items-center gap-1">
          <MapPin size={11} />
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default MapPicker;
