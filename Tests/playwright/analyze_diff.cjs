const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

function readPng(path){
  return new Promise((resolve,reject)=>{
    fs.createReadStream(path).pipe(new PNG()).on('parsed', function(){
      resolve(this);
    }).on('error', reject);
  });
}

async function analyze(baseline, current, outPrefix){
  const a = await readPng(baseline);
  const b = await readPng(current);
  if (a.width !== b.width || a.height !== b.height) throw new Error('size mismatch');
  const {width,height} = a;
  const diff = new PNG({width,height});
  const count = pixelmatch(a.data, b.data, diff.data, width, height, {threshold: 0.1});
  // bounding box
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y=0;y<height;y++){
    for (let x=0;x<width;x++){
      const idx = (y*width + x)*4;
      if (diff.data[idx+3] !== 0){
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const bbox = (maxX >= 0) ? { minX, minY, maxX, maxY, w: maxX-minX+1, h: maxY-minY+1 } : null;
  const pct = (count / (width*height)) * 100;
  // save diff image
  const outDiff = `builds/screenshots/${outPrefix}-analyze-diff.png`;
  fs.mkdirSync('builds/screenshots', { recursive: true });
  diff.pack().pipe(fs.createWriteStream(outDiff));
  // optionally save crop
  if (bbox){
    const crop = new PNG({width: bbox.w, height: bbox.h});
    for (let yy=0; yy<bbox.h; yy++){
      const srcStart = ((bbox.minY+yy)*width + bbox.minX) * 4;
      const dstStart = (yy*bbox.w) * 4;
      diff.data.copy(crop.data, dstStart, srcStart, srcStart + bbox.w*4);
    }
    const outCrop = `builds/screenshots/${outPrefix}-analyze-crop.png`;
    crop.pack().pipe(fs.createWriteStream(outCrop));
  }
  return { baseline, current, width, height, diffCount: count, diffPercent: pct, bbox, diffImage: outDiff };
}

async function main(){
  const pairs = [
    { base: 'Tests/playwright/baseline/playwright-smoke.png', cur: 'builds/screenshots/playwright-smoke.png', name: 'playwright-smoke' },
    { base: 'Tests/playwright/baseline/playwright-future-mode.png', cur: 'builds/screenshots/playwright-future-mode.png', name: 'playwright-future-mode' }
  ];
  const results = [];
  for (const p of pairs){
    try{
      const r = await analyze(p.base, p.cur, p.name);
      results.push(r);
      console.log(JSON.stringify(r, null, 2));
    }catch(e){
      console.error('ERROR analyzing', p.name, e && e.message || e);
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(2); });
