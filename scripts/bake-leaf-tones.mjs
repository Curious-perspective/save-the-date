// Bakes the three depth tones of the opening leaves into image files, so the page needs no CSS filter on ~170 leaves
// (live filters made the opening lag badly on a real phone).
// Usage: node scripts/bake-leaf-tones.mjs     → public/v2/leaves/d1|d2|d3/<name>.webp for every leaf in public/v2/leaves
// The numbers are the old CSS `filter: brightness(b) saturate(s)` per depth: change them here and re-run.
import sharp from 'sharp'
import fs from 'fs'
const TONES = { d1: [0.78, 1.2], d2: [0.9, 1.15], d3: [1.04, 1.1] }
const dir = 'public/v2/leaves'
const names = fs.readdirSync(dir).filter((f) => f.endsWith('.webp'))
for (const [d, [b, s]] of Object.entries(TONES)) {
  fs.mkdirSync(`${dir}/${d}`, { recursive: true })
  for (const f of names) {
    await sharp(`${dir}/${f}`).ensureAlpha().linear([b, b, b, 1], [0, 0, 0, 0]).modulate({ saturation: s }).webp({ quality: 84, alphaQuality: 90 }).toFile(`${dir}/${d}/${f}`)
  }
}
console.log('baked', names.length, 'leaves x 3 tones')
