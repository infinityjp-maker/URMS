import ReactDOM from "react-dom/client";
import App from "./App";

// Immediate bundle entry marker: set a DOM attribute and a global flag so external
// diagnostics can detect that the frontend bundle has executed.
(function () {
  try {
    const ts = Date.now();
    try { document.documentElement && document.documentElement.setAttribute('data-urms-bundle-entry', String(ts)); } catch (e) {}
    try { (window as any).__URMS_BUNDLE_ENTRY_TS = ts; } catch (e) {}
    try { console.log('[bundle] entry', ts); } catch (e) {}
    // best-effort: notify backend via tauri invoke if available
    try {
      const dynamicImport = new Function('m', 'return import(m)');
      dynamicImport('@tauri-apps/api/tauri').then((tauriMod:any) => {
        try { (tauriMod && tauriMod.invoke) && tauriMod.invoke('frontend_log', { level: 'info', msg: '[bundle] entry ' + ts }).catch(()=>{}); } catch(e){}
      }).catch(()=>{});
    } catch (e) {}
  } catch (e) {}
})();

// Always try to forward console messages to backend when running in Tauri
import "./utils/console-forward";

if (import.meta.env.DEV) {
  import("./utils/tauri-test");
}

// Send a guaranteed startup log to the backend (safe no-op on non-Tauri)
(async () => {
  try {
    const moduleName = "@tauri-apps/api/tauri";
    const tauri = (await import(moduleName)) as any;
    const invoke = tauri.invoke as any;
    if (typeof invoke === "function") {
      await invoke("frontend_log", {
        level: "info",
        msg: "frontend: initialized (main.tsx)",
      });
    }
  } catch (e) {
    // ignore failures when running in non-Tauri environments
  }
})();
// Retry after a short delay in case the Tauri runtime isn't ready at module load
setTimeout(async () => {
  try {
    const moduleName = "@tauri-apps/api/tauri";
    const tauri = (await import(moduleName)) as any;
    const invoke = tauri.invoke as any;
    if (typeof invoke === "function") {
      await invoke("frontend_log", {
        level: "info",
        msg: "frontend: initialized (main.tsx) [retry]",
      });
    }
  } catch (e) {
    // ignore
  }
}, 1500);
// Periodic robust ping: try fetch to local ping server and fallback to tauri invoke
(function periodicFrontendPing(){
  const intervalMs = 2000;
  let counter = 0;
  const max = 30; // try for up to ~1 minute
  const doPing = async () => {
    counter++;
    const payload = { msg: 'frontend: periodic ping', attempt: counter, ts: Date.now() };
    // Log payload to console for DevTools inspection
    try { console.log('[frontend-periodic-ping]', payload); } catch(e) {}
    // Try direct injected bridge if available
    try {
      const winAny = window as any;
      if (winAny.__TAURI__ && typeof winAny.__TAURI__.invoke === 'function') {
        try { winAny.__TAURI__.invoke('frontend_log', { level: 'info', msg: JSON.stringify(payload) }); } catch(e) {}
      }
    } catch(e) {}
    // Try navigator.sendBeacon first (best-effort, works during unload)
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const ok = navigator.sendBeacon('http://127.0.0.1:8765/ux-ping', blob);
        if (ok) {
          try {
            const tauri = (await import('@tauri-apps/api/tauri')).default || (await import('@tauri-apps/api/tauri'));
            if (tauri && typeof tauri.invoke === 'function') {
              tauri.invoke('frontend_log', { level: 'info', msg: JSON.stringify(payload) }).catch(()=>{});
            }
          } catch {}
          return;
        }
      }
      // Try fetch next
      await fetch('http://127.0.0.1:8765/ux-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // also try to inform backend via invoke if available
      try {
        const tauri = (await import('@tauri-apps/api/tauri')).default || (await import('@tauri-apps/api/tauri'));
        if (tauri && typeof tauri.invoke === 'function') {
          tauri.invoke('frontend_log', { level: 'info', msg: JSON.stringify(payload) }).catch(()=>{});
        }
      } catch {}
      return;
    } catch (e) {
      // fetch failed; try invoke only
      try {
        const tauri = (await import('@tauri-apps/api/tauri')).default || (await import('@tauri-apps/api/tauri'));
        if (tauri && typeof tauri.invoke === 'function') {
          await tauri.invoke('frontend_log', { level: 'info', msg: JSON.stringify(payload) });
          return;
        }
      } catch {}
    }
  };

  const id = setInterval(() => {
    if (counter >= max) {
      clearInterval(id);
      return;
    }
    void doPing();
  }, intervalMs);
})();
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);

// Ensure an application-level ready flag is set shortly after initial render.
setTimeout(() => {
  try {
    (window as any).__URMS_READY = true;
    try { window.dispatchEvent(new Event('urms-ready')); } catch (e) {}
    console.log('[frontend] __URMS_READY set');
  } catch (e) {}
}, 500);
