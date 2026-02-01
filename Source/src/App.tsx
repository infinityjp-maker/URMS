import { useState, useEffect } from "react";
import "./App.css";
import SystemEventListener from "./components/SystemEventListener";
import Dashboard from "./pages/Dashboard";
import Environment from "./pages/Environment";
import ResourceDetail from "./pages/Environment/ResourceDetail";
import Network from "./pages/Network";
import Subsystems from "./pages/Subsystems";
import SubsystemDetail from "./pages/Subsystems/SubsystemDetail";
import Logs from "./pages/Logs";
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
  }, []);

  return (
    <Router>
      <SystemEventListener />
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
    </Router>
  );
}

export default App;
