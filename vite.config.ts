import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAi } from './api/ai'

/**
 * Dev-only middleware that serves /api/ai using the same handler that runs in
 * production (api/ai.ts as a serverless function). The Gemini key is read from
 * a non-VITE_ env var, so Vite never bundles it into frontend code.
 */
function apiDev(env: Record<string, string>): Plugin {
  return {
    name: 'nexora-api-dev',
    configureServer(server) {
      process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
      process.env.GEMINI_MODEL = env.GEMINI_MODEL
      server.middlewares.use('/api/ai', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        let raw = ''
        req.on('data', (c) => (raw += c))
        req.on('end', async () => {
          let body: unknown = null
          try {
            body = JSON.parse(raw || '{}')
          } catch {
            /* handled below */
          }
          const out = await handleAi(body)
          res.statusCode = out.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(out.json))
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), apiDev(env)] }
})
