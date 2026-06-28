/**
 * PDF HTML Forge - Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './fintech.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline support
registerSW({
  onNeedRefresh() {
    console.log('Nová verzia aplikácie je k dispozícii');
  },
  onOfflineReady() {
    console.log('Aplikácia je pripravená na offline použitie');
  },
});

// Render the application
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find root element');
  
  // Fallback: create a div and render there
  const fallbackRoot = document.createElement('div');
  fallbackRoot.id = 'root';
  document.body.appendChild(fallbackRoot);
  
  ReactDOM.createRoot(fallbackRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
