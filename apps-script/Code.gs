/**
 * RSVP endpoint: appends one row per response to the bound Google Sheet.
 *
 * Setup (one time, ~3 min):
 *  1. Create a Google Sheet → Extensions → Apps Script → paste this file.
 *  2. Deploy → New deployment → type "Web app"
 *     Execute as: Me · Who has access: Anyone → Deploy → copy the /exec URL.
 *  3. In the website folder, create .env.local with:  VITE_RSVP_URL=<that URL>
 *  Re-deploy (Manage deployments → edit → New version) after any edit here.
 */
const HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Attending', 'Guests'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
    const name = clean(d.name, 120);
    const attending = d.attending === 'yes' ? 'Yes' : d.attending === 'no' ? 'No' : '';
    if (!name || !attending) return json({ ok: false, error: 'Name and attendance are required.' });

    const guests = Math.max(0, Math.min(20, parseInt(d.guests, 10) || 0));
    // ponytail: leading ' stops a value like "=HYPERLINK(...)" running as a formula in the sheet
    const safe = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
      if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
      sheet.appendRow([new Date(), safe(name), safe(clean(d.email, 200)), safe(clean(d.phone, 40)),
        attending, attending === 'Yes' ? guests : 0]);
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Could not save RSVP.' });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
