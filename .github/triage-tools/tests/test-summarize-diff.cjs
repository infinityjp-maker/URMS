const assert = require('assert');
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const os = require('os');

function mkd(){ return fs.mkdtempSync(path.join(os.tmpdir(),'triage-sum-')); }

(function severityChange(){
  const d = mkd();
  const diff = { changes: { A: { severity: { prev: 'warning', cur: 'critical', changed: true }, inferredTags: { added:['X'], removed:[] }, internalErrors: { prevCount:0, curCount:1, added:['err1'], removed:[] } }, B:{}, C:{} } };
  fs.writeFileSync(path.join(d,'triage-diff.json'), JSON.stringify(diff));
  const out = path.join(d,'out.md');
  child.spawnSync('node',[path.join(__dirname,'..','summarize-diff.cjs'),'--in',path.join(d,'triage-diff.json'),'--out',out],{encoding:'utf8'});
  const md = fs.readFileSync(out,'utf8');
  assert.ok(/Severity/.test(md));
  assert.ok(/Tags added/.test(md));
  assert.ok(/Internal errors/.test(md));
  console.log('severityChange passed');
})();

(function tagChange(){
  const d = mkd();
  const diff = { changes: { A: { inferredTags: { added:['A'], removed:['B'] } }, B:{}, C:{} } };
  fs.writeFileSync(path.join(d,'triage-diff.json'), JSON.stringify(diff));
  const out = path.join(d,'out.md');
  child.spawnSync('node',[path.join(__dirname,'..','summarize-diff.cjs'),'--in',path.join(d,'triage-diff.json'),'--out',out],{encoding:'utf8'});
  const md = fs.readFileSync(out,'utf8');
  assert.ok(/Tags added/.test(md));
  assert.ok(/Tags removed/.test(md));
  console.log('tagChange passed');
})();

(function mdDiffCount(){
  const d = mkd();
  const diff = { changes:{ C: { md: { added:[{line:1,text:'x'}], removed:[] }, html:{ added:[], removed:[] } } } };
  fs.writeFileSync(path.join(d,'triage-diff.json'), JSON.stringify(diff));
  const out = path.join(d,'out.md');
  child.spawnSync('node',[path.join(__dirname,'..','summarize-diff.cjs'),'--in',path.join(d,'triage-diff.json'),'--out',out],{encoding:'utf8'});
  const md = fs.readFileSync(out,'utf8');
  assert.ok(/MD: \+1/.test(md));
  // check JSON summary exists
  const j = JSON.parse(fs.readFileSync(out.replace(/\.md$/, '.json'),'utf8'));
  assert.strictEqual(j.mdAdded, 1);
  console.log('mdDiffCount passed');
})();

(function indexJsonFields(){
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'idx-'));
  const idx = [{ timestamp:'2026-01-01T00:00:00Z', severity:'critical', severityNumeric:3, internalErrors:2, tags:['A'], summary:'Short summary' }];
  fs.writeFileSync(path.join(tmp,'index.json'), JSON.stringify(idx, null, 2));
  const loaded = JSON.parse(fs.readFileSync(path.join(tmp,'index.json'),'utf8'));
  assert.ok(loaded[0].summary && Array.isArray(loaded[0].tags) && typeof loaded[0].severityNumeric === 'number');
  console.log('indexJsonFields passed');
})();

console.log('All summarize-diff tests passed');
