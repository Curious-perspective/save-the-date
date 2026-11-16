import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { content } from './content'
import RsvpCard from './RsvpCard'
import './story.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)
// ponytail: dev-only handles so the preview browser can drive and inspect the story
if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger })

// The Road to Corbett: one pinned stage, four scenes, one scrubbed timeline measured in "units".
// 0–1 dawn gate · 1–3 the journey · 3–5.4 arrival at the venue · 5.4–7 dusk + RSVP
const U = 7
const FLIES = Array.from({ length: 14 }, (_, i) => ({ left: `${8 + ((i * 53) % 84)}%`, top: `${48 + ((i * 29) % 40)}%`, delay: `${-(i * 0.7) % 6}s` }))
const DUSK_FLIES = Array.from({ length: 12 }, (_, i) => ({ left: `${6 + ((i * 37) % 88)}%`, top: `${56 + ((i * 23) % 30)}%`, delay: `${-(i * 0.9) % 6}s` }))
const DIYAS = [[9, 88], [21, 85], [33, 87], [46, 84], [59, 87], [72, 85], [85, 88]]
const PETALS = Array.from({ length: 13 }, (_, i) => `/story/petals/p${String(i + 1).padStart(2, '0')}.webp`)

// Where the hornbill is at each moment: a perch (an element it lands on) or an open-sky waypoint (it keeps flying).
type Stop = { from: number; perch?: string; at?: [number, number] }
const STOPS: Stop[] = [
  { from: 0, perch: 'arch' },
  { from: 0.22, at: [70, 20] },
  { from: 1.95, perch: 'jeep' },
  { from: 2.6, at: [28, 17] },
  { from: 4.35, perch: 'date' },
  { from: 5.2, at: [66, 30] },
  { from: 6.55, perch: 'rsvp' },
]

const cal = content.calendar
const googleCal = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
  action: 'TEMPLATE', text: cal.title, dates: `${cal.start}/${cal.endExclusive}`, details: cal.details, location: cal.location,
}).toString()

const Corners = () => (
  <>
    <img className="corner corner-l" src="/story/flowers/corner-tl.webp" alt="" />
    <img className="corner corner-r" src="/story/flowers/corner-tr.webp" alt="" />
  </>
)

// Venue layers, shared by the golden-hour scene and its dusk twin so the place never changes.
const Venue = () => (
  <>
    <img className="bg" src="/story/venue.webp" alt="" />
    <img className="lotus" src="/story/flowers/lotus.webp" alt="" />
    <img className="kingfishers" src="/story/wild/kingfishers.webp" alt="" />
    <img className="peacock" src="/story/wild/peacock.webp" alt="" />
    <img className="curtain" src="/story/curtain.webp" alt="" />
    <img className="border border-venue" src="/story/border.webp" alt="" />
  </>
)

export default function Story() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const guide = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const s1imgs = gsap.utils.toArray<HTMLImageElement>('.s1 img', root.current)
      const ready = Promise.all(s1imgs.map((img) => img.decode().catch(() => undefined)))

      // ---- intro: the paper diorama stands up like a pop-up book
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      intro
        .to('.loader', { autoAlpha: 0, duration: 0.7 })
        .from('.L-sky img', { scale: 1.15, duration: 2.6 }, 0)
        .from('.pop', { rotationX: 82, yPercent: 6, autoAlpha: 0, duration: 1.4, ease: 'back.out(1.25)', stagger: 0.18 }, 0.25)
        .from('.hero-k, .hero-names > *', { y: 26, autoAlpha: 0, duration: 1.2, stagger: 0.12 }, 1.05)
        .from('.L-flies .fly', { autoAlpha: 0, duration: 1.2, stagger: 0.06 }, 1.3)
        .from('.guide', { autoAlpha: 0, y: -30, duration: 0.9 }, 1.5)
        .from('.hint', { autoAlpha: 0, duration: 0.8 }, 2.1)
      if (import.meta.env.DEV) Object.assign(window, { storyIntro: intro })
      let alive = true
      ready.then(() => { if (alive) intro.play() })

      // ---- the story
      gsap.set('.s2, .s3, .s4', { autoAlpha: 0 })
      let u = 0, dir = 1
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: 'story', trigger: root.current, start: 'top top', end: () => '+=' + innerHeight * 6.4, scrub: 0.7, pin: true,
          onUpdate: (self) => {
            u = self.progress * U
            if (self.direction) dir = self.direction
            root.current?.classList.toggle('rsvp-live', self.progress > 0.985)
          },
        },
      })
      tl
        // scene 1 · through the arch
        .fromTo('.hint', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.08, immediateRender: false }, 0)
        .to('.L-sky', { yPercent: -7, duration: 1 }, 0)
        .to('.L-hills', { yPercent: -2, scale: 1.12, duration: 1 }, 0)
        .to('.L-forest', { yPercent: 4, scale: 1.3, duration: 1 }, 0)
        .to('.L-flies', { yPercent: 10, scale: 1.4, duration: 1 }, 0)
        .to('.L-grass', { yPercent: 26, scale: 1.7, duration: 1 }, 0)
        .to('.L-frame', { scale: 2.8, duration: 0.75, ease: 'power1.in' }, 0)
        .to('.hero-title', { yPercent: -45, autoAlpha: 0, duration: 0.35 }, 0.05)
        // scene 2 · the forest melts into the trail, the jeep arrives
        .to('.s2', { autoAlpha: 1, duration: 0.45 }, 0.8)
        .fromTo('.s2 .bg', { scale: 1.18 }, { scale: 1, duration: 0.9, ease: 'power1.out' }, 0.8)
        .fromTo('.s2 .palash', { xPercent: -40, rotation: -10 }, { xPercent: 0, rotation: 0, duration: 0.7, ease: 'power2.out' }, 1.0)
        .fromTo('.jeep', { xPercent: 115 }, { xPercent: 0, duration: 0.9, ease: 'power2.out' }, 1.15)
        .fromTo('.card-fam', { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 1.75)
        .to('.deer', { rotation: -4, duration: 0.2, transformOrigin: '50% 100%' }, 1.9)
        .to('.deer', { xPercent: 90, yPercent: -30, rotation: 8, autoAlpha: 0, duration: 0.45, ease: 'power1.in', stagger: 0.08 }, 2.3)
        .to('.card-fam', { y: -30, autoAlpha: 0, duration: 0.3 }, 2.55)
        .to('.jeep', { xPercent: -135, duration: 0.6, ease: 'power2.in' }, 2.6)
        .fromTo('.s2 .border', { yPercent: 0 }, { yPercent: 18, duration: 2.2 }, 0.8)
        // scene 3 · the camera follows the jeep round the bend to the venue
        .to('.s2', { xPercent: 100, duration: 0.6, ease: 'power1.inOut' }, 3.0)
        .set('.s3', { autoAlpha: 1 }, 3.0)
        .fromTo('.s3', { xPercent: -100 }, { xPercent: 0, duration: 0.6, ease: 'power1.inOut', immediateRender: false }, 3.0)
        .fromTo('.s3 .bg', { scale: 1.12, xPercent: 4 }, { scale: 1, xPercent: 0, duration: 2.2, ease: 'power1.out' }, 3.0)
        .fromTo('.s3 .curtain', { yPercent: -100 }, { yPercent: 0, duration: 0.45, ease: 'back.out(1.6)' }, 3.55)
        .fromTo('.s3 .peacock', { xPercent: 30 }, { xPercent: 0, duration: 1.2 }, 3.5)
        .fromTo('.card-date', { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 4.0)
        .to('.card-date', { y: -30, autoAlpha: 0, duration: 0.3 }, 5.1)
        // scene 4 · dusk falls over the same garden, then the RSVP
        .to('.s4', { autoAlpha: 1, duration: 0.9 }, 5.3)
        .fromTo('.diya', { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, stagger: 0.08 }, 5.8)
        .fromTo('.s4 .fly', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, stagger: 0.03 }, 5.9)
        .fromTo('.parakeets', { xPercent: 160 }, { xPercent: -260, duration: 1.1 }, 5.5)
        .fromTo('.card-rsvp', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 6.3)
        .set({}, {}, U)

      // ---- the hornbill guide: lands on perches, flies between them, faces the way you scroll
      const el = guide.current!, st = stage.current!
      let pos: { x: number; y: number } | null = null, raf = 0, lastFlying = true
      const perchPoint = (name: string) => {
        const p = st.querySelector<HTMLElement>(`[data-perch="${name}"]`)
        if (!p) return null
        const r = p.getBoundingClientRect(), s = st.getBoundingClientRect()
        return { x: r.left - s.left, y: r.top - s.top }
      }
      const frame = () => {
        const s = st.getBoundingClientRect()
        const stop = [...STOPS].reverse().find((t) => u >= t.from)!
        const target = stop.perch ? perchPoint(stop.perch) : { x: (stop.at![0] / 100) * s.width, y: (stop.at![1] / 100) * s.height + Math.sin(performance.now() / 600) * 6 }
        if (target) {
          if (!pos) pos = { ...target }
          const dx = target.x - pos.x, dy = target.y - pos.y, dist = Math.hypot(dx, dy)
          pos.x += dx * 0.08; pos.y += dy * 0.08 - (dist > 60 ? Math.min(dist, 300) * 0.01 : 0)
          const flying = !stop.perch || dist > 10
          if (flying !== lastFlying) { el.classList.toggle('flying', flying); lastFlying = flying }
          const tilt = flying ? Math.max(-12, Math.min(12, dy * -0.05)) : 0
          // anchor = the feet (50% / 85% of the box); both poses face right in the box, so one flip turns the bird
          el.style.transform = `translate(${pos.x - el.offsetWidth * 0.5}px, ${pos.y - el.offsetHeight * 0.85}px) scaleX(${dir > 0 ? -1 : 1}) rotate(${tilt}deg)`
        }
        raf = requestAnimationFrame(frame)
      }
      el.classList.add('flying')
      raf = requestAnimationFrame(frame)

      return () => { alive = false; cancelAnimationFrame(raf) }
    })

    mm.add('(prefers-reduced-motion: reduce)', () => { gsap.set('.loader', { autoAlpha: 0 }) })
  }, { scope: root })

  // marigold and rose petals falling over the garden after a "yes"
  const shower = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !stage.current) return
    const st = stage.current, { width, height } = st.getBoundingClientRect()
    for (let i = 0; i < 22; i++) {
      const img = document.createElement('img')
      img.src = PETALS[i % PETALS.length]; img.alt = ''; img.className = 'petal'
      st.appendChild(img)
      const x0 = Math.random() * width
      gsap.fromTo(img, { x: x0, y: -60 - Math.random() * height * 0.3, rotation: Math.random() * 360 },
        { x: x0 + (Math.random() - 0.5) * 140, y: height + 40, rotation: `+=${200 + Math.random() * 300}`, duration: 3 + Math.random() * 2.5, ease: 'sine.in', delay: Math.random() * 0.8, onComplete: () => img.remove() })
    }
  }

  const fam = content.families
  return (
    <section ref={root} className="story" aria-label="Shreya and Akshay are getting married">
      <div ref={stage} className="stage">
        {/* 1 · Dawn at the forest gate */}
        <div className="scene s1">
          <div className="layer L-sky"><img src="/hero/sky.webp" alt="" /></div>
          <div className="layer L-hills"><img className="pop" src="/hero/hills.webp" alt="" /></div>
          <div className="layer L-forest"><img className="pop" src="/hero/forest.webp" alt="" /></div>
          <div className="layer L-flies" aria-hidden="true">
            {FLIES.map((f, i) => <i key={i} className="fly" style={{ left: f.left, top: f.top, animationDelay: f.delay }} />)}
          </div>
          <div className="layer L-grass"><img className="pop" src="/hero/grass.webp" alt="" /></div>
          <div className="layer L-frame"><img className="pop" src="/hero/frame.webp" alt="" /><span className="perch" data-perch="arch" style={{ left: '50%', top: '16.5%' }} /></div>
          <div className="hero-title">
            <p className="hero-k">Save the date</p>
            <h1 className="hero-names"><span>{content.couple.bride}</span><span className="amp">&amp;</span><span>{content.couple.groom}</span></h1>
          </div>
          <p className="hint" aria-hidden="true">scroll</p>
        </div>

        {/* 2 · The journey */}
        <div className="scene s2">
          <img className="bg" src="/story/trail.webp" alt="" />
          <img className="palash" src="/story/flowers/palash.webp" alt="" />
          <img className="deer deer-doe" src="/story/wild/chital-doe.webp" alt="" />
          <img className="deer deer-stag" src="/story/wild/chital-stag.webp" alt="" />
          <div className="jeep">
            <img src="/story/jeep.webp" alt="Shreya and Akshay driving a garlanded jeep through the forest" />
            <span className="perch" data-perch="jeep" style={{ left: '15%', top: '33%' }} />
          </div>
          <img className="bf bf-1" src="/story/wild/butterfly-blue.webp" alt="" />
          <img className="bf bf-2" src="/story/wild/butterfly-marigold.webp" alt="" />
          <img className="border" src="/story/border.webp" alt="" />
          <div className="card card-fam">
            <Corners />
            <p className="caps">Together with our families</p>
            <p className="card-h">We, {content.couple.bride} &amp; {content.couple.groom},<br />are getting married</p>
            <img className="divider" src="/art/divider.webp" alt="" />
            <div className="fam-pair">
              {fam.map((f) => (
                <div key={f.who} className="fam-side">
                  <p className="fam-who">{f.who}</p>
                  <p className="fam-rel">{f.relation}</p>
                  <p className="fam-par">{f.parents}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3 · Arrival at the venue (golden hour) */}
        <div className="scene s3">
          <Venue />
          <div className="card card-date">
            <Corners />
            <span className="perch" data-perch="date" style={{ left: '16%', top: '2%' }} />
            <p className="caps">Save the date</p>
            <p className="card-date-d">{content.dates}</p>
            <p className="card-date-p">Jim Corbett, Uttarakhand</p>
            <div className="cal-btns">
              <a className="cal-btn" href={googleCal} target="_blank" rel="noopener">Google Calendar</a>
              <a className="cal-btn" href="/save-the-date.ics" download="Shreya-Akshay-Save-the-Date.ics">Apple · Outlook</a>
            </div>
            <p className="caps caps-s">Formal invitation to follow</p>
          </div>
        </div>

        {/* 4 · Dusk in the garden, the RSVP */}
        <div className="scene s4" id="rsvp">
          <Venue />
          <div className="dusk" aria-hidden="true" />
          {DIYAS.map(([x, y], i) => <i key={i} className="diya" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />)}
          {DUSK_FLIES.map((f, i) => <i key={i} className="fly" style={{ left: f.left, top: f.top, animationDelay: f.delay }} aria-hidden="true" />)}
          <img className="parakeets" src="/story/wild/parakeets.webp" alt="" />
          <div className="card card-rsvp">
            <Corners />
            <span className="perch" data-perch="rsvp" style={{ right: '17%', top: '2%' }} />
            <RsvpCard onAccepted={shower} />
          </div>
          <p className="mono">S <em>&amp;</em> A <span>· 16 · 17 · II · 2027</span></p>
        </div>

        {/* the hornbill guide */}
        <div ref={guide} className="guide flying" aria-hidden="true">
          <div className="fly-pose">
            <img className="wb" src="/hornbill/wing-back.webp" alt="" />
            <img src="/hornbill/body.webp" alt="" />
            <img className="wf" src="/hornbill/wing-front.webp" alt="" />
          </div>
          <img className="perch-pose" src="/story/wild/hornbill-perched.webp" alt="" />
        </div>
      </div>
      <div className="loader" aria-hidden="true"><span>S <em>&amp;</em> A</span></div>
    </section>
  )
}
