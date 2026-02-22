import fs from 'fs';
import { PNG } from 'pngjs';
const path = process.argv[2];
if (!path) { console.error('Usage: node analyze_diff_png.js <path>'); process.exit(2); }
if (!fs.existsSync(path)) { console.error('File not found', path); process.exit(2); }
const buf = fs.readFileSync(path);
const png = PNG.sync.read(buf);
const {width,height,data} = png;
const total = width * height;
let nonTransparent = 0;
let bbox = {minX: width, minY: height, maxX: 0, maxY: 0};
const colorCounts = new Map();
for (let y=0;y<height;y++){
  for (let x=0;x<width;x++){
    const idx = (width*y + x)*4;
    const r = data[idx];
    const g = data[idx+1];
    const b = data[idx+2];
    const a = data[idx+3];
    if (a === 0) continue;
    nonTransparent++;
    if (x < bbox.minX) bbox.minX = x;
    if (x > bbox.maxX) bbox.maxX = x;
    if (y < bbox.minY) bbox.minY = y;
    if (y > bbox.maxY) bbox.maxY = y;
    // quantize color to reduce distinct keys
    const rq = Math.round(r/8)*8;
    const gq = Math.round(g/8)*8;
    const bq = Math.round(b/8)*8;
    const key = `${rq},${gq},${bq}`;
    colorCounts.set(key, (colorCounts.get(key)||0)+1);
  }
}
const colors = Array.from(colorCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>({color:k,count:v,pct: (v/total*100).toFixed(2)}));
const bboxPixels = (bbox.maxX>=bbox.minX && bbox.maxY>=bbox.minY) ? ((bbox.maxX-bbox.minX+1)*(bbox.maxY-bbox.minY+1)) : 0;
console.log(JSON.stringify({ path, width, height, totalPixels: total, nonTransparent, nonTransparentPct: (nonTransparent/total*100).toFixed(2), bbox: (bboxPixels? { x:bbox.minX,y:bbox.minY,w:bbox.maxX-bbox.minX+1,h:bbox.maxY-bbox.minY+1 } : null), bboxPixels, colors }, null, 2));
