import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Seamless API routing for Mobile App (Capacitor/Android/iOS) and Web
const customApiUrl = localStorage.getItem('examfriend_api_url');
const isNativeApp = window.Capacitor || window.location.protocol === 'capacitor:' || window.location.protocol === 'file:';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || customApiUrl || (isNativeApp ? 'http://10.0.2.2:8000' : '');

if (API_BASE_URL) {
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = `${API_BASE_URL}${input}`;
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
