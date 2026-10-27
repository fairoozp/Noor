export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type AlertSoundId = 
  | 'adhan_makkah'
  | 'adhan_madinah'
  | 'adhan_fajr_melody'
  | 'adhan_alaqsa'
  | 'adhan_mishary'
  | 'adhan_abdulbasit'
  | 'soft_dawn_chime'
  | 'oud_melody'
  | 'resonant_bowl'
  | 'gentle_bell'
  | 'subtle_chime'
  | 'warning_gong'
  | 'warning_pulse'
  | 'warning_woodblock'
  | 'mute';

export interface SoundPreset {
  id: AlertSoundId;
  name: string;
  category: 'adhan' | 'melodic' | 'chime' | 'warning' | 'silent';
  description: string;
}

export interface PrayerItem {
  id: PrayerName;
  name: string;
  arabicName: string;
  startTime: Date;
  endTime: Date;
  isCurrent: boolean;
  isNext: boolean;
  soundId: AlertSoundId;
  alertEnabled: boolean;
}

export interface UserLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  isAutoDetected: boolean;
}

export interface PrayerSettings {
  calculationMethod: 'MuslimWorldLeague' | 'NorthAmerica' | 'Egyptian' | 'UmmAlQura' | 'Karachi' | 'Tehran' | 'Dubai' | 'Qatar' | 'Kuwait' | 'Singapore' | 'Turkey';
  madhab: 'shafi' | 'hanafi';
  highLatitudeRule: 'middleOfTheNight' | 'seventhOfTheNight' | 'twilightAngle';
  timeFormat: '12h' | '24h';
  endReminderMinutes: number; // e.g. 15 minutes before prayer ends
  endReminderEnabled: boolean;
  endReminderSoundId: AlertSoundId;
  masterVolume: number; // 0 to 1
  prayerSounds: Record<PrayerName, AlertSoundId>;
  prayerAlerts: Record<PrayerName, boolean>;
  autoDetectLocation: boolean;
}

export interface CityOption {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}
