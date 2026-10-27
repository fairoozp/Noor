import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab,
  HighLatitudeRule,
  Qibla as calculateQibla,
} from 'adhan';
import { PrayerItem, PrayerName, PrayerSettings, UserLocation } from '../types/prayer.ts';

export const PRAYER_NAMES_CONFIG: Record<PrayerName, { name: string; arabicName: string }> = {
  fajr: { name: 'Fajr', arabicName: 'الفجر' },
  sunrise: { name: 'Sunrise', arabicName: 'الشروق' },
  dhuhr: { name: 'Dhuhr', arabicName: 'الظهر' },
  asr: { name: 'Asr', arabicName: 'العصر' },
  maghrib: { name: 'Maghrib', arabicName: 'المغرب' },
  isha: { name: 'Isha', arabicName: 'العشاء' },
};

export function getCalculationParameters(
  methodName: PrayerSettings['calculationMethod'],
  madhab: PrayerSettings['madhab'],
  highLatRule: PrayerSettings['highLatitudeRule']
) {
  let params;
  switch (methodName) {
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'Karachi':
      params = CalculationMethod.Karachi();
      break;
    case 'Tehran':
      params = CalculationMethod.Tehran();
      break;
    case 'Dubai':
      params = CalculationMethod.Dubai();
      break;
    case 'Qatar':
      params = CalculationMethod.Qatar();
      break;
    case 'Kuwait':
      params = CalculationMethod.Kuwait();
      break;
    case 'Singapore':
      params = CalculationMethod.Singapore();
      break;
    case 'Turkey':
      params = CalculationMethod.Turkey();
      break;
    default:
      params = CalculationMethod.MuslimWorldLeague();
  }

  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  if (highLatRule === 'seventhOfTheNight') {
    params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  } else if (highLatRule === 'twilightAngle') {
    params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  } else {
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  }

  return params;
}

export interface DayPrayerSummary {
  prayers: PrayerItem[];
  currentPrayer: PrayerItem | null;
  nextPrayer: PrayerItem | null;
  timeUntilNext: number; // in milliseconds
  timeUntilCurrentEnds: number; // in milliseconds
  currentProgressPercent: number; // 0 to 100
  qiblaBearing: number; // degrees from true North
  hijriDateFormatted: string;
}

export function computePrayerSchedule(
  location: UserLocation,
  settings: PrayerSettings,
  targetDate: Date = new Date()
): DayPrayerSummary {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = getCalculationParameters(settings.calculationMethod, settings.madhab, settings.highLatitudeRule);

  // Today's prayer times
  const todayTimes = new PrayerTimes(coords, targetDate, params);

  // Tomorrow's prayer times (for Isha end time & Fajr transition)
  const tomorrow = new Date(targetDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = new PrayerTimes(coords, tomorrow, params);

  // Calculate prayer end times according to Islamic jurisprudence:
  // Fajr ends at Sunrise
  // Sunrise ends at Dhuhr (solar zenith)
  // Dhuhr ends at Asr
  // Asr ends at Maghrib (sunset)
  // Maghrib ends at Isha (twilight disappearance)
  // Isha ends at midnight (halfway between Maghrib and tomorrow Fajr)
  const midnightTime = new Date(
    todayTimes.maghrib.getTime() + (tomorrowTimes.fajr.getTime() - todayTimes.maghrib.getTime()) / 2
  );

  const rawList: { id: PrayerName; start: Date; end: Date }[] = [
    { id: 'fajr', start: todayTimes.fajr, end: todayTimes.sunrise },
    { id: 'sunrise', start: todayTimes.sunrise, end: todayTimes.dhuhr },
    { id: 'dhuhr', start: todayTimes.dhuhr, end: todayTimes.asr },
    { id: 'asr', start: todayTimes.asr, end: todayTimes.maghrib },
    { id: 'maghrib', start: todayTimes.maghrib, end: todayTimes.isha },
    { id: 'isha', start: todayTimes.isha, end: midnightTime },
  ];

  const nowMs = targetDate.getTime();

  // Find current prayer
  let currentPrayerId: PrayerName | null = null;
  let nextPrayerId: PrayerName | null = null;

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (nowMs >= item.start.getTime() && nowMs < item.end.getTime()) {
      currentPrayerId = item.id;
      nextPrayerId = rawList[(i + 1) % rawList.length].id;
      break;
    }
  }

  // Edge case: after Isha end (midnight) but before today's Fajr
  if (!currentPrayerId) {
    if (nowMs < todayTimes.fajr.getTime()) {
      currentPrayerId = null;
      nextPrayerId = 'fajr';
    } else if (nowMs >= todayTimes.isha.getTime()) {
      currentPrayerId = 'isha';
      nextPrayerId = 'fajr';
    }
  }

  const prayers: PrayerItem[] = rawList.map((item) => {
    const cfg = PRAYER_NAMES_CONFIG[item.id];
    const isCurrent = currentPrayerId === item.id;
    const isNext = nextPrayerId === item.id;

    return {
      id: item.id,
      name: cfg.name,
      arabicName: cfg.arabicName,
      startTime: item.start,
      endTime: item.end,
      isCurrent,
      isNext,
      soundId: settings.prayerSounds[item.id] || 'adhan_makkah',
      alertEnabled: settings.prayerAlerts[item.id] !== false,
    };
  });

  const currentItem = prayers.find((p) => p.isCurrent) || null;
  const nextItem = prayers.find((p) => p.isNext) || null;

  // Next prayer timing
  let timeUntilNext = 0;
  if (nextItem) {
    let nextStartMs = nextItem.startTime.getTime();
    if (nextStartMs < nowMs) {
      nextStartMs = tomorrowTimes.fajr.getTime();
    }
    timeUntilNext = Math.max(0, nextStartMs - nowMs);
  } else {
    timeUntilNext = Math.max(0, tomorrowTimes.fajr.getTime() - nowMs);
  }

  let timeUntilCurrentEnds = 0;
  let currentProgressPercent = 0;

  if (currentItem) {
    const totalDuration = currentItem.endTime.getTime() - currentItem.startTime.getTime();
    const elapsed = nowMs - currentItem.startTime.getTime();
    timeUntilCurrentEnds = Math.max(0, currentItem.endTime.getTime() - nowMs);
    currentProgressPercent = Math.min(100, Math.max(0, (elapsed / Math.max(1, totalDuration)) * 100));
  }

  // Calculate Qibla bearing
  let qiblaBearing = 0;
  try {
    qiblaBearing = calculateQibla(coords);
  } catch {
    qiblaBearing = 0;
  }

  // Format Hijri Date
  let hijriDateFormatted = '';
  try {
    const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    hijriDateFormatted = hijriFormatter.format(targetDate);
  } catch {
    hijriDateFormatted = 'Islamic Calendar';
  }

  return {
    prayers,
    currentPrayer: currentItem,
    nextPrayer: nextItem,
    timeUntilNext,
    timeUntilCurrentEnds,
    currentProgressPercent,
    qiblaBearing: Math.round(qiblaBearing * 10) / 10,
    hijriDateFormatted,
  };
}

export function formatTime(date: Date, is24Hour = false): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !is24Hour,
  }).format(date);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatDurationShort(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
