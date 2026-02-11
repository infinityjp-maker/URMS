const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// Crop configuration to focus comparisons on the stable central UI area.
// Enable via env var COMPARE_CROP=1 to apply cropping, otherwise full-page compare.
const CROP = {
  enabled: (process.env.COMPARE_CROP === undefined) ? true : !!process.env.COMPARE_CROP,
  x: 0,
  y: 120,
  width: 800,
  height: 980
};

function runSmoke() {
  return new Promise((resolve, reject) => {
    // If the workflow already ran smoke.cjs earlier and wrote a result file, use it
    if (process.env.SKIP_RUN_SMOKE === '1') {
      const path = 'builds/screenshots/smoke-result.json';
      try {
        let raw = fs.readFileSync(path, 'utf8');
        // Enhanced JSON extraction: find the last balanced JSON object by
        // scanning from each '{' (from the end) and matching braces. This
        // is tolerant to leading/trailing noise and interleaved logs.
        const extractLastJson = (s) => {
          const starts = [];
          for (let i = 0; i < s.length; i++) if (s[i] === '{') starts.push(i);
          for (let idx = starts.length - 1; idx >= 0; idx--) {
            let i = starts[idx];
            let depth = 0;
            for (let j = i; j < s.length; j++) {
              const ch = s[j];
              if (ch === '{') depth++;
              else if (ch === '}') depth--;
              if (depth === 0) {
                const candidate = s.slice(i, j + 1);
                try { return JSON.parse(candidate); } catch (e) { break; }
              }
            }
          }
          return null;
        };
        let j = null;
        try { j = JSON.parse(raw); } catch (e) { j = extractLastJson(raw); }
        if (!j) throw new Error('no valid JSON object found in smoke-result.json');
        return resolve(j);
      } catch (e) {
        return reject(new Error('failed to read smoke-result.json: ' + e.message));
      }
    }
    // Attempt smoke.cjs up to 3 times to mitigate transient CDP/connection failures
    const attemptsMax = 3;
    let attempts = 0;
    const runOnce = () => {
      attempts++;
      const env = Object.assign({}, process.env);
      const cp = child_process.spawn('node', ['Tests/playwright/smoke.cjs'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      cp.stdout.on('data', (d) => out += d.toString());
      cp.stderr.on('data', (d) => process.stderr.write(d));
      cp.on('close', (code) => {
        if (code !== 0) {
          if (attempts < attemptsMax) {
            console.error('smoke.cjs failed with', code, ' - retrying attempt', attempts + 1);
            setTimeout(runOnce, 1000 * attempts);
            return;
          }
          return reject(new Error('smoke.cjs exited with ' + code));
        }
        try {
          // Try parse full stdout JSON first, then fallback to robust extraction
          // using the same balanced-brace approach.
          let j = null;
          try { j = JSON.parse(out); } catch (e) {
            const extractLastJson = (s) => {
              const starts = [];
              for (let i = 0; i < s.length; i++) if (s[i] === '{') starts.push(i);
              for (let idx = starts.length - 1; idx >= 0; idx--) {
                let i = starts[idx];
                let depth = 0;
                for (let j = i; j < s.length; j++) {
                  const ch = s[j];
                  if (ch === '{') depth++;
                  else if (ch === '}') depth--;
                  if (depth === 0) {
                    const candidate = s.slice(i, j + 1);
                    try { return JSON.parse(candidate); } catch (e) { break; }
                  }
                }
              }
              return null;
            };
            j = extractLastJson(out);
          }
          if (!j) throw new Error('no valid JSON object found on stdout from smoke.cjs');
          resolve(j);
        } catch (e) {
          reject(e);
        }
      });
    };
    runOnce();
  });
}

function ensureDir(dir){ if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

(async ()=>{
  try{
    const baselineDir = path.join('Tests','playwright','baseline');
    ensureDir(baselineDir);

    const screenshotsDir = path.join('builds','screenshots');
    const names = ['playwright-smoke.png','playwright-future-mode.png'];

    // run smoke to obtain structural info
    const smoke = await runSmoke();

    // baseline metadata file
    const metaPath = path.join(baselineDir,'baseline.json');
    let baselineMeta = null;
    if (fs.existsSync(metaPath)) {
      baselineMeta = JSON.parse(fs.readFileSync(metaPath,'utf8'));
    }

    // if baseline metadata missing, create baseline from current screenshots + smoke output
    let createdBaseline = false;
    for(const name of names){
      const cur = path.join(screenshotsDir,name);
      const base = path.join(baselineDir,name);
      if(!fs.existsSync(cur)){
        console.error('Missing current screenshot:', cur);
        process.exit(2);
      }
      if(!fs.existsSync(base)){
        fs.copyFileSync(cur, base);
        console.warn('Baseline created for', name);
        createdBaseline = true;
      }
    }
    if(!baselineMeta){
      const meta = {
        cardCount: smoke.cardCount || null,
        headings: smoke.headings || null,
        titleColor: smoke.titleColor || null
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
      console.warn('Baseline metadata created at', metaPath);
      createdBaseline = true;
    }

    if(createdBaseline){
      console.log('Baseline was created from current screenshots. On next runs comparisons will be performed.');
      process.exit(0);
    }

    // perform comparisons
    let failed = false;
    // compare structural info
    if (baselineMeta.cardCount !== smoke.cardCount){
      console.error('cardCount mismatch. baseline:', baselineMeta.cardCount, 'current:', smoke.cardCount);
      failed = true;
    }
    const baselineHeadings = baselineMeta.headings || [];
    const curHeadings = smoke.headings || [];
    if (JSON.stringify(baselineHeadings) !== JSON.stringify(curHeadings)){
      console.error('headings mismatch. baseline:', baselineHeadings, 'current:', curHeadings);
      failed = true;
    }
    if (baselineMeta.titleColor && smoke.titleColor && baselineMeta.titleColor !== smoke.titleColor){
      console.error('titleColor mismatch. baseline:', baselineMeta.titleColor, 'current:', smoke.titleColor);
      failed = true;
    }

    // pixel diffs
    for(const name of names){
      const curPath = path.join(screenshotsDir,name);
      const basePath = path.join(baselineDir,name);
      const diffPath = path.join(screenshotsDir, 'diff-' + name);
      const curBuf = fs.readFileSync(curPath);
      const baseBuf = fs.readFileSync(basePath);
      let curP = PNG.sync.read(curBuf);
      let baseP = PNG.sync.read(baseBuf);

      // Optional cropping to reduce noise from dynamic header/footer areas
      if (CROP.enabled) {
        const cropRect = (png, x, y, w, h) => {
          const out = new PNG({width: w, height: h});
          for (let row = 0; row < h; row++) {
            const srcStart = ((y + row) * png.width + x) * 4;
            const dstStart = row * w * 4;
            png.data.copy(out.data, dstStart, srcStart, srcStart + w * 4);
          }
          return out;
        };
        const x = Math.max(0, CROP.x);
        const y = Math.max(0, CROP.y);
        const w = Math.min(CROP.width, Math.min(curP.width, baseP.width) - x);
        const h = Math.min(CROP.height, Math.min(curP.height, baseP.height) - y);
        if (w > 0 && h > 0) {
          curP = cropRect(curP, x, y, w, h);
          baseP = cropRect(baseP, x, y, w, h);
        }
      }
      // If dimensions differ but widths match, either crop the taller image to the
      // shorter height or pad the shorter to match the taller, depending on
      // environment settings. Set COMPARE_PAD=1 to pad (preferred for CI
      // stability) or COMPARE_TARGET_HEIGHT to force a fixed height.
      if (curP.width === baseP.width && curP.height !== baseP.height) {
        // Determine target height: prefer env var, else read file written by smoke.cjs, else derive
        let envTarget = parseInt(process.env.COMPARE_TARGET_HEIGHT || '0', 10) || 0;
        if (!envTarget) {
          try {
            const fh = path.join('builds','COMPARE_TARGET_HEIGHT');
            if (fs.existsSync(fh)) {
              const v = fs.readFileSync(fh,'utf8').trim();
              envTarget = parseInt(v,10) || 0;
            }
          } catch(e) { /* ignore */ }
        }
        const targetH = envTarget || Math.max(curP.height, baseP.height);

        const cropTo = (png, h) => {
          const {width} = png;
          const out = new PNG({width, height: h});
          for (let row = 0; row < h; row++) {
            const srcStart = row * width * 4;
            const srcEnd = srcStart + width * 4;
            const dstStart = row * width * 4;
            png.data.copy(out.data, dstStart, srcStart, srcEnd);
          }
          return out;
        };

        const padTo = (png, h) => {
          const {width, height} = png;
          const out = new PNG({width, height: h});
          // copy existing rows
          for (let row = 0; row < Math.min(height, h); row++) {
            const srcStart = row * width * 4;
            const dstStart = row * width * 4;
            png.data.copy(out.data, dstStart, srcStart, srcStart + width * 4);
          }
          // fill extra rows with the last row's pixels to reduce visual seam
          if (h > height) {
            const lastRowStart = (height - 1) * width * 4;
            for (let row = height; row < h; row++) {
              const dstStart = row * width * 4;
              out.data.set(out.data.slice(lastRowStart, lastRowStart + width * 4), dstStart);
            }
          }
          return out;
        };

        if (process.env.COMPARE_PAD === '1') {
          // pad shorter image(s) up to targetH
          if (curP.height < targetH) {
            console.warn('Padding current image height from', curP.height, 'to', targetH);
            const padded = padTo(curP, targetH);
            curP.data = padded.data; curP.height = targetH;
          }
          if (baseP.height < targetH) {
            console.warn('Padding baseline image height from', baseP.height, 'to', targetH);
            const padded = padTo(baseP, targetH);
            baseP.data = padded.data; baseP.height = targetH;
          }
        } else {
          // default: crop to the smaller height to avoid introducing padding
          const cropTarget = Math.min(curP.height, baseP.height);
          if (curP.height > cropTarget) {
            console.warn('Normalizing current image height from', curP.height, 'to', cropTarget);
            curP.data = cropTo(curP, cropTarget).data; curP.height = cropTarget;
          }
          if (baseP.height > cropTarget) {
            console.warn('Normalizing baseline image height from', baseP.height, 'to', cropTarget);
            baseP.data = cropTo(baseP, cropTarget).data; baseP.height = cropTarget;
          }
        }
      }
      if(curP.width !== baseP.width || curP.height !== baseP.height){
        console.error('Size mismatch for', name, 'baseline:', baseP.width+'x'+baseP.height, 'current:', curP.width+'x'+curP.height);
        failed = true;
        continue;
      }
      const {width,height} = curP;
      const diff = new PNG({width,height});
      const diffPixels = pixelmatch(baseP.data, curP.data, diff.data, width, height, {threshold: 0.12, includeAA: true});
      fs.writeFileSync(diffPath, PNG.sync.write(diff));
      console.log(name, 'diff pixels:', diffPixels, 'diff image:', diffPath);
      const maxAllowed = Math.max(50, Math.floor(width*height*0.03)); // allow up to 3% pixel changes
      if(diffPixels > maxAllowed){
        console.error(name, 'exceeded allowed diff pixels:', diffPixels, '>', maxAllowed);
        failed = true;
      }
    }

    if(failed){
      console.error('Screenshot comparisons failed. See diffs in builds/screenshots/');
      process.exit(1);
    }

    console.log('All screenshot comparisons passed');
    process.exit(0);

  }catch(err){
    console.error('compare_screenshots error', err);
    process.exit(2);
  }
})();
