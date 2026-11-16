import { useState, type FormEvent } from 'react'
import { sendRsvp } from './rsvp'
import { content } from './content'

const SENT_KEY = 'sa-rsvp-sent'
type Sent = { name: string; attending: 'yes' | 'no' }

const readSent = (): Sent | null => {
  try { return JSON.parse(localStorage.getItem(SENT_KEY) || 'null') } catch { return null }
}

// The RSVP form on its paper card. onAccepted fires after a successful "yes" (the petal shower).
export default function RsvpCard({ onAccepted, maxGuests = content.maxGuests }: { onAccepted: () => void; maxGuests?: number }) {
  const [sent, setSent] = useState<Sent | null>(readSent)
  const [attending, setAttending] = useState<'yes' | 'no' | ''>('')
  const [guests, setGuests] = useState(1)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '').trim()
    const phone = String(f.get('phone') || '').trim()
    const email = String(f.get('email') || '').trim()
    if (!name) return setError('Please add your name.')
    if (!attending) return setError('Please let us know if you can come.')
    if (phone && !/^\+?[\d\s-]{7,16}$/.test(phone)) return setError('That phone number doesn\'t look right. You can also leave it empty.')
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('That email doesn\'t look right. You can also leave it empty.')
    if (!import.meta.env.VITE_RSVP_URL) return setError('RSVPs aren\'t connected yet. Please try again a little later.')

    setError('')
    setSending(true)
    try {
      const res = await sendRsvp({ name, phone, email, attending, guests: attending === 'yes' ? guests : 0 })
      if (!res.ok) throw new Error(res.error)
      const done = { name, attending }
      try { localStorage.setItem(SENT_KEY, JSON.stringify(done)) } catch { /* private mode: fine */ }
      setSent(done)
      if (attending === 'yes') onAccepted()
    } catch {
      setError('We couldn\'t send that. Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    const first = sent.name.split(' ')[0]
    return (
      <div className="rsvp-done" role="status">
        <p className="caps">Thank you, {first}</p>
        <p className="rsvp-done-t">{sent.attending === 'yes' ? 'We can\'t wait to celebrate with you.' : 'You\'ll be missed. Thank you for letting us know.'}</p>
        <p className="rsvp-done-s">The formal invitation will reach you soon.</p>
        <button type="button" className="link" onClick={() => { setSent(null); try { localStorage.removeItem(SENT_KEY) } catch { /* ignore */ } }}>
          Send another response
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rsvp-form">
      <p className="caps">Kindly respond by {content.rsvpBy.replace(/ \d{4}$/, '')}</p>
      <h2 className="card-h">Will you join us?</h2>

      <label className="fld" htmlFor="rsvp-name"><span>Your name</span>
        <input id="rsvp-name" name="name" autoComplete="name" required />
      </label>

      <fieldset className="fld">
        <legend>Attending</legend>
        <div className="seg">
          <label className={attending === 'yes' ? 'on' : ''}><input type="radio" name="attending" value="yes" checked={attending === 'yes'} onChange={() => setAttending('yes')} />Joyfully accept</label>
          <label className={attending === 'no' ? 'on' : ''}><input type="radio" name="attending" value="no" checked={attending === 'no'} onChange={() => setAttending('no')} />Regretfully decline</label>
        </div>
      </fieldset>

      {attending === 'yes' && (
        <div className="fld">
          <span id="guests-l">Guests, including you</span>
          <div className="stepper" role="group" aria-labelledby="guests-l">
            <button type="button" aria-label="One fewer guest" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1}>−</button>
            <output aria-live="polite">{guests}</output>
            <button type="button" aria-label="One more guest" onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))} disabled={guests >= maxGuests}>+</button>
          </div>
        </div>
      )}

      <div className="fld-row">
        <label className="fld" htmlFor="rsvp-phone"><span>Phone <i>(optional)</i></span>
          <input id="rsvp-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" />
        </label>
        <label className="fld" htmlFor="rsvp-email"><span>Email <i>(optional)</i></span>
          <input id="rsvp-email" name="email" type="email" autoComplete="email" />
        </label>
      </div>

      <p className="rsvp-err" role="alert">{error}</p>
      <button className="send" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send RSVP'}</button>
    </form>
  )
}
