const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const child = require('child_process');
const zlib = require('zlib');

function spawnValidate(dir){
  const res = child.spawnSync('node', [path.join(__dirname,'..','validate-triage-output.cjs'), dir], { encoding: 'utf8' });
  return res;
}

// Helper to create clean temp dir
function makeTemp(){
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-test-'));
  return d;
}

//正常系テスト
(function okCase(){
  const d = makeTemp();
  // create files
  fs.writeFileSync(path.join(d,'triage-summary.md'), '# test');
  fs.writeFileSync(path.join(d,'triage-summary.html'), '<html></html>');
  fs.writeFileSync(path.join(d,'triage-summary.txt'), 'txt');
  // create gz
  fs.writeFileSync(path.join(d,'triage-summary.md.gz'), zlib.gzipSync(Buffer.from('# test')));
  fs.writeFileSync(path.join(d,'triage-summary.html.gz'), zlib.gzipSync(Buffer.from('<html></html>')));
  fs.writeFileSync(path.join(d,'triage-summary.txt.gz'), zlib.gzipSync(Buffer.from('txt')));

  const res = spawnValidate(d);
  assert.strictEqual(res.status, 0, 'Expected validator to exit 0 for ok case; stdout: '+res.stdout+' stderr:'+res.stderr);
  console.log('OK case passed');

})();

// 異常系: 欠損ファイル
(function missingFile(){
  const d = makeTemp();
  fs.writeFileSync(path.join(d,'triage-summary.md'), '# test');
  // missing html
  fs.writeFileSync(path.join(d,'triage-summary.txt'), 'txt');
  fs.writeFileSync(path.join(d,'triage-summary.md.gz'), zlib.gzipSync(Buffer.from('# test')));
  fs.writeFileSync(path.join(d,'triage-summary.html.gz'), zlib.gzipSync(Buffer.from('<html></html>')));
  fs.writeFileSync(path.join(d,'triage-summary.txt.gz'), zlib.gzipSync(Buffer.from('txt')));

  const res = spawnValidate(d);
  assert.notStrictEqual(res.status, 0, 'Expected validator to fail when files are missing');
  console.log('Missing file case passed');
})();

// 異常系: 壊れた gzip
(function badGzip(){
  const d = makeTemp();
  fs.writeFileSync(path.join(d,'triage-summary.md'), '# test');
  fs.writeFileSync(path.join(d,'triage-summary.html'), '<html></html>');
  fs.writeFileSync(path.join(d,'triage-summary.txt'), 'txt');
  // good md.gz
  fs.writeFileSync(path.join(d,'triage-summary.md.gz'), zlib.gzipSync(Buffer.from('# test')));
  // broken html.gz
  fs.writeFileSync(path.join(d,'triage-summary.html.gz'), Buffer.from('not a gzip'));
  fs.writeFileSync(path.join(d,'triage-summary.txt.gz'), zlib.gzipSync(Buffer.from('txt')));

  const res = spawnValidate(d);
  assert.notStrictEqual(res.status, 0, 'Expected validator to fail for bad gzip');
  console.log('Bad gzip case passed');
})();

console.log('All triage-tools tests passed');
