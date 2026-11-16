import { useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Story from './Story'

export default function App() {
  // the floating RSVP button hides once the RSVP card is on screen
  const [atRsvp, setAtRsvp] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      const st = ScrollTrigger.getById('story')
      setAtRsvp(st ? st.progress > 0.93 : (document.getElementById('rsvp')?.getBoundingClientRect().top ?? 1e9) < innerHeight * 0.5)
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  const goToRsvp = (e: React.MouseEvent) => {
    e.preventDefault()
    const st = ScrollTrigger.getById('story')
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
    if (st) window.scrollTo({ top: st.end, behavior: smooth ? 'smooth' : 'auto' })
    else document.getElementById('rsvp')?.scrollIntoView({ behavior: 'auto' })
  }

  return (
    <main>
      <Story />
      <a className={`rsvp-fab${atRsvp ? ' is-hidden' : ''}`} href="#rsvp" aria-hidden={atRsvp} tabIndex={atRsvp ? -1 : 0} onClick={goToRsvp}>RSVP</a>
    </main>
  )
}
