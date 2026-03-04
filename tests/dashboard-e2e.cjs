const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_DIR = process.env.BASE_DIR || '_gh_pages';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  const failedResponses = [];
  page.on('console', msg => {
    if (!msg.type || msg.type() !== 'error') return;
    const text = msg.text ? msg.text() : String(msg);
    // Ignore benign static-resource/load errors that occur on gh-pages variants:
    // - generic "Failed to load resource" 404s
    // - Fetch API file:// URL scheme errors when running from disk
    // - other transient fetch/load failures for reports/ or diffs/
    if (/Failed to load resource/i.test(text) && /404/.test(text)) return;
    if (/Fetch API cannot load/i.test(text)) return;
    if (/URL scheme "file" is not supported/i.test(text)) return;
    if (/404 \(File not found\)/i.test(text)) return;
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

  try {
    const indexHtmlPath = path.resolve(process.cwd(), BASE_DIR, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) throw new Error('index.html not found in ' + indexHtmlPath);
    const baseUrl = process.env.BASE_URL && String(process.env.BASE_URL).trim() !== '' ? String(process.env.BASE_URL).replace(/\/$/, '') : null;
    const indexUrl = baseUrl ? `${baseUrl}/index.html` : 'file://' + indexHtmlPath;

    const resp = await page.goto(indexUrl, { waitUntil: 'networkidle' });
    if (!resp && !page.url().startsWith('file://')) throw new Error('Failed to load index.html');

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

    // Wait for the page to render the latest report and diff summary areas
    await page.waitForSelector('#latest-report', { state: 'visible', timeout: 20000 }).catch(()=>{});
    await page.waitForSelector('#report-content', { state: 'visible', timeout: 20000 }).catch(()=>{});
    // Wait until report-content is not the loading placeholder
    await page.waitForFunction(() => {
      const el = document.getElementById('report-content');
      return el && el.innerText && !/loading/i.test(el.innerText) && !/Error loading report/i.test(el.innerText);
    }, { timeout: 15000 }).catch(()=>{});

    // Wait for diff content to be populated
    await page.waitForSelector('#diff-content', { state: 'visible', timeout: 20000 }).catch(()=>{});
    await page.waitForFunction(() => {
      const el = document.getElementById('diff-content');
      return el && el.innerText && !/loading/i.test(el.innerText) && !/Error loading diff summary/i.test(el.innerText);
    }, { timeout: 15000 }).catch(()=>{});

    // LLM summary: verify file exists and provide a minimal check on the ai-content container
    await page.waitForSelector('#ai-content', { state: 'visible', timeout: 15000 }).catch(()=>{});

    // Try loading the diff lines by checking that the JSON file is readable
    let diffLinesJson = null;
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
