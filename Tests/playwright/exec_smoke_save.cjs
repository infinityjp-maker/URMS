const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

const now = () => (new Date()).toISOString();

const log = (...args) => {
  try { console.log.apply(console, [`[exec_smoke_save ${now()}]`].concat(args)); } catch(e){}
};

const appendFileSafe = (p, data) => {
  try { fs.appendFileSync(p, data); } catch (e) { try { fs.writeFileSync(p, data); } catch(_){} }
};

// Write JSON safely: try parse, extract last JSON object if needed, otherwise write raw
const writeJsonSafe = (raw, targetPath = 'builds/screenshots/smoke-result.json') => {
  const extractLastJson = (s) => {
    const starts = [];
    for (let i = 0; i < s.length; i++) if (s[i] === '{') starts.push(i);
    for (let idx = starts.length - 1; idx >= 0; idx--) {
      let i = starts[idx];
      let depth = 0;
      for (let j = i; j < s.length; j++) {
        const ch = s[j];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth === 0) {
          const candidate = s.slice(i, j + 1);
          try { return JSON.parse(candidate); } catch (e) { break; }
        }
      }
    }
    return null;
  };
  try {
    if (!raw) return fs.writeFileSync(targetPath, raw, 'utf8');
  } catch (e) {}
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch (e) { parsed = extractLastJson(raw); }
  if (parsed) {
    try {
      if (env && env.URL) parsed.url = env.URL;
      fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), 'utf8');
      return;
    } catch (e) {}
  }
  // fallback: write raw content
  try { fs.writeFileSync(targetPath, raw, 'utf8'); } catch (e) {}
};

try {
  fs.mkdirSync('builds/screenshots', { recursive: true });
} catch (e) {}

// Prefer an explicit localhost dev server URL in CI; allow overriding via ENV
const env = Object.assign({}, process.env, { URL: process.env.URL || 'http://localhost:1420/' });

log('spawning child for Tests/playwright/smoke.cjs', { URL: env.URL, pid: process.pid });
const cp = spawn(process.execPath, ['Tests/playwright/smoke.cjs'], { env });

const runDir = 'builds/screenshots';
const stdoutLog = runDir + '/smoke-run.stdout.log';
const stderrLog = runDir + '/smoke-run.stderr.log';
try { fs.mkdirSync(runDir, { recursive: true }); } catch(e){}

// Open file descriptors for immediate writes and fsync on finalize
let stdoutFd = null;
let stderrFd = null;
try {
  stdoutFd = fs.openSync(stdoutLog, 'a');
} catch (e) { try { stdoutFd = fs.openSync(stdoutLog, 'w'); } catch (_) { stdoutFd = null; } }
try {
  stderrFd = fs.openSync(stderrLog, 'a');
} catch (e) { try { stderrFd = fs.openSync(stderrLog, 'w'); } catch (_) { stderrFd = null; } }

let out = '';
let errOut = '';
let gotStdout = false;
let gotStderr = false;
let firstStdoutAt = null;
let firstStderrAt = null;

const hbInterval = setInterval(() => log('heartbeat — child running, pid=', cp.pid), 30000);

cp.stdout.on('data', d => {
  const s = d.toString();
  if (!gotStdout) { gotStdout = true; firstStdoutAt = now(); log('child produced first stdout at', firstStdoutAt); }
  out += s;
  // write immediately to opened fd when possible
  try {
    if (stdoutFd !== null) fs.writeSync(stdoutFd, s);
    else appendFileSafe(stdoutLog, s);
  } catch (e) { try { appendFileSafe(stdoutLog, s); } catch(_){} }
});

cp.stderr.on('data', d => {
  const s = d.toString();
  if (!gotStderr) { gotStderr = true; firstStderrAt = now(); log('child produced first stderr at', firstStderrAt); }
  errOut += s;
  try {
    if (stderrFd !== null) fs.writeSync(stderrFd, s);
    else appendFileSafe(stderrLog, s);
  } catch (e) { try { appendFileSafe(stderrLog, s); } catch(_){} }
});

cp.on('error', (err) => { log('child process error event', err && err.stack ? err.stack : err); });

let finalized = false;
const finalize = (code, reason) => {
  if (finalized) return; finalized = true;
  clearInterval(hbInterval);
  log('finalizing (reason=' + reason + ')', { code: code, pid: cp && cp.pid ? cp.pid : null, gotStdout, gotStderr });

  try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch(e){}

  // attempt graceful child termination if still running
  try {
    if (cp && !cp.killed) {
      try { cp.kill('SIGTERM'); } catch(e){}
      // after brief wait, force kill if still alive
      const waitUntil = Date.now() + 5000;
      while (Date.now() < waitUntil) {
        try { if (cp.killed) break; } catch(e) { break; }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
      }
      try { if (!cp.killed) cp.kill('SIGKILL'); } catch(e){}
    }
  } catch (e) {}

  // write result JSON from collected stdout
  try { writeJsonSafe(out); } catch(e){}

  // fsync and close stdout/stderr log fds to ensure data is flushed to disk
  try {
    if (stdoutFd !== null) {
      try { fs.fsyncSync(stdoutFd); } catch(e){}
      try { fs.closeSync(stdoutFd); } catch(e){}
      stdoutFd = null;
    }
  } catch (e) {}
  try {
    if (stderrFd !== null) {
      try { fs.fsyncSync(stderrFd); } catch(e){}
      try { fs.closeSync(stderrFd); } catch(e){}
      stderrFd = null;
    }
  } catch (e) {}

  if (errOut && errOut.length) {
    try { fs.writeFileSync('builds/screenshots/smoke-result.err', errOut, 'utf8'); } catch(e){}
    try {
      console.error('--- SMOKE STDERR BEGIN ---');
      const outChunk = errOut.length > 20000 ? errOut.slice(0,20000) + '\n--- TRUNCATED ---' : errOut;
      console.error(outChunk);
      console.error('--- SMOKE STDERR END ---');
    } catch(e){}
  }

  // validate smoke-result.json, otherwise write fallback
  let safeJsonOk = false;
  try {
    const txt = fs.readFileSync('builds/screenshots/smoke-result.json', 'utf8');
    if (txt && txt.trim()) {
      try { JSON.parse(txt); safeJsonOk = true; } catch(e) { safeJsonOk = false; }
    }
  } catch (e) { safeJsonOk = false; }

  if (!safeJsonOk) {
    const fallback = {
      error: 'smoke-run-failed-or-no-json',
      exitCode: code,
      reason: reason,
      url: env && env.URL ? env.URL : null,
      stderrPreview: errOut ? (errOut.length > 10000 ? errOut.slice(0,10000) + '\n--- TRUNCATED ---' : errOut) : null,
      stdoutPreview: out ? (out.length > 10000 ? out.slice(0,10000) + '\n--- TRUNCATED ---' : out) : null,
      timestamp: (new Date()).toISOString()
    };
    try { fs.writeFileSync('builds/screenshots/smoke-result.json', JSON.stringify(fallback, null, 2), 'utf8'); } catch(e){}
  }

  // ensure smoke-result.json is fsynced
  try { const fd = fs.openSync('builds/screenshots/smoke-result.json', 'r'); try { fs.fsyncSync(fd); } catch(e){} try { fs.closeSync(fd); } catch(e){} } catch(e){}

  try { fs.writeFileSync(runDir + '/smoke-exec-summary.json', JSON.stringify({
    exitCode: code,
    gotStdout: !!gotStdout,
    gotStderr: !!gotStderr,
    stdoutBytes: (out && out.length) || 0,
    stderrBytes: (errOut && errOut.length) || 0,
    firstStdoutAt: firstStdoutAt,
    firstStderrAt: firstStderrAt,
    finishedAt: now(),
    host: os.hostname ? os.hostname() : null,
    reason: reason
  }, null, 2), 'utf8'); } catch(e){}

  // fsync summary as well
  try { const sfd = fs.openSync(runDir + '/smoke-exec-summary.json', 'r'); try { fs.fsyncSync(sfd); } catch(e){} try { fs.closeSync(sfd); } catch(e){} } catch(e){}

  log('smoke result saved (stdout-> builds/screenshots/smoke-result.json, stderr-> builds/screenshots/smoke-result.err), reason', reason);

  // Force-override any smoke-result.json under builds to ensure CI env URL is used
  try {
    if (env && env.URL) {
      const walk = (dir) => {
        let list = [];
        try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch(e){ return; }
        for (const ent of list) {
          const p = dir + '/' + ent.name;
          if (ent.isDirectory()) {
            walk(p);
          } else if (ent.isFile() && ent.name === 'smoke-result.json') {
            try {
              const txt = fs.readFileSync(p, 'utf8');
              let j = null;
              try { j = JSON.parse(txt); } catch (e) { j = null; }
              if (j && typeof j === 'object') {
                j.url = env.URL;
                fs.writeFileSync(p, JSON.stringify(j, null, 2), 'utf8');
                console.log('patched smoke-result.json ->', p, 'url=', env.URL);
              } else {
                const replacement = { url: env.URL, note: 'replaced-invalid-json' };
                fs.writeFileSync(p, JSON.stringify(replacement, null, 2), 'utf8');
                console.log('replaced invalid smoke-result.json ->', p);
              }
            } catch (e) {}
          }
        }
      };
      try { if (fs.existsSync('builds')) walk('builds'); } catch(e){}
    }
  } catch (e) {}

  // if invoked due to signal, exit with 130 (128 + SIG) or 0 when close
  if (reason && (reason === 'SIGINT' || reason === 'SIGTERM' || reason === 'SIGHUP')) {
    try { process.exit(130); } catch(e) { /* best-effort */ }
  }
};

// wire up signal handlers to ensure logs are flushed on cancellation
process.on('SIGINT', () => finalize(null, 'SIGINT'));
process.on('SIGTERM', () => finalize(null, 'SIGTERM'));
process.on('SIGHUP', () => finalize(null, 'SIGHUP'));
process.on('uncaughtException', (err) => {
  try { console.error('uncaughtException', err && err.stack ? err.stack : err); } catch(e){}
  finalize(null, 'uncaughtException');
});
process.on('beforeExit', (code) => finalize(code, 'beforeExit'));

cp.on('close', code => finalize(code, 'close'));
