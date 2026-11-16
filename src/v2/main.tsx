import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import StoryV2 from './StoryV2'

// (the couple, 17 Nov night: no floating RSVP button; the story ends on the RSVP board)
// MUSIC (the couple, 17 Nov night): the first 33 s of their chosen track on a loop, quiet. Browsers only allow sound
// after a tap, so it starts from this button; nothing is downloaded until then. It stops while the page is hidden.
function Music() {
  const [on, setOn] = useState(false)
  const audio = useRef<HTMLAudioElement[] | null>(null) // the music loop and, under it, forest birdsong (60 s loop), both all the way through
  const toggle = () => {
    if (!audio.current) audio.current = ['music', 'birds'].map((f) => { const a = new Audio(`${import.meta.env.BASE_URL}v2/${f}.mp3`); a.loop = true; return a }) // the balance is baked into the files (iPhones ignore `volume`)
    for (const a of audio.current) { if (on) a.pause(); else a.play().catch(() => setOn(false)) }
    setOn(!on)
  }
  useEffect(() => {
    const vis = () => { if (!audio.current || !on) return; for (const a of audio.current) { if (document.hidden) a.pause(); else a.play().catch(() => {}) } }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [on])
  return <button type="button" className={`music${on ? ' is-on' : ''}`} aria-pressed={on} aria-label={on ? 'Turn the music off' : 'Play music'} onClick={toggle}><span aria-hidden="true">♪</span>{on ? '' : ' Tap for music'}</button>
}

const App = () => <main><StoryV2 /><Music /></main>

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
