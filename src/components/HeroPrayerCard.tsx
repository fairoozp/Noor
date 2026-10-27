import React from 'react';
import { Clock, Bell, BellOff, Volume2, ArrowRight, Hourglass } from 'lucide-react';
import { DayPrayerSummary, formatTime, formatDuration } from '../services/prayerService.ts';
import { PrayerSettings, UserLocation } from '../types/prayer.ts';
import { NotificationPermissionState } from '../services/notificationService.ts';

interface HeroPrayerCardProps {
  summary: DayPrayerSummary;
  location: UserLocation;
  settings: PrayerSettings;
  notificationPermission: NotificationPermissionState;
  onRequestPermission: () => void;
  onOpenSounds: () => void;
  onOpenQibla: () => void;
  onToggleCurrentAlert: () => void;
}

export const HeroPrayerCard: React.FC<HeroPrayerCardProps> = ({
  summary,
  location,
  settings,
  notificationPermission,
  onRequestPermission,
  onOpenSounds,
  onOpenQibla,
  onToggleCurrentAlert,
}) => {
  const current = summary.currentPrayer;
  const next = summary.nextPrayer;
  const is24h = settings.timeFormat === '24h';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
      {/* Background Architectural Photography with Measured Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/islamic_twilight_serene_1793108272814.jpg"
          alt="Serene twilight Islamic architecture"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[360px] gap-8">
        {/* Top Kicker: Hijri & Gregorian Date and Location Context */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-emerald-400">{location.city}, {location.country}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">{summary.hijriDateFormatted}</span>
          </div>

          <div className="flex items-center gap-2">
            {notificationPermission !== 'granted' ? (
              <button
                onClick={onRequestPermission}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30 transition-all text-[11px] font-semibold shadow-sm"
                title="Configure and enable push notifications"
              >
                <BellOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Enable Push Notifications</span>
              </button>
            ) : (
              <button
                onClick={onRequestPermission}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-[11px] font-semibold"
                title="Push notifications active - click to test"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alerts Active</span>
              </button>
            )}
            <span aria-hidden="true" className="text-slate-600">·</span>
            <button
              onClick={onOpenQibla}
              className="hover:text-emerald-300 transition-colors text-[11px]"
            >
              Qibla {summary.qiblaBearing}°
            </button>
          </div>
        </div>

        {/* Center: Main Prayer Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          {/* Ongoing Prayer & End Time Countdown */}
          <div className="lg:col-span-7 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-emerald-400">
              <Clock className="w-4 h-4" />
              <span>Current Prayer Time</span>
            </div>

            {current ? (
              <div>
                <div className="flex items-baseline gap-3">
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                    {current.name}
                  </h1>
                  <span className="text-3xl sm:text-4xl font-arabic text-emerald-300/80">
                    {current.arabicName}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-300 flex items-center gap-2">
                  <span>Window: {formatTime(current.startTime, is24h)} – {formatTime(current.endTime, is24h)}</span>
                </div>

                {/* Critical Requirement: Time remaining before prayer ends */}
                <div className="mt-5 p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <Hourglass className="w-3.5 h-3.5" />
                      Time left before {current.name} ends:
                    </span>
                    <span className="font-mono text-emerald-400 tabular-nums font-semibold text-sm">
                      {formatDuration(summary.timeUntilCurrentEnds)}
                    </span>
                  </div>

                  {/* Visual Elapsed Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${summary.currentProgressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>Started {formatTime(current.startTime, is24h)}</span>
                    <span className="text-amber-300/90 font-medium">
                      Ends at {formatTime(current.endTime, is24h)} ({settings.endReminderMinutes}m reminder active)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  Night Hours (Imsak / Tahajjud)
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Waiting for Fajr dawn prayer.
                </p>
              </div>
            )}
          </div>

          {/* Next Prayer Countdown Card */}
          <div className="lg:col-span-5 flex flex-col justify-end">
            {next && (
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-slate-300">Next Prayer</span>
                  <span className="text-emerald-400 font-arabic text-sm">{next.arabicName}</span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">{next.name}</div>
                  <div className="text-sm font-medium text-slate-300">{formatTime(next.startTime, is24h)}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-slate-400">Starting in</span>
                  <span className="text-lg font-bold font-mono text-emerald-300 tabular-nums">
                    {formatDuration(summary.timeUntilNext)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Quick Controls Strip */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSounds}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customize Alert Sounds</span>
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Pre-end warning: {settings.endReminderMinutes}m before expiry
            </span>
          </div>

          {current && (
            <button
              onClick={onToggleCurrentAlert}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              {current.alertEnabled ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{current.name} Alert On</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>{current.name} Alert Off</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
