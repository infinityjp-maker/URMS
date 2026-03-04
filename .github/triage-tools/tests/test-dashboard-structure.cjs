const assert = require('assert');
const fs = require('fs');
const path = require('path');

const idx = fs.readFileSync(path.join(__dirname,'..','..','dashboard','index.html'),'utf8');
assert.ok(/Latest Full Report/.test(idx), 'index.html should contain Latest Full Report');
assert.ok(/Latest Diff Summary/.test(idx), 'index.html should contain Latest Diff Summary');
assert.ok(/Recent Reports/.test(idx), 'index.html should contain Recent Reports');
assert.ok(/canvas id="chart"/.test(idx) || /id="chart"/.test(idx), 'index.html should contain chart canvas');
console.log('dashboard structure checks passed');
