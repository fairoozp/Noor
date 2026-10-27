import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Coordinates, PrayerTimes } from 'adhan';
import { PrayerSettings, UserLocation } from '../types/prayer.ts';
import { getCalculationParameters, formatTime } from '../services/prayerService.ts';

interface MonthlyCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: UserLocation;
  settings: PrayerSettings;
}

export const MonthlyCalendarModal: React.FC<MonthlyCalendarModalProps> = ({
  isOpen,
  onClose,
  location,
  settings,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());

  if (!isOpen) return null;

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const coords = new Coordinates(location.latitude, location.longitude);
  const params = getCalculationParameters(settings.calculationMethod, settings.madhab, settings.highLatitudeRule);
  const is24h = settings.timeFormat === '24h';

  const rows = [];
  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const times = new PrayerTimes(coords, d, params);
    const isToday =
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year;

    rows.push({
      day,
      date: d,
      isToday,
      fajr: formatTime(times.fajr, is24h),
      sunrise: formatTime(times.sunrise, is24h),
      dhuhr: formatTime(times.dhuhr, is24h),
      asr: formatTime(times.asr, is24h),
      maghrib: formatTime(times.maghrib, is24h),
      isha: formatTime(times.isha, is24h),
    });
  }

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentMonthDate);

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Prayer Timetable</h2>
              <p className="text-xs text-slate-400">{location.city}, {location.country} · {monthName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-200">{monthName}</span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timetable */}
        <div className="overflow-x-auto flex-1 p-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3 px-3">Day</th>
                <th className="pb-3 px-3">Fajr</th>
                <th className="pb-3 px-3">Sunrise</th>
                <th className="pb-3 px-3">Dhuhr</th>
                <th className="pb-3 px-3">Asr</th>
                <th className="pb-3 px-3">Maghrib</th>
                <th className="pb-3 px-3">Isha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {rows.map((r) => (
                <tr
                  key={r.day}
                  className={`transition-colors ${
                    r.isToday
                      ? 'bg-emerald-950/40 text-emerald-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans font-medium">
                    {r.day}{' '}
                    {r.isToday && (
                      <span className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                        Today
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">{r.fajr}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.sunrise}</td>
                  <td className="py-2.5 px-3">{r.dhuhr}</td>
                  <td className="py-2.5 px-3">{r.asr}</td>
                  <td className="py-2.5 px-3">{r.maghrib}</td>
                  <td className="py-2.5 px-3">{r.isha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
