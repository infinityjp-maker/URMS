const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '..', 'workflows');
const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

function report(file, msg){ console.log(file+': '+msg); }

let hasJsYaml = true;
let jsYaml = null;
try { jsYaml = require('js-yaml'); } catch (e) { hasJsYaml = false; }

for (const f of files) {
  const p = path.join(workflowsDir, f);
  const raw = fs.readFileSync(p, 'utf8');
  // BOM
  if (raw.charCodeAt(0) === 0xFEFF) report(f, 'BOM detected');
  // Tabs
  if (raw.indexOf('\t') !== -1) report(f, 'Tab characters present (use spaces)');
  // multi-doc separator
  if (/^---\s*$/m.test(raw) || raw.includes('\n---')) report(f, 'Multi-document "---" marker present');
  // leading/trailing invisible control chars (besides CRLF)
  const invis = raw.split('\n').find((ln, i) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(ln));
  if (invis) report(f, 'Contains control/不可視文字 in some lines');

  // check for multiple top-level 'on' occurrences using simple parse: count occurrences of '^on:' at start of line
  const onCount = (raw.match(/^on:\s*$/mg) || []).length + (raw.match(/^on:\s*\{/mg) || []).length;
  if (onCount > 1) report(f, `Multiple top-level 'on:' occurrences: ${onCount}`);

  // detect if 'jobs:' appears under 'on:' (a nesting error) by simple heuristic: find 'on:' block range then search for 'jobs:' inside
  const onMatch = raw.match(/^on:\s*([\s\S]*?)(^\S|\Z)/m);
  if (onMatch) {
    const onBlock = onMatch[1];
    if (onBlock && /\bjobs\s*:\s*/.test(onBlock)) report(f, "Found 'jobs:' inside 'on:' block (hierarchy error)");
  }

  // try strict YAML parse if available
  if (hasJsYaml) {
    try {
      const docs = [];
      jsYaml.loadAll(raw, doc => docs.push(doc));
      if (docs.length > 1) report(f, `Parsed ${docs.length} YAML documents`);
      const doc = docs[0];
      if (!doc || typeof doc !== 'object') report(f, 'Top-level YAML is not a mapping/object');
      else {
        // top-level keys
        const keys = Object.keys(doc);
        if (!keys.includes('name')) report(f, "Top-level 'name' missing");
        if (!keys.includes('on')) report(f, "Top-level 'on' missing");
        if (!keys.includes('jobs')) report(f, "Top-level 'jobs' missing");
        // check correct placement of workflow_dispatch: should be under 'on'
        if (doc.workflow_dispatch) report(f, "Found top-level 'workflow_dispatch' (should be under 'on')");
        // check if 'on' contains invalid keys (e.g., jobs)
        if (doc.on && typeof doc.on === 'object') {
          if (doc.on.jobs) report(f, "Found 'jobs' key inside 'on' mapping (hierarchy error)");
        }
      }
    } catch (e) {
      report(f, 'js-yaml parse error: ' + e.message);
    }
  }
}

console.log('Done');
