// Splits a keyed sticker sheet (transparent PNG/WebP) into one WebP per sticker.
// Usage: node scripts/split-sheet.mjs <keyed-sheet> <outdir> name1 name2 ...
// Stickers are found as connected opaque islands, ordered top-to-bottom then left-to-right
// (rows grouped within ROW px), and named in that order.
// ponytail: flood-fill labelling in plain JS; fine for 1-2k px sheets.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const [inPath, outDir, ...names] = process.argv.slice(2)
if (!inPath || !outDir || !names.length) { console.error('usage: split-sheet.mjs <sheet> <outdir> names...'); process.exit(1) }
mkdirSync(outDir, { recursive: true })

const MIN_PX = 1500, ROW = 140, PAD = 4
const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height
const lab = new Int32Array(W * H).fill(-1)
const boxes = []
for (let s = 0; s < W * H; s++) {
  if (lab[s] !== -1 || data[s * 4 + 3] < 24) continue
  const id = boxes.length, st = [s]
  let n = 0, x0 = W, y0 = H, x1 = 0, y1 = 0
  lab[s] = id
  while (st.length) {
    const k = st.pop(), x = k % W, y = (k / W) | 0
    n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    for (const nk of [k - 1, k + 1, k - W, k + W]) {
      if (nk < 0 || nk >= W * H || lab[nk] !== -1 || data[nk * 4 + 3] < 24) continue
      if ((nk === k - 1 && x === 0) || (nk === k + 1 && x === W - 1)) continue
      lab[nk] = id; st.push(nk)
    }
  }
  boxes.push({ id, n, x0, y0, x1, y1 })
}
const parts = boxes.filter((b) => b.n >= MIN_PX)
  .sort((a, b) => (Math.abs(a.y0 - b.y0) < ROW ? a.x0 - b.x0 : a.y0 - b.y0))
console.log(`found ${parts.length} stickers (asked for ${names.length})`)

for (let i = 0; i < Math.min(parts.length, names.length); i++) {
  const b = parts[i]
  const left = Math.max(0, b.x0 - PAD), top = Math.max(0, b.y0 - PAD)
  const width = Math.min(W - left, b.x1 - b.x0 + 1 + PAD * 2), height = Math.min(H - top, b.y1 - b.y0 + 1 + PAD * 2)
  // keep only this island's pixels so neighbours never bleed into the crop
  const out = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sk = (top + y) * W + (left + x), dk = (y * width + x) * 4
    if (lab[sk] !== b.id) continue
    out[dk] = data[sk * 4]; out[dk + 1] = data[sk * 4 + 1]; out[dk + 2] = data[sk * 4 + 2]; out[dk + 3] = data[sk * 4 + 3]
  }
  const file = `${outDir}/${names[i]}.webp`
  await sharp(out, { raw: { width, height, channels: 4 } }).webp({ quality: 85, alphaQuality: 90 }).toFile(file)
  console.log(file, `${width}x${height}`)
}
