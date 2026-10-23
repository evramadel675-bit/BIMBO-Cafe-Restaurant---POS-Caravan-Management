import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for native installation & offline support
if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('BIMBO PWA Service Worker active with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('BIMBO PWA Service Worker registration notice:', err);
      });
  };

  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
