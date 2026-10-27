import React, { useEffect, useState } from 'react';
import { X, Compass, Navigation } from 'lucide-react';
import { UserLocation } from '../types/prayer';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: UserLocation;
  bearing: number;
}

export const QiblaModal: React.FC<QiblaModalProps> = ({
  isOpen,
  onClose,
  location,
  bearing,
}) => {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const heading = (e as any).webkitCompassHeading || (e.alpha !== null ? 360 - e.alpha : null);
      if (heading !== null) {
        setDeviceHeading(Math.round(heading));
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;
  const R = 6371;
  const dLat = ((kaabaLat - location.latitude) * Math.PI) / 180;
  const dLng = ((kaabaLng - location.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((location.latitude * Math.PI) / 180) *
      Math.cos((kaabaLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);

  const needleRotation = deviceHeading !== null ? bearing - deviceHeading : bearing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Qibla Direction</h2>
              <p className="text-xs text-slate-400">Facing the Holy Kaaba in Makkah</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compass Visual */}
        <div className="p-8 flex flex-col items-center justify-center gap-6">
          <div className="relative w-64 h-64 rounded-full border-2 border-slate-800 bg-slate-950/80 flex items-center justify-center shadow-inner">
            <span className="absolute top-2 text-[10px] font-bold text-red-400">N</span>
            <span className="absolute bottom-2 text-[10px] font-bold text-slate-500">S</span>
            <span className="absolute right-3 text-[10px] font-bold text-slate-500">E</span>
            <span className="absolute left-3 text-[10px] font-bold text-slate-500">W</span>

            <div className="w-48 h-48 rounded-full border border-slate-800/60" />
            <div className="w-32 h-32 rounded-full border border-emerald-500/10" />

            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              <div className="relative w-1 h-28 -translate-y-8 flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 border border-emerald-400/80 shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white text-xs font-bold mb-1 -translate-y-2">
                  🕋
                </div>
                <div className="w-1.5 h-16 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full" />
              </div>
            </div>

            <div className="w-4 h-4 rounded-full bg-slate-800 border-2 border-emerald-400 z-10" />
          </div>

          <div className="text-center">
            <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {bearing}°
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bearing from True North · <span className="text-emerald-400 font-semibold">{distanceKm.toLocaleString()} km</span> to Makkah
            </p>
            {deviceHeading !== null && (
              <p className="text-[11px] text-emerald-400/80 mt-1">
                Device Compass Active (Heading: {deviceHeading}°)
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            For best accuracy, hold your device flat and keep away from metallic objects.
          </p>
        </div>
      </div>
    </div>
  );
};
