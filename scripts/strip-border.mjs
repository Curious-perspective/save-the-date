// Removes the white/cream die-cut "sticker" border from a transparent cut-out so it sits in the painting.
// Usage: node scripts/strip-border.mjs <in.webp> <out.webp> [minIsland=1200]
//   minIsland: enclosed pale islands at least this many px are removed too; lower it (e.g. 40) for pieces with no pale flowers
// Flood-fills from the transparent outside into pale, low-saturation pixels (the border), then softens the new edge.
// ponytail: colour-threshold flood; if a subject itself is near-white at its edge it may lose a sliver.
import sharp from 'sharp'

const [inPath, outPath, minIsland = 1200] = process.argv.slice(2)
const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height
const isBorder = (i) => {
  const r = data[i], g = data[i + 1], b = data[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  return (r + g + b) / 3 > 200 && mx - mn < 48
}
const seen = new Uint8Array(W * H), q = []
for (let k = 0; k < W * H; k++) if (data[k * 4 + 3] < 128) { seen[k] = 1; q.push(k) }
while (q.length) {
  const k = q.pop(), x = k % W
  for (const n of [k - 1, k + 1, k - W, k + W]) {
    if (n < 0 || n >= W * H || seen[n]) continue
    if ((n === k - 1 && x === 0) || (n === k + 1 && x === W - 1)) continue
    if (isBorder(n * 4)) { seen[n] = 1; data[n * 4 + 3] = 0; q.push(n) }
  }
}
// enclosed sticker paper (e.g. between two birds): large pale islands the outside flood couldn't reach
const lab = new Int32Array(W * H).fill(-1)
for (let s = 0; s < W * H; s++) {
  if (lab[s] !== -1 || seen[s] || !isBorder(s * 4)) continue
  const comp = [s], st = [s]; lab[s] = s
  while (st.length) {
    const k = st.pop(), x = k % W
    for (const n of [k - 1, k + 1, k - W, k + W]) {
      if (n < 0 || n >= W * H || lab[n] !== -1 || seen[n] || !isBorder(n * 4)) continue
      if ((n === k - 1 && x === 0) || (n === k + 1 && x === W - 1)) continue
      lab[n] = s; st.push(n); comp.push(n)
    }
  }
  if (comp.length > Number(minIsland)) for (const k of comp) data[k * 4 + 3] = 0
}
// soften: pixels touching the new edge get half alpha
const a = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) a[k] = data[k * 4 + 3]
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  const k = y * W + x
  if (a[k] && (!a[k - 1] || !a[k + 1] || !a[k - W] || !a[k + W])) data[k * 4 + 3] = Math.round(a[k] * 0.55)
}
await sharp(data, { raw: info }).trim({ threshold: 1 }).webp({ quality: 88, alphaQuality: 92 }).toFile(outPath)
console.log('wrote', outPath)
