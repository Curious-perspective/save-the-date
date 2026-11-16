# Shreya & Akshay — Save the Date

Save-the-date website for 16–17 February 2027, Jim Corbett. Guests open one WhatsApp link, enjoy the animated story and RSVP. Responses land in a Google Sheet.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Connect the RSVP to Google Sheets (one time)

1. Create a new Google Sheet. Open **Extensions → Apps Script**, delete the sample code, paste in `apps-script/Code.gs`, and save.
2. Click **Deploy → New deployment**, choose type **Web app**, set *Execute as* **Me** and *Who has access* **Anyone**, then **Deploy** and approve the permissions.
3. Copy the Web app URL (ends in `/exec`).
4. In this folder, copy `.env.example` to `.env.local` and paste the URL as `VITE_RSVP_URL`.
5. Restart `npm run dev`. Submit a test RSVP and check that a row appears.

If you edit `Code.gs`, redeploy via **Deploy → Manage deployments → Edit → New version**. The URL stays the same.

Sheet columns: Timestamp · Name · Email · Phone · Attending · Guests.

## Deploy (when the domain is ready)

The site is static, so any static host works. Vercel or Netlify are simplest:
1. Push this folder to a GitHub repo and import it in Vercel (framework: Vite).
2. Add the environment variable `VITE_RSVP_URL` in the project settings.
3. Add the custom domain in the host's domain settings.

Before sending on WhatsApp, paste the link into a chat with yourself to check the preview image and title.

## Layout

```
apps-script/Code.gs   Google Sheet RSVP endpoint
src/rsvp.ts           sendRsvp() — the only network call the site makes
src/                  the site (React + TypeScript)
.claude/skills/       design & animation skills for Claude Code
.mcp.json             Awwwards inspiration MCP server
CLAUDE.md             project facts and rules for Claude
docs/                 specs and plans
```
