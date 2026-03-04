const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const child = require('child_process');

function mkd(){ return fs.mkdtempSync(path.join(os.tmpdir(),'triage-llm-')); }

(function generatesMarkdown(){
  const tmp = mkd();
  const sd = { changes: { A: { inferredTags: { changed: true }, internalErrors: { changed: true } }, C: { md: { added: [{line:1,text:'x'}], removed: [] }, html: { added: [], removed: [] } } }, tagsAdded:['new-tag'], tagsRemoved:[] };
  const inFile = path.join(tmp,'triage-diff-summary.json');
  fs.writeFileSync(inFile, JSON.stringify(sd));
  const outFile = path.join(tmp,'triage-llm-summary.md');
  const res = child.spawnSync('node', [path.join(__dirname,'..','llm-summarize-diff.cjs'),'--in',inFile,'--out',outFile], { encoding:'utf8' });
  assert.strictEqual(res.status, 0, 'llm summarizer should exit 0');
  assert.ok(fs.existsSync(outFile), 'Output markdown should be created');
  const md = fs.readFileSync(outFile,'utf8');
  assert.ok(md.indexOf('## 変更の意図') !== -1, 'Markdown should contain sections');
  console.log('LLM markdown generation test passed');
})();

(function workflowContainsLlmsummary(){
  const wf = fs.readFileSync(path.join(process.cwd(),'.github','workflows','triage-summary-report.yml'),'utf8');
  assert.ok(wf.indexOf('llm-summarize-diff.cjs') !== -1, 'workflow should invoke llm-summarize-diff.cjs');
  assert.ok(wf.indexOf('llmSummary') !== -1, 'workflow should annotate index.json with llmSummary');
  console.log('Workflow presence test passed');
})();

(function dashboardHasAiUi(){
  const html = fs.readFileSync(path.join(process.cwd(),'dashboard','index.html'),'utf8');
  assert.ok(html.indexOf('id="ai-summary"') !== -1, 'dashboard/index.html must contain #ai-summary');
  assert.ok(html.indexOf('AI 要約') !== -1, 'dashboard/index.html should include AI 要約 label');
  console.log('Dashboard AI UI presence test passed');
})();

console.log('All llm-summary tests passed');
