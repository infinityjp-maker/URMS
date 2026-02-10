const { spawn } = require('child_process');
const fs = require('fs');

try {
  fs.mkdirSync('builds/screenshots', { recursive: true });
} catch (e) {}

// Prefer an explicit localhost dev server URL in CI; allow overriding via ENV
const env = Object.assign({}, process.env, { URL: process.env.URL || 'http://localhost:1420/' });
const cp = spawn(process.execPath, ['Tests/playwright/smoke.cjs'], { env });
let out = '';
let errOut = '';
cp.stdout.on('data', d => out += d.toString());
cp.stderr.on('data', d => errOut += d.toString());
cp.on('close', code => {
  try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch(e){}
  // Normalize stdout: attempt to extract last balanced JSON object and
  // write it prettified. If extraction fails, fall back to raw stdout.
  const writeJsonSafe = (raw) => {
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
    if (!raw) return fs.writeFileSync('builds/screenshots/smoke-result.json', raw, 'utf8');
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = extractLastJson(raw); }
    if (parsed) {
      try {
        if (env && env.URL) parsed.url = env.URL;
        fs.writeFileSync('builds/screenshots/smoke-result.json', JSON.stringify(parsed, null, 2), 'utf8');
        return;
      } catch (e) {}
    }
    // fallback: write raw content
    fs.writeFileSync('builds/screenshots/smoke-result.json', raw, 'utf8');
  };
  writeJsonSafe(out);
  if (errOut && errOut.length) {
    try { fs.writeFileSync('builds/screenshots/smoke-result.err', errOut, 'utf8'); } catch(e){}
    try {
      console.error('--- SMOKE STDERR BEGIN ---');
      const outChunk = errOut.length > 20000 ? errOut.slice(0,20000) + '\n--- TRUNCATED ---' : errOut;
      console.error(outChunk);
      console.error('--- SMOKE STDERR END ---');
    } catch(e){}
  }

  // If child exited non-zero or produced no/invalid JSON, write a fallback JSON
  // so downstream compare logic always has a JSON file to inspect.
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
      url: env && env.URL ? env.URL : null,
      stderrPreview: errOut ? (errOut.length > 10000 ? errOut.slice(0,10000) + '\n--- TRUNCATED ---' : errOut) : null,
      stdoutPreview: out ? (out.length > 10000 ? out.slice(0,10000) + '\n--- TRUNCATED ---' : out) : null,
      timestamp: (new Date()).toISOString()
    };
    try { fs.writeFileSync('builds/screenshots/smoke-result.json', JSON.stringify(fallback, null, 2), 'utf8'); } catch(e){}
  }

  console.log('smoke result saved (stdout-> builds/screenshots/smoke-result.json, stderr-> builds/screenshots/smoke-result.err), exit code', code);
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

  process.exit(code);
});
