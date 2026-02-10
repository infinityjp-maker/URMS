// Use the tallest baseline height to keep all CI screenshots consistent
const CLIP = { x: 0, y: 0, width: 800, height: 1257 };

async function stabilizePage(page) {
  try { await page.setViewportSize({ width: CLIP.width, height: CLIP.height }); } catch (e) { }
  // ensure fonts loaded
  try { await page.evaluate(() => document.fonts.ready); } catch (e) { }
  // short extra paint wait
  try { await page.waitForTimeout(80); } catch (e) { }
  // disable animations
  try { await page.addStyleTag({ content: `* { transition: none !important; animation: none !important; caret-color: transparent !important; }` }); } catch (e) { }
  // Force document height/overflow/margins to the CLIP to avoid variable page heights
  try {
    await page.evaluate((w,h) => {
      try {
        const el = document.documentElement;
        const bd = document.body;
        el.style.boxSizing = 'border-box';
        bd.style.boxSizing = 'border-box';
        el.style.margin = '0'; el.style.padding = '0';
        bd.style.margin = '0'; bd.style.padding = '0';
        el.style.width = w + 'px'; el.style.minWidth = w + 'px';
        el.style.height = h + 'px'; el.style.minHeight = h + 'px';
        bd.style.width = w + 'px'; bd.style.minWidth = w + 'px';
        bd.style.height = h + 'px'; bd.style.minHeight = h + 'px';
        el.style.overflow = 'hidden'; bd.style.overflow = 'hidden';
        window.scrollTo(0,0);
      } catch(e){}
    }, CLIP.width, CLIP.height);
    try { await page.waitForTimeout(60); } catch(e){}
  } catch(e){}
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
