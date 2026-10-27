import { AlertSoundId, PrayerItem, PrayerSettings } from '../types/prayer.ts';
import { playAlertSound } from './soundEngine.ts';
import { formatTime } from './prayerService.ts';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function isRunningInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<{
  state: NotificationPermissionState;
  reason?: 'iframe' | 'ios_needs_pwa' | 'denied' | 'unsupported' | 'success';
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    if (isIOS() && !isStandalone()) {
      return { state: 'unsupported', reason: 'ios_needs_pwa' };
    }
    return { state: 'unsupported', reason: 'unsupported' };
  }

  // Handle iframe environment safely without uncaught DOMException
  if (isRunningInIframe()) {
    try {
      const perm = await Notification.requestPermission();
      return { state: perm as NotificationPermissionState, reason: perm === 'granted' ? 'success' : 'iframe' };
    } catch {
      return { state: Notification.permission as NotificationPermissionState, reason: 'iframe' };
    }
  }

  try {
    const perm = await Notification.requestPermission();
    return { state: perm as NotificationPermissionState, reason: perm === 'granted' ? 'success' : 'denied' };
  } catch {
    return new Promise((resolve) => {
      try {
        Notification.requestPermission((result) => {
          resolve({ state: result as NotificationPermissionState, reason: result === 'granted' ? 'success' : 'denied' });
        });
      } catch {
        resolve({ state: Notification.permission as NotificationPermissionState, reason: 'denied' });
      }
    });
  }
}

/**
 * Dispatch system notification via ServiceWorker (if registered) or Notification API
 */
export async function showSystemNotification(title: string, options: NotificationOptions) {
  if (getNotificationPermission() !== 'granted') return;

  // Try service worker registration first (preferred on mobile/PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    } catch {
      // fallback to constructor
    }
  }

  // Fallback to Notification constructor
  try {
    new Notification(title, options);
  } catch {
    // suppressed in some sandboxes
  }
}

/**
 * Trigger an instant test notification & sound
 */
export async function sendTestNotification(
  prayerName: string,
  soundId: AlertSoundId | string,
  volume: number,
  type: 'prayer_start' | 'prayer_end' = 'prayer_start'
) {
  // Play sound
  playAlertSound(soundId as AlertSoundId, volume);

  // Send browser notification if permitted
  if (getNotificationPermission() === 'granted') {
    const title = type === 'prayer_start'
      ? `Time for ${prayerName} Prayer`
      : `⚠️ ${prayerName} Ending Soon`;

    const body = type === 'prayer_start'
      ? `It is now time to perform the ${prayerName} prayer. (Sound: ${soundId})`
      : `Reminder: ${prayerName} prayer time ends in a few minutes. Please complete your salah.`;

    await showSystemNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `test-${Date.now()}`,
    });
  }
}

export class PrayerAlertScheduler {
  private firedAlerts: Set<string> = new Set();
  private intervalId: number | null = null;
  private onAlertTriggered?: (prayer: PrayerItem, type: 'start' | 'end_reminder') => void;

  public start(
    getSchedule: () => { prayers: PrayerItem[]; settings: PrayerSettings },
    onAlertTriggered?: (prayer: PrayerItem, type: 'start' | 'end_reminder') => void
  ) {
    this.stop();
    this.onAlertTriggered = onAlertTriggered;

    // Check every 5 seconds
    this.intervalId = window.setInterval(() => {
      this.checkAndTrigger(getSchedule());
    }, 5000);

    // Initial check immediately
    this.checkAndTrigger(getSchedule());
  }

  public stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkAndTrigger({ prayers, settings }: { prayers: PrayerItem[]; settings: PrayerSettings }) {
    const now = Date.now();
    const currentDateStr = new Date().toISOString().slice(0, 10);

    prayers.forEach(prayer => {
      const startMs = prayer.startTime.getTime();
      const endMs = prayer.endTime.getTime();

      // 1. Prayer Start Alert
      // Window: within 70 seconds after prayer start
      const startKey = `${currentDateStr}-${prayer.id}-start`;
      if (prayer.alertEnabled && !this.firedAlerts.has(startKey)) {
        const diffStart = now - startMs;
        if (diffStart >= 0 && diffStart <= 70000) {
          this.firedAlerts.add(startKey);
          this.fireStartAlert(prayer, settings);
          if (this.onAlertTriggered) {
            this.onAlertTriggered(prayer, 'start');
          }
        }
      }

      // 2. Pre-End Reminder Alert
      // Window: within 70 seconds of (endTime - endReminderMinutes)
      const endReminderMinutes = settings.endReminderMinutes || 15;
      const reminderTriggerMs = endMs - endReminderMinutes * 60 * 1000;
      const endReminderKey = `${currentDateStr}-${prayer.id}-endreminder`;

      if (
        settings.endReminderEnabled &&
        prayer.id !== 'sunrise' && // Sunrise is not a formal prayer with end obligation
        !this.firedAlerts.has(endReminderKey)
      ) {
        const diffReminder = now - reminderTriggerMs;
        if (diffReminder >= 0 && diffReminder <= 70000 && now < endMs) {
          this.firedAlerts.add(endReminderKey);
          this.fireEndReminderAlert(prayer, settings, endReminderMinutes);
          if (this.onAlertTriggered) {
            this.onAlertTriggered(prayer, 'end_reminder');
          }
        }
      }
    });

    // Clean up fired alerts older than 24 hours
    if (this.firedAlerts.size > 50) {
      this.firedAlerts.clear();
    }
  }

  private fireStartAlert(prayer: PrayerItem, settings: PrayerSettings) {
    const soundId = settings.prayerSounds[prayer.id] || 'adhan_makkah';
    playAlertSound(soundId, settings.masterVolume);

    if (getNotificationPermission() === 'granted') {
      showSystemNotification(`Time for ${prayer.name} (${prayer.arabicName})`, {
        body: `It is now ${formatTime(prayer.startTime, settings.timeFormat === '24h')}. Adhan time has arrived.`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `prayer-${prayer.id}-${Date.now()}`,
      });
    }
  }

  private fireEndReminderAlert(prayer: PrayerItem, settings: PrayerSettings, minutesLeft: number) {
    const soundId = settings.endReminderSoundId || 'warning_gong';
    playAlertSound(soundId, settings.masterVolume);

    if (getNotificationPermission() === 'granted') {
      showSystemNotification(`⏳ ${prayer.name} Ending in ${minutesLeft} Minutes`, {
        body: `Reminder: ${prayer.name} prayer ends at ${formatTime(prayer.endTime, settings.timeFormat === '24h')}. Don't forget your salah!`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `prayer-end-${prayer.id}-${Date.now()}`,
      });
    }
  }
}

export const alertScheduler = new PrayerAlertScheduler();
