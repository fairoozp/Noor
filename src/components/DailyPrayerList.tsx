import React, { useState } from 'react';
import { Bell, BellOff, Volume2, Play, Square, AlertCircle } from 'lucide-react';
import { PrayerItem, PrayerName, PrayerSettings } from '../types/prayer.ts';
import { formatTime } from '../services/prayerService.ts';
import { playAlertSound, SOUND_PRESETS, stopAllSounds } from '../services/soundEngine.ts';

interface DailyPrayerListProps {
  prayers: PrayerItem[];
  settings: PrayerSettings;
  onToggleAlert: (prayerId: PrayerName) => void;
  onOpenSoundCustomizerForPrayer: (prayerId: PrayerName) => void;
}

export const DailyPrayerList: React.FC<DailyPrayerListProps> = ({
  prayers,
  settings,
  onToggleAlert,
  onOpenSoundCustomizerForPrayer,
}) => {
  const is24h = settings.timeFormat === '24h';
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);

  const handlePreviewSound = (e: React.MouseEvent, soundId: string) => {
    e.stopPropagation();
    if (playingSoundId === soundId) {
      stopAllSounds();
      setPlayingSoundId(null);
    } else {
      setPlayingSoundId(soundId);
      const handle = playAlertSound(soundId as any, settings.masterVolume);
      // Auto-reset state after audio duration or 12 seconds
      setTimeout(() => {
        setPlayingSoundId(prev => (prev === soundId ? null : prev));
      }, 10000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Daily Prayer Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Prayer windows with personalized Adhan alerts &amp; end-of-prayer timers
          </p>
        </div>

        <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
          <span>End Reminder:</span>
          <span className="font-semibold text-emerald-400">
            {settings.endReminderEnabled ? `${settings.endReminderMinutes}m before expiry` : 'Disabled'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {prayers.map((prayer) => {
          const soundPreset = SOUND_PRESETS.find(s => s.id === prayer.soundId) || SOUND_PRESETS[0];
          const isPlayingThis = playingSoundId === prayer.soundId;

          return (
            <div
              key={prayer.id}
              className={`group relative p-5 rounded-2xl border transition-all ${
                prayer.isCurrent
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              {/* Top row: Name & Arabic */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      prayer.isCurrent
                        ? 'bg-emerald-400'
                        : prayer.isNext
                        ? 'bg-teal-400'
                        : 'bg-slate-700'
                    }`}
                  />
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {prayer.name}
                      {prayer.isCurrent && (
                        <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                          (Active Now)
                        </span>
                      )}
                      {prayer.isNext && (
                        <span className="text-[10px] font-medium text-teal-400 uppercase tracking-wider">
                          (Next)
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <span className="text-2xl font-arabic text-slate-400 group-hover:text-emerald-300 transition-colors">
                  {prayer.arabicName}
                </span>
              </div>

              {/* Time Window (Start & End) */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Starts</span>
                  <span className="text-2xl font-bold font-mono text-white tabular-nums">
                    {formatTime(prayer.startTime, is24h)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Ends At</span>
                  <span className="text-sm font-semibold font-mono text-slate-300 tabular-nums">
                    {formatTime(prayer.endTime, is24h)}
                  </span>
                </div>
              </div>

              {/* Sound & Alert Controls */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                {/* Sound Name & Audition Button */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    onClick={(e) => handlePreviewSound(e, prayer.soundId)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition-colors shrink-0"
                    title={isPlayingThis ? 'Stop Audio' : 'Preview Sound'}
                  >
                    {isPlayingThis ? (
                      <Square className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    )}
                  </button>

                  <button
                    onClick={() => onOpenSoundCustomizerForPrayer(prayer.id)}
                    className="text-xs text-slate-400 hover:text-emerald-300 transition-colors truncate text-left"
                    title="Change sound for this prayer"
                  >
                    <span className="truncate block font-medium">
                      {prayer.soundId === 'mute' ? 'Silent' : soundPreset.name}
                    </span>
                  </button>
                </div>

                {/* Toggle Notification */}
                <button
                  onClick={() => onToggleAlert(prayer.id)}
                  className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                    prayer.alertEnabled
                      ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/60'
                      : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                  title={prayer.alertEnabled ? 'Disable notification for this prayer' : 'Enable notification for this prayer'}
                >
                  {prayer.alertEnabled ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
