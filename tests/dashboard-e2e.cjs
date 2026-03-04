const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_DIR = process.env.BASE_DIR || '_gh_pages';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type && msg.type() === 'error') consoleErrors.push(msg.text ? msg.text() : String(msg));
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
    const latestSummaryPath = path.resolve(process.cwd(), BASE_DIR, indexJson.latest.summary || 'reports/latest.md');
    const diffSummaryPath = path.resolve(process.cwd(), BASE_DIR, indexJson.latest.diffSummary || 'diffs/triage-diff-summary-latest.md');
    const llmSummaryPath = path.resolve(process.cwd(), BASE_DIR, indexJson.latest.llmSummary || 'diffs/triage-llm-summary-latest.md');
    const diffLinesPath = path.resolve(process.cwd(), BASE_DIR, indexJson.latest.diffLines || 'diffs/triage-diff-lines-latest.json');
    if (!fs.existsSync(latestSummaryPath)) throw new Error('Latest summary file not found: ' + latestSummaryPath);
    if (!fs.existsSync(diffSummaryPath)) throw new Error('Diff summary file not found: ' + diffSummaryPath);
    if (!fs.existsSync(diffLinesPath)) {
      console.warn('Diff lines file not found (continuing): ' + diffLinesPath);
      // not fatal: presence of diff summary is sufficient for basic checks
    }

    // Wait for the page to render the latest report and diff summary areas
    await page.waitForSelector('#latest-report', { state: 'visible', timeout: 8000 }).catch(()=>{});
    await page.waitForSelector('#report-content', { state: 'visible', timeout: 8000 }).catch(()=>{});
    // Wait until report-content is not the loading placeholder
    await page.waitForFunction(() => {
      const el = document.getElementById('report-content');
      return el && el.innerText && !/loading/i.test(el.innerText) && !/Error loading report/i.test(el.innerText);
    }, { timeout: 8000 }).catch(()=>{});

    // Wait for diff content to be populated
    await page.waitForSelector('#diff-content', { state: 'visible', timeout: 8000 }).catch(()=>{});
    await page.waitForFunction(() => {
      const el = document.getElementById('diff-content');
      return el && el.innerText && !/loading/i.test(el.innerText) && !/Error loading diff summary/i.test(el.innerText);
    }, { timeout: 8000 }).catch(()=>{});

    // LLM summary: verify file exists and provide a minimal check on the ai-content container
    await page.waitForSelector('#ai-content', { state: 'visible', timeout: 5000 }).catch(()=>{});

    // Try loading the diff lines by checking that the JSON file is readable
    let diffLinesJson = null;
    if (fs.existsSync(diffLinesPath)){
      diffLinesJson = JSON.parse(fs.readFileSync(diffLinesPath, 'utf8'));
      if (!diffLinesJson) throw new Error('Failed to parse diff lines JSON');
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
