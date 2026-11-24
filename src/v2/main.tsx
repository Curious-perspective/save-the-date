import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import StoryV2 from './StoryV2'

// (the couple, 17 Nov night: no floating RSVP button; the story ends on the RSVP board)
// MUSIC (the couple, 17 Nov night): the first 33 s of their chosen track on a loop with forest birdsong under it, all
// the way through. It starts BY ITSELF: we try at once, and because phones refuse sound until the guest has touched
// the page, we try again on every touch, tap or key until it plays. The button then only turns it off (and on again).
// The balance is baked into the files (iPhones ignore `volume`). It stops while the page is hidden.
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const
function Music() {
  const [on, setOn] = useState(false)
  const audio = useRef<HTMLAudioElement[]>([])
  const wanted = useRef(true) // false once the guest has turned it off themselves
  const play = () => Promise.all(audio.current.map((a) => a.play())).then(() => setOn(true), () => { audio.current.forEach((a) => a.pause()); setOn(false) })
  useEffect(() => {
    audio.current = ['music', 'birds'].map((f) => { const a = new Audio(`${import.meta.env.BASE_URL}v2/${f}.mp3`); a.loop = true; return a })
    const tryIt = () => { if (wanted.current && audio.current[0].paused && !document.hidden) play() }
    const vis = () => { if (document.hidden) audio.current.forEach((a) => a.pause()); else tryIt() }
    tryIt()
    GESTURES.forEach((g) => addEventListener(g, tryIt, { passive: true }))
    document.addEventListener('visibilitychange', vis)
    return () => { GESTURES.forEach((g) => removeEventListener(g, tryIt)); document.removeEventListener('visibilitychange', vis); audio.current.forEach((a) => a.pause()) }
  }, [])
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    wanted.current = !on
    if (on) { audio.current.forEach((a) => a.pause()); setOn(false) } else play()
  }
  return <button type="button" className={`music${on ? ' is-on' : ''}`} aria-pressed={on} aria-label={on ? 'Turn the music off' : 'Play music'} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={toggle}><span aria-hidden="true">♪</span>{on ? '' : wanted.current ? ' Tap for music' : ' Music off'}</button>
}

// THE NUDGE: a small arrow at the bottom when the guest has stopped part-way through the story.
// Swipe version (what guests get): an arrow pointing UP with "swipe up" under it, 2.5 s after a scene has finished
// playing, on every screen from the first until the RSVP board is down. Scroll version (`?swipe=0`): the old bare
// down arrow after 4 s. (`v2progress` only comes from the animated story, so the still version never shows it.)
const SWIPE = !/[?&]swipe=0\b/.test(location.search)
function Nudge() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    let p = 0, timer = 0, live = !SWIPE // swipe: only once the animated story has said it is at rest (the still version never does)
    const ok = () => live && (SWIPE || p > 0.02) && p < 0.985
    // swipe version (the couple, 23 Nov: "the moment the animation gets over, not wait"): the story says when a scene
    // has finished (`v2rest`) and the arrow shows at once; while it plays, the arrow is hidden. A gesture that did
    // not start a scene (too short) only hides it for a moment.
    const arm = () => { setShow(false); clearTimeout(timer); timer = window.setTimeout(() => setShow(ok()), SWIPE ? 600 : 4000) }
    const prog = (e: Event) => { const v = (e as CustomEvent<number>).detail; if (Math.abs(v - p) > 1e-5) { p = v; if (SWIPE) { setShow(false); clearTimeout(timer) } else arm() } }
    const rest = () => { live = true; clearTimeout(timer); setShow(ok()) }
    const moves = ['scroll', 'wheel', 'touchmove', 'keydown'] as const
    moves.forEach((m) => addEventListener(m, arm, { passive: true }))
    addEventListener('v2progress', prog); addEventListener('v2rest', rest)
    if (!SWIPE) arm()
    return () => { clearTimeout(timer); moves.forEach((m) => removeEventListener(m, arm)); removeEventListener('v2progress', prog); removeEventListener('v2rest', rest) }
  }, [])
  return <p className={`nudge${SWIPE ? '' : ' down'}${show ? ' is-on' : ''}`} aria-hidden="true"><i />{SWIPE && <span>swipe up</span>}</p>
}

const App = () => <main><StoryV2 /><Music /><Nudge /></main>

// DEV ONLY (24 Nov, temporary: remove once the iPhone keyboard is sorted): the phone reports what happens around an
// RSVP field to the dev server on the Mac (`/__log`, written to node_modules/.cache/phone.log). Nothing leaves the Wi-Fi.
if (import.meta.env.DEV) {
  const t0 = performance.now()
  const say = (m: string) => { try { navigator.sendBeacon('/__log', `${Math.round(performance.now() - t0)} ${m}`) } catch { /* ignore */ } }
  const name = (e: EventTarget | null) => { const el = e as Element | null; return el?.tagName ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).split(' ')[0]}` : String(e) }
  say(`open ${navigator.userAgent} inner ${innerWidth}x${innerHeight} vv ${Math.round(visualViewport?.height ?? 0)}`)
  for (const ev of ['touchstart', 'touchend', 'click', 'focusin', 'focusout'] as const) addEventListener(ev, (e) => {
    const hit = 'changedTouches' in e ? (e as TouchEvent).changedTouches[0] : (e as MouseEvent)
    const under = 'clientX' in hit ? name(document.elementFromPoint(hit.clientX, hit.clientY)) : ''
    say(`${ev} ${name(e.target)} under ${under} active ${name(document.activeElement)} prevented ${e.defaultPrevented}`)
    if (ev === 'focusin') for (const ms of [100, 500, 1500]) setTimeout(() => say(`+${ms} active ${name(document.activeElement)} vv ${Math.round(visualViewport?.height ?? 0)} inner ${innerHeight} scrollY ${Math.round(scrollY)}`), ms)
  }, true)
  addEventListener('resize', () => say(`resize inner ${innerWidth}x${innerHeight}`))
  visualViewport?.addEventListener('resize', () => say(`vv ${Math.round(visualViewport!.height)}`))
  addEventListener('error', (e) => say(`error ${e.message}`))
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
