// Forward browser console messages to Tauri backend `frontend_log` command when available
function safeStringify(arg: any) {
  try {
    if (typeof arg === 'string') return arg;
    return JSON.stringify(arg);
  } catch (e) {
    return String(arg);
  }
}

async function initConsoleForward() {
  // Check for Tauri invoke availability via multiple fallback strategies
  let invoke: any = null;
  try {
    // 1) If Tauri injected a global bridge, use it
    const win = window as any;
    if (win.__TAURI__ && typeof win.__TAURI__.invoke === 'function') {
      invoke = win.__TAURI__.invoke.bind(win.__TAURI__);
    }
  } catch {}

  if (!invoke) {
    try {
      // 2) Try '@tauri-apps/api/core' using runtime import to avoid bundler resolution
      const modName = '@tauri-apps/api/core';
      const mod = (await import(modName)) as any;
      if (mod && typeof mod.invoke === 'function') invoke = mod.invoke;
    } catch {}
  }

  if (!invoke) {
    try {
      // 3) Try the top-level tauri module using runtime import
      const modName = '@tauri-apps/api/tauri';
      const mod = (await import(modName)) as any;
      if (mod && typeof mod.invoke === 'function') invoke = mod.invoke;
    } catch {}
  }

  if (!invoke) {
    // 4) Give up silently — not running under Tauri or API unavailable
    return;
  }

  const levels: Array<keyof Console> = ['log', 'info', 'warn', 'error', 'debug'];
  levels.forEach((lvl) => {
    const orig = (console as any)[lvl]?.bind(console) ?? (() => {});
    (console as any)[lvl] = (...args: any[]) => {
      try {
        const msg = args.map(safeStringify).join(' ');
        // send to backend for persistent logging
        Promise.resolve(invoke('frontend_log', { level: lvl, msg })).catch(() => {});
      } catch (e) {
        // ignore
      }
      orig(...args);
    };
  });

  // Also send a guaranteed startup ping after a short delay to ensure the bridge is ready.
  setTimeout(() => {
    try {
      Promise.resolve(invoke('frontend_log', { level: 'info', msg: 'frontend: console-forward initialized' })).catch(() => {});
    } catch {}
  }, 800);
}

// initialize but don't block
initConsoleForward();

export {};
