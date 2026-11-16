import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

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

export default defineConfig({
  base,
  plugins: [publicPaths, react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), v2: resolve(__dirname, 'v2/index.html') },
    },
  },
})
