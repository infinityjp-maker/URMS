import { useState, useEffect } from "react";
import "./App.css";
import SystemEventListener from "./components/SystemEventListener";
import ToastProvider from './components/common/Toast'
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
    <div style={{ fontSize: '13px', opacity: 0.9 }}>
      {currentTime} JST
    </div>
  );
}

function App() {
  const [overlayVisible, setOverlayVisible] = useState(true);

  // Apply saved theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('urms-theme');
    if (savedTheme === 'light') {
      document.body.className = 'light-theme';
    } else if (savedTheme === 'dark') {
      document.body.className = 'dark-theme';
    } else {
      document.body.className = '';
    }
    // DEBUG: temporarily force red background to make UI visible in packaged builds
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = 'red';
    return () => { document.body.style.backgroundColor = prevBg };
  }, []);

  // Auto-hide overlay after a short timeout to avoid blocking normal use.
  useEffect(() => {
    if (!overlayVisible) return;
    const t = setTimeout(() => setOverlayVisible(false), 8000);
    return () => clearTimeout(t);
  }, [overlayVisible]);

  return (
    <Router>
      <ToastProvider>
        <SystemEventListener />
        {/* DEBUG: high-contrast full-screen overlay for packaged-build verification */}
        {overlayVisible && (
          <div style={{ position: 'fixed', inset: 0, background: '#ffea00', color: '#000', zIndex: 2147483647, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>UI RENDERED — PACKAGED BUILD</div>
            <div style={{ fontSize: 18, marginBottom: 18 }}>This is a visible debug overlay to confirm the WebView rendered React.</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setOverlayVisible(false)} style={{ padding: '10px 16px', fontSize: 16, fontWeight: 700 }}>Dismiss</button>
              <button onClick={() => alert('Press F12 (or Ctrl+Shift+I) to open DevTools') } style={{ padding: '10px 16px', fontSize: 16 }}>How to open DevTools</button>
            </div>
          </div>
        )}
      <header style={{
        padding: '12px 20px',
        background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(124,58,237,0.05))',
        borderBottom: '1px solid rgba(6,182,212,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#06b6d4',
        fontWeight: 600,
        fontSize: '14px',
        letterSpacing: '1px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{URMS_ICON}</span>
          <span>URMS v4.0</span>
        </div>
        <HeaderClock />
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
  );
}

export default App;
