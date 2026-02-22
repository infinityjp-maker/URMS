const fs = require('fs');
function check(path){
  try{
    const buf = fs.readFileSync(path);
    if (!buf || buf.length < 24) return console.log(path, 'not-found-or-too-small');
    if (buf.slice(0,8).toString('hex') !== '89504e470d0a1a0a') return console.log(path, 'not-png');
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    console.log(path, 'IHDR', w, h, 'bytes', buf.length);
  }catch(e){ console.log(path, 'error', e && e.message); }
}
const paths = [
  'Tests/playwright/baseline/playwright-smoke.png',
  '.gh-logs/artifacts-22067388401/home/runner/work/URMS/URMS/builds/screenshots/playwright-smoke.png',
  '.gh-logs/artifacts-22067388401/home/runner/work/URMS/URMS/builds/screenshots/playwright-smoke-full.png',
  '.gh-logs/artifacts-22067388401/home/runner/work/URMS/URMS/builds/screenshots/diff-playwright-smoke.png',
  '.gh-logs/artifacts-22063846022/home/runner/work/URMS/URMS/builds/screenshots/playwright-smoke.png',
  '.gh-logs/artifacts-22063846022/home/runner/work/URMS/URMS/builds/screenshots/diff-playwright-smoke.png'
];
paths.forEach(check);
