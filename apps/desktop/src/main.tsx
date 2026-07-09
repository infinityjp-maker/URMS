import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './styles/global.css';
import './styles/app-shell.css';
import './styles/dashboard.css';
import './styles/screen-catalog.css';
import './styles/calendar.css';
import './styles/knowledge.css';
import './styles/assets.css';
import './styles/storage.css';
import './styles/video.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
