import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker immediately for offline caching and iOS/Android Web Push
registerSW({
  immediate: true,
  onRegistered(r) {
    console.log('Noor ServiceWorker registered:', r);
  },
  onRegisterError(error) {
    console.error('ServiceWorker registration error:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
