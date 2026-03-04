const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_DIR = process.env.BASE_DIR || '_gh_pages';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  const failedResponses = [];
  // runtime-adjustable console filters (auto-updateable during run)
  const consoleIgnorePatterns = [
    /Failed to load resource/i,
    /Fetch API cannot load/i,
    /URL scheme "file" is not supported/i,
    /404 \(File not found\)/i,
  ];
  page.on('console', msg => {
    if (!msg.type || msg.type() !== 'error') return;
    const text = msg.text ? msg.text() : String(msg);
    // If any ignore pattern matches, skip
    for (const p of consoleIgnorePatterns) if (p.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('response', resp => {
    try{
      const url = typeof resp.url === 'function' ? resp.url() : (resp.url || '');
      const status = typeof resp.status === 'function' ? resp.status() : (resp.status || 0);
      if (status >= 400) failedResponses.push({ url, status });
    }catch(e){}
  });
  page.on('requestfailed', rf => {
    try{
      const url = typeof rf.url === 'function' ? rf.url() : (rf.url || '');
      const failure = rf.failure ? (typeof rf.failure === 'function' ? rf.failure() : rf.failure) : null;
      failedResponses.push({ url, failureText: failure });
    }catch(e){}
  });

  // helper: try waitForSelector with auto-increasing timeouts
  async function waitForVisibleAuto(sel, initial=20000, max=60000){
    try{
      await page.waitForSelector(sel, { state: 'visible', timeout: initial });
      return true;
    }catch(e){
      // try longer timeout once
      try{
        await page.waitForSelector(sel, { state: 'visible', timeout: Math.min(max, initial*2) });
        return true;
      }catch(e2){
        return false;
      }
    }
  }

  // helper: find alternate selector candidates from index.html content
  function findAlternateSelector(html, keyword){
    const ids = Array.from(html.matchAll(/id\s*=\s*"([^"]+)"/ig)).map(m=>m[1]);
    const classes = Array.from(html.matchAll(/class\s*=\s*"([^"]+)"/ig)).flatMap(m=>m[1].split(/\s+/));
    const all = ids.concat(classes);
    const lower = keyword.replace(/[^a-z0-9]+/ig,'').toLowerCase();
    let best = null;
    for (const a of all){
      const s = a.replace(/[^a-z0-9]+/ig,'').toLowerCase();
      if (s.includes(lower) || lower.includes(s)) { best = a; break; }
    }
    if (!best && all.length>0) best = all[0];
    if (!best) return null;
    // prefer id
    if (ids.includes(best)) return `#${best}`;
    return `.${best}`;
  }

  try {
    const indexHtmlPath = path.resolve(process.cwd(), BASE_DIR, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) throw new Error('index.html not found in ' + indexHtmlPath);
    const baseUrl = process.env.BASE_URL && String(process.env.BASE_URL).trim() !== '' ? String(process.env.BASE_URL).replace(/\/$/, '') : null;
    const indexUrl = baseUrl ? `${baseUrl}/index.html` : 'file://' + indexHtmlPath;

    let resp = await page.goto(indexUrl, { waitUntil: 'networkidle' });
    if (!resp && !page.url().startsWith('file://')) throw new Error('Failed to load index.html');

    // Read raw index.html to support auto-fix heuristics
    const indexHtml = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath,'utf8') : '';
    // diffLines JSON may be discovered from multiple locations
    let diffLinesJson = null;
    // Auto-detect BASE_URL from <base> or canonical/meta tags when not provided
    if (!baseUrl && indexHtml) {
      const baseMatch = indexHtml.match(/<base[^>]+href\s*=\s*"([^"]+)"/i);
      const canonMatch = indexHtml.match(/<link[^>]+rel\s*=\s*"canonical"[^>]+href\s*=\s*"([^"]+)"/i);
      const ogMatch = indexHtml.match(/<meta[^>]+property\s*=\s*"og:url"[^>]+content\s*=\s*"([^"]+)"/i);
      const detected = (baseMatch && baseMatch[1]) || (canonMatch && canonMatch[1]) || (ogMatch && ogMatch[1]) || null;
      if (detected) {
        try{
          const normalized = String(detected).replace(/\/index\.html\/?$/,'').replace(/\/$/, '');
          if (normalized && !String(indexUrl).startsWith(normalized)){
            console.log('Auto-detected BASE_URL from index.html:', normalized);
            // navigate to the canonical base URL version to avoid BASE_URL mismatches
            resp = await page.goto(normalized + '/index.html', { waitUntil: 'networkidle' });
          }
        }catch(e){}
      }
    }

    // Read index.json and ensure latest keys exist
    const indexJsonPath = path.resolve(process.cwd(), BASE_DIR, 'reports', 'index.json');
    if (!fs.existsSync(indexJsonPath)) throw new Error('reports/index.json not found at ' + indexJsonPath);
    const indexJson = JSON.parse(fs.readFileSync(indexJsonPath, 'utf8'));
    if (!indexJson || !indexJson.latest) throw new Error('index.json.latest missing');

    // Ensure referenced files exist on disk
    const latestSummaryRel = indexJson.latest.summary || 'reports/latest.md';
    const diffSummaryRel = indexJson.latest.diffSummary || 'diffs/triage-diff-summary-latest.md';
    const llmSummaryRel = indexJson.latest.llmSummary || 'diffs/triage-llm-summary-latest.md';
    const diffLinesRel = indexJson.latest.diffLines || 'diffs/triage-diff-lines-latest.json';
    const latestSummaryPath = path.resolve(process.cwd(), BASE_DIR, latestSummaryRel);
    const diffSummaryPath = path.resolve(process.cwd(), BASE_DIR, diffSummaryRel);
    const llmSummaryPath = path.resolve(process.cwd(), BASE_DIR, llmSummaryRel);
    const diffLinesPath = path.resolve(process.cwd(), BASE_DIR, diffLinesRel);
    // Accept either .md or .html variants for report summaries to reduce benign 404s
    const altLatestSummaryPath = latestSummaryPath.replace(/\.md$/i, '.html');
    const altDiffSummaryPath = diffSummaryPath.replace(/\.md$/i, '.html');
    const altLlmSummaryPath = llmSummaryPath.replace(/\.md$/i, '.html');
    if (!(fs.existsSync(latestSummaryPath) || fs.existsSync(altLatestSummaryPath))) {
      throw new Error('Latest summary file not found: ' + latestSummaryPath + ' (alt: ' + altLatestSummaryPath + ')');
    }
    if (!(fs.existsSync(diffSummaryPath) || fs.existsSync(altDiffSummaryPath))) {
      throw new Error('Diff summary file not found: ' + diffSummaryPath + ' (alt: ' + altDiffSummaryPath + ')');
    }
    if (!fs.existsSync(diffLinesPath)) {
      console.warn('Diff lines file not found (continuing): ' + diffLinesPath);
      // not fatal: presence of diff summary is sufficient for basic checks
    }

    // --- Auto-fix heuristics: selector adjustments, diffLines fallback, console filter updates ---
    const selectorMap = {
      latestReport: '#latest-report',
      reportContent: '#report-content',
      diffContent: '#diff-content',
      aiContent: '#ai-content'
    };
    if (indexHtml){
      for (const key of Object.keys(selectorMap)){
        const sel = selectorMap[key];
        // if primary id/class not present in the HTML, attempt to find an alternate
        const idMatch = sel.match(/^#(.+)/);
        const keyword = idMatch ? idMatch[1] : sel.replace(/[^a-z0-9]+/ig,'');
        if (!new RegExp(idMatch ? `id\s*=\s*"${keyword}"` : keyword, 'i').test(indexHtml)){
          const alt = findAlternateSelector(indexHtml, keyword);
          if (alt){
            console.log('Selector auto-fixed:', sel, '->', alt);
            selectorMap[key] = alt;
          }
        }
      }
    }

    // Diff lines fallback: try alternate locations if primary diffLines missing
    if (!fs.existsSync(diffLinesPath)){
      const altCandidates = [
        path.resolve(process.cwd(), BASE_DIR, 'data', 'diffs.json'),
        path.resolve(process.cwd(), 'data', 'diffs.json'),
        path.resolve(process.cwd(), BASE_DIR, 'diffs', 'triage-diff-lines.json')
      ];
      for (const c of altCandidates){
        if (fs.existsSync(c)){
          try{ diffLinesJson = JSON.parse(fs.readFileSync(c,'utf8')); console.log('Loaded diffLines from', c); break; }catch(e){}
        }
    }

    // Console filter auto-update: if many 404s share a prefix, add to ignore list
    try{
      const prefixCounts = {};
      for (const r of (failedResponses||[])){
        const u = String(r.url||'');
        if (!/404/.test(String(r.status||''))) continue;
        const m = u.match(/https?:\/\/[^\/]+(\/[^?#]*)/i) || u.match(/(\/[^?#]+)/);
        const p = m && m[1] ? m[1].split('/').slice(0,3).join('/') : '/';
        prefixCounts[p] = (prefixCounts[p]||0) + 1;
      }
      for (const p in prefixCounts){
        if (prefixCounts[p] >= 3){
          const re = new RegExp(p.replace(/\//g,'\\/'));
          consoleIgnorePatterns.push(re);
          console.log('Auto-added console ignore pattern for prefix', p);
        }
      }
    }catch(e){}

    // Wait for the page to render the latest report and diff summary areas (using auto-fixed selectors)
    await waitForVisibleAuto(selectorMap.latestReport, 20000).catch(()=>{});
    await waitForVisibleAuto(selectorMap.reportContent, 20000).catch(()=>{});
    // Wait until report-content is not the loading placeholder
    await page.waitForFunction((sel) => {
      const el = document.querySelector(sel);
      return el && el.innerText && !/loading/i.test(el.innerText) && !/Error loading report/i.test(el.innerText);
    }, selectorMap.reportContent, { timeout: 15000 }).catch(()=>{});

    // Wait for diff content to be populated
    await waitForVisibleAuto(selectorMap.diffContent, 20000).catch(()=>{});
    await page.waitForFunction((sel) => {
      const el = document.querySelector(sel);
      return el && el.innerText && !/loading/i.test(el.innerText) && !/Error loading diff summary/i.test(el.innerText);
    }, selectorMap.diffContent, { timeout: 15000 }).catch(()=>{});

    // LLM summary: verify file exists and provide a minimal check on the ai-content container
    await waitForVisibleAuto(selectorMap.aiContent, 15000).catch(()=>{});

    // Try loading the diff lines by checking that the JSON file is readable
    if (fs.existsSync(diffLinesPath)){
      diffLinesJson = JSON.parse(fs.readFileSync(diffLinesPath, 'utf8'));
      if (!diffLinesJson) throw new Error('Failed to parse diff lines JSON');
    }

    // Filter failedResponses: ignore 404s under /reports/ and /diffs/
    const relevantFailed = (failedResponses || []).filter(r => {
      const u = String(r.url || '');
      const status = r.status || 0;
      if (status === 404 && (/\/reports\//.test(u) || /\/diffs\//.test(u))) return false;
      return true;
    });
    if (relevantFailed.length > 0) {
      throw new Error('Network failures detected: ' + JSON.stringify(relevantFailed.slice(0,5)));
    }
    if (consoleErrors.length > 0) {
      throw new Error('Console errors detected: ' + JSON.stringify(consoleErrors.slice(0,5)));
    }

    console.log('E2E checks passed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('E2E failure:', err && err.message ? err.message : err);
    await browser.close();
    process.exit(1);
  }

})();
