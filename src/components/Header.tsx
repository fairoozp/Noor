import React from 'react';
import { MapPin, Volume2, Compass, Settings, Calendar, Bell, BellOff, Share2, Github, Smartphone } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { UserLocation } from '../types/prayer.ts';
import { NotificationPermissionState } from '../services/notificationService.ts';

interface HeaderProps {
  location: UserLocation;
  notificationPermission: NotificationPermissionState;
  onOpenNotifications: () => void;
  onOpenGitHubPublish: () => void;
  onOpenLocation: () => void;
  onOpenSounds: () => void;
  onOpenQibla: () => void;
  onOpenCalendar: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  notificationPermission,
  onOpenNotifications,
  onOpenGitHubPublish,
  onOpenLocation,
  onOpenSounds,
  onOpenQibla,
  onOpenCalendar,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg group-hover:bg-emerald-600/30 group-hover:scale-105 transition-all shadow-sm">
              ن
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Noor
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                  PWA
                </span>
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-300">
          <button
            onClick={onOpenSounds}
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Alert Sounds</span>
          </button>
          <button
            onClick={onOpenQibla}
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Qibla</span>
          </button>
          <button
            onClick={onOpenCalendar}
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Timetable</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Calculation</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notification Quick Toggle / Status Button */}
          <button
            onClick={onOpenNotifications}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
              notificationPermission === 'granted'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/50'
            }`}
            title={notificationPermission === 'granted' ? 'Notifications active' : 'Click to enable notifications'}
          >
            {notificationPermission === 'granted' ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {notificationPermission === 'granted' ? 'Alerts On' : 'Alerts'}
            </span>
          </button>

          {/* GitHub & Mobile Device Setup Button */}
          <button
            onClick={onOpenGitHubPublish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/40 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
            title="Scan QR code for mobile or publish to GitHub"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Phone &amp; GitHub</span>
            <span className="sm:hidden">Phone</span>
          </button>

          <PWAInstallButton />

          {/* Location button */}
          <button
            onClick={onOpenLocation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
            title="Change Location"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[90px] sm:max-w-[140px] truncate">{location.city}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
