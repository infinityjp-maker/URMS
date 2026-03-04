#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function isoFromEpochIfPossible(s) {
  const m = s && s.match(/(\d{10,})/);
  if (m) return new Date(Number(m[1]) * 1000).toISOString();
  return null;
}

function fileMtimeIso(filePath) {
  try {
    const st = fs.statSync(filePath);
    return st.mtime.toISOString();
  } catch (e) {
    return null;
  }
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir,f)).isFile());
  } catch (e) {
    return [];
  }
}

function main() {
  // simple argv parser to avoid external deps
  const argv = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = raw[i+1] && !raw[i+1].startsWith('--') ? raw[++i] : true;
      argv[key] = val;
    }
  }
  const reportsDir = argv.reportsDir || 'dashboard/reports';
  const diffsDir = argv.diffsDir || 'dashboard/diffs';
  const out = argv.out || path.join(reportsDir, 'index.json');

  const latest = {
    summary: 'reports/latest.md',
    diffSummary: 'diffs/triage-diff-summary-latest.md',
    llmSummary: 'diffs/triage-llm-summary-latest.md',
    diffLines: 'diffs/triage-diff-lines-latest.json'
  };

  const history = [];

  // collect report files (exclude latest.md and index.json)
  const reports = listFiles(reportsDir).filter(f => f !== 'latest.md' && f !== 'index.json');
  // iterate reports and find matching diffs by timestamp token
  reports.forEach(rf => {
    const rfPath = path.join(reportsDir, rf);
    let ts = isoFromEpochIfPossible(rf) || fileMtimeIso(rfPath);
    // attempt to find matching diff files containing the same epoch token
    const tokenMatch = (rf.match(/(\d{10,})/) || [null, null])[1];
    let diffSummary = null, llmSummary = null, diffLines = null;
    if (tokenMatch) {
      const ds = listFiles(diffsDir);
      ds.forEach(df => {
        if (df.includes(tokenMatch) && df.includes('diff-summary')) diffSummary = path.posix.join('diffs', df);
        if (df.includes(tokenMatch) && df.includes('llm-summary')) llmSummary = path.posix.join('diffs', df);
        if (df.includes(tokenMatch) && (df.includes('diff-lines') || df.includes('lines'))) diffLines = path.posix.join('diffs', df);
      });
    }
    // fallback: try to find any nearby files by mtime order
    history.push({
      timestamp: ts || fileMtimeIso(rfPath) || new Date().toISOString(),
      summary: path.posix.join('reports', rf),
      diffSummary: diffSummary || null,
      llmSummary: llmSummary || null,
      diffLines: diffLines || null
    });
  });

  // sort history by timestamp desc
  history.sort((a,b)=> (a.timestamp < b.timestamp) ? 1 : -1);

  const index = {
    generatedAt: new Date().toISOString(),
    latest,
    history
  };

  // ensure reportsDir exists
  try { fs.mkdirSync(reportsDir, { recursive: true }); } catch(e){}
  fs.writeFileSync(out, JSON.stringify(index, null, 2), 'utf8');
  console.log('Wrote index to', out);
}

main();
