import { useState, useEffect } from "react";
import "./App.css";
import "./theme/theme-future.css";
import SystemEventListener from "./components/SystemEventListener";
import ToastProvider from './components/common/Toast'
import ThemeProvider from './theme/ThemeProvider'
import ThemeToggle from './theme/ThemeToggle'
import Dashboard from "./pages/Dashboard";
import Environment from "./pages/Environment";
import ResourceDetail from "./pages/Environment/ResourceDetail";
import Network from "./pages/Network";
import Subsystems from "./pages/Subsystems";
import SubsystemDetail from "./pages/Subsystems/SubsystemDetail";
import Logs from "@pages/Logs/index.tsx";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

const URMS_ICON = "🛡️";

function HeaderClock() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const jstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
      const formatted = jstTime.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="header-clock">
      {currentTime} JST
    </div>
  );
}

function App() {
  const [overlayVisible, setOverlayVisible] = useState(true);

  // theme handled by ThemeProvider

  // Auto-hide overlay after a short timeout to avoid blocking normal use.
  useEffect(() => {
    if (!overlayVisible) return;
    const t = setTimeout(() => setOverlayVisible(false), 8000);
    return () => clearTimeout(t);
  }, [overlayVisible]);

  const isDev = import.meta.env.MODE !== 'production';

  return (
    <ThemeProvider>
      <Router>
        <ToastProvider>
          <SystemEventListener />
          {/* DEBUG: high-contrast full-screen overlay for packaged-build verification (dev-only) */}
          {isDev && overlayVisible && (
            <div className="debug-overlay">
              <div className="debug-overlay-title">UI RENDERED — PACKAGED BUILD</div>
              <div className="debug-overlay-sub">This is a visible debug overlay to confirm the WebView rendered React.</div>
              <div className="debug-overlay-actions">
                <button className="debug-btn" onClick={() => setOverlayVisible(false)}>Dismiss</button>
                <button className="debug-btn" onClick={() => alert('Press F12 (or Ctrl+Shift+I) to open DevTools')}>How to open DevTools</button>
              </div>
            </div>
          )}

          <header className="app-header">
            <div className="app-header-left">
              <span className="app-icon">{URMS_ICON}</span>
              <span className="app-title">URMS v4.0</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <HeaderClock />
              <ThemeToggle />
            </div>
          </header>
        <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Environment" element={<Environment />} />
        <Route path="/Environment/:resource" element={<ResourceDetail />} />
        <Route path="/Network" element={<Network />} />
        <Route path="/Subsystems" element={<Subsystems />} />
        <Route path="/Subsystems/:subsystem" element={<SubsystemDetail />} />
        <Route path="/Logs" element={<Logs />} />
        <Route path="/Security" element={<Security />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </Router>
    </ThemeProvider>
  );
}

export default App;
