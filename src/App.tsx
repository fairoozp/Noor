/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  Compass,
  Calendar,
  Settings,
  MapPin,
  Clock,
  Hourglass,
  Sparkles,
  ShieldAlert,
  X,
  VolumeX,
} from 'lucide-react';
import {
  AlertSoundId,
  PrayerItem,
  PrayerName,
  PrayerSettings,
  UserLocation,
} from './types/prayer.ts';
import {
  computePrayerSchedule,
  DayPrayerSummary,
  formatTime,
} from './services/prayerService.ts';
import {
  alertScheduler,
  getNotificationPermission,
  NotificationPermissionState,
  requestNotificationPermission,
} from './services/notificationService.ts';
import { stopAllSounds } from './services/soundEngine.ts';
import { Header } from './components/Header.tsx';
import { HeroPrayerCard } from './components/HeroPrayerCard.tsx';
import { DailyPrayerList } from './components/DailyPrayerList.tsx';
import { SoundCustomizerModal } from './components/SoundCustomizerModal.tsx';
import { LocationModal } from './components/LocationModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { QiblaModal } from './components/QiblaModal.tsx';
import { MonthlyCalendarModal } from './components/MonthlyCalendarModal.tsx';
import { NotificationModal } from './components/NotificationModal.tsx';
import { GitHubPublishModal } from './components/GitHubPublishModal.tsx';
import { MobileTabBar } from './components/MobileTabBar.tsx';
import { MobileMenuModal } from './components/MobileMenuModal.tsx';

const DEFAULT_LOCATION: UserLocation = {
  city: 'Mecca',
  country: 'Saudi Arabia',
  latitude: 21.4225,
  longitude: 39.8262,
  isAutoDetected: false,
};

const DEFAULT_SETTINGS: PrayerSettings = {
  calculationMethod: 'UmmAlQura',
  madhab: 'shafi',
  highLatitudeRule: 'middleOfTheNight',
  timeFormat: '12h',
  endReminderMinutes: 15,
  endReminderEnabled: true,
  endReminderSoundId: 'warning_gong',
  masterVolume: 0.8,
  prayerSounds: {
    fajr: 'adhan_fajr_melody',
    sunrise: 'soft_dawn_chime',
    dhuhr: 'adhan_makkah',
    asr: 'adhan_madinah',
    maghrib: 'adhan_makkah',
    isha: 'adhan_alaqsa',
  },
  prayerAlerts: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  autoDetectLocation: true,
};

export default function App() {
  // State: Location (stored in localStorage)
  const [location, setLocation] = useState<UserLocation>(() => {
    try {
      const saved = localStorage.getItem('noor_user_location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  // State: Settings (stored in localStorage)
  const [settings, setSettings] = useState<PrayerSettings>(() => {
    try {
      const saved = localStorage.getItem('noor_prayer_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Current ticking date
  const [now, setNow] = useState(() => new Date());

  // Notification permission state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(getNotificationPermission());

  // Active Alert In-App Toast
  const [activeAlertToast, setActiveAlertToast] = useState<{
    title: string;
    message: string;
    type: 'start' | 'end_reminder';
  } | null>(null);

  // Modals
  const [isSoundsModalOpen, setIsSoundsModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isQiblaModalOpen, setIsQiblaModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isGitHubPublishModalOpen, setIsGitHubPublishModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prayerFocusForSounds, setPrayerFocusForSounds] = useState<PrayerName | null>(null);

  // Keep latest refs for scheduler
  const locationRef = useRef(location);
  locationRef.current = location;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Persist location
  useEffect(() => {
    try {
      localStorage.setItem('noor_user_location', JSON.stringify(location));
    } catch {
      // ignore
    }
  }, [location]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('noor_prayer_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Request browser location on mount if not yet manually set
  useEffect(() => {
    if (!location.isAutoDetected && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
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

          setLocation({
            city: cityName,
            country: countryName,
            latitude: lat,
            longitude: lng,
            isAutoDetected: true,
          });
        },
        () => {
          // Keep default if permission declined
        },
        { timeout: 7000 }
      );
    }
  }, []);

  // Real-time second ticker for countdown clocks
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute daily schedule
  const schedule: DayPrayerSummary = useMemo(() => {
    return computePrayerSchedule(location, settings, now);
  }, [location, settings, now]);

  // Alert Scheduler & Notification Runner
  useEffect(() => {
    alertScheduler.start(
      () => {
        const currentSummary = computePrayerSchedule(locationRef.current, settingsRef.current, new Date());
        return {
          prayers: currentSummary.prayers,
          settings: settingsRef.current,
        };
      },
      (prayer: PrayerItem, type: 'start' | 'end_reminder') => {
        // Trigger In-App visual banner
        if (type === 'start') {
          setActiveAlertToast({
            title: `Adhan Time for ${prayer.name}`,
            message: `It is now time for ${prayer.name} (${prayer.arabicName}) prayer.`,
            type: 'start',
          });
        } else {
          setActiveAlertToast({
            title: `⏳ Reminder: ${prayer.name} Ending Soon`,
            message: `${prayer.name} prayer window ends in ${settingsRef.current.endReminderMinutes} minutes. Complete your salah.`,
            type: 'end_reminder',
          });
        }
      }
    );

    return () => {
      alertScheduler.stop();
    };
  }, []);

  const handleRequestPermission = () => {
    setIsNotificationModalOpen(true);
  };

  const handleTogglePrayerAlert = (prayerId: PrayerName) => {
    setSettings((prev) => {
      const currentVal = prev.prayerAlerts[prayerId] !== false;
      return {
        ...prev,
        prayerAlerts: {
          ...prev.prayerAlerts,
          [prayerId]: !currentVal,
        },
      };
    });
  };

  const handleToggleCurrentAlert = () => {
    if (schedule.currentPrayer) {
      handleTogglePrayerAlert(schedule.currentPrayer.id);
    }
  };

  const handleOpenSoundCustomizerForPrayer = (prayerId: PrayerName) => {
    setPrayerFocusForSounds(prayerId);
    setIsSoundsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header compliant with Top Bar Contract */}
      <Header
        location={location}
        notificationPermission={notificationPermission}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenGitHubPublish={() => setIsGitHubPublishModalOpen(true)}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onOpenSounds={() => {
          setPrayerFocusForSounds(null);
          setIsSoundsModalOpen(true);
        }}
        onOpenQibla={() => setIsQiblaModalOpen(true)}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Floating In-App Alert Banner (when prayer or pre-end reminder triggers) */}
      {activeAlertToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-bounce">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 ${
              activeAlertToast.type === 'start'
                ? 'bg-emerald-950/95 border-emerald-500/80 text-white'
                : 'bg-amber-950/95 border-amber-500/80 text-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  activeAlertToast.type === 'start'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {activeAlertToast.type === 'start' ? (
                  <Bell className="w-5 h-5 animate-pulse" />
                ) : (
                  <Hourglass className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold">{activeAlertToast.title}</h4>
                <p className="text-xs text-slate-200 mt-0.5">{activeAlertToast.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => stopAllSounds()}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Silence sound"
              >
                <VolumeX className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveAlertToast(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-28 md:pb-8">
        {/* Permission / Status Alert Banner if not enabled */}
        {notificationPermission !== 'granted' && (
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {notificationPermission === 'denied'
                    ? 'Push Notifications Blocked by Browser'
                    : 'Enable Push Notifications for Adhan & End Reminders'}
                </h3>
                <p className="text-xs text-slate-300">
                  {notificationPermission === 'denied'
                    ? 'Notifications are blocked in site settings. Click to view quick reset instructions or test audio alerts.'
                    : 'Receive timely notifications for each prayer throughout the day and warning before prayer times expire.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white whitespace-nowrap shadow-md transition-colors text-center"
              >
                {notificationPermission === 'denied' ? 'Resolve in Settings' : 'Configure Notifications'}
              </button>
            </div>
          </div>
        )}

        {/* Hero Prayer Card with Current Prayer, End Time Countdown, and Next Prayer */}
        <HeroPrayerCard
          summary={schedule}
          location={location}
          settings={settings}
          notificationPermission={notificationPermission}
          onRequestPermission={handleRequestPermission}
          onOpenSounds={() => {
            setPrayerFocusForSounds(null);
            setIsSoundsModalOpen(true);
          }}
          onOpenQibla={() => setIsQiblaModalOpen(true)}
          onToggleCurrentAlert={handleToggleCurrentAlert}
        />

        {/* Daily Prayer List with customized sound badges & toggles */}
        <DailyPrayerList
          prayers={schedule.prayers}
          settings={settings}
          onToggleAlert={handleTogglePrayerAlert}
          onOpenSoundCustomizerForPrayer={handleOpenSoundCustomizerForPrayer}
        />

        {/* Informative Islamic Wisdom & Feature Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-900">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 shrink-0">
              <Hourglass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">End-of-Prayer Reminder</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Alerts you {settings.endReminderMinutes} minutes before each prayer ends so you never miss completing your obligatory salah on time.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Custom Alert Sounds</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Choose between Makkah, Madinah, Fajr melodies, acoustic chimes, or quiet taps. Audition each sound in the sound library.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Astronomical Accuracy</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Precise solar position calculations via {settings.calculationMethod} and {settings.madhab === 'hanafi' ? 'Hanafi' : 'Standard'} madhab.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Noor Prayer Times</span>
            <span aria-hidden="true">·</span>
            <span>Accurate GPS &amp; Astronomical Timing</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => setIsGitHubPublishModalOpen(true)}
              className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <span>📱 Phone &amp; GitHub Setup</span>
            </button>
            <button onClick={() => setIsNotificationModalOpen(true)} className="hover:text-emerald-400 transition-colors">
              Notification Status
            </button>
            <button onClick={() => setIsSoundsModalOpen(true)} className="hover:text-emerald-400 transition-colors">
              Sound Settings
            </button>
            <button onClick={() => setIsCalendarModalOpen(true)} className="hover:text-emerald-400 transition-colors">
              Monthly Schedule
            </button>
            <button onClick={() => setIsSettingsModalOpen(true)} className="hover:text-emerald-400 transition-colors">
              Calculation Method
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={settings}
        permissionState={notificationPermission}
        onPermissionChange={setNotificationPermission}
        onOpenSoundSettings={() => {
          setIsNotificationModalOpen(false);
          setIsSoundsModalOpen(true);
        }}
      />

      <GitHubPublishModal
        isOpen={isGitHubPublishModalOpen}
        onClose={() => setIsGitHubPublishModalOpen(false)}
      />

      <SoundCustomizerModal
        isOpen={isSoundsModalOpen}
        onClose={() => setIsSoundsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        initialPrayerFocus={prayerFocusForSounds}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={location}
        onSelectLocation={setLocation}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <QiblaModal
        isOpen={isQiblaModalOpen}
        onClose={() => setIsQiblaModalOpen(false)}
        location={location}
        bearing={schedule.qiblaBearing}
      />

      <MonthlyCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        location={location}
        settings={settings}
      />

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens) */}
      <MobileTabBar
        onOpenSounds={() => {
          setPrayerFocusForSounds(null);
          setIsSoundsModalOpen(true);
        }}
        onOpenQibla={() => setIsQiblaModalOpen(true)}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onOpenMore={() => setIsMobileMenuOpen(true)}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Mobile Drawer Menu Modal */}
      <MobileMenuModal
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        location={location}
        notificationPermission={notificationPermission}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenGitHubPublish={() => setIsGitHubPublishModalOpen(true)}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onOpenSounds={() => {
          setPrayerFocusForSounds(null);
          setIsSoundsModalOpen(true);
        }}
        onOpenQibla={() => setIsQiblaModalOpen(true)}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
      />
    </div>
  );
}
