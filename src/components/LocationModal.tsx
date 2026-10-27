import React, { useState } from 'react';
import { X, MapPin, Search, Navigation, Compass, Globe } from 'lucide-react';
import { CityOption, UserLocation } from '../types/prayer';
import { POPULAR_CITIES } from '../services/citiesData';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: UserLocation;
  onSelectLocation: (loc: UserLocation) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  // Custom coordinate input state
  const [customLat, setCustomLat] = useState(currentLocation.latitude.toString());
  const [customLng, setCustomLng] = useState(currentLocation.longitude.toString());
  const [customCity, setCustomCity] = useState(currentLocation.city);

  if (!isOpen) return null;

  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      setDetectError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setDetectError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Try reverse geocoding via standard free open service or local lookup
        let cityName = 'Current Location';
        let countryName = 'GPS Position';

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
          if (res.ok) {
            const data = await res.json();
            cityName = data.address?.city || data.address?.town || data.address?.municipality || data.address?.state || 'My Location';
            countryName = data.address?.country || 'GPS Coordinates';
          }
        } catch {
          cityName = `Lat ${lat.toFixed(2)}, Lng ${lng.toFixed(2)}`;
        }

        onSelectLocation({
          city: cityName,
          country: countryName,
          latitude: lat,
          longitude: lng,
          isAutoDetected: true,
        });

        setIsDetecting(false);
        onClose();
      },
      (err) => {
        setIsDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setDetectError('Location access was denied. You can select your city from the list below or enter coordinates manually.');
        } else {
          setDetectError('Unable to retrieve location. Please pick a city below.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCity = (c: CityOption) => {
    onSelectLocation({
      city: c.city,
      country: c.country,
      latitude: c.latitude,
      longitude: c.longitude,
      isAutoDetected: false,
    });
    onClose();
  };

  const handleApplyCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setDetectError('Please enter valid coordinates (-90 to 90 for latitude, -180 to 180 for longitude).');
      return;
    }

    onSelectLocation({
      city: customCity.trim() || `Position (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
      country: 'Custom Coordinates',
      latitude: lat,
      longitude: lng,
      isAutoDetected: false,
    });
    onClose();
  };

  const filteredCities = POPULAR_CITIES.filter((c) =>
    `${c.city} ${c.country}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Choose Your Location</h2>
              <p className="text-xs text-slate-400">Prayer times calculated accurately for your exact coordinates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Auto Detect GPS Button */}
          <div>
            <button
              onClick={handleDetectGPS}
              disabled={isDetecting}
              className="w-full p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-950/40 active:scale-[0.99] disabled:opacity-60"
            >
              <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting Precise Location...' : 'Detect My Location via GPS'}</span>
            </button>

            {detectError && (
              <p className="mt-2 text-xs text-amber-400/90 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                {detectError}
              </p>
            )}
          </div>

          {/* Search bar */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Search City Worldwide:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type city or country name (e.g. Mecca, London, Dubai)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* City list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredCities.map((c) => {
                const isCurrent =
                  Math.abs(c.latitude - currentLocation.latitude) < 0.05 &&
                  Math.abs(c.longitude - currentLocation.longitude) < 0.05;

                return (
                  <button
                    key={`${c.city}-${c.country}`}
                    onClick={() => handleSelectCity(c)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                        : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{c.city}</div>
                      <div className="text-[11px] text-slate-400 truncate">{c.country}</div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Coordinate Form */}
          <div className="pt-4 border-t border-slate-800">
            <details className="group">
              <summary className="text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-200 transition-colors list-none flex items-center justify-between">
                <span>Enter Custom Coordinates (Optional)</span>
                <span className="text-emerald-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <form onSubmit={handleApplyCustomCoords} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Location Label</label>
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="My Mosque"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      placeholder="e.g. 21.42"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      placeholder="e.g. 39.82"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  Apply Custom Coordinates
                </button>
              </form>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
