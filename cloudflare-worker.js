/**
 * Indeats AI — Cloudflare Worker Proxy
 * 
 * DEPLOY STEPS:
 * 1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this entire file
 * 3. Click Settings → Variables → Add variable:
 *      Name:  ANTHROPIC_API_KEY
 *      Value: your-api-key-here   (tick "Encrypt")
 * 4. Deploy — copy your worker URL (e.g. https://indeats-ai.YOUR-NAME.workers.dev)
 * 5. In indeats-ai.js replace the fetch URL with your worker URL
 */

export default {
  async fetch(request, env) {

    // Allow CORS from indeats.app and localhost (dev)
    const allowedOrigins = ['https://indeats.app', 'http://localhost', 'http://127.0.0.1'];
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = allowedOrigins.some(o => origin.startsWith(o)) ? origin : 'https://indeats.app';

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();

      // Forward to Anthropic — API key injected server-side
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: body.model || 'claude-sonnet-4-20250514',
          max_tokens: body.max_tokens || 400,
          system: body.system,
          messages: body.messages,
        }),
      });

      const data = await anthropicResponse.json();

      return new Response(JSON.stringify(data), {
        status: anthropicResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
