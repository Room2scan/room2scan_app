/**
 * Crop 5x5 catalog grid images into individual cells.
 * Run: node scripts/cropCatalog.js
 */
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const SRC = 'C:/Users/park/Downloads/카탈로그';
const OUT = path.join(__dirname, '../assets/catalog');

const GRIDS = [
  { file: 'sofa.png',   dir: 'sofa'    },
  { file: 'chair.png',  dir: 'chair'   },
  { file: 'desk.png',   dir: 'table'   },
  { file: 'cabinet.png',dir: 'shelf'   },
  { file: 'plant.png',  dir: 'decor'   },
  { file: '주방.png',   dir: 'kitchen' },
];

async function run() {
  for (const { file, dir } of GRIDS) {
    const outDir = path.join(OUT, dir);
    fs.mkdirSync(outDir, { recursive: true });

    const img = await Jimp.read(path.join(SRC, file));
    const W = img.bitmap.width;
    const H = img.bitmap.height;
    const cellW = Math.floor(W / 5);
    const cellH = Math.floor(H / 5);

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const idx = row * 5 + col;
        const cell = img.clone().crop(col * cellW, row * cellH, cellW, cellH);
        await cell.writeAsync(path.join(outDir, `${idx}.png`));
      }
    }
    console.log(`✓ ${dir} (${W}x${H}, cell ${cellW}x${cellH})`);
  }
  console.log('Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
