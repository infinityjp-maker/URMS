const { spawn } = require('child_process');
const fs = require('fs');

try {
  fs.mkdirSync('builds/screenshots', { recursive: true });
} catch (e) {}

const env = Object.assign({}, process.env, { URL: 'http://tauri.localhost/' });
const cp = spawn(process.execPath, ['Tests/playwright/smoke.cjs'], { env });
let out = '';
cp.stdout.on('data', d => out += d.toString());
cp.stderr.on('data', d => out += d.toString());
cp.on('close', code => {
  fs.writeFileSync('builds/screenshots/smoke-result.json', out, 'utf8');
  console.log('smoke result saved, exit code', code);
  process.exit(code);
});
