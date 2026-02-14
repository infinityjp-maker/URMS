const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest){
  return new Promise((resolve,reject)=>{
    const dir = path.dirname(dest);
    fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error('download failed ' + res.statusCode));
      res.pipe(file);
      file.on('finish', ()=> file.close(resolve));
    }).on('error', err => { try{ fs.unlinkSync(dest) }catch(e){}; reject(err); });
  });
}

async function main(){
  // canonical Noto Sans JP WOFF2 location (raw.githubusercontent direct link)
  const url = 'https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/WOFF2/NotoSansJP-Regular.woff2';
  const out = path.join('Source','assets','fonts','NotoSansJP-Regular.woff2');
  console.log('Downloading NotoSansJP ->', out);
  try {
    await download(url, out);
    console.log('Downloaded NotoSansJP to', out);
  } catch (e) {
    console.error('download failed:', e && e.message);
    // do not fail hard; build should continue with best-effort
    process.exitCode = 0;
  }
}

main().catch(e=>{ console.error(e); process.exit(0); });
