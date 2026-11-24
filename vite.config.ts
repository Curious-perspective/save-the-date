import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { appendFileSync, mkdirSync } from 'node:fs'

// https://vite.dev/config/
// Two pages while the couple compares: / (v1, the scene version) and /v2/ (forest → river glide → far bank).
// GitHub Pages serves a project site under /<repo>/, but the art in `public/` is referenced by absolute paths
// ("/v2/…", "/hero/…") in the JSX. When BASE_PATH is set (the Pages workflow sets it), this prefixes those strings.
// ponytail: a string rewrite at build time; it only touches quoted paths starting with one of the public folders/files.
const base = process.env.BASE_PATH || '/'
const publicPaths = {
  name: 'public-paths-under-base',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (base === '/' || !/\/src\/.*\.(tsx?|jsx?)$/.test(id)) return null
    return code.replace(/(["'`])\/(v2|hero|story|hornbill|save-the-date\.ics|og\.jpg)(?=[\/"'`])/g, `$1${base}$2`)
  },
}

// DEV ONLY, temporary (24 Nov): the phone posts short lines here while the couple test on Wi-Fi (see src/v2/main.tsx)
const phoneLog = {
  name: 'phone-log',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use('/__log', (req, res) => {
      let body = ''
      req.on('data', (c) => { body += c })
      req.on('end', () => { mkdirSync('node_modules/.cache', { recursive: true }); appendFileSync('node_modules/.cache/phone.log', `${new Date().toISOString().slice(11, 19)} ${body}\n`); res.end('ok') })
    })
  },
}

export default defineConfig({
  base,
  plugins: [publicPaths, phoneLog, react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), v2: resolve(__dirname, 'v2/index.html') },
    },
  },
})
