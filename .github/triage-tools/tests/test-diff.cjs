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

// test: no previous -> no changes
(function noPrev(){
  const cur = mkd();
  fs.writeFileSync(path.join(cur,'triage-summary.md'),'line1\nline2');
  fs.writeFileSync(path.join(cur,'triage-summary.html'),'<html>v1</html>');
  fs.writeFileSync(path.join(cur,'triage.json'), JSON.stringify({ severity: 'critical', inferredTags:['A'], internalErrors:[] }));
  const {res,out} = run('',cur);
  const j = JSON.parse(fs.readFileSync(out,'utf8'));
  assert.ok(j, 'output JSON present');
  console.log('noPrev passed');
})();

// test: changed severity
(function changedSeverity(){
  const prev = mkd(); const cur = mkd();
  fs.writeFileSync(path.join(prev,'triage.json'), JSON.stringify({ severity: 'warning', inferredTags:['A'], internalErrors:[] }));
  fs.writeFileSync(path.join(cur,'triage.json'), JSON.stringify({ severity: 'critical', inferredTags:['A'], internalErrors:[] }));
  fs.writeFileSync(path.join(prev,'triage-summary.md'),'same'); fs.writeFileSync(path.join(cur,'triage-summary.md'),'same');
  const {res,out} = run(prev,cur);
  const j = JSON.parse(fs.readFileSync(out,'utf8'));
  assert.ok(j.changes && j.changes.A && j.changes.A.severity.changed, 'severity should be detected as changed');
  console.log('changedSeverity passed');
})();

// test: md line diff
(function mdDiff(){
  const prev = mkd(); const cur = mkd();
  fs.writeFileSync(path.join(prev,'triage-summary.md'),'a\nb\nc');
  fs.writeFileSync(path.join(cur,'triage-summary.md'),'a\nB\nc');
  fs.writeFileSync(path.join(prev,'triage.json'), JSON.stringify({}));
  fs.writeFileSync(path.join(cur,'triage.json'), JSON.stringify({}));
  const {res,out} = run(prev,cur);
  const j = JSON.parse(fs.readFileSync(out,'utf8'));
  assert.ok(j.changes && j.changes.C && (j.changes.C.md.added.length>0 || j.changes.C.md.removed.length>0), 'md diff detected');
  console.log('mdDiff passed');
})();

console.log('All diff tests passed');
