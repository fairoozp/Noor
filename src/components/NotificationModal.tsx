import React, { useState, useEffect } from 'react';
import {
  Bell,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Info,
  Share2,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import {
  NotificationPermissionState,
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
  const [iosNoticeMessage, setIosNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInIframe(isRunningInIframe());
      setIosDevice(isIOS());
      setStandalone(isStandalone());
      setIosNoticeMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequest = async () => {
    // If on iOS and NOT installed to Home Screen, iOS will never prompt in browser tab
    if (iosDevice && !standalone) {
      setIosNoticeMessage('Apple requires Noor to be added to your Home Screen first before iOS displays the permission prompt.');
      return;
    }

    setIsRequesting(true);
    try {
      const res = await requestNotificationPermission();
      onPermissionChange(res.state);
      if (res.reason === 'ios_needs_pwa') {
        setIosNoticeMessage('Apple requires Noor to be added to your Home Screen first before iOS displays the permission prompt.');
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in safe-area-bottom">
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl ${permissionState === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Push &amp; Adhan Notifications</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Timely prayer alerts &amp; end-of-prayer countdowns</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* iOS IN-BROWSER EXPLANATION & WALKTHROUGH (Prominent when user is on iPhone/iPad in Safari or Chrome) */}
          {iosDevice && !standalone && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/60 border border-blue-500/40 space-y-3.5 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                      Apple iOS Platform Rule
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">iPhone &amp; iPad</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-1">Why Permission Isn&apos;t Prompting Yet</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Apple intentionally <strong>blocks notification permission popups inside Safari &amp; Chrome browser tabs</strong>. On iOS (16.4+), Apple strictly requires web apps to be added to the Home Screen first:
                  </p>
                </div>
              </div>

              {/* 3 Steps */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-2.5">
                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">1</span>
                  <div className="leading-relaxed">
                    <span>Open in <strong>Safari</strong> and tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-400 mx-1" /> (square with arrow up at the bottom).</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      <em>Note for Chrome on iOS:</em> Tap Chrome menu &rarr; Share &rarr; Add to Home Screen (or copy link to Safari).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">2</span>
                  <div className="leading-relaxed">
                    <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-1" />, then tap <strong>Add</strong> at top right.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">3</span>
                  <div className="leading-relaxed">
                    <span>Launch <strong>Noor from your iPhone Home Screen</strong>. Tap <strong>Allow Notifications</strong> and iOS will immediately display the system prompt!</span>
                  </div>
                </div>
              </div>

              {iosNoticeMessage && (
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{iosNoticeMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Standalone iOS App Mode (User has already added to Home Screen!) */}
          {iosDevice && standalone && permissionState !== 'granted' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Home Screen App Active</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You are running Noor from your iPhone Home Screen! Tap below to display the native iOS permission alert.
              </p>
              <button
                onClick={handleRequest}
                disabled={isRequesting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Bell className="w-4 h-4" />
                <span>{isRequesting ? 'Requesting iOS Permission...' : 'Allow iOS Notifications Now'}</span>
              </button>
            </div>
          )}

          {/* Permission Status Box (Desktop & Android & Granted) */}
          {permissionState === 'granted' ? (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-emerald-300">Push Notifications are Enabled!</h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Your device has permitted system notifications. You will receive alerts at Adhan start time and {settings.endReminderMinutes} minutes before each prayer ends.
                </p>
              </div>
            </div>
          ) : !iosDevice && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-amber-300">
                  {permissionState === 'denied' ? 'Notifications Blocked in Settings' : 'Notifications Not Yet Enabled'}
                </h3>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  {permissionState === 'denied'
                    ? 'Your browser has blocked notifications for this site. Click the lock/tune icon in the address bar to switch to Allow.'
                    : 'Enable notifications to receive background alerts when prayer times begin and when prayers are about to expire.'}
                </p>
              </div>
            </div>
          )}

          {/* Action Row for Desktop & Android */}
          {!iosDevice && permissionState !== 'granted' && (
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

          {/* Special Warning if running inside AI Studio iFrame */}
          {inIframe && (
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider">Preview Environment Notice</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You are viewing Noor inside an embedded preview frame. Browsers block notification permission prompts inside iframes. Open directly in a standalone tab to test.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenStandalone}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Standalone Tab</span>
              </button>
            </div>
          )}

          {/* Instant Audio Test and Sound Check Button */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instant Audio &amp; Alert Test</h4>
                <p className="text-[11px] text-slate-400">Play authentic Makkah Adhan recording &amp; test alert banner</p>
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
              <span>{testAlertSent ? 'Alert Triggered! Playing Original Adhan...' : 'Play Original Adhan & Test Alert'}</span>
            </button>
          </div>

          {/* In-App Alerts Always-On Guarantee */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>In-App Audio &amp; Visual Alerts Always Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Noor automatically plays original Adhan audio recordings and displays on-screen banners whenever prayer times arrive while the app is open in any tab.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={onOpenSoundSettings}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Adhan Recordings</span>
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
