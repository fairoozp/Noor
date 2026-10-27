import React, { useState, useEffect } from 'react';
import {
  Github,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Globe,
  Download,
  X,
  Laptop,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import QRCode from 'qrcode';

interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'github' | 'apk'>('phone');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#022c22',
          light: '#f0fdf4',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const gitBashScript = `# 1. Initialize local repository
git init

# 2. Stage all project files
git add .

# 3. Create your initial commit
git commit -m "feat: Noor Islamic Prayer Times PWA with Adhan alerts"

# 4. Set default main branch
git branch -M main

# 5. Link to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/fairoozp97/noor-prayer-times.git

# 6. Push code to GitHub
git push -u origin main`;

  const localWifiCommand = `npm run dev -- --host`;

  const bubblewrapCommand = `# Install Bubblewrap CLI to convert this PWA to Android APK
npm install -g @bubblewrap/cli

# Initialize Android project from your deployed manifest
bubblewrap init --manifest=https://<your-app-domain>/manifest.json

# Build the signed Android APK or AAB bundle for Google Play
bubblewrap build`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Mobile Device &amp; GitHub Setup</h2>
              <p className="text-xs text-slate-400">Run locally on Android / iOS, or publish to your GitHub repository</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('phone')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'phone'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Use on Android &amp; iOS</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'github'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>Publish to GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'apk'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Android APK Guide</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: PHONE (Android & iOS) */}
          {activeTab === 'phone' && (
            <div className="space-y-6">
              {/* Scan QR Code Banner */}
              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-5">
                {qrCodeDataUrl ? (
                  <div className="p-2 rounded-2xl bg-emerald-100 shadow-md shrink-0">
                    <img
                      src={qrCodeDataUrl}
                      alt="Scan to open Noor on your mobile device"
                      className="w-36 h-36 rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <QrCode className="w-10 h-10 animate-pulse" />
                  </div>
                )}

                <div className="space-y-2 text-center sm:text-left">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300">
                    <QrCode className="w-3.5 h-3.5" />
                    Instant Camera Scan
                  </span>
                  <h3 className="text-base font-bold text-white">Scan with Your Phone Camera</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Point your iPhone or Android camera at the QR code to instantly open Noor in your mobile browser.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      onClick={() => handleCopy(currentUrl, 'url')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedSection === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'url' ? 'Link Copied!' : 'Copy Direct Link'}</span>
                    </button>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Standalone Tab</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Install Instructions by OS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Android Steps */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Android (Chrome / Edge)</span>
                  </div>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open link in <strong className="text-white">Google Chrome</strong>.</li>
                    <li>Tap the <strong className="text-white">Install App</strong> banner at top, or tap menu (⋮) &rarr; <strong className="text-white">Install app / Add to Home screen</strong>.</li>
                    <li>Tap <strong className="text-white">Allow Notifications</strong> to receive Adhan sounds and time reminders.</li>
                    <li>Launches with its own app icon and runs full offline!</li>
                  </ol>
                </div>

                {/* iOS Steps */}
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>iPhone &amp; iPad (Safari)</span>
                  </div>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open link in <strong className="text-white">Apple Safari</strong>.</li>
                    <li>Tap the <strong className="text-white">Share</strong> button (box with arrow up at bottom).</li>
                    <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</li>
                    <li>Launch from your home screen — notifications and audio chimes are now fully active!</li>
                  </ol>
                </div>
              </div>

              {/* Local WiFi Network Testing */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Laptop className="w-4 h-4 text-emerald-400" />
                    <span>Run Locally on Your Home WiFi</span>
                  </div>
                  <button
                    onClick={() => handleCopy(localWifiCommand, 'wifi')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                  >
                    {copiedSection === 'wifi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'wifi' ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When cloned onto your computer, run with the <code className="text-emerald-300 bg-slate-900 px-1.5 py-0.5 rounded">--host</code> flag so your phone can connect directly to your laptop&apos;s local IP address (e.g. <code className="text-slate-300">http://192.168.1.50:3000</code>):
                </p>
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800/80">
                  {localWifiCommand}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB */}
          {activeTab === 'github' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Github className="w-4 h-4 text-emerald-400" />
                  <span>Push to Your GitHub Account</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This project contains clean TypeScript source code, Vite build configuration, PWA service worker, audio engine, and GitHub Actions workflow.
                </p>
              </div>

              {/* Terminal Code Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Terminal Commands:
                  </span>
                  <button
                    onClick={() => handleCopy(gitBashScript, 'git')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 flex items-center gap-1 text-xs font-medium transition-colors"
                  >
                    {copiedSection === 'git' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'git' ? 'Commands Copied!' : 'Copy All Commands'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                  <pre>{gitBashScript}</pre>
                </div>
              </div>

              {/* Free 1-Click Hosting Services */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Free Instant Hosting Platforms:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                    <span className="font-bold text-white">▲ Vercel</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Import your GitHub repo. Vercel auto-detects Vite and provides free SSL &amp; custom domain in 10 seconds.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                    <span className="font-bold text-white">🐙 GitHub Pages</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Included <code className="text-emerald-300">.github/workflows/deploy.yml</code> deploys on every commit automatically.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                    <span className="font-bold text-white">💠 Netlify / Cloudflare</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connect GitHub repository, set publish directory to <code className="text-emerald-300">dist</code>, and deploy worldwide.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID APK */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Create a Native Android APK (Bubblewrap)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Google&apos;s official tool <strong className="text-white">Bubblewrap</strong> turns any Progressive Web App with a manifest into an installable Android APK or Google Play AAB bundle without writing Java/Kotlin.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Bubblewrap CLI Commands:
                  </span>
                  <button
                    onClick={() => handleCopy(bubblewrapCommand, 'apk')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 flex items-center gap-1 text-xs font-medium transition-colors"
                  >
                    {copiedSection === 'apk' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'apk' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                  <pre>{bubblewrapCommand}</pre>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200/90 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Because Noor is built with offline service worker caching, the resulting Android app will load instantly even with zero internet connection!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>PWA &amp; Offline Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
