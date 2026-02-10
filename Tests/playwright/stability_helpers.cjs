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
  // hide common dynamic elements (live badges, clocks, counters, toasts, animated svgs)
  try {
    await page.addStyleTag({ content: `
      /* dynamic UI suppression for CI captures */
      .live-badge, .badge--live, .clock, .time, .now, .status-dot, .pulse, .ticker, .animated, svg.animate, .count, .notification, .toast, .marquee, .count-badge, .kpi-value, .uptime, .live-indicator, .blink, .spinner, .loader, .progress, .progress-bar, .tooltip, .tooltip-inner, .dropdown, .menu, .modal, .popover, .ads, [data-live], [data-updating], [aria-live], [role=progressbar], [role=status] { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
      /* ensure animations/transitions are disabled globally */
      * { transition: none !important; animation: none !important; }
      /* prefer stable system UI fonts to avoid webfont variability (include common JP system fonts) */
      :root { --ci-system-fonts: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif; }
      * { font-family: var(--ci-system-fonts) !important; font-weight: 400 !important; font-style: normal !important; -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }
    `});
  } catch (e) { }
  // observe DOM mutations and hide matching dynamic elements continuously
  try {
    await page.evaluate(() => {
      try {
        const DYN = [
          '.live-badge','.badge--live','.clock','.time','.now','.status-dot','.pulse','.ticker','.animated','svg.animate','.count','.notification','.toast','.marquee',
          '.count-badge','.kpi-value','.uptime','.live-indicator','.blink','.spinner','.loader','.progress','.progress-bar',
          '.tooltip','.tooltip-inner','.dropdown','.menu','.modal','.popover','.ads','[data-live]','[data-updating]','[aria-live]','[role="progressbar"]','[role="status"]'
        ];
        const hide = (el) => {
          try { el.style.visibility = 'hidden'; el.style.opacity = '0'; el.style.pointerEvents = 'none'; el.setAttribute('data-ci-hidden','1'); } catch(e){}
        };
        DYN.forEach(s => {
          try { document.querySelectorAll(s).forEach(hide); } catch(e){}
        });
        const mo = new MutationObserver(records => {
          for (const r of records) {
            if (r.addedNodes) for (const n of r.addedNodes) {
              try {
                if (n.nodeType === 1) {
                  for (const s of DYN) if (n.matches && n.matches(s)) hide(n);
                  // also hide descendants
                  for (const s of DYN) try { n.querySelectorAll && n.querySelectorAll(s).forEach(hide); } catch(e){}
                }
              } catch(e){}
            }
            if (r.type === 'attributes' && r.target) {
              try { DYN.forEach(s => { if (r.target.matches && r.target.matches(s)) hide(r.target); }); } catch(e){}
            }
          }
        });
        mo.observe(document.documentElement || document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','style'] });

        // proactively remove webfont/link/style that declare @font-face or Google Fonts
        try {
          document.querySelectorAll('link[rel="preload"][as="font"],link[href*="fonts.googleapis.com"],link[href*="fonts.gstatic"],link[rel="stylesheet"]').forEach(n => {
            try { n.remove(); } catch(e){}
          });
          // remove style blocks containing @font-face
          document.querySelectorAll('style').forEach(s => { try { if (/@font-face/.test(s.textContent)) s.remove(); } catch(e){} });
          // attempt to neutralize FontFace API so webfonts don't load (replace with no-op class)
          try {
            window.FontFace = function(){ return { load: () => Promise.resolve() }; };
            window.FontFace.prototype = { load: () => Promise.resolve() };
          } catch(e){}
          // remove any @font-face rules from all stylesheets
          try {
            for (const ss of Array.from(document.styleSheets)) {
              try {
                const rules = ss.cssRules || ss.rules || [];
                for (let i = rules.length - 1; i >= 0; i--) {
                  try { if (rules[i] && rules[i].cssText && /@font-face/.test(rules[i].cssText)) ss.deleteRule(i); } catch(e){}
                }
              } catch(e){}
            }
          } catch(e){}
          // enforce system font styles to further reduce font variability
          try {
            const sys = document.createElement('style');
            sys.textContent = ':root{ --ci-system-fonts: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif !important; } *{ font-family: var(--ci-system-fonts) !important; font-weight: 400 !important; font-style: normal !important; }';
            document.documentElement.appendChild(sys);
            try { document.documentElement.style.fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--ci-system-fonts') || 'sans-serif'; } catch(e){}
          } catch(e){}
        } catch(e){}
      } catch(e){}
    });
  } catch(e){}
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
        // Force a consistent vertical scrollbar and reserve its width so
        // presence/absence doesn't shift layout between runs.
        // Compute native scrollbar width and apply as right padding.
        try {
          const sb = window.innerWidth - document.documentElement.clientWidth;
          el.style.overflowY = 'scroll';
          bd.style.overflowY = 'scroll';
          if (sb > 0) {
            // use CSS variable so authorship can override if needed
            document.documentElement.style.setProperty('--ci-scrollbar-width', sb + 'px');
            // apply padding to body to keep content width stable
            bd.style.paddingRight = sb + 'px';
          }
        } catch (e) { /* ignore */ }
        // also clamp any elements that overflow the forced height
        try { document.querySelectorAll('body *').forEach(n => { n.style.maxHeight = h + 'px'; n.style.overflow = 'hidden'; }); } catch(e){}
        window.scrollTo(0,0);
      } catch(e){}
    }, CLIP.width, CLIP.height);
    try { await page.waitForTimeout(60); } catch(e){}
  } catch(e){}
  // clear timers and cancel RAFs to stop live updates
  try {
    await page.evaluate(() => {
      try {
        // clear intervals/timeouts by iterating to a high id
        const maxInterval = setInterval(() => {}, 1000);
        for (let i = 1; i <= maxInterval; i++) try { clearInterval(i); } catch (e) {}
        const maxTimeout = setTimeout(() => {}, 1000);
        for (let i = 1; i <= maxTimeout; i++) try { clearTimeout(i); } catch (e) {}
        // cancel rAFs
        try { const raf = requestAnimationFrame(() => {}); for (let i = 0; i <= raf; i++) try { cancelAnimationFrame(i); } catch(e) {} } catch(e) {}
        // override scheduling functions to no-op
        try { window.setInterval = () => 0; window.setTimeout = () => 0; window.requestAnimationFrame = () => 0; } catch(e) {}
      } catch (e) {}
    });
  } catch (e) { }
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
