#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const inPath = argv.in || argv.i || (process.env.RUNNER_TEMP? path.join(process.env.RUNNER_TEMP,'triage-diff.json') : 'triage-diff.json');
const outPath = argv.out || argv.o || (process.env.RUNNER_TEMP? path.join(process.env.RUNNER_TEMP,'triage-diff-summary.md') : 'triage-diff-summary.md');

function read(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null; } }
const diff = read(inPath);
if (!diff){
  fs.writeFileSync(outPath, '# Triage Diff Summary\n\n_No diff available_\n','utf8');
  console.log('Wrote empty diff summary to', outPath);
  process.exit(0);
}

let md = '# Triage Diff Summary\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;

// A: severity / tags / internalErrors
if (diff.changes && diff.changes.A){
  const a = diff.changes.A;
  md += '## Severity / Tags / Internal Errors\n\n';
  if (a.severity) md += `- Severity: **${a.severity.prev||'none'}** -> **${a.severity.cur||'none'}** ${a.severity.changed?': changed':'': ''}\n`;
  if (a.inferredTags) {
    md += `- Tags added: ${ (a.inferredTags.added||[]).join(', ') || 'none' }\n`;
    md += `- Tags removed: ${ (a.inferredTags.removed||[]).join(', ') || 'none' }\n`;
  }
  if (a.internalErrors) {
    md += `- Internal errors: ${a.internalErrors.prevCount||0} -> ${a.internalErrors.curCount||0}\n`;
    if ((a.internalErrors.added||[]).length) md += '\n**Added internal errors (excerpt):**\n\n' + (a.internalErrors.added.slice(0,5).map(x=>'> '+String(x).split('\n')[0]).join('\n')) + '\n\n';
  }
}

// B: structure
if (diff.changes && diff.changes.B){
  const b = diff.changes.B;
  md += '## Triage JSON Structure Changes\n\n';
  md += `- Keys added: ${(b.added||[]).join(', ') || 'none'}\n`;
  md += `- Keys removed: ${(b.removed||[]).join(', ') || 'none'}\n`;
}

// C: md/html line counts
if (diff.changes && diff.changes.C){
  const c = diff.changes.C;
  const mdAdded = (c.md.added||[]).length;
  const mdRemoved = (c.md.removed||[]).length;
  const htmlAdded = (c.html.added||[]).length;
  const htmlRemoved = (c.html.removed||[]).length;
  md += '## Text Diffs\n\n';
  md += `- MD: +${mdAdded} / -${mdRemoved} lines\n`;
  md += `- HTML: +${htmlAdded} / -${htmlRemoved} lines\n`;
}

fs.writeFileSync(outPath, md, 'utf8');
console.log('Wrote diff summary to', outPath);
// also write a JSON summary for dashboards
try{
  const jsonOut = (outPath.endsWith('.md')) ? outPath.replace(/\.md$/, '.json') : outPath + '.json';
  const a = diff.changes && diff.changes.A ? diff.changes.A : {};
  const c = diff.changes && diff.changes.C ? diff.changes.C : {};
  const summary = {
    generatedAt: new Date().toISOString(),
    severity: (a.severity && a.severity.cur) || null,
    severityPrev: (a.severity && a.severity.prev) || null,
    tagsAdded: (a.inferredTags && a.inferredTags.added) || [],
    tagsRemoved: (a.inferredTags && a.inferredTags.removed) || [],
    internalErrorsPrev: (a.internalErrors && a.internalErrors.prevCount) || 0,
    internalErrorsCur: (a.internalErrors && a.internalErrors.curCount) || 0,
    mdAdded: (c.md && c.md.added) ? (c.md.added.length||0) : 0,
    mdRemoved: (c.md && c.md.removed) ? (c.md.removed.length||0) : 0,
    htmlAdded: (c.html && c.html.added) ? (c.html.added.length||0) : 0,
    htmlRemoved: (c.html && c.html.removed) ? (c.html.removed.length||0) : 0,
  };
  fs.writeFileSync(jsonOut, JSON.stringify(summary, null, 2), 'utf8');
  console.log('Wrote diff summary JSON to', jsonOut);
} catch(e){ console.error('Failed to write diff json', e); }
process.exit(0);
