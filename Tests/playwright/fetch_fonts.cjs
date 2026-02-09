const https = require('https');
const fs = require('fs');
const path = require('path');

function fetch(url){
  return new Promise((resolve,reject)=>{
    https.get(url, res => {
      let d='';
      res.on('data', c=>d+=c);
      res.on('end', ()=> resolve({ statusCode: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

function download(url, dest){
  return new Promise((resolve,reject)=>{
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error('download failed ' + res.statusCode));
      res.pipe(file);
      file.on('finish', ()=> file.close(resolve));
    }).on('error', err => { try{ fs.unlinkSync(dest) }catch(e){}; reject(err); });
  });
}

async function main(){
  const gfUrl = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap';
  console.log('Fetching', gfUrl);
  const res = await fetch(gfUrl);
  if (res.statusCode !== 200) throw new Error('failed to fetch google css ' + res.statusCode);
  let css = res.body;
  // find all gstatic urls
  const urls = Array.from(css.matchAll(/https:\/\/fonts\.gstatic\.com\/[^)"']+/g)).map(m=>m[0]);
  const fontsDir = path.join('Source','src','assets','fonts');
  fs.mkdirSync(fontsDir, { recursive: true });
  const localPaths = {};
  for(const u of urls){
    const fname = path.basename(u.split('?')[0]);
    const dest = path.join(fontsDir, fname);
    console.log('Downloading', u, '->', dest);
    await download(u, dest);
    localPaths[u] = '/src/assets/fonts/' + fname;
  }
  // replace urls in css with local paths
  for(const [remote, local] of Object.entries(localPaths)){
    css = css.split(remote).join(local);
  }
  const outCssPath = path.join('Source','src','theme','local-fonts.css');
  fs.writeFileSync(outCssPath, css, 'utf8');
  console.log('Wrote', outCssPath);
}

main().catch(e=>{ console.error(e); process.exit(2); });
