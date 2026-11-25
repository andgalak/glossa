import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig(({ mode }) => {
  // Load .env.local (and .env) so ANTHROPIC_API_KEY is available in the dev middleware
  const env = loadEnv(mode, process.cwd(), '')
  process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY

  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), 'index.html'),
          flashcards: resolve(process.cwd(), 'flashcards.html'),
        },
      },
    },
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

          server.middlewares.use('/api/generate-card', (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405)
              res.end('Method Not Allowed')
              return
            }
            let body = ''
            req.on('data', chunk => (body += chunk))
            req.on('end', async () => {
              try {
                const { word } = JSON.parse(body)
                const { generateCard } = await import('./api/_lib/generateCardCore.js')
                const card = await generateCard(word)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(card))
              } catch (err) {
                console.error('[api/generate-card dev]', err)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })

          server.middlewares.use('/api/translate', (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405)
              res.end('Method Not Allowed')
              return
            }
            let body = ''
            req.on('data', chunk => (body += chunk))
            req.on('end', async () => {
              try {
                const { word } = JSON.parse(body)
                const Anthropic = (await import('@anthropic-ai/sdk')).default
                const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
                const message = await client.messages.create({
                  model: 'claude-haiku-4-5',
                  max_tokens: 50,
                  messages: [{ role: 'user', content: `Translate this single Greek word to English: "${word}". Reply with only the English translation, 1-4 words maximum. No punctuation, no explanation.` }],
                })
                const translation = message.content[0].text.trim()
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ translation }))
              } catch (err) {
                console.error('[api/translate dev]', err)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })

          server.middlewares.use('/api/translate-sentence', (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405)
              res.end('Method Not Allowed')
              return
            }
            let body = ''
            req.on('data', chunk => (body += chunk))
            req.on('end', async () => {
              try {
                const { word, sentence } = JSON.parse(body)
                const { translateInContext } = await import('./api/_lib/translateSentenceCore.js')
                const out = await translateInContext(word, sentence)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(out))
              } catch (err) {
                console.error('[api/translate-sentence dev]', err)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })

          server.middlewares.use('/api/tts', (req, res) => {
            if (req.method !== 'POST') {
              res.writeHead(405)
              res.end('Method Not Allowed')
              return
            }
            let body = ''
            req.on('data', chunk => (body += chunk))
            req.on('end', async () => {
              try {
                const { text, voice } = JSON.parse(body)
                const { synthesize } = await import('./api/_lib/ttsCore.js')
                const out = await synthesize(text, voice)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(out))
              } catch (err) {
                if (err.code === 'AZURE_NOT_CONFIGURED') {
                  res.writeHead(503, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: 'azure_not_configured' }))
                  return
                }
                console.error('[api/tts dev]', err)
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
