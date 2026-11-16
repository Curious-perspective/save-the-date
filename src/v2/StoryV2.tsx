import { Fragment, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { useGSAP } from '@gsap/react'
import { content } from '../content'
import RsvpBoard from './RsvpBoard'
import './v2.css'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true }) // the address bar or keyboard sliding in must not re-measure the story mid-read
if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger })

/*
  v2 · Whole painted layers only (never cut, never scaled up, never faded). One scrubbed timeline in "units" (≈ screens).
  0–0.95   the leaves part left and right, three curtains ("You are invited")
  0.97–2   only then two clouds drift together over the forest, a name on each
  1.3–2.45 we walk on: the grass, then the forest, sink out of frame; the riverside is already standing behind
  2.95–4.9 the road: the jeep comes along the near bank, pauses, drives on
  4.9–6.35 the palash branch lowers the wooden sign: our families
  6.3–7.55 the sign lifts away, the riverside sinks: the resort was standing behind it (ARRIVAL)
  7.5–8.25 the jeep rolls to a stop by the garlanded gate; the sign comes back down with the date
  9.0–10.6 dusk falls; the hornbill brings the scroll; the sign turns over into the RSVP board
*/
const U = 11.6
const RESORT_END = /[?&]b=(wood|rock)\b/.test(location.search) ? 0.11 : 0.06 // for the closing picture the resort settles this much lower (in stage heights), so the lit villa stands clear below the RSVP board
const RESORT_LOW = 0.22 // the resort waits this much lower (in stage heights), wholly hidden behind the riverside, and rises into place as the riverside sinks
// While we are in the forest, the next scene (the riverside painting) waits this far below its place, in stage heights,
// fully behind the forest's trees, so the mauve HILLS show in the gap between the treetops (the couple missed them:
// the riverside's own far trees had been covering them). It rises into place as the forest sinks, as the resort does.
const FAR_LOW = 0.36
// The BEATS: where the story comes to rest and holds until the guest scrolls again. One gesture never goes past the
// next one. 0 "You are invited" · 1.8 both names joined on their clouds · 4.15 the jeep at rest on the road ·
// 5.8 the families sign · 8.6 the resort with the date sign · U the RSVP board.
const BEATS_T = [0, 1.8, 4.15, 5.8, 8.6, U] // in TIMELINE time (the rock option still rests at 5.8: its families stone rises after the jeep has gone)
// THE STORY CLOCK. After the jeep drives away (timeline 4.9) nothing moved until the board lifted at 6.35: on a phone
// that was more than a screen of scrolling with a still picture (the couple, 17 Nov: "the board doesn't move after a
// lot of scrolls even after the jeep has moved away"). Rather than renumber every later beat, the scroll is measured
// on a STORY clock that runs quickly through the idle stretches listed in ZONES.
// toT() turns story time into timeline time, toS() the other way. Everything the scroll driver does is in story time.
// [start in timeline time, its length there, the length it gets on the story clock]
//   1.7-2.0  the forest with both names joined, before the clouds leave ("the scroll is just a bit long on the first forest")
//   5.45-6.25 the families board alone after the jeep has gone (the rock option keeps this one at full length)
//   4.05-4.3 the jeep at rest with the hornbill on its bonnet: STRETCHED (the couple: "a slightly longer pause here before the hornbill flies away")
const ZONES: [number, number, number][] = [[1.7, 0.3, 0.1], [4.05, 0.25, 0.6], [5.45, 0.8, /[?&]b=rock\b/.test(location.search) ? 0.8 : 0.15]]
const toT = (s: number) => { let off = 0; for (const [a, len, w] of ZONES) { const sa = a - off; if (s <= sa) return s + off; if (s <= sa + w) return a + (s - sa) * (len / w); off += len - w } return s + off }
const toS = (t: number) => { let off = 0; for (const [a, len, w] of ZONES) { if (t <= a) return t - off; if (t <= a + len) return a - off + (t - a) * (w / len); off += len - w } return t - off }
const US = toS(U) // the story's length
// beats in story time; a beat inside the hurried stretch is dropped
const BEATS = BEATS_T.filter((b) => !ZONES.some(([a, len, w]) => w < len && b > a && b < a + len)).map(toS)
// WHAT CARRIES THE WORDS (families · date · RSVP): three options for the couple to compare, by URL `?b=wood|paper|rock`.
// wood = the wooden sign on ropes (as before) · paper = an ivory card on gold cords, same branch, same turn-over ·
// rock = painted river boulders standing in the scene: they RISE from below the frame instead of hanging, and the
// hornbill perches on top. All three are the same markup; v2.css restyles it under `.b-wood/.b-paper/.b-rock`.
// ponytail: delete the losers (and the switch) once the couple have picked.
const BOARD = (/[?&]b=(wood|paper|rock)\b/.exec(location.search)?.[1] ?? 'paper') as 'wood' | 'paper' | 'rock'
const ROCK = BOARD === 'rock'
const DIR = ROCK ? 1 : -1 // the carrier leaves upwards (hung) or downwards (a rock sinking)
const SWAP = 9.6 // (the couple, 17 Nov night: the date goes up at DATE_UP, THEN dusk falls and the lights come on, THEN the RSVP board comes down)
const DATE_UP = 9.0 // the date board has lifted out of the frame (F2 - 0.6 .. F2 - 0.15); the RSVP board comes down from F2 - 0.05
const F1 = 7.0, F2 = 11.0 // when the sign turns over (F1 happens off screen, between the two places: it comes back down as the date)

// Hornbill perches, in % of the stage (x of width, y of height). Branches are laid out from the same numbers.
// x is fixed; y is worked out by perches() below, because the branches and the bird are sized by the stage WIDTH
// but placed by its HEIGHT, so a fixed % only put the feet on the branch at one screen shape.
const P = {
  forest: { x: 68.3, y: 46.5 },
  palash: { x: 71.7, y: 12.7 },
  board: { x: 84, y: 22.5 },
  jeep: { x: 70, y: 70 }, // on the bonnet of the jeep at rest in the road scene (worked out in perches())
}
const AIR3 = [{ x: 78, y: 9.7 }] // the hop from the palash to the board
// Feet on the wood. All in stage widths (k = W/H in %): the bird is 30% wide and render() anchors it by its tail tip,
// 0.08 W below its feet. Branch tops and sizes are the ones in v2.css (.branchA, .palash, .sign-turn/.board).
// the short turn it makes just above the boards while the date board goes up and the RSVP board comes down; kept only
// a little above the board's top edge, because on a tall phone the frame's top is close above it (set in perches())
const HOP = [{ x: 66, y: 20 }, { x: 46, y: 19 }, { x: 28, y: 20 }]
const perches = (W: number, H: number, crop = 0) => {
  if (!W || !H) return // no size yet (a tab that is not showing): keep the last good numbers
  // crop = px of the stage hidden above the screen on tall phones; the sign group (.palash-grp) starts below it
  const k = (W / H) * 100, tail = 0.08, c = (crop / H) * 100, g = 1 - crop / H
  P.forest.y = 38 + (0.104 + tail) * k   // .branchA top 38%, feet on the thick limb 0.104 W below its top
  P.palash.y = c + 4 * g + (0.108 + tail) * k    // .palash top 4%, feet on top of the upper flower cluster
  P.board.y = c + 8 * g + ((BOARD === 'paper' ? 0.108 : 0.234) + tail) * k     // .sign-turn top 8% + the board's 26% margin = the board's top edge
  AIR3[0].y = P.palash.y - 3
  // the jeep at rest on the road (v2.css `.art > img.jeep`: 70.16% of the painting wide, left 14.92%, bottom 13.5%;
  // the painting is as tall as the stage or as wide, bottom-anchored and centred). Feet ON THE BONNET (the couple's call), towards
  // its front: 86% along the jeep, 37% down from its top (the art faces right on screen), which keeps the bird clear
  // of the antlers of the painted deer standing behind.
  { const aw = Math.max(W, H * 0.5625), ah = aw * 1536 / 864, jw = 0.7016 * aw, jh = jw * 606 / 1128
    const jx = (W - aw) / 2 + 0.1492 * aw, jtop = H - 0.135 * ah - jh
    P.jeep.x = ((jx + 0.86 * jw) / W) * 100; P.jeep.y = ((jtop + 0.37 * jh) / H) * 100 + tail * k }
  // PAPER has no branch: the hornbill sits on the card's own top edge, by its right-hand flowers
  // (the couple, 17 Nov) not the same side both times: on the RIGHT of the date board, then on the LEFT of the RSVP board
  if (BOARD === 'paper') { P.palash.x = 82; P.palash.y = P.board.y; P.board.x = 11; AIR3[0].x = 60; AIR3[0].y = P.board.y - 4 }
  HOP[0].y = P.board.y - 1.5; HOP[1].y = P.board.y - 2.5; HOP[2].y = P.board.y - 1.5
  if (ROCK) {
    // feet on the stone: the rocks stand on the bottom edge (.b-rock in v2.css: wide 110cqw, its foot 1% above the
    // bottom; tall 86cqw, 4% below), so their tops are 99 - 0.51k and 104 - 1.218k. On the wide rock the bird sits on
    // the right shoulder (lower than the crown, clear of the lettering); on the tall one just off the crown.
    P.palash.x = 86; P.palash.y = 99 - 0.51 * k + (0.13 + tail) * k
    P.board.x = 58; P.board.y = 104 - 1.218 * k + (0.035 + tail) * k
    AIR3[0].x = 72; AIR3[0].y = (P.palash.y + P.board.y) / 2 - 6
  }
}

// The opening jungle: we stand at the edge of an enchanted forest. Three curtains of plants, one behind the other.
// EACH CURTAIN COVERS THE WHOLE SCREEN ON ITS OWN (the couple's rule: the layer behind must never show through), and
// each is made of a LEFT half and a RIGHT half that overlap in the middle and part to the left and right as we walk in:
// NEAR (d1) in deep shade, MID (d2) in half shade, FAR (d3) lit from inside the forest.
// Every piece grows from the edge it is rooted at (nothing stands in the middle of the screen).
// x/y is the ROOT (the stalk end; the top end for hanging pieces) in % of the stage and may lie outside it; w is the
// width in % of the stage width; r turns the piece about its root (0 = growing straight up, 90 = reaching to the
// right, -90 = to the left; for hanging pieces 0 = hanging straight down); m mirrors the art.
type Leaf = { n: string; x: number; y: number; w: number; r: number; m?: boolean; hang?: boolean; d: 1 | 2 | 3 }
// ponytail: tiny seeded PRNG (mulberry32) so every piece opens its own way, the same on every load and every screen
const rnd = (seed: number) => () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
// height / width of each piece's art (its length along the stalk)
const LEAF_A: Record<string, number> = { elephant: 1.85, banana: 1.77, creeper: 4.02, vine: 4.06, fern: 3.2, broad: 1.82, salbranch: 1.84, ginger: 1.77, palm: 1.63, fernA: 1.43, fernB: 1.73, single: 2.4, salyoung: 1.5, twig: 2.17, monstera: 1.44, paradise: 1.46, bamboo: 1.32, hibiscus: 1.47, roundleaf: 1.28, papaya: 1.31 }
// Both halves are written out by hand: the couple want the two sides different (a mirror image looked artificial).
// A piece belongs to the half its root is in (x < 50 = left) and leaves to that side.
const JUNGLE: Leaf[] = [
  // ---- FAR · monstera, papaya, bamboo, hibiscus, round leaves, long fronds and two palm fans (the couple did not
  // want it to be mostly palm), lit from inside the forest
  { n: 'vine', x: 36, y: -3, w: 22, r: 4, hang: true, d: 3 },
  { n: 'broad', x: -20, y: -2, w: 66, r: 91, d: 3 },
  { n: 'fernA', x: -10, y: 10, w: 70, r: 100, d: 3 },
  { n: 'roundleaf', x: -16, y: 26, w: 64, r: 86, d: 3 },
  { n: 'broad', x: -20, y: 28, w: 64, r: 88, m: true, d: 3 },
  { n: 'fernA', x: -12, y: 36, w: 70, r: 86, m: true, d: 3 },
  { n: 'monstera', x: -22, y: 50, w: 70, r: 84, d: 3 },
  { n: 'broad', x: -22, y: 60, w: 64, r: 84, d: 3 },
  { n: 'papaya', x: -22, y: 76, w: 74, r: 70, d: 3 },
  { n: 'fernA', x: -10, y: 86, w: 70, r: 78, d: 3 },
  { n: 'fernB', x: -8, y: 98, w: 64, r: 60, d: 3 },
  { n: 'bamboo', x: 22, y: 106, w: 72, r: 8, d: 3 },
  { n: 'palm', x: 46, y: 110, w: 66, r: -6, d: 3 },
  { n: 'vine', x: 64, y: -4, w: 21, r: -4, m: true, hang: true, d: 3 },
  { n: 'fernA', x: 110, y: 0, w: 68, r: -96, d: 3 },
  { n: 'broad', x: 120, y: 12, w: 64, r: -92, m: true, d: 3 },
  { n: 'fernB', x: 112, y: 26, w: 64, r: -88, m: true, d: 3 },
  { n: 'papaya', x: 122, y: 44, w: 72, r: -86, m: true, d: 3 },
  { n: 'fernA', x: 112, y: 56, w: 70, r: -84, m: true, d: 3 },
  { n: 'paradise', x: 108, y: 100, w: 64, r: -24, m: true, d: 3 },
  { n: 'broad', x: 122, y: 82, w: 62, r: -78, d: 3 },
  { n: 'fernA', x: 110, y: 94, w: 68, r: -70, d: 3 },
  { n: 'paradise', x: 78, y: 106, w: 66, r: -10, d: 3 },
  { n: 'monstera', x: 60, y: 112, w: 64, r: 4, m: true, d: 3 },
  { n: 'broad', x: 1, y: 36, w: 44, r: 6, d: 3 },
  { n: 'broad', x: 2, y: 72, w: 44, r: 8, m: true, d: 3 },
  { n: 'roundleaf', x: 2, y: 108, w: 60, r: 14, d: 3 },
  { n: 'broad', x: 99, y: 30, w: 44, r: -6, m: true, d: 3 },
  { n: 'broad', x: 98, y: 64, w: 44, r: -8, d: 3 },
  { n: 'palm', x: 102, y: 108, w: 60, r: -20, m: true, d: 3 },
  { n: 'broad', x: -4, y: 74, w: 44, r: 20, d: 3 },
  { n: 'paradise', x: 16, y: 108, w: 62, r: 10, d: 3 },
  // ---- MID · sal blossom, broad leaves, ginger flowers and marigold buds
  { n: 'vine', x: 27, y: -2, w: 19, r: 5, hang: true, d: 2 },
  { n: 'vine', x: 44, y: -3, w: 18, r: -3, hang: true, d: 2 },
  { n: 'broad', x: -14, y: 6, w: 56, r: 96, d: 2 },
  { n: 'salbranch', x: -12, y: 26, w: 56, r: 84, d: 2 },
  { n: 'roundleaf', x: -16, y: 46, w: 62, r: 82, d: 2 },
  { n: 'salbranch', x: -12, y: 62, w: 56, r: 70, d: 2 },
  { n: 'broad', x: -14, y: 80, w: 54, r: 66, d: 2 },
  { n: 'salbranch', x: -6, y: 100, w: 52, r: 40, d: 2 },
  { n: 'ginger', x: 16, y: 106, w: 58, r: 6, d: 2 },
  { n: 'ginger', x: 40, y: 108, w: 52, r: -6, d: 2 },
  { n: 'twig', x: 30, y: 104, w: 27, r: -8, d: 2 },
  { n: 'vine', x: 73, y: -2, w: 18, r: -4, m: true, hang: true, d: 2 },
  { n: 'vine', x: 56, y: -5, w: 19, r: 3, m: true, hang: true, d: 2 },
  { n: 'salbranch', x: 112, y: 9, w: 56, r: -94, m: true, d: 2 },
  { n: 'broad', x: 113, y: 29, w: 56, r: -84, d: 2 },
  { n: 'salbranch', x: 112, y: 47, w: 54, r: -80, m: true, d: 2 },
  { n: 'papaya', x: 120, y: 66, w: 62, r: -78, d: 2 },
  { n: 'broad', x: 113, y: 83, w: 56, r: -64, m: true, d: 2 },
  { n: 'broad', x: 106, y: 101, w: 52, r: -40, d: 2 },
  { n: 'ginger', x: 85, y: 106, w: 56, r: -7, m: true, d: 2 },
  { n: 'ginger', x: 61, y: 109, w: 50, r: 6, m: true, d: 2 },
  { n: 'twig', x: 72, y: 104, w: 26, r: 8, m: true, d: 2 },
  { n: 'broad', x: 2, y: 40, w: 40, r: 8, d: 2 },
  { n: 'broad', x: 3, y: 78, w: 40, r: 6, m: true, d: 2 },
  { n: 'broad', x: 98, y: 34, w: 40, r: -8, m: true, d: 2 },
  { n: 'broad', x: 97, y: 70, w: 42, r: -6, d: 2 },
  // ---- NEAR · the first thing a guest sees: GREEN ONLY (the couple's call: flowers start from the second layer),
  // big banana, elephant-ear, monstera and papaya leaves with creepers (no ferns: they disliked the row of ferns)
  { n: 'creeper', x: 8, y: -2, w: 20, r: 4, hang: true, d: 1 },
  { n: 'creeper', x: 40, y: -5, w: 19, r: -2, m: true, hang: true, d: 1 },
  { n: 'monstera', x: -22, y: 14, w: 64, r: 88, d: 1 },
  { n: 'papaya', x: -22, y: 30, w: 64, r: 84, d: 1 },
  { n: 'elephant', x: -24, y: 50, w: 60, r: 84, d: 1 },
  { n: 'banana', x: -9, y: 68, w: 58, r: 76, m: true, d: 1 },
  { n: 'banana', x: -10, y: 90, w: 54, r: 58, d: 1 },
  { n: 'single', x: -3, y: 96, w: 26, r: 36, d: 1 },
  { n: 'elephant', x: 14, y: 108, w: 58, r: 8, m: true, d: 1 },
  { n: 'elephant', x: 36, y: 110, w: 54, r: -6, d: 1 },
  { n: 'single', x: 30, y: 104, w: 28, r: -6, m: true, d: 1 },
  { n: 'creeper', x: 90, y: -3, w: 19, r: -3, m: true, hang: true, d: 1 },
  { n: 'creeper', x: 62, y: -6, w: 20, r: 3, hang: true, d: 1 },
  { n: 'elephant', x: 126, y: 14, w: 60, r: -88, m: true, d: 1 },
  { n: 'banana', x: 109, y: 34, w: 58, r: -82, m: true, d: 1 },
  { n: 'monstera', x: 122, y: 54, w: 64, r: -80, m: true, d: 1 },
  { n: 'elephant', x: 124, y: 72, w: 58, r: -80, d: 1 },
  { n: 'banana', x: 108, y: 72, w: 56, r: -14, m: true, d: 1 },
  { n: 'banana', x: 108, y: 92, w: 56, r: -60, d: 1 },
  { n: 'elephant', x: 90, y: 108, w: 58, r: -12, m: true, d: 1 },
  { n: 'banana', x: 66, y: 108, w: 56, r: -6, m: true, d: 1 },
  { n: 'single', x: 78, y: 104, w: 26, r: 8, d: 1 },
  { n: 'creeper', x: 2, y: -2, w: 20, r: 2, m: true, hang: true, d: 1 },
  { n: 'banana', x: -6, y: 44, w: 52, r: 100, m: true, d: 1 },
  { n: 'single', x: -4, y: 62, w: 28, r: 70, d: 1 },
  { n: 'elephant', x: 4, y: 112, w: 54, r: 10, d: 1 },
  { n: 'creeper', x: 98, y: -4, w: 20, r: -2, hang: true, d: 1 },
  { n: 'banana', x: 110, y: 38, w: 54, r: -94, d: 1 },
  { n: 'banana', x: 106, y: 58, w: 52, r: -100, d: 1 },
  { n: 'elephant', x: 92, y: 112, w: 56, r: -10, d: 1 },
  { n: 'banana', x: 106, y: 64, w: 54, r: -88, m: true, d: 1 },
  { n: 'elephant', x: -2, y: 114, w: 50, r: 4, d: 1 },
]
// Under the composed pieces of each curtain lies a plain bed of its own leaves (two columns, leaning in over the
// middle), so the curtain is opaque at every screen shape and no gap can show the layer behind.
const BED: Record<number, string[]> = { 1: ['banana', 'elephant'], 2: ['broad', 'salbranch'], 3: ['broad', 'monstera'] }
const bed = (d: 1 | 2 | 3): Leaf[] => {
  const R = rnd(d * 11), out: Leaf[] = []
  for (let y = 24; y <= 120; y += 16) for (const left of [true, false]) {
    const n = BED[d][Math.floor(R() * 2)], lean = 10 + R() * 14
    out.push({ n, x: (left ? 18 : 82) + (R() - 0.5) * 8, y: y + (R() - 0.5) * 6, w: 62, r: left ? lean : -lean, m: R() < 0.5, d })
    // and one standing along the frame's own edge
    out.push({ n: BED[d][Math.floor(R() * 2)], x: left ? 0 : 100, y: y + 8 + (R() - 0.5) * 6, w: 50, r: (R() - 0.5) * 10, m: R() < 0.5, d })
  }
  return out
}
// the composed pieces in DOM order (far first, near on top): each of these moves on its own
const PIECES = ([3, 2, 1] as const).flatMap((d) => JUNGLE.filter((l) => l.d === d))
// the bed is cut into three bands per side (top, middle, bottom), so it does not leave as one flat sheet
const band = (l: Leaf) => (l.y < 50 ? 0 : l.y < 86 ? 1 : 2)
// Only the topmost plants of each curtain move on their own (MOVERS per curtain); the ones underneath ride with the
// bed's bands. ~170 separately moving, live-filtered leaves were far too heavy for a real phone (17 Nov); this keeps
// the look of individual plants being pushed aside with about 36 moving pieces plus 18 bands, and no CSS filters
// (the depth tones are baked into /v2/leaves/d1|d2|d3 by scripts/bake-leaf-tones.mjs).
const MOVERS = 12
const layerOf = (d: number) => PIECES.filter((l) => l.d === d)
const MOVING = ([3, 2, 1] as const).flatMap((d) => layerOf(d).slice(-MOVERS))
const leafSrc = (l: Leaf) => `/v2/leaves/d${l.d}/${l.n}.webp`

// fireflies among the opening leaves
const JFLIES = Array.from({ length: 16 }, (_, i) => ({ left: `${10 + ((i * 47) % 80)}%`, top: `${14 + ((i * 31) % 74)}%`, delay: `${-(i * 0.9) % 6}s` }))
const FLIES = Array.from({ length: 14 }, (_, i) => ({ left: `${8 + ((i * 53) % 84)}%`, top: `${48 + ((i * 29) % 40)}%`, delay: `${-(i * 0.7) % 6}s` }))
// Dusk at the resort. All in % of the resort PAINTING (not the stage), so the lights stay on the art at every screen
// shape and travel with it. Lit windows and doorways [x, y, width, height]: the four garlanded veranda arches, the
// three doors on the upper veranda, the three windows on the left wall, the far cottage's veranda.
const RWINDOWS = [[24.2, 56.6, 3.2, 3.6], [32.2, 56.6, 3.2, 3.6], [40.2, 56.6, 3.2, 3.6], [47.6, 56.6, 3, 3.6], [23, 47.2, 3, 3], [31.2, 47.2, 3, 3], [38.6, 47.2, 2.8, 3], [12.8, 47.4, 2.6, 3], [6.4, 55.6, 2.4, 3.4], [12.2, 55.6, 2.4, 3.4], [71.8, 47.5, 4.4, 1.6]]
// lamps [x, y]: five diyas along the upper balustrade, one on each gate post, four down the path, three on the river
const RLAMPS = [[17.5, 49.3], [26.8, 49.6], [36, 49.9], [44.5, 50.2], [52, 50.5], [56.5, 66.9], [72.9, 67.3], [61.5, 74.6], [68.8, 75.2], [60.5, 78.2], [70.6, 78.8], [86, 57.2], [92.5, 61.2], [88.5, 64.6]]
const PETALS = Array.from({ length: 13 }, (_, i) => `/story/petals/p${String(i + 1).padStart(2, '0')}.webp`)


const cal = content.calendar
const googleCal = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: cal.title, dates: `${cal.start}/${cal.endExclusive}`, details: cal.details, location: cal.location }).toString()

// REDUCED MOTION · the same story as four still panels down the page (forest and names → road and families → resort
// and date → dusk and RSVP), no pin, no scrub, no leaves, the RSVP form live at the bottom. Same art, same classes;
// `.calm` in v2.css un-hides what the timeline would have revealed.
// ponytail: decided once at load (a guest who flips the OS setting mid-visit reloads to switch). `?calm=1` forces it, for testing.
// `?calm=0` forces the animated story even when the phone asks for reduced motion (to compare on one's own phone).
const CALM = !/[?&]calm=0\b/.test(location.search) && (matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]calm=1\b/.test(location.search))

function Calm() {
  const sky = <div className="scene sA"><div className="layer L-sky"><img src="/hero/sky.webp" alt="" /></div><div className="layer L-hills"><img src="/hero/hills.webp" alt="" /></div></div>
  // the perched hornbill, feet on the wood: x in % of the panel, top worked out as in perches()
  const bird = (x: number, top: string, flip = false) => <img className="calm-bird" src="/v2/hornbill-perch.webp" alt="" style={{ left: `calc(${x}% - 7.8cqw)`, top, transform: flip ? 'scaleX(-1)' : undefined }} />
  const sign = (face: React.ReactNode) => <div className="palash-grp"><img className="palash" src="/v2/palash.webp" alt="" /><div className="sign-turn">{face}</div></div>
  const resort = (dusk: boolean, face: React.ReactNode) => (
    <div className="scene sB">
      <div className="resort" style={dusk ? { transform: `translateY(${RESORT_END * 100}%)` } : undefined}>
        <div className="art">
          <img src="/v2/resort/scene.webp" alt="" />
          {dusk && RWINDOWS.map(([x, y, w, h], i) => <i key={i} className="rwin" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }} />)}
          {dusk && RLAMPS.map(([x, y], i) => <i key={i} className="fly rlamp" style={{ left: `${x}%`, top: `${y}%` }} />)}
          <img className="jeep2" src="/story/jeep.webp" alt="Shreya and Akshay's jeep, parked at the gate" />
        </div>
      </div>
      {sign(face)}
      <div className="tint" aria-hidden="true" />
      {dusk && <div className="dusk" aria-hidden="true" />}
    </div>
  )
  return (
    <section className="v2 calm" aria-label="Shreya and Akshay are getting married">
      <div className={`stage b-${ROCK ? 'paper' : BOARD}`}>
        <div className="scene sB"><div className="riverside" style={{ transform: `translateY(${FAR_LOW * 100}%)` }}><div className="art"><img src="/v2/riverside/scene.webp" alt="" /></div></div></div>
        <div className="scene sA">
          <div className="layer L-sky"><img src="/hero/sky.webp" alt="" /></div>
          <div className="layer L-hills"><img src="/hero/hills.webp" alt="" /></div>
          <div className="layer L-forest"><img className="pop" src="/hero/forest.webp" alt="" /><img className="deer deer-doe" src="/v2/chital-doe.webp" alt="" /><img className="deer deer-stag" src="/v2/chital-stag.webp" alt="" /></div>
          <div className="layer L-grass"><img className="pop" src="/hero/grass.webp" alt="" /></div>
          <img className="branchA" src="/v2/branch-r.webp" alt="" />
        </div>
        <h1 className="names" aria-label={`${content.couple.bride} & ${content.couple.groom} ${content.announce}`}>
          <span className="cloud cloud-a" aria-hidden="true"><img src="/v2/cloud-a.webp" alt="" /><span className="cl-name">{content.couple.bride}<span className="cl-amp">&amp;</span></span></span>
          <span className="cloud cloud-b" aria-hidden="true"><img src="/v2/cloud-b.webp" alt="" /><span className="cl-name">{content.couple.groom}<span className="cl-sub">{content.announce}</span></span></span>
        </h1>
        {bird(68.3, 'calc(38% - 2.5cqw)')}
      </div>
      <div className={`stage b-${ROCK ? 'paper' : BOARD}`}>
        {sky}
        <div className="scene sB">
          <div className="riverside"><div className="art"><img src="/v2/riverside/scene.webp" alt="" /><img className="jeep" style={{ left: '14.92%' }} src="/story/jeep.webp" alt="Shreya and Akshay's jeep on the riverside road" /></div></div>
          {sign(<div className="fam-face plank plank-fam">{content.families.map((f) => <p key={f.who} className="plank-line"><b>{f.who}</b> <i>{f.relation}</i><span>{f.parents}</span></p>)}</div>)}
          <div className="tint" style={{ opacity: 0.6 }} aria-hidden="true" />
        </div>
        {bird(71.7, 'calc(4% - 2.1cqw)')}
      </div>
      <div className={`stage b-${ROCK ? 'paper' : BOARD}`}>
        {sky}
        {resort(false, (
          <div className="date-face plank plank-date">
            <p className="foil date-d">16 &amp; 17</p>
            <p className="date-m">February 2027</p>
            <p className="date-p">{content.place}</p>
            <details className="cal">
              <summary>Add to calendar</summary>
              <div className="cal-opts">
                <a href={googleCal} target="_blank" rel="noopener">Google</a>
                <a href="/save-the-date.ics" download="Shreya-Akshay-Save-the-Date.ics">Apple · Outlook</a>
              </div>
            </details>
          </div>
        ))}
        {bird(71.7, 'calc(4% - 2.1cqw)')}
      </div>
      <div className={`stage b-${ROCK ? 'paper' : BOARD}`}>
        {sky}
        {resort(true, <div className="board plank plank-board" id="rsvp"><RsvpBoard onSent={() => {}} /></div>)}
        {bird(84, 'calc(8% + 10.5cqw)', true)}
      </div>
    </section>
  )
}

export default function StoryV2() { return CALM ? <Calm /> : <Animated /> }

function Animated() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    // (guests with reduced motion never get here: they get <Calm /> above)
    const mm = gsap.matchMedia()
    mm.add('all', () => {
      // start from clean inline styles (React StrictMode mounts twice in dev and can leave stale transforms behind)
      gsap.set('.sA, .sB, .names, .cloud-a, .cloud-b, .palash-grp, .jp, .jbed, .jfly, .std, .guide, .fam-face, .date-face, .board, .tint, .dusk, .glow, .rlamp, .rwin, .L-sky, .L-hills, .L-forest, .L-grass, .L-flies, .branchA, .riverside, .resort, .jeep2', { clearProps: 'transform,opacity,visibility,translate,rotate,scale' })
      const firstImgs = gsap.utils.toArray<HTMLImageElement>('.sA img, .jbed.d1 img, .jp.d1', root.current)
      const ready = Promise.all(firstImgs.map((i) => i.decode().catch(() => undefined)))

      // ---- intro: the paper forest stands up, then the title glints on the leaves
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      intro
        .to('.loader', { autoAlpha: 0, duration: 0.7 })
        .from('.sA .pop', { rotationX: 70, yPercent: 6, autoAlpha: 0, duration: 1.3, ease: 'back.out(1.2)', stagger: 0.15 }, 0.2)
        .from('.jbed, .jp', { autoAlpha: 0, duration: 0.9, stagger: { each: 0.008, from: 'end' } }, 0.2)
        .from('.std > *', { y: 24, autoAlpha: 0, duration: 1.1 }, 1.0)
        .from('.hint', { autoAlpha: 0, duration: 0.8 }, 1.9)
      if (import.meta.env.DEV) Object.assign(window, { v2Intro: intro })
      let alive = true
      ready.then(() => { if (alive) intro.play() })

      // ---- the hornbill: its position is a tween on this proxy, so scrolling back plays the flight in reverse
      // the paths below hold the P objects themselves, so a refresh (resize, rotate) re-reads the new perches
      const place = () => perches(stage.current!.clientWidth, stage.current!.clientHeight, -parseFloat(getComputedStyle(stage.current!).top) || 0)
      place()
      ScrollTrigger.addEventListener('refreshInit', place)
      const bird = { x: P.forest.x, y: P.forest.y, perched: 1, scroll: 0 }
      const el = stage.current!.querySelector<HTMLElement>('.guide')!
      const flip = el.querySelector<HTMLElement>('.flip')!
      const tilt = el.querySelector<HTMLElement>('.tilt')!
      const famFace = stage.current!.querySelector('.fam-face')!, dateFace = stage.current!.querySelector('.date-face')!, board = stage.current!.querySelector('.board')!
      let tl: gsap.core.Timeline | null = null
      let lastX = bird.x, lastY = bird.y, facing = -1 // starts facing left on the forest branch
      const render = () => {
        const st = stage.current!, W = st.clientWidth, H = st.clientHeight
        el.style.transform = `translate(${(bird.x / 100) * W - el.offsetWidth * 0.5}px, ${(bird.y / 100) * H - el.offsetHeight * 0.85}px)`
        el.classList.toggle('flying', !bird.perched)
        el.classList.toggle('carrying', !!bird.scroll)
        const dx = bird.x - lastX, dy = bird.y - lastY
        // flying, it faces the way it is going; SITTING, it faces into the picture (right when it sits on the left)
        const want = bird.perched ? (bird.x < 50 ? 1 : -1) : Math.abs(dx) > 0.04 ? (dx > 0 ? 1 : -1) : 0
        if (want) {
          const f = want
          if (f !== facing) { facing = f; gsap.to(flip, { rotationY: f > 0 ? 0 : 180, duration: 0.45, ease: 'sine.inOut', overwrite: true }) }
        }
        gsap.to(tilt, { rotation: bird.perched ? 0 : gsap.utils.clamp(-14, 14, dy * -6), duration: 0.3, overwrite: true })
        lastX = bird.x; lastY = bird.y
        // the one sign turns over twice: families → date (F1), date → RSVP board (F2). Each turn: the old face tips
        // away over 0.25, the new one comes down over 0.3. Computed straight from the timeline time.
        const t = tl ? tl.time() : 0
        const out = (f: number) => gsap.utils.clamp(0, 1, (t - f) / 0.25), inn = (f: number) => gsap.utils.clamp(0, 1, (t - f - 0.25) / 0.3)
        if (ROCK) { // a boulder does not turn over: the old one sinks out of frame, the next one rises
          gsap.set(famFace, { y: 0.7 * H * out(F1), autoAlpha: t < F1 + 0.25 ? 1 : 0 })
          gsap.set(dateFace, { y: 0.7 * H * (t < F2 ? 1 - inn(F1) : out(F2)), autoAlpha: t >= F1 + 0.25 && t < F2 + 0.25 ? 1 : 0 })
          gsap.set(board, { y: 0.8 * H * (1 - inn(F2)), autoAlpha: t >= F2 + 0.25 ? 1 : 0 })
          return
        }
        // the boards never turn over (the couple, 17 Nov: "banners need to come from the top, not flip between two
        // banners"): each one is swapped while the sign is up out of the frame (F1 between the two places; SWAP while
        // the date board has lifted away), and comes down from the top as its own board
        gsap.set(famFace, { rotationX: 0, autoAlpha: t < F1 + 0.25 ? 1 : 0 })
        gsap.set(dateFace, { rotationX: 0, autoAlpha: t >= F1 + 0.25 && t < SWAP ? 1 : 0 })
        gsap.set(board, { rotationX: 0, autoAlpha: t >= SWAP ? 1 : 0 })
      }
      gsap.set(flip, { rotationY: 180 })

      const fly = (pts: { x: number; y: number }[], at: number, dur: number, land = true) => tl!
        .set(bird, { perched: 0 }, at)
        // lazy: false · on a big jump (RSVP button, reload at the end) a lazy tween writes the proxy AFTER onUpdate has drawn the bird
        .to(bird, { motionPath: { path: pts, curviness: 1.25 }, duration: dur, ease: 'sine.inOut', lazy: false }, at)
        .set(bird, { perched: land ? 1 : 0 }, at + dur)

      // ---- the story (full-height groups move by y in px of the stage height; yPercent on them got baked into px after pin refreshes)
      const sh = () => stage.current!.clientHeight
      const sw = () => stage.current!.clientWidth
      // The timeline is NOT scrubbed by ScrollTrigger directly: the scroll only pins the stage, and `drive()` below moves
      // the timeline towards the scroll position, but never past the next BEAT (see "the gates").
      tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: render })
      tl
        // the forest: the bushes rise away (we step through them)
        .fromTo('.hint', { y: 0 }, { y: () => 0.3 * sh(), duration: 0.2, ease: 'power1.in', immediateRender: false }, 0)
        // the words hold, untouched, while the near and mid curtains part, and dissolve where they stand only as the
        // far curtain opens (it moves 0.46–0.92; the couple's call; the words used to slide up at the start)
        .to('.std', { autoAlpha: 0, duration: 0.38, ease: 'power1.in' }, 0.52)
        .to('.L-sky', { yPercent: -4, duration: 1.3 }, 0)
        // THE NAMES · only once every leaf has gone and the whole forest stands open (0.95) do two clouds drift in with the scroll, one from each side, a name on each, and come together over
        // the forest. They belong to the forest only: joined, they lift away together as we walk on.
        // (the lift is on the clouds themselves: a transform on their parent would flatten their two depths into one)
        .fromTo('.cloud-a', { x: () => -1.6 * sw() }, { x: 0, duration: 0.7, ease: 'power2.out' }, 0.97)
        .fromTo('.cloud-b', { x: () => 1.6 * sw() }, { x: 0, duration: 0.7, ease: 'power2.out' }, 0.97)
        // they leave the way they came, each carrying on along its own path (the couple, 17 Nov): Shreya's cloud, which
        // drifted in from the left, sails on out to the right; Akshay's, from the right, on out to the left
        .fromTo('.cloud-a', { x: 0 }, { x: () => 1.7 * sw(), duration: 0.55, ease: 'power2.in', immediateRender: false }, 2.0)
        .fromTo('.cloud-b', { x: 0 }, { x: () => -1.7 * sw(), duration: 0.55, ease: 'power2.in', immediateRender: false }, 2.0)
        // FOREST → ROAD · we walk on: each whole layer sinks out of frame as we pass it, nearest first (grass, then the
        // forest with the hornbill's branch). The road scene is already standing behind, under the same sky.
        // Nothing is cut, scaled up or faded.
        .to('.L-grass', { y: () => 1.0 * sh(), duration: 0.6, ease: 'power1.in' }, 2.0)
        .to('.L-flies', { y: () => 1.0 * sh(), duration: 0.6, ease: 'power1.in' }, 2.0)
        .to('.L-forest, .branchA', { y: () => 1.05 * sh(), duration: 0.95, ease: 'power1.inOut' }, 2.15)
        // (in the forest scene the far trees stand a little lower, FAR_LOW, so more sky is open for "Shreya")
        .fromTo('.riverside', { y: () => FAR_LOW * sh() }, { y: 0, duration: 1.1, ease: 'sine.inOut', immediateRender: true }, 2.15)
        .set('.L-forest, .L-grass, .L-flies, .branchA', { visibility: 'hidden' }, 3.15)
        // THE ROAD · the jeep comes along, pauses, and drives on out of the frame towards the wedding…
        .fromTo('.jeep', { left: '-72%' }, { left: '14.92%', duration: 1.1, ease: 'power2.out' }, 2.95)
        .fromTo('.jeep', { left: '14.92%' }, { left: '104%', duration: 1.1, ease: 'power2.in', immediateRender: false }, 4.3)
        // …and only once it has gone does the palash branch lower the wooden sign with the two families
        .fromTo('.palash-grp', { y: () => DIR * 1.2 * sh() }, { y: 0, duration: 0.55, ease: 'power2.out' }, ROCK ? 4.9 : 3.6)
        // ROAD → RESORT · the families have been read (0.9): the sign lifts away and we go on. The riverside sinks out
        // of frame, whole, as the forest did; the resort was standing behind it all along (kept RESORT_LOW lower so its
        // tall mango trees stayed hidden behind the riverside's own trees) and rises into place under the same sky.
        .to('.palash-grp', { y: () => DIR * 1.2 * sh(), duration: 0.45, ease: 'power2.in' }, 6.35)
        .set('.resort', { visibility: 'visible' }, 6.55)
        .to('.riverside', { y: () => 1.05 * sh(), duration: 0.95, ease: 'power1.inOut' }, 6.6)
        .fromTo('.resort', { y: () => RESORT_LOW * sh() }, { y: 0, duration: 1.0, ease: 'sine.inOut', immediateRender: true }, 6.6)
        .set('.riverside', { visibility: 'hidden' }, 7.56)
        // THE RESORT · the jeep rolls the last few yards and stops by the garlanded gate (no bounce: it is parked)…
        // it stops with the JEEP centred on the screen, not counting the dust cloud behind it (0.5425 = the middle of the jeep's body in its image; the same sum is in v2.css)
        .fromTo('.jeep2', { left: '-95%' }, { left: () => { const j = root.current!.querySelector<HTMLElement>('.jeep2')!; return (j.parentElement as HTMLElement).clientWidth * 0.5 - j.offsetWidth * 0.5425 }, duration: 0.75, ease: 'power3.out' }, 7.2)
        // …and the sign comes back down, turned over meanwhile (F1): the date, the place, Add to calendar
        .fromTo('.palash-grp', { y: () => DIR * 1.2 * sh() }, { y: 0, duration: 0.55, ease: 'power2.out', immediateRender: false }, 7.7)
        // light: afternoon → golden hour → dusk
        .fromTo('.tint', { opacity: 0 }, { opacity: 1, duration: 3.6 }, 2.9)
        .fromTo('.dusk', { opacity: 0 }, { opacity: 1, duration: 1.0 }, DATE_UP + 0.45)
        // the house lights come on one after another as dusk deepens, then the lamps outside (light, so it may fade in)
        // (the couple, 17 Nov: "a small gap between the lights coming on and then the next board": every light is on by
        // about 9.75, the date board only starts to lift at F2 - 0.6 = 10.0)
        .fromTo('.rwin', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, stagger: 0.03 }, DATE_UP + 0.6)
        .fromTo('.rlamp', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, stagger: 0.015 }, DATE_UP + 0.9)
        // THE CLOSING PICTURE · as the sign turns over into the RSVP board (F2) the whole resort settles a little lower,
        // so the lit villa and the parked jeep stand below the board instead of behind it
        // (not with rocks: the tall stone stands at the bottom, so the villa is left where it is, above the stone)
        .to('.resort', { y: () => (ROCK ? 0 : RESORT_END) * sh(), duration: 0.7, ease: 'sine.inOut' }, F2 - 0.35)
        .set({}, {}, U)
      if (!ROCK) tl
        .to('.palash-grp', { y: () => -1.2 * sh(), duration: 0.45, ease: 'power2.in' }, DATE_UP)
        .fromTo('.palash-grp', { y: () => -1.2 * sh() }, { y: 0, duration: 0.55, ease: 'power2.out', immediateRender: false }, F2 - 0.05)

      // hornbill: seated on the forest branch from the first frame (behind the leaves). As the forest sinks it flies on
      // ahead, out past the right edge; it comes back in with the palash branch and lands on it as the sign settles.
      if (ROCK) fly([P.forest, { x: 80, y: 38 }, { x: 98, y: 27 }, { x: 120, y: 20 }], 2.15, 0.8)
      if (ROCK) {
        fly([{ x: 120, y: 14 }, { x: 98, y: 7 }, { x: 82, y: 6 }, P.palash], 4.95, 0.5)
        fly([P.palash, { x: 92, y: 9 }, { x: 122, y: 12 }], 6.3, 0.45)
        fly([{ x: 122, y: 14 }, { x: 98, y: 7 }, { x: 82, y: 6 }, P.palash], 7.75, 0.5)
        fly([P.palash, ...AIR3, P.board], F2 + 0.05, 0.55) // lands on the tall stone as it arrives
      } else {
        // (the couple, 17 Nov) THE HORNBILL NEVER LEAVES THE SCREEN, and every move is one long smooth flight that ends
        // where the next begins. Waypoints keep the whole bird inside the frame (x 16-86, y 10-90).
        // forest branch → as the forest sinks it glides a slow loop over the river and lands ON THE BONNET of the jeep
        // just as the jeep stops at the centre
        fly([P.forest, { x: 60, y: 34 }, { x: 38, y: 32 }, { x: 28, y: 46 }, { x: 46, y: 58 }, { x: 70, y: 60 }, P.jeep], 2.15, 1.9)
        // (the couple, 17 Nov) in the road scene it sits ONLY on the jeep, never on the families board, and stays on the
        // bonnet until the jeep drives off. It cannot ride out with the jeep (it must never leave the screen), so as
        // the jeep pulls away it lifts off and waits in the air over the river…
        const WAIT = { x: 34, y: 52 }
        fly([P.jeep, { x: 80, y: 57 }, { x: 58, y: 52 }, WAIT], 4.35, 1.05, false)
        // …(it hovers there through the hurried stretch) and when the river scene gives way to the resort it circles
        // round and settles on the RIGHT of the date board as that comes down
        fly([WAIT, { x: 28, y: 40 }, { x: 46, y: 28 }, { x: 68, y: 34 }, { x: 86, y: 40 }, { x: 86, y: 25 }, P.palash], 6.25, 2.0)
        // the date board goes up: it rises off it, crosses the sky above, and comes down on the LEFT of the RSVP board
        // (it stays in the air, circling over the garden, while dusk falls and the lights come on)
        fly([P.palash, HOP[0], { x: 40, y: 30 }, { x: 24, y: 42 }, { x: 44, y: 50 }, { x: 68, y: 44 }, { x: 76, y: 30 }, HOP[1], HOP[2], P.board], DATE_UP - 0.05, F2 + 0.5 - (DATE_UP - 0.05))
      }

      // three curtains, one after another, each parting to the LEFT and RIGHT: we push through the near one, then the
      // mid one, then the far one, and the forest is there. EVERY composed plant moves on its own (the couple's call:
      // two sheets sliding like panels looked unnatural): it goes out to the side its root is on, swinging about its
      // root as if pushed aside, each with its own seeded timing, drift and swing. The bed of leaves under them
      // follows in three bands per side. Whole pieces only: nothing fades or scales. All gone by 0.95.
      gsap.utils.toArray<HTMLElement>('.jp').forEach((el, i) => {
        const lf = MOVING[i], R = rnd(i * 97 + 13), side = lf.x < 50 ? -1 : 1
        gsap.set(el, { rotation: lf.r, scaleX: lf.m ? -1 : 1 })
        const inFrame = (side < 0 ? lf.x : 100 - lf.x) / 100 // how far inside the frame its root stands
        const reach = () => (inFrame + (lf.w / 100) * LEAF_A[lf.n] + 0.2) * sw() // root + its whole length + a margin
        const drift = (R() - 0.5) * 0.16
        const swing = (lf.hang ? -side : side) * (10 + R() * 16)
        tl!.fromTo(el, { x: 0, y: 0, rotation: lf.r }, { x: () => side * reach(), y: () => drift * sh(), rotation: lf.r + swing, duration: 0.18 + R() * 0.05, ease: 'power2.in', immediateRender: false }, 0.02 + (lf.d - 1) * 0.3 + R() * 0.08)
      })
      ;([1, 2, 3] as const).forEach((d) => [-1, 1].forEach((side) => [0, 1, 2].forEach((b) => {
        tl!.fromTo(`.jbed.d${d}.${side < 0 ? 'L' : 'R'}.b${b}`, { x: 0, y: 0, rotation: 0 },
          { x: () => side * 1.4 * sw(), y: () => (b - 1) * 0.05 * sh(), rotation: side * (4 + b * 3), duration: 0.2, ease: 'power2.in', immediateRender: false },
          0.07 + (d - 1) * 0.3 + b * 0.02 + (side > 0 ? 0.02 : 0))
      })))
      // the fireflies among the leaves go out as the last curtain opens (light may fade)
      tl.to('.jfly', { opacity: 0, duration: 0.3 }, 0.6)
      tl.set('.jungle', { autoAlpha: 0 }, 0.95)
      render()

      // ---- THE GATES · how the scroll drives the story (the couple: "hold when we want to hold the screen, in no case
      // one scroll should shuffle through the entire series; people's scroll can be different").
      // Scrolling is left completely native (no touch or wheel hijacking, so every phone, webview, trackpad and keyboard
      // behaves as it always does). The stage is pinned, so the scroll position itself is invisible: only the timeline
      // shows. `drive()` eases the timeline towards where the scroll is (the same 1s expo lag the old `scrub: 1` had),
      // CLAMPED between the beats on either side of where the guest last came to rest [lo, hi]. However hard a flick
      // or wheel burst is, the story stops at the next beat and holds there. When the scrolling has stopped
      // (`settle()`), the real scroll position is quietly put back where the story is (invisible: pinned), a rest close
      // to a beat glides onto it, and the gates move on, so the next gesture carries on from there.
      const tlNow = tl
      const head = { s: 0 } // where the story is, in story time; the timeline is always at toT(head.s)
      const setS = (v: number, suppress = false) => { head.s = v; tlNow.time(toT(v), suppress) }
      const AFTER = BEATS.length === 6 ? [0, 0.2, 0.15, 0.5, 0.4, 0] : [0, 0.2, 0.15, 0.4, 0] // the still stretch after each beat: resting anywhere in it counts as resting on the beat
      const CATCH = 0.35 // resting this close before a beat glides onto it
      // `?gates=0`: no beats, the story simply follows the scroll (to review on a phone where the gates misbehave).
      // `?debug=1`: a small readout of the scroll driver's state, for diagnosing a real phone from a screenshot.
      // (the couple, 17 Nov: "the scroll keeps changing… like one single scroll, not resetting") The default is now
      // SMOOTH: no beats and no re-anchoring, the page's scroll position is never touched. The story chases the scroll
      // with the same soft lag, but no faster than VMAX story-units a second, so a hard flick still plays every scene
      // at a watchable pace instead of skipping them. `?gates=1` brings the old stopping-points back for comparison.
      const SMOOTH = !/[?&]gates=1\b/.test(location.search), VMAX = 2.2
      const NOGATES = SMOOTH || /[?&]gates=0\b/.test(location.search), DEBUG = /[?&]debug=1\b/.test(location.search)
      const n = { scroll: 0, down: 0, up: 0, settle: 0, open: 0, sync: 0, err: '' }
      let lo = 0, hi = BEATS[1], free = false, touching = false
      let st: ScrollTrigger | undefined // created below, once drive() exists
      const typing = () => { const a = document.activeElement; return !!a && !!root.current?.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) }
      const at = () => (st ? st.progress * US : 0) // where the scroll is, in timeline units (ScrollTrigger calls onUpdate once while it is still being created)
      const show = (t: number) => { // side effects that follow the STORY's position, not the raw scroll
        root.current?.classList.toggle('board-live', t > 0.985 * US)
        dispatchEvent(new CustomEvent('v2progress', { detail: t / US }))
      }
      const drive = (now = false) => {
        if (typing()) return // the keyboard opening or a field scrolling into view must not move the story
        // a page opened in a tab that is not showing yet has no height: the pinned stretch is then 0 long, its progress
        // reads as 1, and the story jumped to the RSVP (and the later refresh scrolled the page there). Wait for a real size.
        if (!st || st.end - st.start < 10) return
        const want = free || NOGATES ? at() : gsap.utils.clamp(lo, hi, at())
        if (now) { gsap.killTweensOf(head); setS(want) } else if (!SMOOTH) gsap.to(head, { s: want, duration: 1, ease: 'expo', overwrite: true, onUpdate: () => { tlNow.time(toT(head.s)) } })
        show(SMOOTH && !now ? head.s : want) // SMOOTH: side effects follow the story, which may still be catching up
      }
      st = ScrollTrigger.create({ id: 'v2', trigger: root.current, start: 'top top', end: () => '+=' + innerHeight * 0.8915 * US, pin: true, onUpdate: () => drive() })
      const gates = (t: number) => { lo = Math.max(0, ...BEATS.filter((b) => b < t - 0.001)); hi = Math.min(US, ...BEATS.filter((b) => b > t + 0.001)) }
      const settle = () => {
        n.settle++
        if (NOGATES) return
        if (touching) return rest() // a finger is still down: wait for it to lift
        if (typing()) return
        let t = free ? at() : gsap.utils.clamp(lo, hi, at())
        free = false
        const i = BEATS.findIndex((b, k) => t >= b - (k ? CATCH : 0) && t <= b + AFTER[k])
        if (i >= 0) t = BEATS[i]
        gates(t)
        sync(t)
      }
      // put the real scroll position where the story is (invisible: the stage is pinned). It fires a scroll event, so
      // drive() and one more (idle) settle() follow.
      const sync = (t: number) => { n.sync++; if (!st) return; const y = st.start + (t / US) * (st.end - st.start); if (Math.abs(st.scroll() - y) > 2) st.scroll(y) }
      // while a guest types, the browser may scroll the page to bring the field above the keyboard; the story ignores
      // that (typing()), and when the field is left the scroll is put back, so the RSVP board never slides away
      const leftField = () => sync(head.s)
      root.current!.addEventListener('focusout', leftField)
      // "the scrolling has stopped" = no scroll event for 0.2s (a plain timer, not GSAP's ticker, which browsers throttle)
      let timer = 0
      const rest = () => { clearTimeout(timer); timer = window.setTimeout(settle, 200) }
      const onScroll = () => { n.scroll++; rest() }
      // A gate must also open for a guest who never stops: on a real phone people swipe again while the page is still
      // gliding, so "the scrolling has stopped" may not happen for a long time and the story sat at the first beat
      // (the couple's phone, 17 Nov). So: once the story has ARRIVED at the beat it is held at and stayed there for a
      // moment (HOLD ms: long enough to read that it is a beat), the next NEW gesture (a new touch, a new wheel burst, a
      // key) opens the gate at once and re-anchors the scroll there, so whatever distance had piled up is thrown away.
      const HOLD = 350
      let arrived = 0, gateAt: number | null = null, lastWheel = 0
      const watch = window.setInterval(() => {
        const a = at(), bound = a > hi + 0.001 ? hi : a < lo - 0.001 ? lo : null
        if (bound !== null && Math.abs(head.s - bound) < 0.03) { arrived ||= performance.now(); if (performance.now() - arrived > HOLD) gateAt = bound }
        else { arrived = 0; gateAt = null }
      }, 80)
      const open = () => { if (SMOOTH || gateAt === null || free || typing()) return; const t = gateAt; gateAt = null; arrived = 0; n.open++; gates(t); sync(t) }
      const down = () => { n.down++; touching = true; open() }
      const up = () => { n.up++; touching = false; rest() }
      const onWheel = () => { const n = performance.now(); if (n - lastWheel > 150) open(); lastWheel = n }
      addEventListener('wheel', onWheel, { passive: true })
      addEventListener('keydown', open)
      const setFree = () => { free = true } // the RSVP button's jump to the end goes straight through the gates
      addEventListener('scroll', onScroll, { passive: true })
      addEventListener('touchstart', down, { passive: true })
      addEventListener('touchend', up, { passive: true })
      addEventListener('touchcancel', up, { passive: true })
      addEventListener('v2free', setFree)
      let dbg: HTMLElement | null = null, dbgTimer = 0
      if (DEBUG) {
        dbg = document.body.appendChild(Object.assign(document.createElement('pre'), { style: 'position:fixed;z-index:999;left:4px;top:4px;margin:0;padding:6px 8px;font:11px/1.35 ui-monospace,Menlo,monospace;color:#fff;background:rgba(0,0,0,.72);border-radius:6px;pointer-events:none;white-space:pre' }))
        addEventListener('error', (e) => { n.err = String(e.message).slice(0, 60) })
        dbgTimer = window.setInterval(() => {
          dbg!.textContent = `story ${head.s.toFixed(2)}  scroll ${at().toFixed(2)}\ngate ${lo}-${hi}  ready ${gateAt ?? '-'}\ny ${Math.round(scrollY)} / ${Math.round(document.documentElement.scrollHeight - innerHeight)}  h ${innerHeight}\npin ${st ? Math.round(st.start) + '-' + Math.round(st.end) : '-'}\ntouch ${touching ? 'DOWN' : 'up'}  typing ${typing() ? 'YES' : 'no'}  free ${free ? 'YES' : 'no'}\nscroll ${n.scroll} down ${n.down} up ${n.up}\nsettle ${n.settle} open ${n.open} sync ${n.sync}\n${n.err}`
        }, 150)
      }
      // SMOOTH: every frame, move the story towards where the scroll is (eased, speed-capped). The RSVP button's jump
      // (free) is allowed to run faster.
      const chase = (_t: number, dt: number) => {
        if (!SMOOTH || typing() || !st || st.end - st.start < 10) return
        const diff = at() - head.s
        if (Math.abs(diff) < 0.0004) { if (free) free = false; return }
        const cap = (free ? VMAX * 5 : VMAX) * Math.min(dt, 100) / 1000
        setS(head.s + gsap.utils.clamp(-cap, cap, diff * (1 - Math.exp(-Math.min(dt, 100) / 260))))
        show(head.s)
      }
      gsap.ticker.add(chase)
      const rootEl = root.current!
      // a refresh (resize, rotate): the tweens' function-based values must be worked out again at the new size, as
      // `invalidateOnRefresh` did when ScrollTrigger owned the timeline (same steps as ScrollTrigger's own)
      let keep = 0
      const before = () => {
        keep = head.s; gsap.killTweensOf(head)
        tlNow.revert({ kill: false }).invalidate()
        tlNow.getChildren(true, true, false).forEach((c) => c.vars.immediateRender && c.render(0, true, true))
      }
      const after = () => { if (keep < 2.15) { bird.x = P.forest.x; bird.y = P.forest.y } /* not flown yet: sit on the forest branch as now measured */; if (st && st.scroll() < 2 && !typing()) keep = Math.min(keep, 0) /* still at the very top: stay on the first screen */; gsap.killTweensOf(head); setS(keep, true); render(); gates(keep); if (!SMOOTH) sync(keep) } // the story stays where it was; the scroll is moved to match the new length
      ScrollTrigger.addEventListener('refreshInit', before)
      ScrollTrigger.addEventListener('refresh', after)
      // `ignoreMobileResize` skips height-only window resizes (toolbars sliding), but on a phone the stage often gets its
      // real height only AFTER the first measure (17 Nov: every distance worked out from the stage's height, such as how
      // far the next scene waits below, was computed from a height of ~0 and stayed wrong, so the hills were covered).
      // The stage is sized in lvh, which toolbars do not change, so re-measure whenever the stage itself changes size.
      let roT = 0
      const ro = new ResizeObserver(() => { clearTimeout(roT); roT = window.setTimeout(() => ScrollTrigger.refresh(), 120) })
      ro.observe(stage.current!)
      // a reload always opens the invitation from the top (a restored scroll position would otherwise be stopped at the first gate)
      history.scrollRestoration = 'manual'
      free = true; drive(true); free = false; gates(head.s)
      if (import.meta.env.DEV) {
        // preview aid: v2go(t) puts the story at t at once, through the gates (the old `st.animation` helpers still read the timeline)
        Object.assign(st, { animation: tlNow })
        Object.assign(window, { v2tl: tlNow, v2go: (t: number) => { t = toS(t); /* v2go takes TIMELINE time, as before */ free = true; st.scroll(st.start + (t / US) * (st.end - st.start)); ScrollTrigger.update(); drive(true); free = false; gates(t); return tlNow.time() }, v2gates: () => [lo, hi] })
      }

      // THE ENDING (the couple, 17 Nov night) · once a response is sent the hornbill leaves the board: after a "yes" it
      // flies down and sits on the jeep's bonnet again; after a "no" it flies away, out of the picture (the one time it
      // may leave the screen). "Send another response" (null) brings it back to the board. Scrolling back hands it
      // to the story again.
      let ending: gsap.core.Timeline | null = null
      const onRsvp = (e: Event) => {
        const a = (e as CustomEvent<'yes' | 'no' | null>).detail, st = stage.current
        if (!st || ROCK) return
        const s = st.getBoundingClientRect(), j = st.querySelector('.jeep2')!.getBoundingClientRect(), from = { x: bird.x, y: bird.y }
        const bonnet = { x: ((j.left - s.left + 0.86 * j.width) / s.width) * 100, y: ((j.top - s.top + 0.37 * j.height) / s.height) * 100 + 8 * (s.width / s.height) }
        const path = a === 'yes' ? [from, { x: 34, y: from.y + 10 }, { x: 62, y: bonnet.y - 22 }, { x: bonnet.x + 4, y: bonnet.y - 10 }, bonnet]
          : a === 'no' ? [from, { x: 38, y: from.y + 5 }, { x: 78, y: from.y - 2 }, { x: 135, y: from.y - 10 }]
          : [from, { x: 50, y: P.board.y + 14 }, P.board]
        ending?.kill()
        ending = gsap.timeline({ onUpdate: render })
          .set(bird, { perched: 0 })
          .to(bird, { motionPath: { path, curviness: 1.25 }, duration: a === 'yes' ? 2.4 : 2, ease: 'sine.inOut' })
          .set(bird, { perched: a === 'no' ? 0 : 1 })
      }
      addEventListener('v2rsvp', onRsvp)

      return () => {
        removeEventListener('v2rsvp', onRsvp); ending?.kill()
        alive = false; gsap.ticker.remove(chase); clearTimeout(timer); clearTimeout(roT); ro.disconnect(); clearInterval(watch); clearInterval(dbgTimer); dbg?.remove(); removeEventListener('wheel', onWheel); removeEventListener('keydown', open)
        ScrollTrigger.removeEventListener('refreshInit', place); ScrollTrigger.removeEventListener('refreshInit', before); ScrollTrigger.removeEventListener('refresh', after)
        removeEventListener('scroll', onScroll); removeEventListener('touchstart', down); removeEventListener('touchend', up); removeEventListener('touchcancel', up); removeEventListener('v2free', setFree); rootEl.removeEventListener('focusout', leftField)
      }
    })
  }, { scope: root })

  // marigold and rose petals over the water after a "yes"
  const shower = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !stage.current) return
    const st = stage.current, { width, height } = st.getBoundingClientRect()
    for (let i = 0; i < 22; i++) {
      const img = document.createElement('img'); img.src = PETALS[i % PETALS.length]; img.alt = ''; img.className = 'petal'; st.appendChild(img)
      const x0 = Math.random() * width
      gsap.fromTo(img, { x: x0, y: -60 - Math.random() * height * 0.3, rotation: Math.random() * 360 },
        { x: x0 + (Math.random() - 0.5) * 120, y: height * (0.75 + Math.random() * 0.2), rotation: `+=${200 + Math.random() * 300}`, duration: 3 + Math.random() * 2.5, ease: 'sine.in', delay: Math.random() * 0.8 })
    }
  }

  const fam = content.families
  return (
    <section ref={root} className="v2" aria-label="Shreya and Akshay are getting married">
      <div ref={stage} className={`stage b-${BOARD}`}>
        {/* the far bank (sky, cottages, river) sits underneath and is revealed as the forest opens */}
        <div className="scene sB">
          {/* the riverside is ONE whole painting (like the forest), sky left open; only the jeep is separate */}
          {/* (fetchPriority low on everything that is not on the first screen: the page loads every image at once, and the
              opening leaves and the forest should win the connection) */}
          {/* the resort: ONE whole painting again, standing behind the riverside; its own jeep is parked by the gate */}
          <div className="resort">
            <div className="art">
              <img src="/v2/resort/scene.webp" alt="" fetchPriority="low" />
              {RWINDOWS.map(([x, y, w, h], i) => <i key={i} className="rwin" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }} />)}
              {RLAMPS.map(([x, y], i) => <i key={i} className="fly rlamp" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-(i * 0.83) % 6}s` }} />)}
              <img className="jeep2" src="/story/jeep.webp" alt="Shreya and Akshay's jeep, parked at the gate" fetchPriority="low" />
            </div>
          </div>
          <div className="riverside">
            {/* (no lights here any more: dusk now falls at the resort, after this painting has sunk away) */}
            <div className="art">
              <img src="/v2/riverside/scene.webp" alt="" />
              <img className="jeep" src="/story/jeep.webp" alt="Shreya and Akshay's jeep on the riverside road" fetchPriority="low" />
            </div>
          </div>

          <div className="palash-grp">
            <img className="palash" src="/v2/palash.webp" alt="" fetchPriority="low" />
            <div className="sign-turn">
              <div className="fam-face plank plank-fam">
                {fam.map((f) => (
                  <p key={f.who} className="plank-line"><b>{f.who}</b> <i>{f.relation}</i><span>{f.parents}</span></p>
                ))}
              </div>
              <div className="date-face plank plank-date">
                <p className="foil date-d">16 &amp; 17</p>
                <p className="date-m">February 2027</p>
                <p className="date-p">{content.place}</p>
                <details className="cal">
                  <summary>Add to calendar</summary>
                  <div className="cal-opts">
                    <a href={googleCal} target="_blank" rel="noopener">Google</a>
                    <a href="/save-the-date.ics" download="Shreya-Akshay-Save-the-Date.ics">Apple · Outlook</a>
                  </div>
                </details>
              </div>
              <div className="board plank plank-board" id="rsvp"><RsvpBoard onSent={(a) => { if (a === 'yes') shower(); dispatchEvent(new CustomEvent('v2rsvp', { detail: a })) }} /></div>
            </div>
          </div>
          <div className="tint" aria-hidden="true" />
          <div className="dusk" aria-hidden="true" />
        </div>

        {/* the forest */}
        <div className="scene sA">
          <div className="layer L-sky"><img src="/hero/sky.webp" alt="" /></div>
          <div className="layer L-hills"><img className="pop" src="/hero/hills.webp" alt="" /></div>
          <div className="layer L-forest">
            <img className="pop" src="/hero/forest.webp" alt="" />
            <img className="deer deer-doe" src="/v2/chital-doe.webp" alt="" />
            <img className="deer deer-stag" src="/v2/chital-stag.webp" alt="" />
          </div>
          <div className="layer L-flies" aria-hidden="true">{FLIES.map((f, i) => <i key={i} className="fly" style={{ left: f.left, top: f.top, animationDelay: f.delay }} />)}</div>
          <div className="layer L-grass"><img className="pop" src="/hero/grass.webp" alt="" /></div>
          <img className="branchA" src="/v2/branch-r.webp" alt="" />
        </div>

        {/* the names are lettered on two long, light clouds that drift together BEHIND the trees: "&amp; Akshay" between the
            forest and the far trees standing behind it, "Shreya" higher up behind both tree lines (z-order only, see v2.css) */}
        <h1 className="names" aria-label={`${content.couple.bride} & ${content.couple.groom} ${content.announce}`}>
          <span className="cloud cloud-a" aria-hidden="true">
            <img src="/v2/cloud-a.webp" alt="" />
            <span className="cl-name">{content.couple.bride}<span className="cl-amp">&amp;</span></span>
          </span>
          <span className="cloud cloud-b" aria-hidden="true">
            <img src="/v2/cloud-b.webp" alt="" />
            <span className="cl-name">{content.couple.groom}<span className="cl-sub">{content.announce}</span></span>
          </span>
        </h1>

        {/* the bushes in front of everything */}
        <div className="jungle">
          {([3, 2, 1] as const).map((dd) => (
            <Fragment key={dd}>
              {(['L', 'R'] as const).flatMap((sd) => [0, 1, 2].map((b) => (
                <div key={sd + b} className={`jbed d${dd} ${sd} b${b}`}>
                  {[...bed(dd), ...layerOf(dd).slice(0, -MOVERS)].filter((lf) => (lf.x < 50) === (sd === 'L') && band(lf) === b).map((lf, i) => (
                    <img key={i} className={`jleaf${lf.hang ? ' hang' : ''}`} src={leafSrc(lf)} alt="" style={{ left: `${lf.x - lf.w / 2}%`, width: `${lf.w}%`, ...(lf.hang ? { top: `${lf.y}%` } : { bottom: `${100 - lf.y}%` }), transform: `rotate(${lf.r}deg) scaleX(${lf.m ? -1 : 1})` }} />
                  ))}
                </div>
              )))}
              {layerOf(dd).slice(-MOVERS).map((lf, i) => (
                <img key={i} className={`jleaf jp d${dd}${lf.hang ? ' hang' : ''}`} src={leafSrc(lf)} alt="" style={{ left: `${lf.x - lf.w / 2}%`, width: `${lf.w}%`, ...(lf.hang ? { top: `${lf.y}%` } : { bottom: `${100 - lf.y}%` }) }} />
              ))}
            </Fragment>
          ))}
          {JFLIES.map((f, i) => <i key={i} className="fly jfly" aria-hidden="true" style={{ left: f.left, top: f.top, animationDelay: f.delay }} />)}
          <div className="std"><p className="std-t">{content.opening}</p></div>
          {/* the same words again, painted plainly on top: how solid the white is (--std-white in v2.css) */}
          <div className="std std-top" aria-hidden="true"><p className="std-t">{content.opening}</p></div>
        </div>
        <p className="hint" aria-hidden="true">scroll</p>

        {/* the hornbill */}
        <div className="guide" aria-hidden="true">
          <div className="tilt"><div className="flip">
            <div className="fly-pose">
              <img className="wb" src="/hornbill/wing-back.webp" alt="" />
              <img src="/hornbill/body.webp" alt="" />
              <img className="wf" src="/hornbill/wing-front.webp" alt="" />
            </div>
            <img className="perch-pose" src="/v2/hornbill-perch.webp" alt="" />
            <img className="carry" src="/v2/scroll.webp" alt="" fetchPriority="low" />
          </div></div>
        </div>
      </div>
      <div className="loader" aria-hidden="true"><span>S <em>&amp;</em> A</span></div>
    </section>
  )
}
