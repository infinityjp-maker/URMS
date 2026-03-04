#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const runnerTemp = process.env.RUNNER_TEMP || process.argv[2] || '/tmp';
function checkFile(p){ try { return fs.existsSync(p); } catch(e){ return false; } }
function log(msg){ console.log(msg); }

const expected = [
  'triage-summary.md',
  'triage-summary.html',
  'triage-summary.txt',
  'triage-summary.md.gz',
  'triage-summary.html.gz',
  'triage-summary.txt.gz'
];
let ok = true;
let report = { checkedAt: new Date().toISOString(), root: runnerTemp, files: {} };
for(const f of expected){
  const fp = path.join(runnerTemp, f);
  const exists = checkFile(fp);
  report.files[f] = { present: exists };
  if (!exists) { ok = false; }
}
// internal errors extraction optional
const ie = path.join(runnerTemp,'triage-internal-errors.txt');
report.files['triage-internal-errors.txt'] = { present: checkFile(ie) };

// gzip integrity quick check (only if present)
const zlib = require('zlib');
for(const gz of expected.filter(x=>x.endsWith('.gz'))){
  const p = path.join(runnerTemp,gz);
  if (checkFile(p)){
    try {
      const raw = fs.readFileSync(p);
      zlib.gunzipSync(raw);
      report.files[gz].gzip_ok = true;
    } catch(e){ report.files[gz].gzip_ok = false; ok = false; }
  }
}

console.log(JSON.stringify(report,null,2));
if (!ok) {
  console.error('Validation failed: missing or invalid files');
  process.exit(2);
}
console.log('Validation OK');
process.exit(0);
