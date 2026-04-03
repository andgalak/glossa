import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load .env.local (and .env) so ANTHROPIC_API_KEY is available in the dev middleware
  const env = loadEnv(mode, process.cwd(), '')
  process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY

  return {
    plugins: [
      react(),
      {
        name: 'api-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/generate', (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405)
              res.end('Method Not Allowed')
              return
            }
            let body = ''
            req.on('data', chunk => (body += chunk))
            req.on('end', async () => {
              try {
                const { chapterPrompt } = JSON.parse(body)
                // Dynamic import so hot-reload works and the module picks up env
                const { generateSentences } = await import('./api/_lib/generateCore.js')
                const sentences = await generateSentences(chapterPrompt)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(sentences))
              } catch (err) {
                console.error('[api/generate dev]', err)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })
        },
      },
    ],
  }
})
