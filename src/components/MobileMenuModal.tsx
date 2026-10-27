import React from 'react';
import {
  Bell,
  Settings,
  Smartphone,
  MapPin,
  Volume2,
  X,
  Compass,
  Calendar,
  Download,
  Info,
} from 'lucide-react';
import { UserLocation } from '../types/prayer.ts';
import { NotificationPermissionState } from '../services/notificationService.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: UserLocation;
  notificationPermission: NotificationPermissionState;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenGitHubPublish: () => void;
  onOpenLocation: () => void;
  onOpenSounds: () => void;
  onOpenQibla: () => void;
  onOpenCalendar: () => void;
}

export const MobileMenuModal: React.FC<MobileMenuModalProps> = ({
  isOpen,
  onClose,
  location,
  notificationPermission,
  onOpenNotifications,
  onOpenSettings,
  onOpenGitHubPublish,
  onOpenLocation,
  onOpenSounds,
  onOpenQibla,
  onOpenCalendar,
}) => {
  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border-t sm:border border-slate-800 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold text-sm flex items-center justify-center">
              ن
            </span>
            <h3 className="text-base font-bold text-white">Noor Menu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Location Badge */}
        <button
          onClick={() => handleAction(onOpenLocation)}
          className="w-full p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-left hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Location</span>
              <span className="text-sm font-bold text-white truncate block">{location.city}, {location.country}</span>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-medium">Change &rarr;</span>
        </button>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => handleAction(onOpenNotifications)}
            className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 flex flex-col items-start gap-2 text-left transition-colors"
          >
            <div className={`p-2 rounded-xl ${notificationPermission === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Adhan Alerts</span>
              <span className="text-[10px] text-slate-400">
                {notificationPermission === 'granted' ? 'Alerts Enabled' : 'Configure Push'}
              </span>
            </div>
          </button>

          <button
            onClick={() => handleAction(onOpenGitHubPublish)}
            className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 flex flex-col items-start gap-2 text-left transition-colors"
          >
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Phone &amp; GitHub</span>
              <span className="text-[10px] text-slate-400">QR Scan &amp; Export</span>
            </div>
          </button>

          <button
            onClick={() => handleAction(onOpenSounds)}
            className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 flex flex-col items-start gap-2 text-left transition-colors"
          >
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Original Adhans</span>
              <span className="text-[10px] text-slate-400">Makkah, Madinah, Fajr</span>
            </div>
          </button>

          <button
            onClick={() => handleAction(onOpenSettings)}
            className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 flex flex-col items-start gap-2 text-left transition-colors"
          >
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Calculations</span>
              <span className="text-[10px] text-slate-400">Madhab &amp; Method</span>
            </div>
          </button>
        </div>

        {/* PWA Install Button row */}
        <div className="pt-2">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};
