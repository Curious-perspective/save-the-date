import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '../index.css'
import StoryV2 from './StoryV2'

function App() {
  // floating RSVP button; hides once the RSVP board is up
  const [atRsvp, setAtRsvp] = useState(false)
  useEffect(() => {
    // the story's own position (it can lag behind the raw scroll: see "the gates" in StoryV2)
    const onProgress = (e: Event) => setAtRsvp((e as CustomEvent<number>).detail > 0.9)
    addEventListener('v2progress', onProgress)
    return () => removeEventListener('v2progress', onProgress)
  }, [])
  const go = (e: React.MouseEvent) => {
    e.preventDefault()
    const st = ScrollTrigger.getById('v2')
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
    dispatchEvent(new Event('v2free')) // straight to the end, through the gates
    if (st) window.scrollTo({ top: st.end, behavior: smooth ? 'smooth' : 'auto' })
    else document.getElementById('rsvp')?.scrollIntoView()
  }
  return (
    <main>
      <StoryV2 />
      <a className={`rsvp-fab${atRsvp ? ' is-hidden' : ''}`} href="#rsvp" aria-hidden={atRsvp} tabIndex={atRsvp ? -1 : 0} onClick={go}>RSVP</a>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
