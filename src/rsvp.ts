export type Rsvp = {
  name: string
  email?: string
  phone?: string
  attending: 'yes' | 'no'
  guests?: number
}

// text/plain body = "simple" request, so the browser skips the CORS preflight Apps Script can't answer.
export async function sendRsvp(data: Rsvp): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(import.meta.env.VITE_RSVP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data),
  })
  return res.json()
}
