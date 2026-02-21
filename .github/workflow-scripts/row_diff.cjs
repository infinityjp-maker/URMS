const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

function load(p){
  const buf = fs.readFileSync(p);
  return PNG.sync.read(buf);
}

function rowDiff(aPath,bPath){
  const a = load(aPath);
  const b = load(bPath);
  if(a.width!==b.width) throw new Error('width mismatch');
  const h = Math.min(a.height,b.height);
  const w = a.width;
  const rowDiffs = [];
  for(let y=0;y<h;y++){
    const aRow = Buffer.alloc(w*4);
    const bRow = Buffer.alloc(w*4);
    a.data.copy(aRow,0,y*w*4,y*w*4 + w*4);
    b.data.copy(bRow,0,y*w*4,y*w*4 + w*4);
    const diffRow = Buffer.alloc(w*4);
    const pd = pixelmatch(aRow,bRow,diffRow,w,1,{threshold:0.1});
    rowDiffs.push(pd);
  }
  return {width:w,height:h,rowDiffs, total: rowDiffs.reduce((s,v)=>s+v,0)};
}

if(process.argv.length<4){
  console.error('Usage: node row_diff.cjs <baseline.png> <current.png>'); process.exit(2);
}
const res = rowDiff(process.argv[2], process.argv[3]);
console.log(JSON.stringify({width:res.width,height:res.height,total:res.total,topRows:res.rowDiffs.slice(0,10),bottomRows:res.rowDiffs.slice(-10)},null,2));
