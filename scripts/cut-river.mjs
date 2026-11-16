// Cuts the river out of the forest painting as its own element, and punches it out of the left/right tree halves.
// Writes public/v2/forest-river.webp (and .tmp punched halves, unused: the halves keep their own water edges so no holes open while they part).
// ponytail: colour test + largest connected region + morphological close; tuned for hero/forest.webp only.
import sharp from 'sharp'
const { data, info } = await sharp('public/hero/forest.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, N = W * H
const water = new Uint8Array(N)
for (let k = 0; k < N; k++) {
  const i = k * 4, r = data[i], g = data[i + 1], b = data[i + 2], l = (r + g + b) / 3, mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  const y = Math.floor(k / W)
  if (y < H * 0.45 || data[i + 3] < 200) continue
  // pale jade water with gold ripple lines: light, low saturation, green/blue not far below red
  if (l > 150 && mx - mn < 70 && g >= r - 12 && b >= r - 40) water[k] = 1
}
// keep the region connected to the river's mouth at the bottom centre
const keep = new Uint8Array(N), st = []
for (let x = Math.floor(W * 0.3); x < W * 0.75; x++) { const k = (H - 2) * W + x; if (water[k]) { keep[k] = 1; st.push(k) } }
while (st.length) {
  const k = st.pop(), x = k % W
  for (const n of [k - 1, k + 1, k - W, k + W]) {
    if (n < 0 || n >= N || keep[n] || !water[n]) continue
    if ((n === k - 1 && x === 0) || (n === k + 1 && x === W - 1)) continue
    keep[n] = 1; st.push(n)
  }
}
// close small holes (ripple lines, glints): dilate 4px then erode 3px
const morph = (src, r, dil) => { const out = new Uint8Array(N); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = dil ? 0 : 1; for (let dy = -r; dy <= r && (dil ? !v : v); dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const s = src[yy * W + xx]; if (dil && s) { v = 1; break } if (!dil && !s) { v = 0; break } } out[y * W + x] = v } return out }
let m = morph(keep, 4, true); m = morph(m, 3, false)
const river = Buffer.alloc(N * 4)
for (let k = 0; k < N; k++) { const i = k * 4; river[i] = data[i]; river[i + 1] = data[i + 1]; river[i + 2] = data[i + 2]; river[i + 3] = m[k] ? 255 : 0 }
await sharp(river, { raw: info }).blur(2).webp({ quality: 88, alphaQuality: 90 }).toFile('public/v2/forest-river.webp')
// punch a slightly smaller hole than the river so the river piece always overlaps the trees (no gaps at the edges)
const punch = morph(m, 6, false)
for (const side of ['l', 'r']) {
  const f = `public/v2/forest-${side}.webp`
  const h = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let k = 0; k < N; k++) if (punch[k]) h.data[k * 4 + 3] = 0
  await sharp(h.data, { raw: h.info }).webp({ quality: 86, alphaQuality: 90 }).toFile(f + '.tmp.webp')
}
let n = 0; for (let k = 0; k < N; k++) n += m[k]
console.log('river px', n, 'of', N)
