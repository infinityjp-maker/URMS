const { spawn } = require('child_process');
const fs = require('fs');

try {
  fs.mkdirSync('builds/screenshots', { recursive: true });
} catch (e) {}

const env = Object.assign({}, process.env, { URL: 'http://tauri.localhost/' });
const cp = spawn(process.execPath, ['Tests/playwright/smoke.cjs'], { env });
let out = '';
let errOut = '';
cp.stdout.on('data', d => out += d.toString());
cp.stderr.on('data', d => errOut += d.toString());
cp.on('close', code => {
  try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch(e){}
  fs.writeFileSync('builds/screenshots/smoke-result.json', out, 'utf8');
  if (errOut && errOut.length) fs.writeFileSync('builds/screenshots/smoke-result.err', errOut, 'utf8');
  console.log('smoke result saved (stdout-> builds/screenshots/smoke-result.json, stderr-> builds/screenshots/smoke-result.err), exit code', code);
  process.exit(code);
});
