import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Volume2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Laptop,
  X,
  VolumeX,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  NotificationPermissionState,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isRunningInIframe,
  isIOS,
  isStandalone,
} from '../services/notificationService.ts';
import { PrayerSettings } from '../types/prayer.ts';
import { stopAllSounds } from '../services/soundEngine.ts';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrayerSettings;
  permissionState: NotificationPermissionState;
  onPermissionChange: (state: NotificationPermissionState) => void;
  onOpenSoundSettings: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  settings,
  permissionState,
  onPermissionChange,
  onOpenSoundSettings,
}) => {
  const [inIframe, setInIframe] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testAlertSent, setTestAlertSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'troubleshoot'>('status');

  useEffect(() => {
    setInIframe(isRunningInIframe());
    setIosDevice(isIOS());
    setStandalone(isStandalone());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      const res = await requestNotificationPermission();
      onPermissionChange(res.state);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestAlert = () => {
    setTestAlertSent(true);
    sendTestNotification('Fajr', settings.prayerSounds.fajr || 'adhan_fajr_melody', settings.masterVolume, 'prayer_start');
    setTimeout(() => setTestAlertSent(false), 3000);
  };

  const handleOpenStandalone = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${permissionState === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Push &amp; Adhan Notifications</h2>
              <p className="text-xs text-slate-400">Timely prayer alerts &amp; end-of-prayer reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Permission Status Box */}
          {permissionState === 'granted' ? (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-emerald-300">Push Notifications are Enabled!</h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Your browser has permitted system notifications. You will receive alerts at Adhan start time and {settings.endReminderMinutes} minutes before each prayer ends.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-amber-300">
                  {permissionState === 'denied' ? 'Notifications Blocked by Browser' : 'Notifications Not Yet Enabled'}
                </h3>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  {permissionState === 'denied'
                    ? 'Your browser has blocked notifications for this origin. You can re-enable them in site permissions or test using our standalone app.'
                    : 'Enable notifications to receive background alerts when prayer times begin and when prayers are about to expire.'}
                </p>
              </div>
            </div>
          )}

          {/* Special Warning if running inside AI Studio iFrame */}
          {inIframe && (
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider">Preview Environment Notice</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You are viewing Noor inside an embedded preview frame. Modern browsers (Chrome/Safari) block notification permission prompts inside iframes for security.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenStandalone}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Standalone Tab (Direct Link)</span>
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="space-y-3">
            {permissionState !== 'granted' && (
              <button
                onClick={handleRequest}
                disabled={isRequesting}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
              >
                {isRequesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                <span>{isRequesting ? 'Requesting Permission...' : 'Allow System Notifications'}</span>
              </button>
            )}

            {/* Test Notification and Audio Chime Button */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instant Alert &amp; Audio Test</h4>
                  <p className="text-[11px] text-slate-400">Audition the alert banner and Adhan sound right now</p>
                </div>
                <button
                  onClick={() => stopAllSounds()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                  title="Silence all sounds"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleTestAlert}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  testAlertSent
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                }`}
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>{testAlertSent ? 'Alert Triggered! Playing Sound...' : 'Test Adhan Sound & Notification'}</span>
              </button>
            </div>
          </div>

          {/* In-App Alerts Always-On Guarantee */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>In-App Audio &amp; Visual Alerts Always Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Even if browser push permissions are disabled, Noor automatically sounds Adhan melodies and renders on-screen banners whenever prayer times start or end reminders trigger while the app is open.
            </p>
          </div>

          {/* Device-Specific Troubleshooting Guides */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>How to Enable on Your Devices</span>
            </h4>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              {/* iOS Guide */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                <span className="font-semibold text-slate-200">🍎 iPhone &amp; iPad (iOS 16.4+)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Safari requires web apps to be installed to the Home Screen before granting notification permissions. Tap <strong className="text-slate-200">Share</strong> (square with arrow) &rarr; <strong className="text-slate-200">Add to Home Screen</strong>, then launch Noor and enable notifications.
                </p>
              </div>

              {/* Android Guide */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                <span className="font-semibold text-slate-200">🤖 Android (Chrome / Edge / Firefox)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tap the lock / tune icon in the address bar &rarr; <strong className="text-slate-200">Permissions</strong> &rarr; enable <strong className="text-slate-200">Notifications</strong>. Alternatively, install as PWA via menu &rarr; &ldquo;Install app&rdquo;.
                </p>
              </div>

              {/* Desktop Browser */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                <span className="font-semibold text-slate-200">💻 Desktop (Chrome, Edge, Brave, Safari)</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Click the site settings icon to the left of the URL address bar and change Notifications from &ldquo;Block&rdquo; to &ldquo;Allow&rdquo;, then refresh.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={onOpenSoundSettings}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Customize Adhan Sounds</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
