const fs = await import('fs').then(m=>m.default||m);
const path = await import('path').then(m=>m.default||m);

function inspectFile(filePath){
  const text = fs.readFileSync(filePath,'utf8');
  const lines = text.split(/\r?\n/);
  const stats = {
    path: filePath,
    docSepCount: (text.match(/^---$/m)||[]).length,
    nameCount: 0,
    onCount: 0,
    jobsCount: 0,
    totalLines: lines.length,
    issues: []
  };
  for(let i=0;i<lines.length;i++){
    const l = lines[i];
    if(/^name:\s*/.test(l)) stats.nameCount++;
    if(/^on:\s*/.test(l)) stats.onCount++;
    if(/^jobs:\s*/.test(l)) stats.jobsCount++;
    // detect duplicated workflow blocks by seeing multiple top-level 'name' and 'on' and 'jobs' groups
  }
  if(stats.docSepCount>0) stats.issues.push(`Contains YAML document separator '---' (${stats.docSepCount})`);
  if(stats.nameCount>1) stats.issues.push(`Multiple 'name:' entries (${stats.nameCount})`);
  if(stats.onCount>1) stats.issues.push(`Multiple 'on:' entries (${stats.onCount})`);
  if(stats.jobsCount>1) stats.issues.push(`Multiple 'jobs:' entries (${stats.jobsCount})`);
  // detect accidental concatenation: look for repeated 'name:' followed shortly by 'on:'
  const nameIndexes = [];
  lines.forEach((l,idx)=>{ if(/^name:\s*/.test(l)) nameIndexes.push(idx); });
  if(nameIndexes.length>1){
    for(let k=0;k<nameIndexes.length-1;k++){
      const a = nameIndexes[k], b = nameIndexes[k+1];
      if(b - a < 40) stats.issues.push(`Possible concatenated workflows: two 'name:' at lines ${a+1} and ${b+1}`);
    }
  }
  return stats;
}

function main(){
  const dir = path.join(process.cwd(),'.github','workflows');
  if(!fs.existsSync(dir)){
    console.error('No .github/workflows directory found');
    process.exit(2);
  }
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.yml')||f.endsWith('.yaml'));
  const results = files.map(f=>inspectFile(path.join(dir,f)));
  console.log('Workflow inspection results:');
  for(const r of results){
    console.log('---');
    console.log(r.path);
    console.log(`lines: ${r.totalLines}, docs: ${r.docSepCount}, name:${r.nameCount}, on:${r.onCount}, jobs:${r.jobsCount}`);
    if(r.issues.length){
      console.log('Issues:');
      for(const it of r.issues) console.log('  -',it);
    } else {
      console.log('OK');
    }
  }
  // If issues found, exit non-zero
  const any = results.some(r=>r.issues.length>0);
  process.exit(any?3:0);
}

main();
