const fs = require('fs');
const { PNG } = require('pngjs');

if (process.argv.length < 3) {
  console.error('Usage: node analyze_diff_rows.cjs <diff-png> [output.json]');
  process.exit(2);
}

const input = process.argv[2];
const outPath = process.argv[3] || (input.replace(/\.png$/i, '') + '-rows.json');

fs.createReadStream(input)
  .pipe(new PNG())
  .on('parsed', function () {
    const w = this.width;
    const h = this.height;
    const data = this.data;
    const rows = new Array(h).fill(0);
    const cols = new Array(w).fill(0);
    let total = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (w * y + x) << 2;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (r !== 0 || g !== 0 || b !== 0 || a !== 0) {
          rows[y]++;
          cols[x]++;
          total++;
        }
      }
    }

    const sortedRows = rows.map((c, i) => ({ i, c })).sort((a, b) => b.c - a.c);
    const sortedCols = cols.map((c, i) => ({ i, c })).sort((a, b) => b.c - a.c);

    const out = {
      input,
      width: w,
      height: h,
      totalDiffPixels: total,
      diffPercent: Number(((total / (w * h)) * 100).toFixed(4)),
      topRows: sortedRows.slice(0, 10),
      topCols: sortedCols.slice(0, 10),
      rows,
      cols,
    };

    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log('Wrote', outPath);
  });
