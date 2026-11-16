// Cleans leftover paper off a keyed plant cut-out: the pale fringe on its edges and the cream patches between leaflets.
// Usage: node scripts/despeck.mjs <in.webp> <out.webp> [depth=5] [paper=1]
//   depth: how many px in from the cut edge a pale (paper-blended) pixel may be removed; 30 or more also removes
//          enclosed cream patches (for ferns and palms, whose paper shows between the leaflets)
//   paper: 1 = also remove true paper-white wherever it is reachable from outside, and enclosed paper islands;
//          0 = keep it (use for pieces with real cream flowers or plumes)
// Works inward from the transparent outside only, so pale gold veins inside a leaf are never touched.
// ponytail: colour thresholds; a cream flower sitting on the cut edge loses up to `depth` px.
import sharp from 'sharp'

const [inPath, outPath, depthArg = 5, paperArg = 1] = process.argv.slice(2)
const depth = Number(depthArg), paper = Number(paperArg) === 1
const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, N = W * H
const rgb = (k) => [data[k * 4], data[k * 4 + 1], data[k * 4 + 2]]
const pale = (k) => { const [r, g, b] = rgb(k); return (r + g + b) / 3 > 172 && Math.max(r, g, b) - b < 58 }
const white = (k) => { const [r, g, b] = rgb(k); return (r + g + b) / 3 > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 50 }
const nb = (k) => { const x = k % W, o = []; if (x) o.push(k - 1); if (x < W - 1) o.push(k + 1); if (k >= W) o.push(k - W); if (k < N - W) o.push(k + W); return o }

// breadth-first from the transparent outside: dist = steps taken through removed pixels
const dist = new Int32Array(N).fill(-1)
let q = []
for (let k = 0; k < N; k++) if (data[k * 4 + 3] < 128) { dist[k] = 0; q.push(k) }
while (q.length) {
  const next = []
  for (const k of q) for (const n of nb(k)) {
    if (dist[n] !== -1) continue
    const d = dist[k] + 1
    if ((paper && white(n)) || (d <= depth && pale(n))) { dist[n] = d; data[n * 4 + 3] = 0; next.push(n) }
  }
  q = next
}
// enclosed paper islands the outside could not reach
if (paper) {
  const lab = new Uint8Array(N), isl = depth >= 30 ? pale : white
  for (let s = 0; s < N; s++) {
    if (lab[s] || dist[s] !== -1 || !isl(s)) continue
    const comp = [s], st = [s]; lab[s] = 1
    while (st.length) { const k = st.pop(); for (const n of nb(k)) if (!lab[n] && dist[n] === -1 && isl(n)) { lab[n] = 1; st.push(n); comp.push(n) } }
    if (comp.length >= 6) for (const k of comp) data[k * 4 + 3] = 0
  }
}
// soften the new edge
const a = new Uint8Array(N); for (let k = 0; k < N; k++) a[k] = data[k * 4 + 3]
for (let k = 0; k < N; k++) if (a[k] && nb(k).some((n) => !a[n])) data[k * 4 + 3] = Math.round(a[k] * 0.55)
await sharp(data, { raw: info }).webp({ quality: 90, alphaQuality: 95 }).toFile(outPath)
console.log('wrote', outPath)
