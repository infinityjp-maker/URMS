#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function safeReadJson(p) {
  try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e) { return null }
}

const DIAG_DIRS = [
  path.join('builds','diagnostics'),
  path.join('.github','actions-runs')
];

let smoke = null;
for (const d of DIAG_DIRS) {
  const p = path.join(d, 'smoke-result.full.json');
  if (fs.existsSync(p)) { smoke = safeReadJson(p); break; }
}
if (!smoke) {
  // try workspace build path from recent artifact dirs
  const alt = path.join('builds','ci-run-22621648721-artifacts','builds','diagnostics','smoke-result.full.json');
  if (fs.existsSync(alt)) smoke = safeReadJson(alt);
}

const connPath = path.join('builds','diagnostics','connectivity-preflight.json');
const connectivity = fs.existsSync(connPath) ? safeReadJson(connPath) : null;
const browserResolvePath = path.join('builds','diagnostics','browser-resolve.json');
const browserResolve = fs.existsSync(browserResolvePath) ? safeReadJson(browserResolvePath) : null;

const out = [];
out.push('Smoke auto-triage');
out.push('Timestamp: ' + new Date().toISOString());
if (!smoke) {
  out.push('Result: MISSING smoke-result.full.json');
} else {
  out.push('Result.success: ' + !!smoke.success);
  if (smoke.synthesized) out.push('Note: synthesized=' + smoke.synthesized);
  out.push('pingOk: ' + !!smoke.pingOk);
  out.push('pingPostReceived: ' + !!smoke.pingPostReceived);
  out.push('pageErrors: ' + ((smoke.pageErrors && smoke.pageErrors.length) || 0));
  out.push('consoleMessages: ' + ((smoke.consoleMessages && smoke.consoleMessages.length) || 0));
  if (Array.isArray(smoke.internalErrors) && smoke.internalErrors.length) {
    out.push('Internal errors (sample):');
    smoke.internalErrors.slice(0,10).forEach(e=>out.push(' - '+String(e).slice(0,200)));
  }
}

if (connectivity && Array.isArray(connectivity)) {
  out.push('\nConnectivity probes:');
  connectivity.forEach(p=>{
    out.push(` - ${p.host}:${p.port} tcp=${p.tcp} http=${p.http}`);
  });
} else {
  out.push('\nConnectivity: missing/connectivity-preflight.json');
}

// heuristic triage
const issues = [];

// analyze browser-resolve diagnostics for browser fetch failures
if (browserResolve && Array.isArray(browserResolve)) {
  const brFails = browserResolve.filter(r => !r.ok || (r.error && /Failed to fetch|TypeError: Failed to fetch|ERR_CONNECTION_REFUSED|ECONNREFUSED/i.test(String(r.error))));
  if (brFails.length) {
    issues.push('BrowserFetchFailed');
  }
}

if (smoke && Array.isArray(smoke.internalErrors)) {
  const i = smoke.internalErrors.join('\n');
  if (/CSP|Content Security Policy|violates the following Content Security Policy/i.test(i)) issues.push('CSP');
  if (/Failed to fetch|ERR_CONNECTION_REFUSED|ECONNREFUSED|Connection refused/i.test(i)) issues.push('ConnectionRefused');
}

// inspect consoleMessages and pageErrors for fetch/CSP signs
if (smoke && Array.isArray(smoke.consoleMessages)) {
  const cm = smoke.consoleMessages.join('\n');
  if (/Content Security Policy|CSP/i.test(cm)) issues.push('CSP');
  if (/Failed to fetch|TypeError: Failed to fetch|net::ERR_CONNECTION_REFUSED/i.test(cm)) issues.push('BrowserFetchFailed');
}
if (smoke && Array.isArray(smoke.pageErrors)) {
  const pe = smoke.pageErrors.join('\n');
  if (/Failed to fetch|TypeError: Failed to fetch|net::ERR_CONNECTION_REFUSED/i.test(pe)) issues.push('BrowserFetchFailed');
}

if (connectivity && connectivity.find(p=>p.port===1420 && !p.http)) issues.push('Static1420NotHttp');

out.push('\nInferred issues: ' + (issues.length?issues.join(', '):'none'));

// Deduplicate and present tags as a separate section
const uniqueTags = Array.from(new Set(issues));
out.push('\nInferred tags: ' + (uniqueTags.length ? uniqueTags.join(', ') : 'none'));

try {
  fs.mkdirSync(path.join('.github','actions-runs'), { recursive: true });
  fs.writeFileSync(path.join('.github','actions-runs','smoke-triage.txt'), out.join('\n'), 'utf8');
  console.log('Wrote .github/actions-runs/smoke-triage.txt');
} catch (e) {
  console.error('Failed to write triage file:', e && e.message);
  process.exitCode = 2;
}

// Also write structured JSON triage into builds/diagnostics/triage.json
try {
  const triage = {
    success: !!(smoke && smoke.success),
    inferredTags: uniqueTags || [],
    connectivity: connectivity || null,
    internalErrors: (smoke && Array.isArray(smoke.internalErrors)) ? smoke.internalErrors.slice(0,200) : [],
    browserErrors: {
      browserResolve: browserResolve || null,
      consoleMessages: (smoke && Array.isArray(smoke.consoleMessages)) ? smoke.consoleMessages.slice(0,200) : [],
      pageErrors: (smoke && Array.isArray(smoke.pageErrors)) ? smoke.pageErrors.slice(0,200) : []
    },
    timestamp: new Date().toISOString()
  };
  fs.mkdirSync(path.join('builds','diagnostics'), { recursive: true });
  fs.writeFileSync(path.join('builds','diagnostics','triage.json'), JSON.stringify(triage, null, 2), 'utf8');
  // mirror to actions-runs for quick access
  try { fs.writeFileSync(path.join('.github','actions-runs','triage.json'), JSON.stringify(triage, null, 2), 'utf8'); } catch(e) {}
  console.log('Wrote builds/diagnostics/triage.json');
} catch (e) {
  console.error('Failed to write triage.json:', e && e.message);
}
