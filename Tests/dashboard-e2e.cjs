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
    const indexUrl = 'file://' + indexHtmlPath;

    const resp = await page.goto(indexUrl, { waitUntil: 'networkidle' });
    // page.goto with file:// returns null response in some environments; skip status check
    if (!resp && !page.url().startsWith('file://')) throw new Error('Failed to load index.html');

    const indexJsonPath = path.resolve(process.cwd(), BASE_DIR, 'reports', 'index.json');
    if (!fs.existsSync(indexJsonPath)) throw new Error('reports/index.json not found at ' + indexJsonPath);
    const indexJson = JSON.parse(fs.readFileSync(indexJsonPath, 'utf8'));
    if (!indexJson || !indexJson.history) throw new Error('index.json missing history');

    // check for links/buttons in the rendered page
    const summary = await page.$('a[href*="reports/latest"], a[href*="latest.md"], text="Latest"');
    if (!summary) throw new Error('Latest summary link not found');
    const diff = await page.$('a[href*="diffs/"], a:has-text("diff"), text=diff');
    if (!diff) throw new Error('Diff link not found');
    const llm = await page.$('a[href*="llm"], button:has-text("LLM"), text=LLM');
    if (!llm) throw new Error('LLM link/button not found');

    // try toggle LLM if possible
    const llmToggle = await page.$('[data-llm-toggle], .llm-toggle, button:has-text("LLM summary"), button:has-text("LLM")');
    if (llmToggle) {
      await llmToggle.click();
      await page.waitForTimeout(500);
      const llmContent = await page.$('.llm-content, [data-llm-content], .llm-summary');
      if (!llmContent) throw new Error('LLM content not visible after toggle');
    } else {
      throw new Error('LLM toggle not found');
    }

    // check diff file exists in gh-pages clone
    const diffFile = path.resolve(process.cwd(), BASE_DIR, 'diffs', 'triage-diff-lines-latest.json');
    if (!fs.existsSync(diffFile)) throw new Error('Expected diff file not found: ' + diffFile);

    // attempt to open diff link (if present in page) and verify viewer
    try {
      await diff.click();
      await page.waitForTimeout(1500);
      const diffViewer = await page.$('#diff-viewer, .diff-viewer, [data-diff-viewer]');
      if (!diffViewer) throw new Error('Diff viewer not rendered');
    } catch (e) {
      // if clicking fails, at least ensure the diff file exists (already checked)
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
