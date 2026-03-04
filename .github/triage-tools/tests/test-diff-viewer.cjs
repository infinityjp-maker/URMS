const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const child = require('child_process');

function mkd(){ return fs.mkdtempSync(path.join(os.tmpdir(),'triage-diff-')); }
function run(prev,cur){
  const out = path.join(cur,'triage-diff-out.json');
  const res = child.spawnSync('node', [path.join(__dirname,'..','diff-triage.cjs'),'--prev',prev,'--cur',cur,'--out',out], { encoding:'utf8' });
  return { res, out };
}

(function mdHtmlLinesPresent(){
  const prev = mkd(); const cur = mkd();
  fs.writeFileSync(path.join(prev,'triage-summary.md'), 'a\nb\nc');
  fs.writeFileSync(path.join(cur,'triage-summary.md'), 'a\nB\nc');
  fs.writeFileSync(path.join(prev,'triage-summary.html'), '<div>a</div>\n<div>b</div>');
  fs.writeFileSync(path.join(cur,'triage-summary.html'), '<div>a</div>\n<div>B</div>');
  fs.writeFileSync(path.join(prev,'triage.json'), JSON.stringify({}));
  fs.writeFileSync(path.join(cur,'triage.json'), JSON.stringify({}));
  const {res,out} = run(prev,cur);
  assert.strictEqual(res.status, 0, 'diff script should exit 0');
  const j = JSON.parse(fs.readFileSync(out,'utf8'));
  assert.ok(j.changes && j.changes.C && Array.isArray(j.changes.C.mdLines), 'mdLines should exist');
  assert.ok(j.changes.C.mdLines.some(x=> x.type==='added') && j.changes.C.mdLines.some(x=> x.type==='removed') && j.changes.C.mdLines.some(x=> x.type==='context'), 'mdLines should include added/removed/context');
  assert.ok(Array.isArray(j.changes.C.htmlLines), 'htmlLines should exist');
  console.log('md/html mdLines/htmlLines presence test passed');
})();

(function indexHasDiffViewer(){
  const html = fs.readFileSync(path.join(process.cwd(),'dashboard','index.html'),'utf8');
  assert.ok(html.indexOf('id="diff-viewer"') !== -1, 'dashboard/index.html must contain #diff-viewer');
  assert.ok(html.indexOf('.diff-line') !== -1, 'dashboard/index.html should include diff-line styles');
  console.log('index.html diff viewer presence test passed');
})();

console.log('All diff-viewer tests passed');
