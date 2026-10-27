import React from 'react';
import { X, Settings, Check, BookOpen, Clock } from 'lucide-react';
import { PrayerSettings } from '../types/prayer';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrayerSettings;
  onUpdateSettings: (newSettings: PrayerSettings) => void;
}

const METHODS = [
  { id: 'MuslimWorldLeague', name: 'Muslim World League (MWL)', desc: 'Fajr 18°, Isha 17°. Standard in Europe, Far East, and parts of the Middle East.' },
  { id: 'NorthAmerica', name: 'ISNA (North America)', desc: 'Fajr 15°, Isha 15°. Standard across the United States and Canada.' },
  { id: 'UmmAlQura', name: 'Umm Al-Qura University, Makkah', desc: 'Fajr 18.5°, Isha 90 min after Maghrib (120 min in Ramadan). Official in Saudi Arabia.' },
  { id: 'Egyptian', name: 'Egyptian General Authority of Survey', desc: 'Fajr 19.5°, Isha 17.5°. Standard in Egypt, Africa, Syria, and Lebanon.' },
  { id: 'Karachi', name: 'University of Islamic Sciences, Karachi', desc: 'Fajr 18°, Isha 18°. Standard in Pakistan, Bangladesh, India, and Afghanistan.' },
  { id: 'Dubai', name: 'Dubai / UAE Awqaf', desc: 'Official Islamic calculation method for UAE and Gulf regions.' },
  { id: 'Qatar', name: 'Qatar Calendar House', desc: 'Official calculation standard for Qatar.' },
  { id: 'Kuwait', name: 'Kuwait Ministry of Awqaf', desc: 'Fajr 18°, Isha 17.5°. Official in Kuwait.' },
  { id: 'Turkey', name: 'Diyanet İşleri Başkanlığı (Turkey)', desc: 'Official calculation method in Turkey and Turkish communities.' },
  { id: 'Singapore', name: 'MUIS (Singapore)', desc: 'Majlis Ugama Islam Singapura official standard.' },
  { id: 'Tehran', name: 'Institute of Geophysics, Tehran', desc: 'Fajr 17.7°, Isha 14°, Maghrib 4.5°.' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Calculation &amp; Preferences</h2>
              <p className="text-xs text-slate-400">Astronomical formulas, juristic madhab, and display format</p>
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
          {/* Time Format */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Time Display Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateSettings({ ...settings, timeFormat: '12h' })}
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  settings.timeFormat === '12h'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white font-medium'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <div className="text-xs font-bold">12-Hour (AM / PM)</div>
                  <div className="text-[11px] text-slate-400">e.g. 5:24 AM, 6:15 PM</div>
                </div>
                {settings.timeFormat === '12h' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => onUpdateSettings({ ...settings, timeFormat: '24h' })}
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  settings.timeFormat === '24h'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white font-medium'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <div className="text-xs font-bold">24-Hour (Military)</div>
                  <div className="text-[11px] text-slate-400">e.g. 05:24, 18:15</div>
                </div>
                {settings.timeFormat === '24h' && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Asr Juristic Method (Madhab) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Asr Juristic Calculation (Madhab)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateSettings({ ...settings, madhab: 'shafi' })}
                className={`p-3.5 rounded-xl border flex items-start justify-between transition-colors ${
                  settings.madhab === 'shafi'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white font-medium'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <div className="text-xs font-bold">Standard (Shafi, Maliki, Hanbali)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Shadow length equals object height (1x shadow factor).
                  </div>
                </div>
                {settings.madhab === 'shafi' && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              </button>

              <button
                onClick={() => onUpdateSettings({ ...settings, madhab: 'hanafi' })}
                className={`p-3.5 rounded-xl border flex items-start justify-between transition-colors ${
                  settings.madhab === 'hanafi'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white font-medium'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <div className="text-xs font-bold">Hanafi</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Shadow length equals twice object height (2x shadow factor).
                  </div>
                </div>
                {settings.madhab === 'hanafi' && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              </button>
            </div>
          </div>

          {/* Calculation Convention */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Islamic Calculation Authority / Method
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {METHODS.map((method) => {
                const isSelected = settings.calculationMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => onUpdateSettings({ ...settings, calculationMethod: method.id as any })}
                    className={`w-full p-3 rounded-xl border text-left flex items-start justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/70 text-white'
                        : 'bg-slate-800/30 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{method.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{method.desc}</div>
                    </div>
                    {isSelected && (
                      <span className="text-emerald-400 shrink-0 ml-2 mt-0.5">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
