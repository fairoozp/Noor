import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  RotateCw,
  ShieldCheck,
  Smartphone,
  Sliders,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
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

function getScreenOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;
  if (window.screen?.orientation && typeof window.screen.orientation.angle === 'number') {
    return window.screen.orientation.angle;
  }
  if (typeof window.orientation === 'number') {
    return window.orientation;
  }
  return 0;
}

export const QiblaModal: React.FC<QiblaModalProps> = ({
  isOpen,
  onClose,
  location,
  bearing,
}) => {
  // Rounded bearing from True North
  const roundedBearing = Math.round(((bearing % 360) + 360) % 360);
  const cardinal = getCardinalDirection(roundedBearing);

  // Compass state
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [smoothDialRotation, setSmoothDialRotation] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [permissionRequired, setPermissionRequired] = useState<boolean>(false);
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [isFlat, setIsFlat] = useState<boolean>(true);
  const [tiltAngle, setTiltAngle] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [showCalibrationHelp, setShowCalibrationHelp] = useState<boolean>(false);

  // Refs for smooth unwrapped rotation & sensor filtering
  const absoluteFiredRef = useRef<boolean>(false);
  const lastRawHeadingRef = useRef<number | null>(null);
  const currentDialRotationRef = useRef<number>(0);
  const targetDialRotationRef = useRef<number>(0);
  const lastVibrateTimeRef = useRef<number>(0);

  // Great-circle distance to Kaaba in Makkah
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

  // Apply new heading with noise deadband and continuous circular angle unwrapping
  const applyNewHeading = useCallback((rawH: number) => {
    const normalized = ((rawH % 360) + 360) % 360;

    // Filter magnetometer jitter when motionless (deadband threshold: 0.35°)
    const last = lastRawHeadingRef.current;
    if (last !== null) {
      const diff = Math.abs(((normalized - last + 540) % 360) - 180);
      if (diff < 0.35) {
        return; // Suppress micro-jitter to prevent flickering
      }
    }
    lastRawHeadingRef.current = normalized;

    // The dial rotates counter to heading so True North (0°) points to real physical North
    const targetRotation = -normalized;

    // Continuous angle unwrapping to PREVENT the 360° spin/flip bug when crossing 0°/360°
    const current = currentDialRotationRef.current;
    const delta = ((((targetRotation - current) + 180) % 360) + 360) % 360 - 180;
    targetDialRotationRef.current = current + delta;

    setDeviceHeading(Math.round(normalized));
    setHasCompassSensor(true);
    setPermissionRequired(false);
  }, []);

  // Request Animation Frame loop for silky-smooth exponential easing (no CSS transition clash)
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const updateLoop = () => {
      const current = currentDialRotationRef.current;
      const target = targetDialRotationRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.02) {
        // Exponential smoothing factor: 0.20 provides snappy yet buttery rotation
        const next = current + diff * 0.20;
        currentDialRotationRef.current = next;
        setSmoothDialRotation(next);
      }

      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  // Check iOS permission requirements
  useEffect(() => {
    if (!isOpen) return;

    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })?.requestPermission === 'function'
    ) {
      setPermissionRequired(true);
    }
  }, [isOpen]);

  // Set up orientation sensor listeners with mutual exclusion (NO alternating event thrashing)
  useEffect(() => {
    if (!isOpen || isManualMode) return;

    absoluteFiredRef.current = false;
    lastRawHeadingRef.current = null;

    // 1. Android / Chrome Absolute Compass Handler
    const handleAbsoluteOrientation = (e: DeviceOrientationEvent) => {
      if (typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        absoluteFiredRef.current = true;
        // W3C: alpha increases counter-clockwise from 0 (North) -> 90 (West)
        // Compass heading = (360 - alpha) % 360
        let heading = (360 - e.alpha) % 360;
        const screenAngle = getScreenOrientationAngle();
        heading = (heading + screenAngle + 360) % 360;
        applyNewHeading(heading);
      }

      // Check tilt angle for flat holding guidance
      if (typeof e.beta === 'number' && typeof e.gamma === 'number') {
        const tilt = Math.round(Math.sqrt(e.beta * e.beta + e.gamma * e.gamma));
        setTiltAngle(tilt);
        setIsFlat(tilt <= 45);
      }
    };

    // 2. Standard DeviceOrientation Handler (Used for iOS Safari and fallback)
    const handleStandardOrientation = (e: DeviceOrientationEvent) => {
      // If absolute orientation is already active and delivering true values, DO NOT let standard orientation override it!
      if (absoluteFiredRef.current) return;

      let heading: number | null = null;

      // iOS Safari provides webkitCompassHeading directly (True/Magnetic North, clockwise)
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof webkitHeading === 'number' && !isNaN(webkitHeading)) {
        heading = webkitHeading;
      }
      // Or if absolute flag is explicitly true
      else if ((e as unknown as { absolute?: boolean }).absolute === true && typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        heading = (360 - e.alpha) % 360;
      }
      // Or standard alpha fallback if deviceorientationabsolute is absent
      else if (typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        heading = (360 - e.alpha) % 360;
      }

      if (heading !== null) {
        const screenAngle = getScreenOrientationAngle();
        heading = (heading + screenAngle + 360) % 360;
        applyNewHeading(heading);
      }

      if (typeof e.beta === 'number' && typeof e.gamma === 'number') {
        const tilt = Math.round(Math.sqrt(e.beta * e.beta + e.gamma * e.gamma));
        setTiltAngle(tilt);
        setIsFlat(tilt <= 45);
      }
    };

    // Listen to absolute event first if supported
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleAbsoluteOrientation as EventListener);
    }
    // Listen to standard event (with absolute guard check inside)
    if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleStandardOrientation);
    }

    return () => {
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute', handleAbsoluteOrientation as EventListener);
      }
      if ('ondeviceorientation' in window) {
        window.removeEventListener('deviceorientation', handleStandardOrientation);
      }
    };
  }, [isOpen, isManualMode, applyNewHeading]);

  // Handle manual heading change (for testing / desktop)
  const handleManualSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setManualHeading(val);
    const targetRotation = -val;
    const current = currentDialRotationRef.current;
    const delta = ((((targetRotation - current) + 180) % 360) + 360) % 360 - 180;
    targetDialRotationRef.current = current + delta;
  };

  // iOS Motion permission trigger
  const requestIOSMotionPermission = async () => {
    try {
      const DeviceOrientationEventAny = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setPermissionRequired(false);
        } else {
          setSensorError('Motion sensor permission was denied. You can use manual rotation mode instead.');
        }
      }
    } catch (err) {
      console.warn('Error requesting device orientation permission:', err);
      setSensorError('Could not access device motion sensor.');
    }
  };

  if (!isOpen) return null;

  // Active heading: sensor heading or manual simulation
  const effectiveHeading = isManualMode ? manualHeading : deviceHeading;
  const angleDiff =
    effectiveHeading !== null
      ? Math.abs(((effectiveHeading - roundedBearing + 540) % 360) - 180)
      : null;
  const isAligned = angleDiff !== null && angleDiff <= 4; // Within ±4° of Kaaba

  // Gentle haptic feedback on Kaaba alignment (throttled to 1 pulse per 2.5s)
  if (isAligned && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const now = Date.now();
    if (now - lastVibrateTimeRef.current > 2500) {
      try {
        navigator.vibrate(40);
      } catch {
        // ignore
      }
      lastVibrateTimeRef.current = now;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto safe-area-bottom">
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl transition-all ${
                isAligned ? 'bg-emerald-500/20 text-emerald-400 scale-105' : 'bg-slate-800 text-emerald-400'
              }`}
            >
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Qibla Direction</span>
                {isAligned && (
                  <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Aligned
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">{location.city} &rarr; Holy Kaaba, Makkah</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCalibrationHelp(!showCalibrationHelp)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Calibration Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calibration Help Banner */}
        {showCalibrationHelp && (
          <div className="p-3.5 bg-emerald-950/40 border-b border-emerald-500/30 text-xs text-slate-200 flex items-start gap-2.5">
            <RotateCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="space-y-1">
              <p className="font-semibold text-white">How to Calibrate Your Phone Compass:</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                If the compass drifts or shows the wrong heading, move your phone in a <strong>figure-8 motion in the air</strong> for 5 seconds. Also keep away from large metal objects, magnets, or laptop speakers.
              </p>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center gap-4">
          {/* Alignment Status Banner */}
          {effectiveHeading !== null ? (
            <div
              className={`w-full py-2 px-3.5 rounded-xl text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isAligned
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80'
              }`}
            >
              {isAligned ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Aligned! You are directly facing the Holy Kaaba</span>
                </>
              ) : (
                <span>
                  Turn device {((roundedBearing - effectiveHeading + 540) % 360 - 180) > 0 ? 'Right ↻' : 'Left ↺'}{' '}
                  (Heading: {effectiveHeading}° &bull; Qibla: {roundedBearing}°)
                </span>
              )}
            </div>
          ) : (
            <div className="w-full py-2 px-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Hold device flat &bull; Top notch points forward</span>
            </div>
          )}

          {/* Phone Flatness / Tilt Warning */}
          {!isFlat && effectiveHeading !== null && !isManualMode && (
            <div className="w-full py-1.5 px-3 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center gap-2 text-[11px] text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Hold phone flat horizontally for highest compass accuracy ({tiltAngle}° tilt)</span>
            </div>
          )}

          {/* Compass Dial Assembly */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center shadow-2xl overflow-hidden select-none">
            {/* Forward Sight / Target Indicator (Fixed at Top = 12 o'clock) */}
            <div className="absolute top-0 inset-x-0 flex flex-col items-center z-30 pointer-events-none">
              <div
                className={`w-3 h-3 rotate-45 -translate-y-1.5 transition-colors ${
                  isAligned ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400'
                }`}
              />
              <div className={`w-0.5 h-3.5 ${isAligned ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </div>

            {/* Rotating Compass Disc (Smooth JS RAF interpolation, zero CSS transition fighting) */}
            <div
              className="absolute inset-0 flex items-center justify-center will-change-transform"
              style={{
                transform: `rotate(${smoothDialRotation}deg)`,
              }}
            >
              {/* Outer Cardinal Points */}
              <div className="absolute top-2.5 flex flex-col items-center">
                <span className="text-xs font-black text-red-400">N</span>
                <span className="text-[8px] text-red-400/80 font-mono">0°</span>
              </div>
              <div className="absolute right-3 flex flex-row items-center gap-0.5">
                <span className="text-xs font-bold text-slate-400">E</span>
              </div>
              <div className="absolute bottom-2.5 flex flex-col items-center">
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

              {/* Compass Rings */}
              <div className="w-52 h-52 rounded-full border border-slate-800/80" />
              <div className="w-40 h-40 rounded-full border border-slate-800/40" />

              {/* KAABA QIBLA NEEDLE PINNED AT EXACT BEARING ON THE DISC */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transform: `rotate(${roundedBearing}deg)` }}
              >
                <div className="relative w-2 h-full flex flex-col items-center justify-start pt-3.5">
                  {/* Kaaba Marker at Tip */}
                  <div
                    className={`p-1.5 rounded-xl border flex items-center justify-center text-sm shadow-xl transition-all ${
                      isAligned
                        ? 'bg-emerald-600 border-emerald-300 ring-4 ring-emerald-500/50 scale-125'
                        : 'bg-emerald-950/90 border-emerald-500 text-white'
                    }`}
                  >
                    🕋
                  </div>

                  {/* Glowing Emerald Beam */}
                  <div
                    className={`w-1.5 rounded-full mt-1 transition-all ${
                      isAligned
                        ? 'h-24 bg-gradient-to-t from-emerald-500 via-emerald-300 to-white shadow-lg shadow-emerald-400/80'
                        : 'h-20 bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-300 shadow-md shadow-emerald-500/40'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Center Cap */}
            <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-emerald-400 z-20 shadow-md flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
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
              Bearing from True North &bull; <strong className="text-white">{distanceKm.toLocaleString()} km</strong> to Makkah
            </p>

            <div className="pt-1 flex items-center justify-center gap-2.5 text-[11px] text-slate-400">
              <span>{location.city}</span>
              <span>&bull;</span>
              <span>Lat: {location.latitude.toFixed(2)}°</span>
              <span>&bull;</span>
              <span>Lng: {location.longitude.toFixed(2)}°</span>
            </div>
          </div>

          {/* iOS Motion Permission Prompt */}
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

          {/* Manual Rotation Slider / Test Mode */}
          <div className="w-full p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  const nextMode = !isManualMode;
                  setIsManualMode(nextMode);
                  if (nextMode) {
                    setManualHeading(deviceHeading ?? 0);
                  }
                }}
                className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors font-medium"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isManualMode ? 'Switch to Live Sensor' : 'Manual / Desktop Test Mode'}</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                {effectiveHeading !== null ? `${effectiveHeading}°` : '---'}
              </span>
            </div>

            {isManualMode && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={manualHeading}
                  onChange={handleManualSliderChange}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0° (North)</span>
                  <span>90° (East)</span>
                  <span>180° (South)</span>
                  <span>270° (West)</span>
                </div>
              </div>
            )}
          </div>

          {/* Usage Instructions */}
          <div className="w-full p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>How to use:</span>
            </div>
            <p className="leading-relaxed">
              Hold phone horizontally flat. Rotate your body until the top notch aligns with the Holy Kaaba 🕋 and the dial turns vibrant green.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Great Circle Navigation &bull; Jitter-Filtered</span>
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
