#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJsonSafe(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null; } }
function readTextSafe(p){ try { return fs.readFileSync(p,'utf8'); } catch(e){ return null; } }

function lineDiff(a,b){
  // simple line diff: return arrays of added and removed lines with indices
  const al = (a||'').split(/\r?\n/);
  const bl = (b||'').split(/\r?\n/);
  const removed = [];
  const added = [];
  const max = Math.max(al.length, bl.length);
  for(let i=0;i<max;i++){
    const A = al[i]===undefined?null:al[i];
    const B = bl[i]===undefined?null:bl[i];
    if (A !== B){
      if (A !== null) removed.push({line:i+1,text:A});
      if (B !== null) added.push({line:i+1,text:B});
    }
  }
  return { removed, added };
}

function uniq(arr){ return Array.from(new Set(arr)); }

// Parse args
const argv = require('minimist')(process.argv.slice(2));
const prevDir = argv.prev || argv.p || process.env.PREV_DIR || null;
const curDir = argv.cur || argv.c || process.env.CUR_DIR || process.env.RUNNER_TEMP || null;
const out = argv.out || argv.o || (process.env.RUNNER_TEMP? path.join(process.env.RUNNER_TEMP,'triage-diff.json') : 'triage-diff.json');

const result = { generatedAt: new Date().toISOString(), prevDir: prevDir||null, curDir: curDir||null, summary: { changed: false }, changes: {} };

// read triage.json
const prevJson = prevDir ? readJsonSafe(path.join(prevDir,'triage.json')) || readJsonSafe(path.join(prevDir,'builds/diagnostics/triage.json')) || readJsonSafe(path.join(prevDir,'triage.json')) : null;
const curJson = curDir ? readJsonSafe(path.join(curDir,'triage.json')) || readJsonSafe(path.join(curDir,'builds/diagnostics/triage.json')) || readJsonSafe(path.join(curDir,'builds/diagnostics/triage.json')) : null;

// A: compare severity, inferredTags, internalErrors
try {
  const a = {};
  const prevSev = prevJson && prevJson.severity ? String(prevJson.severity) : null;
  const curSev = curJson && curJson.severity ? String(curJson.severity) : null;
  a.severity = { prev: prevSev, cur: curSev, changed: prevSev !== curSev };

  const prevTags = prevJson && Array.isArray(prevJson.inferredTags)? prevJson.inferredTags : [];
  const curTags = curJson && Array.isArray(curJson.inferredTags)? curJson.inferredTags : [];
  const addedTags = curTags.filter(x=> !prevTags.includes(x));
  const removedTags = prevTags.filter(x=> !curTags.includes(x));
  a.inferredTags = { prev: prevTags, cur: curTags, added: uniq(addedTags), removed: uniq(removedTags), changed: addedTags.length>0 || removedTags.length>0 };

  const prevErrs = prevJson && Array.isArray(prevJson.internalErrors)? prevJson.internalErrors.map(String) : [];
  const curErrs = curJson && Array.isArray(curJson.internalErrors)? curJson.internalErrors.map(String) : [];
  const addedErrs = curErrs.filter(x=> !prevErrs.includes(x));
  const removedErrs = prevErrs.filter(x=> !curErrs.includes(x));
  a.internalErrors = { prevCount: prevErrs.length, curCount: curErrs.length, added: addedErrs, removed: removedErrs, changed: addedErrs.length>0 || removedErrs.length>0 };

  result.changes.A = a;
  if (a.severity.changed || a.inferredTags.changed || a.internalErrors.changed) result.summary.changed = true;
} catch(e){ result.changes.A = { error: String(e) }; }

// B: structural diff of triage.json keys (summary/diagnostics/metadata)
try{
  const keysOf = (j)=> j ? Object.keys(j) : [];
  const relevant = ['summary','diagnostics','metadata'];
  const prevKeys = prevJson? keysOf(prevJson).filter(k=> relevant.includes(k)) : [];
  const curKeys = curJson? keysOf(curJson).filter(k=> relevant.includes(k)) : [];
  const added = curKeys.filter(x=> !prevKeys.includes(x));
  const removed = prevKeys.filter(x=> !curKeys.includes(x));
  result.changes.B = { prevKeys, curKeys, added, removed, changed: added.length>0 || removed.length>0 };
  if (result.changes.B.changed) result.summary.changed = true;
} catch(e){ result.changes.B = { error: String(e) }; }

// C: full text diffs for md and html
try{
  const prevMd = prevDir ? readTextSafe(path.join(prevDir,'triage-summary.md')) || readTextSafe(path.join(prevDir,'triage-summary.txt')) : null;
  const curMd = curDir ? readTextSafe(path.join(curDir,'triage-summary.md')) || readTextSafe(path.join(curDir,'triage-summary.txt')) : null;
  const mdDiff = lineDiff(prevMd, curMd);
  const prevHtml = prevDir ? readTextSafe(path.join(prevDir,'triage-summary.html')) : null;
  const curHtml = curDir ? readTextSafe(path.join(curDir,'triage-summary.html')) : null;
  const htmlDiff = lineDiff(prevHtml, curHtml);
  // Build per-line arrays suitable for a simple line-diff viewer
  function buildLines(aStr,bStr){
    const a = (aStr||'').split(/\r?\n/);
    const b = (bStr||'').split(/\r?\n/);
    const max = Math.max(a.length,b.length);
    const lines = [];
    for(let i=0;i<max;i++){
      const A = a[i]===undefined?null:a[i];
      const B = b[i]===undefined?null:b[i];
      if (A === B){
        lines.push({ type: 'context', line: A===null? '': A });
      } else {
        if (A !== null) lines.push({ type: 'removed', line: A });
        if (B !== null) lines.push({ type: 'added', line: B });
      }
    }
    return lines;
  }

  const mdLines = buildLines(prevMd, curMd);
  const htmlLines = buildLines(prevHtml, curHtml);

  // keep existing structure, add additional fields for viewer-friendly lines
  result.changes.C = { md: mdDiff, html: htmlDiff, mdLines: mdLines, htmlLines: htmlLines };
  if ((mdDiff.added.length||mdDiff.removed.length||htmlDiff.added.length||htmlDiff.removed.length)>0) result.summary.changed = true;
} catch(e){ result.changes.C = { error: String(e) }; }

// write out
try{
  fs.writeFileSync(out, JSON.stringify(result,null,2),'utf8');
  console.log('Wrote triage diff to', out);
  console.log(JSON.stringify({changed: result.summary.changed, changes: Object.keys(result.changes)}));
} catch(e){ console.error('Failed to write triage diff', e); process.exit(2); }

process.exit(0);
