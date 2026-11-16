// Splits a layer into left/right pieces along its natural centre opening (a river or sky corridor), for a "parting" animation.
// Usage: node scripts/split-lr.mjs <in.webp> <outBase> [minX=0.3] [maxX=0.7]
// Per row it picks the calmest (least textured) column inside [minX, maxX], smooths the seam over rows, and feathers both edges.
// ponytail: texture = local colour variance; smoothing = moving average. Good enough for painted art with a clear corridor.
import sharp from 'sharp'
const [inPath, outBase, a = '0.3', b = '0.7'] = process.argv.slice(2)
const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, X0 = Math.floor(W * +a), X1 = Math.floor(W * +b)
const lum = (x, y) => { const i = (y * W + x) * 4; return data[i + 3] < 40 ? -1 : (data[i] + data[i + 1] + data[i + 2]) / 3 }
const seam = new Float32Array(H)
for (let y = 0; y < H; y++) {
  let best = (X0 + X1) / 2, bestScore = Infinity
  for (let x = X0; x < X1; x += 2) {
    let s = 0, n = 0
    for (let dy = -6; dy <= 6; dy += 3) for (let dx = -6; dx <= 6; dx += 3) {
      const yy = Math.min(H - 1, Math.max(0, y + dy)), l = lum(x + dx, yy), c = lum(x, yy)
      if (l < 0 || c < 0) { s -= 50; n++; continue } // transparent counts as an ideal gap
      s += Math.abs(l - c); n++
    }
    const score = s / n + Math.abs(x - W / 2) * 0.04 // gentle pull to the centre
    if (score < bestScore) { bestScore = score; best = x }
  }
  seam[y] = best
}
const R = 60, sm = new Float32Array(H)
for (let y = 0; y < H; y++) { let s = 0, n = 0; for (let k = -R; k <= R; k++) { const yy = y + k; if (yy >= 0 && yy < H) { s += seam[yy]; n++ } } sm[y] = s / n }
const F = 10 // feather px
const L = Buffer.from(data), Rb = Buffer.from(data)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4, d = x - sm[y]
  const kl = Math.max(0, Math.min(1, (-d + F / 2) / F)), kr = 1 - kl
  L[i + 3] = Math.round(data[i + 3] * kl); Rb[i + 3] = Math.round(data[i + 3] * kr)
}
await sharp(L, { raw: info }).webp({ quality: 86, alphaQuality: 90 }).toFile(`${outBase}-l.webp`)
await sharp(Rb, { raw: info }).webp({ quality: 86, alphaQuality: 90 }).toFile(`${outBase}-r.webp`)
console.log(outBase, 'seam x range', Math.min(...sm) / W, Math.max(...sm) / W)
