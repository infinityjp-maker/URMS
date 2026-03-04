#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

function readJson(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null; } }
function writeText(p,t){ fs.writeFileSync(p,t,'utf8'); }

const input = argv.in || argv.i || process.env.INPUT || process.env.RUNNER_TEMP && path.join(process.env.RUNNER_TEMP,'triage-diff-summary.json') || 'triage-diff-summary.json';
const fallback = argv.alt || process.env.RUNNER_TEMP && path.join(process.env.RUNNER_TEMP,'triage-diff.json') || 'triage-diff.json';
const out = argv.out || argv.o || process.env.OUT || (process.env.RUNNER_TEMP? path.join(process.env.RUNNER_TEMP,'triage-llm-summary.md') : 'triage-llm-summary.md');

const data = readJson(input) || readJson(fallback) || {};

// Heuristic summarizer (no external LLM). Produces markdown with the requested sections.
function detectImportance(d){
  try{
    const sev = (d.severity||d.summary&&d.summary.severity||'')+'';
    const ieAdded = (d.internalErrorsAdded && d.internalErrorsAdded.length) || (d.internalErrors && d.internalErrors.added && d.internalErrors.added.length) || 0;
    if (/critical/i.test(sev) || ieAdded>0) return 'high';
    if (/warning/i.test(sev) || (d.tagsAdded && d.tagsAdded.length>0)) return 'medium';
    return 'low';
  }catch(e){ return 'medium'; }
}

function summarize(d){
  const lines = [];
  lines.push('# LLM-style Triage Diff Summary');
  lines.push('');
  // Intent
  const intentHints = [];
  if (d.tagsAdded && d.tagsAdded.length) intentHints.push('new tags: '+d.tagsAdded.join(', '));
  if (d.tagsRemoved && d.tagsRemoved.length) intentHints.push('removed tags: '+d.tagsRemoved.join(', '));
  if (d.severity && d.severity.prev !== undefined && d.severity.cur !== undefined && d.severity.prev !== d.severity.cur) intentHints.push('severity changed from '+d.severity.prev+' to '+d.severity.cur);
  if (d.changes && d.changes.C && ((d.changes.C.md && ((d.changes.C.md.added||[]).length+(d.changes.C.md.removed||[]).length>0)) || (d.changes.C.html && ((d.changes.C.html.added||[]).length+(d.changes.C.html.removed||[]).length>0)))) intentHints.push('content lines changed in summary output');
  lines.push('## 変更の意図（推測）');
  if (intentHints.length) lines.push('- ' + intentHints.join('; '));
  else lines.push('- 明確な指標は見つかりません。変更は小規模な内容更新かメタデータ更新の可能性があります。');
  lines.push('');

  // Impact
  lines.push('## 影響範囲');
  const impacted = [];
  if (d.changes && d.changes.A){
    if (d.changes.A.inferredTags && d.changes.A.inferredTags.changed) impacted.push('inferredTags');
    if (d.changes.A.internalErrors && d.changes.A.internalErrors.changed) impacted.push('internalErrors');
    if (d.changes.A.severity && d.changes.A.severity.changed) impacted.push('severity');
  }
  if (d.changes && d.changes.B && d.changes.B.changed) impacted.push('triage.json structure (summary/diagnostics/metadata)');
  if (d.changes && d.changes.C && ((d.changes.C.md && (d.changes.C.md.added.length||d.changes.C.md.removed.length)) || (d.changes.C.html && (d.changes.C.html.added.length||d.changes.C.html.removed.length)))) impacted.push('triage-summary contents (md/html)');
  if (impacted.length) lines.push('- ' + Array.from(new Set(impacted)).join(', '));
  else lines.push('- 明確な影響箇所は検出されませんでした。');
  lines.push('');

  // Importance
  const importance = detectImportance(d);
  lines.push('## 重要度');
  lines.push('- ' + (importance==='high'?'High':'Medium/Likely Medium').toLowerCase());
  lines.push('');

  // internalErrors
  lines.push('## internalErrors の意味と推定原因');
  if (d.internalErrorsAdded && d.internalErrorsAdded.length) lines.push('- 新たに検出された internalErrors: '+d.internalErrorsAdded.join('; '));
  else if (d.internalErrors && d.internalErrors.added && d.internalErrors.added.length) lines.push('- 新たに増えた internalErrors: '+d.internalErrors.added.join('; '));
  else lines.push('- internalErrors に明確な増減は見られません。増加があれば、内部システムログの異常や例外発生が疑われます。');
  lines.push('');

  // inferredTags changes
  lines.push('## inferredTags の変化の意味');
  if (d.tagsAdded && d.tagsAdded.length) lines.push('- 新たに推論されたタグ: '+d.tagsAdded.join(', '));
  if (d.tagsRemoved && d.tagsRemoved.length) lines.push('- 削除されたタグ: '+d.tagsRemoved.join(', '));
  if (!(d.tagsAdded && d.tagsAdded.length) && !(d.tagsRemoved && d.tagsRemoved.length)) lines.push('- タグの変化はありません。');
  lines.push('');

  // Recommendations
  lines.push('## 推奨アクション');
  if (importance==='high'){
    lines.push('- 直ちに内部エラーの詳細ログを確認してください。');
    lines.push('- 主要な機能やサービスの監視を強化してください。');
  } else if (importance==='medium'){
    lines.push('- 変更点のレビュ—を推奨します。');
  } else {
    lines.push('- 情報として記録し、次回差分で継続的に監視してください。');
  }
  lines.push('');

  // include a short raw summary if available
  if (d.summary && typeof d.summary === 'string') lines.push('---\n' + d.summary);

  return lines.join('\n');
}

const md = summarize(data);
try{
  writeText(out, md);
  console.log('Wrote LLM-style summary to', out);
  process.exit(0);
}catch(e){
  console.error('Failed to write LLM summary', e);
  process.exit(2);
}
