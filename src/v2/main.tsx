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

// THE NUDGE: a small arrow at the bottom when the guest has stopped scrolling for 4 s part-way through the story.
// (`v2progress` only comes from the animated story, so the still version never shows it.)
function Nudge() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    let p = 0, timer = 0
    const arm = () => { setShow(false); clearTimeout(timer); timer = window.setTimeout(() => setShow(p > 0.02 && p < 0.985), 4000) }
    const prog = (e: Event) => { p = (e as CustomEvent<number>).detail }
    const moves = ['scroll', 'wheel', 'touchmove', 'keydown'] as const
    moves.forEach((m) => addEventListener(m, arm, { passive: true }))
    addEventListener('v2progress', prog); arm()
    return () => { clearTimeout(timer); moves.forEach((m) => removeEventListener(m, arm)); removeEventListener('v2progress', prog) }
  }, [])
  return <i className={`nudge${show ? ' is-on' : ''}`} aria-hidden="true" />
}

const App = () => <main><StoryV2 /><Music /><Nudge /></main>

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
