const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname,'..','..','dashboard','index.html'),'utf8');
assert.ok(/id="severity-filter"/.test(html), 'severity filter should be present');
assert.ok(/id="tag-filter"/.test(html), 'tag filter should be present');
assert.ok(/id="from-date"/.test(html) && /id="to-date"/.test(html), 'date range inputs should be present');
assert.ok(/id="search-box"/.test(html), 'search box should be present');
assert.ok(/id="detail-view"/.test(html), 'detail view placeholder should be present');
assert.ok(/id="report-frame"/.test(html), 'report iframe should be present');
console.log('dashboard UI elements test passed');
