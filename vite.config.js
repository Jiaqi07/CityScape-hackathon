import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function openAiPenguMiddleware({ apiKey, model }) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  async function readJson(req) {
    return await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  }

  async function handler(req, res) {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { message: 'Method not allowed' } }));
      return;
    }

    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { message: 'Missing OPENAI_API_KEY' } }));
      return;
    }

    try {
      const body = await readJson(req);
      const messages = Array.isArray(body?.messages) ? body.messages : [];

      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages,
          temperature: 0.75,
          max_tokens: 512,
        }),
      });

      const text = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(text);
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { message: e?.message || 'Server error' } }));
    }
  }

  return {
    name: 'openai-pengu-middleware',
    configureServer(server) {
      server.middlewares.use('/api/pengu-chat', (req, res) => { handler(req, res); });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/pengu-chat', (req, res) => { handler(req, res); });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const model = env.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  return {
    plugins: [react(), openAiPenguMiddleware({ apiKey, model })],
    server: {
      proxy: {
        '/ercot-live': {
          target: 'https://www.ercot.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ercot-live/, '/content/cdr/html'),
        },
        '/ercot-api': {
          target: 'https://api.ercot.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ercot-api/, '/api'),
        },
      },
    },
  };
})
