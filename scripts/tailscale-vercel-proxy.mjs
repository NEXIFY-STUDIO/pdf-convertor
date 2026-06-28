#!/usr/bin/env node
/**
 * Local reverse proxy: injects x-tailscale-auth and forwards to Vercel.
 * Expose via: tailscale serve --set-path=/vub --bg http://127.0.0.1:4180
 */
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.TAILSCALE_PROXY_PORT || 4180);
const TARGET = process.env.VERCEL_TARGET_URL || 'https://vub-statement-generator.vercel.app';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const secret = process.env.TAILSCALE_SECRET;
if (!secret) {
  console.error('TAILSCALE_SECRET missing in environment / .env.local');
  process.exit(1);
}

const targetUrl = new URL(TARGET);

function proxyRequest(clientReq, clientRes) {
  const upstreamPath = clientReq.url || '/';
  const headers = { ...clientReq.headers, host: targetUrl.host, 'x-tailscale-auth': secret };
  delete headers['transfer-encoding'];

  const upstream = https.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || 443,
      method: clientReq.method,
      path: upstreamPath,
      headers,
    },
    (upstreamRes) => {
      clientRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(clientRes);
    }
  );

  upstream.on('error', (err) => {
    console.error('Upstream error:', err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'content-type': 'application/json' });
      clientRes.end(JSON.stringify({ error: 'Bad gateway' }));
    }
  });

  clientReq.pipe(upstream);
}

const server = http.createServer(proxyRequest);
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Tailscale→Vercel proxy on http://127.0.0.1:${PORT} → ${TARGET}`);
});