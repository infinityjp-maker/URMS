import fs from 'fs';
import { PNG } from 'pngjs';

function analyze(path){
  if(!fs.existsSync(path)) return null;
  const buf = fs.readFileSync(path);
  const png = PNG.sync.read(buf);
  const {width,height,data} = png;
  let non = 0;
  let minX=width, minY=height, maxX=0, maxY=0;
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++){
      const idx = (y*width + x)*4;
      const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
      // consider pixel non-empty if any channel differs from 0 (diff images use colored pixels)
      if(a!==0 && (r!==0 || g!==0 || b!==0)){
        non++;
        if(x<minX) minX=x;
        if(y<minY) minY=y;
        if(x>maxX) maxX=x;
        if(y>maxY) maxY=y;
      }
    }
  }
  return { path, width, height, nonZeroPixels: non, bbox: (non? [minX,minY,maxX,maxY]: null), pct: ((non/(width*height))*100).toFixed(4) };
}

const files = process.argv.slice(2);
if(files.length===0){
  console.error('Usage: node analyze_diff.js <diff-png> [diff-png...]');
  process.exit(2);
}
for(const f of files){
  const r = analyze(f);
  console.log(JSON.stringify(r,null,2));
}
