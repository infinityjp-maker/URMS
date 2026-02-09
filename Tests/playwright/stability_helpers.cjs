const CLIP = { x: 0, y: 0, width: 800, height: 1236 };

async function stabilizePage(page) {
  try { await page.setViewportSize({ width: 800, height: 1236 }); } catch (e) { }
  // ensure fonts loaded
  try { await page.evaluate(() => document.fonts.ready); } catch (e) { }
  // short extra paint wait
  try { await page.waitForTimeout(80); } catch (e) { }
  // disable animations
  try { await page.addStyleTag({ content: `* { transition: none !important; animation: none !important; caret-color: transparent !important; }` }); } catch (e) { }
  // normalize DPR by applying zoom if needed
  try {
    const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
    if (dpr !== 1) {
      try { await page.evaluate(d => { document.documentElement.style.zoom = String(1 / d); }, dpr); } catch (e) { }
      console.warn('stability_helpers: normalized DPR via zoom', dpr);
    }
  } catch (e) { }
}

module.exports = { stabilizePage, CLIP };
