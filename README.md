# 🌙 Noor - Islamic Prayer Times & Alerts (PWA)

Noor is an Islamic prayer times and Adhan alerts Progressive Web Application (PWA). It delivers solar-accurate prayer schedules, customizable Adhan melody chimes, real-time end-of-prayer countdown timers, advance expiry warning alerts, and a Qibla compass — functioning 100% offline on Android, iOS, and desktop browsers.

---

## ✨ Features

- 🕋 **Astronomical Solar Accuracy**: Computes exact prayer timings using standard calculation authorities (Muslim World League, Umm Al-Qura, ISNA, Egyptian General Authority, Karachi, Dubai, Qatar, Kuwait, Singapore, Turkey) and Shafi'i / Hanafi Asr madhab rules.
- ⏳ **End-of-Prayer Timers & Warnings**: Live countdown showing elapsed progress and remaining minutes before the current prayer window closes, with configurable advance audio alerts (default: 15 minutes before expiry).
- 🔊 **Authentic Original Adhan Audio**: Authentic high-fidelity audio recordings including Grand Mosque Makkah (Sheikh Ali Ibn Ahmad Mulla), Prophet's Mosque Madinah, Fajr dawn Adhan ("Assalatu khayrun minan-nawm"), Al-Aqsa Jerusalem, Sheikh Mishary Rashid Alafasy, and Sheikh Abdul Basit, plus ambient crystal chimes and pre-end warning gongs.
- 🔔 **Push & In-App Notification System**: Service worker push notifications with rich titles and badges, plus an always-on in-app audio-visual banner fallback.
- 📱 **Installable PWA**: Install directly on Android (Chrome), iOS (Safari "Add to Home Screen"), and Desktop with full offline caching.
- 🧭 **Qibla Direction Finder**: Computes precise Great Circle bearing towards the Kaaba (Mecca) from any GPS coordinate on earth.
- 📅 **Monthly Hijri & Gregorian Timetable**: View and export full monthly prayer schedules with printable layout.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ or v20+ / v22+
- **npm**, **yarn**, or **pnpm**

### 2. Clone & Install
```bash
# Clone the repository
git clone https://github.com/fairoozp97/noor-prayer-times.git
cd noor-prayer-times

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Running on Your Phone (Android / iOS) Locally via WiFi

To use and test Noor directly on your mobile device on the same local network:

1. Start Vite with the `--host` flag:
   ```bash
   npm run dev -- --host
   ```
2. Your terminal will display your Network IP, e.g.:
   ```text
   ➜  Local:   http://localhost:3000/
   ➜  Network: http://192.168.1.50:3000/
   ```
3. Open the `Network` URL in your phone's browser:
   - **On Android**: Open in **Google Chrome**. Tap the `⋮` menu > **Install app** (or **Add to Home screen**).
   - **On iPhone / iPad**: Open in **Apple Safari**. Tap the **Share** button (box with upward arrow) > tap **Add to Home Screen**.
4. Tap **Enable Push Notifications** to grant Adhan alert permissions.

---

## 🐙 How to Publish to Your GitHub Account

Run these commands in your project root directory:

```bash
# 1. Initialize Git repository
git init

# 2. Stage all files
git add .

# 3. Commit your code
git commit -m "feat: Noor Islamic Prayer Times PWA with Adhan alerts"

# 4. Set main branch
git branch -M main

# 5. Link to your GitHub repository
# (Create a new empty repository at https://github.com/new first)
git remote add origin https://github.com/<your-github-username>/noor-prayer-times.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🌐 Free 1-Click Deployment Options

### Option A: Vercel (Recommended — Zero Config)
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your `noor-prayer-times` GitHub repository.
3. Vercel automatically detects **Vite**. Click **Deploy**.
4. You receive a free, production HTTPS domain (e.g., `noor-prayer.vercel.app`) with full PWA service worker and push notification support!

### Option B: GitHub Pages
An automated GitHub Actions workflow is provided at `.github/workflows/deploy.yml`.
1. Go to your GitHub repository **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
3. Push to `main` — GitHub Pages builds and deploys your PWA automatically!

### Option C: Netlify
1. Import repository on [netlify.com](https://www.netlify.com).
2. Set Build command: `npm run build`
3. Set Publish directory: `dist`
4. Click **Deploy**.

---

## 🤖 Generating a Native Android APK (Google Play / Sideloading)

You can turn this PWA into an official Android APK or Google Play `.aab` file using Google's **Bubblewrap**:

```bash
# Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# Initialize Android project from your deployed URL
bubblewrap init --manifest=https://<your-deployed-url>/manifest.json

# Build the Android APK / App Bundle
bubblewrap build
```

---

## 🔔 Push Notification & Adhan Audio Guide

| Environment | How It Works |
| :--- | :--- |
| **Desktop (Chrome/Edge/Brave/Safari)** | Native system banners & Web Audio chimes appear at prayer start and before expiry. |
| **Android (Chrome)** | Works in browser tabs and as an installed standalone PWA. Push notifications deliver via Service Worker. |
| **iPhone & iPad (iOS 16.4+)** | Apple requires web apps to be **Added to Home Screen** before Web Push can be granted. Tap Safari **Share** > **Add to Home Screen**, then open from Home Screen to enable alerts. |
| **In-App Guarantee** | Even if system permissions are denied, Noor's **In-App Audio Engine and Floating Toast Banners** will always chime whenever Noor is open! |

---

## 🛠️ Tech Stack & Architecture

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8 with `@tailwindcss/vite` (Tailwind CSS v4)
- **PWA**: `vite-plugin-pwa` + Workbox offline asset caching
- **Astronomical Engine**: `adhan` (solar ephemeris and shadow ratio algorithms)
- **Audio Engine**: Web Audio API oscillator synthesis and harmonic filters
- **Icons**: Lucide React + custom SVG vector moon & star artwork

---

## 📄 License

Apache-2.0 License. Free for personal and community use.
