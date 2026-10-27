import React, { useState } from 'react';
import { X, Volume2, Play, Square, Bell, Hourglass, Check, Sliders, Sparkles } from 'lucide-react';
import { AlertSoundId, PrayerName, PrayerSettings, SoundPreset } from '../types/prayer.ts';
import { playAlertSound, SOUND_PRESETS, stopAllSounds } from '../services/soundEngine.ts';
import { sendTestNotification } from '../services/notificationService.ts';
import { PRAYER_NAMES_CONFIG } from '../services/prayerService.ts';

interface SoundCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrayerSettings;
  onUpdateSettings: (newSettings: PrayerSettings) => void;
  initialPrayerFocus?: PrayerName | null;
}

export const SoundCustomizerModal: React.FC<SoundCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  initialPrayerFocus,
}) => {
  const [activeTab, setActiveTab] = useState<'prayers' | 'end_reminder' | 'soundboard'>('prayers');
  const [selectedPrayerForEdit, setSelectedPrayerForEdit] = useState<PrayerName>(initialPrayerFocus || 'fajr');
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePlayPreview = (soundId: AlertSoundId) => {
    if (playingSoundId === soundId) {
      stopAllSounds();
      setPlayingSoundId(null);
    } else {
      setPlayingSoundId(soundId);
      playAlertSound(soundId, settings.masterVolume);
      // Auto reset after 10s
      setTimeout(() => {
        setPlayingSoundId(curr => (curr === soundId ? null : curr));
      }, 10000);
    }
  };

  const handleSelectSoundForPrayer = (prayer: PrayerName, soundId: AlertSoundId) => {
    const updated = {
      ...settings,
      prayerSounds: {
        ...settings.prayerSounds,
        [prayer]: soundId,
      },
    };
    onUpdateSettings(updated);
  };

  const handleUpdateEndReminderMinutes = (minutes: number) => {
    onUpdateSettings({
      ...settings,
      endReminderMinutes: minutes,
    });
  };

  const handleUpdateEndReminderSound = (soundId: AlertSoundId) => {
    onUpdateSettings({
      ...settings,
      endReminderSoundId: soundId,
    });
  };

  const handleToggleEndReminder = () => {
    onUpdateSettings({
      ...settings,
      endReminderEnabled: !settings.endReminderEnabled,
    });
  };

  const handleVolumeChange = (vol: number) => {
    onUpdateSettings({
      ...settings,
      masterVolume: vol,
    });
  };

  const handleTriggerTest = (type: 'prayer_start' | 'prayer_end') => {
    const soundId = type === 'prayer_start'
      ? settings.prayerSounds[selectedPrayerForEdit]
      : settings.endReminderSoundId;

    const prayerName = PRAYER_NAMES_CONFIG[selectedPrayerForEdit].name;
    sendTestNotification(prayerName, soundId, settings.masterVolume, type);
    setTestStatus(type === 'prayer_start' ? 'Adhan test alert triggered!' : 'End warning test triggered!');
    setTimeout(() => setTestStatus(null), 3000);
  };

  const prayerList: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Alert Sounds &amp; Reminders</h2>
              <p className="text-xs text-slate-400">Customize distinct alert audio for each prayer &amp; ending countdowns</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAllSounds();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Volume Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Master Alert Volume:</span>
            <span className="font-mono text-emerald-400 font-semibold">{Math.round(settings.masterVolume * 100)}%</span>
          </div>

          <div className="flex items-center gap-3 w-48 sm:w-64">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('prayers')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
              activeTab === 'prayers'
                ? 'border-emerald-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Per-Prayer Adhan Sounds
            </span>
          </button>

          <button
            onClick={() => setActiveTab('end_reminder')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
              activeTab === 'end_reminder'
                ? 'border-emerald-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Hourglass className="w-3.5 h-3.5 text-amber-400" />
              End-of-Prayer Reminder
            </span>
          </button>

          <button
            onClick={() => setActiveTab('soundboard')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 ${
              activeTab === 'soundboard'
                ? 'border-emerald-500 text-white bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Sound Library Preview
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: PER-PRAYER AUDIO */}
          {activeTab === 'prayers' && (
            <div className="space-y-6">
              {/* Prayer Selector Pills */}
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-2">
                  Select Prayer to Configure:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {prayerList.map((p) => {
                    const cfg = PRAYER_NAMES_CONFIG[p];
                    const isSelected = selectedPrayerForEdit === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedPrayerForEdit(p)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/30'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="text-xs">{cfg.name}</div>
                        <div className="text-[11px] font-arabic opacity-80">{cfg.arabicName}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Selection for the chosen prayer */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Assigned sound for</span>
                  <span className="text-sm font-bold text-white ml-1.5">
                    {PRAYER_NAMES_CONFIG[selectedPrayerForEdit].name} ({PRAYER_NAMES_CONFIG[selectedPrayerForEdit].arabicName})
                  </span>
                  <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                    {SOUND_PRESETS.find(s => s.id === settings.prayerSounds[selectedPrayerForEdit])?.name || 'Makkah Adhan'}
                  </div>
                </div>

                <button
                  onClick={() => handleTriggerTest('prayer_start')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  Test This Alert
                </button>
              </div>

              {/* Sound Choices Grid */}
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-3">
                  Choose Sound for {PRAYER_NAMES_CONFIG[selectedPrayerForEdit].name}:
                </label>
                <div className="space-y-2">
                  {SOUND_PRESETS.map((preset) => {
                    const isSelected = settings.prayerSounds[selectedPrayerForEdit] === preset.id;
                    const isPlaying = playingSoundId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectSoundForPrayer(selectedPrayerForEdit, preset.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                            : 'bg-slate-800/30 border-slate-800/80 hover:bg-slate-800/70 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPreview(preset.id);
                            }}
                            className={`p-2 rounded-lg transition-colors shrink-0 ${
                              isPlaying
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                            }`}
                            title={isPlaying ? 'Stop' : 'Audition Sound'}
                          >
                            {isPlaying ? (
                              <Square className="w-4 h-4 fill-amber-400" />
                            ) : (
                              <Play className="w-4 h-4 fill-emerald-400" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 text-slate-400 bg-slate-800 rounded">
                                {preset.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{preset.description}</p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-slate-700" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: END-OF-PRAYER REMINDER */}
          {activeTab === 'end_reminder' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Hourglass className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Pre-Expiry Prayer Alert</h3>
                      <p className="text-xs text-amber-200/80">Sends a notification before the current prayer window expires</p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleEndReminder}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      settings.endReminderEnabled
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {settings.endReminderEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Lead Time Selection */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-2">
                  Remind Me Before Prayer Ends:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[5, 10, 15, 20, 30].map((mins) => {
                    const isSelected = settings.endReminderMinutes === mins;
                    return (
                      <button
                        key={mins}
                        onClick={() => handleUpdateEndReminderMinutes(mins)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-500/30'
                            : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="text-lg font-mono font-bold">{mins}</div>
                        <div className="text-[11px] text-slate-400">minutes</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound selection for end warning */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-slate-300">
                    Warning Alert Sound:
                  </label>
                  <button
                    onClick={() => handleTriggerTest('prayer_end')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Test Warning Alert Now
                  </button>
                </div>

                <div className="space-y-2">
                  {SOUND_PRESETS.filter(s => s.category === 'warning' || s.category === 'chime' || s.category === 'silent').map((preset) => {
                    const isSelected = settings.endReminderSoundId === preset.id;
                    const isPlaying = playingSoundId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleUpdateEndReminderSound(preset.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500/50 text-white'
                            : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/70 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPreview(preset.id);
                            }}
                            className={`p-2 rounded-lg transition-colors shrink-0 ${
                              isPlaying
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                            }`}
                          >
                            {isPlaying ? (
                              <Square className="w-4 h-4 fill-amber-400" />
                            ) : (
                              <Play className="w-4 h-4 fill-amber-400" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block">{preset.name}</span>
                            <span className="text-[11px] text-slate-400 block truncate">{preset.description}</span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FULL SOUND LIBRARY PREVIEW */}
          {activeTab === 'soundboard' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Audition all built-in acoustic presets synthesized via the Web Audio API. Each tone is crafted with real acoustic harmonics and resonant decays.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOUND_PRESETS.map((preset) => {
                  const isPlaying = playingSoundId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3"
                    >
                      <button
                        onClick={() => handlePlayPreview(preset.id)}
                        className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                          isPlaying
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900'
                        }`}
                        title={isPlaying ? 'Stop' : 'Play'}
                      >
                        {isPlaying ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate">{preset.name}</h4>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">{preset.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{preset.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-emerald-400 font-medium">
            {testStatus || 'All sound changes save automatically'}
          </div>

          <button
            onClick={() => {
              stopAllSounds();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
