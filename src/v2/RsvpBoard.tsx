import { useState, type FormEvent } from 'react'
import { sendRsvp } from '../rsvp'
import { content } from '../content'

const SENT_KEY = 'sa-rsvp-sent'
type Sent = { name: string; attending: 'yes' | 'no' }
const readSent = (): Sent | null => { try { return JSON.parse(localStorage.getItem(SENT_KEY) || 'null') } catch { return null } }

// The RSVP on the wooden board: one question at a time so it stays small. Step 1 attend? · 2 name (+ guests) · 3 contact + send.
export default function RsvpBoard({ onAccepted }: { onAccepted: () => void }) {
  const [sent, setSent] = useState<Sent | null>(readSent)
  const [step, setStep] = useState(1)
  const [attending, setAttending] = useState<'yes' | 'no' | ''>('')
  const [name, setName] = useState('')
  const [guests, setGuests] = useState(1)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const max = content.maxGuests

  const choose = (a: 'yes' | 'no') => { setAttending(a); setError(''); setStep(2) }
  const toStep3 = (e: FormEvent) => { e.preventDefault(); if (!name.trim()) return setError('Please add your name.'); setError(''); setStep(3) }
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (phone && !/^\+?[\d\s-]{7,16}$/.test(phone)) return setError('That phone number doesn\'t look right. You can leave it empty.')
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('That email doesn\'t look right. You can leave it empty.')
    if (!import.meta.env.VITE_RSVP_URL) return setError('RSVPs aren\'t connected yet. Please try again a little later.')
    setError(''); setSending(true)
    try {
      const res = await sendRsvp({ name: name.trim(), phone, email, attending: attending as 'yes' | 'no', guests: attending === 'yes' ? guests : 0 })
      if (!res.ok) throw new Error(res.error)
      const done = { name: name.trim(), attending: attending as 'yes' | 'no' }
      try { localStorage.setItem(SENT_KEY, JSON.stringify(done)) } catch { /* private mode */ }
      setSent(done)
      if (attending === 'yes') onAccepted()
    } catch { setError('We couldn\'t send that. Please check your connection and try again.') } finally { setSending(false) }
  }

  if (sent) return (
    <div className="board-in" role="status">
      <p className="board-k">Thank you, {sent.name.split(' ')[0]}</p>
      <p className="board-q">{sent.attending === 'yes' ? 'We can\'t wait to celebrate with you.' : 'You\'ll be missed. Thank you for letting us know.'}</p>
      <p className="board-note">{content.formal}</p>
      <button type="button" className="board-link" onClick={() => { setSent(null); setStep(1); try { localStorage.removeItem(SENT_KEY) } catch { /* ignore */ } }}>Send another response</button>
    </div>
  )

  return (
    <div className="board-in">
      <p className="board-k">Kindly respond by {content.rsvpBy.replace(/ \d{4}$/, '')}</p>
      {step === 1 && (
        <>
          <p className="board-q" id="q-attend">Will you join us?</p>
          <div className="board-choices" role="group" aria-labelledby="q-attend">
            <button type="button" className="board-btn" onClick={() => choose('yes')}>Joyfully accept</button>
            <button type="button" className="board-btn" onClick={() => choose('no')}>Regretfully decline</button>
          </div>
          <p className="board-note">{content.formal}</p>
        </>
      )}
      {step === 2 && (
        <form onSubmit={toStep3} noValidate className="board-form">
          <label className="board-fld" htmlFor="b-name"><span>Your name</span>
            <input id="b-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          {attending === 'yes' && (
            <div className="board-fld"><span id="b-guests">Guests, including you</span>
              <div className="board-step" role="group" aria-labelledby="b-guests">
                <button type="button" aria-label="One fewer guest" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1}>−</button>
                <output aria-live="polite">{guests}</output>
                <button type="button" aria-label="One more guest" onClick={() => setGuests((g) => Math.min(max, g + 1))} disabled={guests >= max}>+</button>
              </div>
            </div>
          )}
          <p className="board-err" role="alert">{error}</p>
          <div className="board-nav"><button type="button" className="board-link" onClick={() => { setError(''); setStep(1) }}>Back</button><button type="submit" className="board-btn board-go">Next</button></div>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={submit} noValidate className="board-form">
          <label className="board-fld" htmlFor="b-phone"><span>Phone <i>(optional)</i></span>
            <input id="b-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+91" />
          </label>
          <label className="board-fld" htmlFor="b-email"><span>Email <i>(optional)</i></span>
            <input id="b-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <p className="board-err" role="alert">{error}</p>
          <div className="board-nav"><button type="button" className="board-link" onClick={() => { setError(''); setStep(2) }}>Back</button><button type="submit" className="board-btn board-go" disabled={sending}>{sending ? 'Sending…' : 'Send RSVP'}</button></div>
        </form>
      )}
      <div className="board-dots" aria-hidden="true">{[1, 2, 3].map((n) => <i key={n} className={n === step ? 'on' : ''} />)}</div>
    </div>
  )
}
