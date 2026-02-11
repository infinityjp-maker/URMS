// Use the tallest baseline height to keep all CI screenshots consistent
const CLIP = { x: 0, y: 0, width: 800, height: 1257 };
// attempt to embed a bundled woff2 (if available) or fetch a remote fallback
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');

async function _prepareEmbeddedFont() {
  try {
    // path relative to this helper file: Source/assets/fonts/NotoSansJP-Regular.woff2
    const candidate = resolve(__dirname, '..', '..', 'Source', 'assets', 'fonts', 'NotoSansJP-Regular.woff2');
    if (existsSync(candidate)) {
      const buf = readFileSync(candidate);
      return buf.toString('base64');
    }
    // fallback: try to fetch a known public WOFF2 if network available
    if (typeof fetch === 'function') {
      try {
        const url = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/WOFF2/NotoSansJP-Regular.woff2';
        const res = await fetch(url);
        if (res && res.ok) {
          const ab = await res.arrayBuffer();
          const b = Buffer.from(ab);
          return b.toString('base64');
        }
      } catch (e) {
        // ignore fetch failures
      }
    }
  } catch (e) {
    // ignore any failures and return undefined
  }
  return undefined;
}

async function stabilizePage(page) {
  // prepare embedded font (base64) and, if found, inject before other font scrub steps
  let _embeddedBase64 = undefined;
  try { _embeddedBase64 = await _prepareEmbeddedFont(); } catch(e){}

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
          // remove preload/google/style links
          document.querySelectorAll('link[rel="preload"][as="font"],link[href*="fonts.googleapis.com"],link[href*="fonts.gstatic"],link[rel="stylesheet"]').forEach(n => { try { n.remove(); } catch(e){} });
          // remove inline style blocks containing @font-face
          document.querySelectorAll('style').forEach(s => { try { if (/@font-face/.test(s.textContent)) s.remove(); } catch(e){} });

          // attempt to neutralize FontFace API so webfonts don't load
          try {
            // preserve original if present
            const RealFontFace = window.FontFace;
            try { window.FontFace = function(){ return { load: () => Promise.resolve() }; }; } catch(e){}
            try { if (RealFontFace && RealFontFace.prototype) RealFontFace.prototype.load = () => Promise.resolve(); } catch(e){}
            try { if (window.FontFace && window.FontFace.prototype) window.FontFace.prototype.load = () => Promise.resolve(); } catch(e){}
          } catch(e){}

          // neutralize document.fonts APIs to avoid waiting for or loading webfonts
          try {
            if (document.fonts) {
              try { document.fonts.load = (..._) => Promise.resolve([]); } catch(e){}
              try { Object.defineProperty(document.fonts, 'ready', { value: Promise.resolve(document.fonts), configurable: true }); } catch(e){}
            }
          } catch(e){}

          // remove any @font-face rules from all stylesheets and watch for added rules
          try {
            const scrubRules = (ss) => {
              try {
                const rules = ss.cssRules || ss.rules || [];
                for (let i = rules.length - 1; i >= 0; i--) {
                  try { if (rules[i] && rules[i].cssText && /@font-face/.test(rules[i].cssText)) ss.deleteRule(i); } catch(e){}
                }
              } catch(e){}
            };
            for (const ss of Array.from(document.styleSheets)) scrubRules(ss);
            // observe additions of style/link nodes and scrub
            const styleObserver = new MutationObserver(records => {
              for (const r of records) {
                if (r.addedNodes) for (const n of r.addedNodes) {
                  try {
                    if (n.nodeType === 1) {
                      if (n.tagName === 'STYLE') {
                        try { if (/@font-face/.test(n.textContent)) n.remove(); } catch(e){}
                      }
                      if (n.tagName === 'LINK') {
                        try { const href = n.getAttribute && n.getAttribute('href'); if (href && (/fonts.googleapis.com|fonts.gstatic|\.woff|\.woff2|\.ttf/i).test(href)) n.remove(); } catch(e){}
                      }
                      try { n.querySelectorAll && n.querySelectorAll('style').forEach(s => { if (/@font-face/.test(s.textContent)) s.remove(); }); } catch(e){}
                    }
                  } catch(e){}
                }
              }
            });
            styleObserver.observe(document.documentElement || document, { childList: true, subtree: true });
          } catch(e){}

          // enforce system font styles to further reduce font variability (apply to pseudo elements too)
          try {
            const sys = document.createElement('style');
            sys.setAttribute('data-ci-system-fonts','1');
            // Add explicit scrollbar rules and gutter reservation to avoid layout shifts
            sys.textContent = ':root{ --ci-system-fonts: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "MS Gothic", sans-serif !important; --ci-scrollbar-width: 16px; }\n' +
              '* , *::before, *::after { font-family: var(--ci-system-fonts) !important; font-weight: 400 !important; font-style: normal !important; -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }\n' +
              'html, body { scrollbar-gutter: stable both-edges !important; }\n' +
              '::-webkit-scrollbar { width: var(--ci-scrollbar-width) !important; height: var(--ci-scrollbar-width) !important; background: transparent !important; }\n' +
              '::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18) !important; border-radius: 6px !important; }\n' +
              '::-webkit-scrollbar-track { background: transparent !important; }';
            document.documentElement.appendChild(sys);
            try { document.documentElement.style.fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--ci-system-fonts') || 'sans-serif'; } catch(e){}
          } catch(e){}
        } catch(e){}
      } catch(e){}
    });
    // if Node side found an embedded font, inject it now (via base64 data URI)
    if (_embeddedBase64) {
      try {
        const css = `@font-face{font-family: 'URMS-Embedded-JP'; src: url("data:font/woff2;base64,${_embeddedBase64}") format('woff2'); font-weight:400; font-style:normal; font-display:swap;} :root{ --ci-system-fonts: 'URMS-Embedded-JP', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "MS Gothic", sans-serif !important; } * , *::before, *::after { font-family: var(--ci-system-fonts) !important; }`;
        try { await page.addStyleTag({ content: css }); } catch(e){}
      } catch(e){}
    }
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
          const sb = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
          // force scrollbars visible and reserve space
          el.style.overflowY = 'scroll';
          bd.style.overflowY = 'scroll';
          try { el.style.scrollbarGutter = 'stable both-edges'; } catch(e){}
          if (sb > 0) {
            // use CSS variable so authorship can override if needed
            document.documentElement.style.setProperty('--ci-scrollbar-width', sb + 'px');
            // apply padding to body and html to keep content width stable
            bd.style.paddingRight = sb + 'px';
            el.style.paddingRight = sb + 'px';
          }
          // also ensure overlay scrollbars are given a consistent visual width
          try {
            const sbStyle = document.createElement('style');
            sbStyle.setAttribute('data-ci-scrollbar','1');
            sbStyle.textContent = `::-webkit-scrollbar{width:var(--ci-scrollbar-width)!important;height:var(--ci-scrollbar-width)!important}`;
            document.documentElement.appendChild(sbStyle);
          } catch(e){}
        } catch (e) { /* ignore */ }
        // also clamp any elements that overflow the forced height
        try { document.querySelectorAll('body *').forEach(n => { n.style.maxHeight = h + 'px'; n.style.overflow = 'hidden'; n.style.minHeight = '0'; n.style.boxSizing = 'border-box'; }); } catch(e){}

        // inject a persistent style to aggressively constrain layout and media
        try {
          const clampStyle = document.createElement('style');
          clampStyle.setAttribute('data-ci-clamp','1');
          clampStyle.textContent = `html,body{height:${h}px !important;min-height:${h}px !important;overflow:hidden !important;} body *{max-height:${h}px !important;overflow:hidden !important;min-height:0 !important;box-sizing:border-box !important;} img,video,iframe,picture,svg{max-width:100% !important;max-height:${h}px !important;object-fit:cover !important;} *{min-height:0 !important;}`;
          document.documentElement.appendChild(clampStyle);
        } catch(e){}

        // observe new nodes and ensure they don't grow past the clamp
        try {
          const clampNode = (n) => {
            try {
              if (n && n.style) {
                n.style.maxHeight = h + 'px';
                n.style.overflow = 'hidden';
                n.style.minHeight = '0';
                n.style.boxSizing = 'border-box';
              }
            } catch(e){}
          };
          const clampMo = new MutationObserver(records => {
            for (const r of records) {
              if (r.addedNodes) for (const n of r.addedNodes) {
                try {
                  if (n.nodeType === 1) {
                    clampNode(n);
                    try { n.querySelectorAll && n.querySelectorAll('*').forEach(clampNode); } catch(e){}
                  }
                } catch(e){}
              }
            }
          });
          clampMo.observe(document.documentElement || document, { childList: true, subtree: true });
        } catch(e){}

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
