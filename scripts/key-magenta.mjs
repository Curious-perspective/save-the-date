// Turns art generated on a flat magenta (#FF00FF) background into a transparent WebP layer.
// Usage: node scripts/key-magenta.mjs <in.png> <out.webp> [--opaque] [--width=N] [--saturation=0.7] [--spill=0] [--trim]
//   --opaque  skip keying (e.g. the sky), just convert
// ponytail: simple chroma key on "magenta-ness" = min(r,b) - g. Upgrade to a real matting model if edges ever look fringed.
import sharp from 'sharp'

const [inPath, outPath, ...flags] = process.argv.slice(2)
if (!inPath || !outPath) { console.error('usage: key-magenta.mjs <in> <out> [--opaque] [--width=N]'); process.exit(1) }
const opaque = flags.includes('--opaque')
const green = flags.includes('--green')
const width = Number((flags.find(f => f.startsWith('--width=')) || '').split('=')[1]) || undefined

const LO = 45, HI = 140 // magenta-ness below LO = fully opaque, above HI = fully transparent
// allowed min(r,b)-g before we treat it as magenta spill and pull r/b down; lower it for layers with no pinks/lilacs
const SPILL = Number((flags.find(f => f.startsWith('--spill=')) || '').split('=')[1] ?? 10) || 0
const sat = Number((flags.find(f => f.startsWith('--saturation=')) || '').split('=')[1]) || 1

let img = sharp(inPath)
if (width) img = img.resize({ width })
if (opaque) {
  await img.webp({ quality: 82 }).toFile(outPath)
} else {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (green) {
      // --green: art generated on flat green #00FF00 (for pink/lilac subjects such as clouds). Soft ramp = soft, light edges.
      const m = g - Math.max(r, b)
      const a = m <= 20 ? 1 : m >= 150 ? 0 : 1 - (m - 20) / 130
      if (a > 0 && a < 1) {
        data[i] = Math.max(0, Math.min(255, r / a))
        data[i + 1] = Math.max(0, Math.min(255, (g - (1 - a) * 255) / a))
        data[i + 2] = Math.max(0, Math.min(255, b / a))
      }
      const s = data[i + 1] - Math.max(data[i], data[i + 2])
      if (s > 0) data[i + 1] -= s // despill green
      data[i + 3] = Math.round(a * 255)
      continue
    }
    const m = Math.min(r, b) - g
    let a = m <= LO ? 1 : m >= HI ? 0 : 1 - (m - LO) / (HI - LO)
    if (a > 0 && a < 1) {
      // un-mix the magenta from semi-transparent edge pixels: C = (P - (1-a)K) / a, K = (255,0,255)
      data[i] = Math.max(0, Math.min(255, (r - (1 - a) * 255) / a))
      data[i + 1] = Math.max(0, Math.min(255, g / a))
      data[i + 2] = Math.max(0, Math.min(255, (b - (1 - a) * 255) / a))
    }
    // despill: kill the leftover pink/magenta cast on fine edges (grass plumes, leaf tips)
    const s = Math.min(data[i], data[i + 2]) - data[i + 1] - SPILL
    if (s > 0) { data[i] -= s; data[i + 2] -= s }
    data[i + 3] = Math.round(a * 255)
  }
  let out = sharp(data, { raw: info }).modulate({ saturation: sat })
  // --trim: crop away the transparent margin (for ornaments and stickers)
  if (flags.includes('--trim')) out = sharp(await out.png().toBuffer()).trim({ threshold: 1 })
  await out.webp({ quality: 82, alphaQuality: 90 }).toFile(outPath)
}
const meta = await sharp(outPath).metadata()
console.log(outPath, `${meta.width}x${meta.height}`)
