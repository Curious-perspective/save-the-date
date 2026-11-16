import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import StoryV2 from './StoryV2'

// (the couple, 17 Nov night: no floating RSVP button; the story ends on the RSVP board)
// MUSIC (the couple, 17 Nov night): the first 33 s of their chosen track on a loop, quiet. Browsers only allow sound
// after a tap, so it starts from this button; nothing is downloaded until then. It stops while the page is hidden.
function Music() {
  const [on, setOn] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const toggle = () => {
    if (!audio.current) { audio.current = new Audio(import.meta.env.BASE_URL + 'v2/music.mp3'); audio.current.loop = true; audio.current.volume = 0.45 }
    if (on) audio.current.pause(); else audio.current.play().catch(() => setOn(false))
    setOn(!on)
  }
  useEffect(() => {
    const vis = () => { if (!audio.current || !on) return; if (document.hidden) audio.current.pause(); else audio.current.play().catch(() => {}) }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [on])
  return <button type="button" className={`music${on ? ' is-on' : ''}`} aria-pressed={on} aria-label={on ? 'Turn the music off' : 'Play music'} onClick={toggle}><span aria-hidden="true">♪</span>{on ? '' : ' Tap for music'}</button>
}

const App = () => <main><StoryV2 /><Music /></main>

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
