import React, { useEffect, useState, useRef } from 'react';
import { X, Compass, CheckCircle2, RotateCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { UserLocation } from '../types/prayer';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: UserLocation;
  bearing: number; // Qibla bearing in degrees from True North (0° = North, 90° = East, 180° = South, 270° = West)
}

function getCardinalDirection(deg: number): string {
  const directions = [
    'North (N)',
    'North-Northeast (NNE)',
    'Northeast (NE)',
    'East-Northeast (ENE)',
    'East (E)',
    'East-Southeast (ESE)',
    'Southeast (SE)',
    'South-Southeast (SSE)',
    'South (S)',
    'South-Southwest (SSW)',
    'Southwest (SW)',
    'West-Southwest (WSW)',
    'West (W)',
    'West-Northwest (WNW)',
    'Northwest (NW)',
    'North-Northwest (NNW)',
  ];
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 22.5) % 16;
  return directions[idx];
}

export const QiblaModal: React.FC<QiblaModalProps> = ({
  isOpen,
  onClose,
  location,
  bearing,
}) => {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [permissionRequired, setPermissionRequired] = useState<boolean>(false);
  const [sensorError, setSensorError] = useState<string | null>(null);

  const roundedBearing = Math.round(((bearing % 360) + 360) % 360);
  const cardinal = getCardinalDirection(roundedBearing);

  // Kaaba coordinates in Mecca
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;
  const R = 6371; // Earth's mean radius in km
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

  // Check if iOS requires motion permission
  useEffect(() => {
    if (!isOpen) return;

    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })?.requestPermission === 'function'
    ) {
      setPermissionRequired(true);
    }
  }, [isOpen]);

  // Setup orientation listener
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // 1. iOS Safari provides webkitCompassHeading directly (0° = True North, clockwise)
      if ((e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading !== undefined) {
        const h = (e as unknown as { webkitCompassHeading: number }).webkitCompassHeading;
        if (h !== null && !isNaN(h)) {
          heading = Math.round(h);
        }
      }
      // 2. Android deviceorientationabsolute or standard orientation
      else if (e.alpha !== null && !isNaN(e.alpha)) {
        // In W3C spec, alpha increases counter-clockwise, so compass heading = (360 - alpha) % 360
        heading = Math.round((360 - e.alpha) % 360);
      }

      if (heading !== null) {
        setDeviceHeading(heading);
        setHasCompassSensor(true);
        setPermissionRequired(false);
      }
    };

    // Try deviceorientationabsolute on Android Chrome first, then standard deviceorientation
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener);
    }
    if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener);
      }
      if ('ondeviceorientation' in window) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [isOpen]);

  const requestIOSMotionPermission = async () => {
    try {
      const DeviceOrientationEventAny = DeviceOrientationEvent as unknown as {
        requestPermission: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setPermissionRequired(false);
        } else {
          setSensorError('Motion sensor permission was denied. You can still use the visual True North compass.');
        }
      }
    } catch (err) {
      console.warn('Error requesting device orientation permission:', err);
      setSensorError('Could not access device motion sensor.');
    }
  };

  if (!isOpen) return null;

  // Real navigation compass calculation:
  // Dial rotation: The compass dial rotates so that "N" points to physical North (-deviceHeading).
  // Kaaba position on dial: Pinned at exactly `roundedBearing` degrees on the dial.
  // When device faces the Qibla (deviceHeading === roundedBearing), the Kaaba icon points straight UP!
  const dialRotation = deviceHeading !== null ? -deviceHeading : 0;
  const angleDiff = deviceHeading !== null ? Math.abs((deviceHeading - roundedBearing + 540) % 360 - 180) : null;
  const isAligned = angleDiff !== null && angleDiff <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3.5 sm:p-4 overflow-y-auto safe-area-bottom">
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl sm:rounded-2xl ${isAligned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-emerald-400'}`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Qibla Direction</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">{location.city} &rarr; Holy Kaaba in Makkah</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 flex flex-col items-center justify-center gap-5">
          {/* Alignment Status Banner */}
          {deviceHeading !== null ? (
            <div
              className={`w-full py-2 px-4 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isAligned
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 animate-pulse'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700/80'
              }`}
            >
              {isAligned ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aligned! You are facing the Kaaba</span>
                </>
              ) : (
                <span>
                  Turn device {((roundedBearing - deviceHeading + 540) % 360 - 180) > 0 ? 'Right ↻' : 'Left ↺'} to face Qibla
                </span>
              )}
            </div>
          ) : (
            <div className="w-full py-2 px-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center text-xs text-slate-400">
              Hold device flat · True North at top (0°)
            </div>
          )}

          {/* Compass Dial Assembly */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center shadow-2xl overflow-hidden">
            {/* Forward Sight / Target Indicator (Fixed at Top = 12 o'clock) */}
            <div className="absolute top-0 inset-x-0 flex flex-col items-center z-30 pointer-events-none">
              <div className={`w-3 h-3 rotate-45 -translate-y-1.5 ${isAligned ? 'bg-emerald-400' : 'bg-amber-400'} shadow-md`} />
              <div className={`w-0.5 h-3 ${isAligned ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </div>

            {/* Rotating Compass Disc (N always points towards actual North) */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${dialRotation}deg)` }}
            >
              {/* Outer Cardinal Points */}
              <div className="absolute top-3 flex flex-col items-center">
                <span className="text-xs font-black text-red-400">N</span>
                <span className="text-[8px] text-red-400/80 font-mono">0°</span>
              </div>
              <div className="absolute right-3 flex flex-row items-center gap-0.5">
                <span className="text-xs font-bold text-slate-400">E</span>
              </div>
              <div className="absolute bottom-3 flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500">S</span>
                <span className="text-[8px] text-slate-500 font-mono">180°</span>
              </div>
              <div className="absolute left-3 flex flex-row items-center gap-0.5">
                <span className="text-xs font-bold text-slate-400">W</span>
              </div>

              {/* Intercardinal markers */}
              <span className="absolute top-8 right-8 text-[9px] font-mono text-slate-600">NE</span>
              <span className="absolute bottom-8 right-8 text-[9px] font-mono text-slate-600">SE</span>
              <span className="absolute bottom-8 left-8 text-[9px] font-mono text-slate-600">SW</span>
              <span className="absolute top-8 left-8 text-[9px] font-mono text-slate-600">NW</span>

              {/* Degree tick ring */}
              <div className="w-52 h-52 rounded-full border border-slate-800/80" />
              <div className="w-40 h-40 rounded-full border border-slate-800/40" />

              {/* KAABA QIBLA NEEDLE PINNED AT EXACT BEARING ON THE DISC */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transform: `rotate(${roundedBearing}deg)` }}
              >
                <div className="relative w-1.5 h-full flex flex-col items-center justify-start pt-4">
                  {/* Kaaba Marker at Tip */}
                  <div
                    className={`p-1.5 rounded-xl border flex items-center justify-center text-sm shadow-xl transition-all ${
                      isAligned
                        ? 'bg-emerald-600 border-emerald-300 ring-4 ring-emerald-500/40 scale-110'
                        : 'bg-emerald-950/90 border-emerald-500 text-white'
                    }`}
                  >
                    🕋
                  </div>

                  {/* Emerald Beam Pointer */}
                  <div className="w-1.5 h-20 bg-gradient-to-t from-emerald-600 via-emerald-400 to-teal-300 rounded-full mt-1 shadow-md shadow-emerald-500/50" />
                </div>
              </div>
            </div>

            {/* Center Cap */}
            <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-emerald-400 z-20 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>

          {/* Compass Statistics */}
          <div className="text-center space-y-1">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                {roundedBearing}°
              </span>
              <span className="text-sm font-bold text-emerald-400">{cardinal}</span>
            </div>

            <p className="text-xs text-slate-300">
              Bearing from True North · <strong className="text-white">{distanceKm.toLocaleString()} km</strong> to Makkah
            </p>

            <div className="pt-1 flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <span>Your Lat: {location.latitude.toFixed(2)}°</span>
              <span aria-hidden="true">·</span>
              <span>Your Lng: {location.longitude.toFixed(2)}°</span>
            </div>
          </div>

          {/* iOS Motion Permission Trigger if required */}
          {permissionRequired && (
            <div className="w-full p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-center space-y-2">
              <p className="text-xs text-blue-200">
                iPhone sensor access is required for the live compass to rotate automatically with your phone.
              </p>
              <button
                onClick={requestIOSMotionPermission}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Enable iPhone Live Compass Motion</span>
              </button>
            </div>
          )}

          {sensorError && (
            <p className="text-[11px] text-amber-300 text-center">{sensorError}</p>
          )}

          {/* Sensor Info Tip */}
          <div className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>How to use:</span>
            </div>
            <p className="leading-relaxed">
              Hold your phone flat horizontally. Slowly rotate your body until the top gold notch aligns directly with the Kaaba 🕋 icon and the indicator turns green.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Calculated via Great Circle Formula</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
