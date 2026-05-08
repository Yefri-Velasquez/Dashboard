#!/usr/bin/env node
// Auth-broker: localhost-only HTTP proxy that forwards dashboard requests to
// api.github.com with an Authorization header sourced from the host's `gh` CLI.
//
// The token is never written to disk by this project, never sent to the
// browser, and is fetched fresh from `gh auth token` (with a small in-memory
// cache so we don't spawn a subprocess per request).
//
// Run on the Mac host (NOT inside Docker):
//   node auth-broker.js
//
// nginx in Docker reverse-proxies /proxy/github/* → http://host.docker.internal:4000/github/*

'use strict';

const http = require('http');
const https = require('https');
const { execFile } = require('child_process');

const PORT = 4000;
const HOST = '127.0.0.1';
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);
const TOKEN_TTL_MS = 30 * 1000;

// ── Token sourcing via `gh auth token` ──
let cachedToken = null;
let cachedAt = 0;

function getGitHubToken() {
  if (cachedToken && (Date.now() - cachedAt) < TOKEN_TTL_MS) {
    return Promise.resolve(cachedToken);
  }
  return new Promise((resolve, reject) => {
    execFile('gh', ['auth', 'token'], { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error('Could not read token from `gh` CLI. Run: gh auth login. ' + (stderr || err.message).trim()));
      }
      const token = stdout.trim();
      if (!token) return reject(new Error('`gh auth token` returned empty'));
      cachedToken = token;
      cachedAt = Date.now();
      resolve(token);
    });
  });
}

// ── Forwarder ──
function forwardToGitHub(req, res, subPath) {
  const chunks = [];
  let size = 0;
  req.on('data', (c) => {
    size += c.length;
    if (size > 5 * 1024 * 1024) { res.writeHead(413).end('payload too large'); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', async () => {
    let token;
    try { token = await getGitHubToken(); }
    catch (e) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
      return;
    }

    const body = chunks.length ? Buffer.concat(chunks) : null;
    const upstream = https.request({
      method: req.method,
      hostname: 'api.github.com',
      path: subPath,
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: req.headers['accept'] || 'application/vnd.github+json',
        'User-Agent': 'GH-Dashboard-Broker',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Content-Length': body ? body.length : 0,
      },
    }, (gh) => {
      const headers = {};
      for (const [k, v] of Object.entries(gh.headers)) {
        const lk = k.toLowerCase();
        if (lk === 'set-cookie' || lk === 'connection' || lk === 'transfer-encoding') continue;
        headers[k] = v;
      }
      res.writeHead(gh.statusCode || 502, headers);
      gh.pipe(res);
    });

    upstream.on('error', (e) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'upstream: ' + e.message }));
    });

    if (body) upstream.write(body);
    upstream.end();
  });
}

// ── Server ──
const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : '';
  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }

  if (req.method === 'GET' && req.url === '/health') {
    getGitHubToken()
      .then(() => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true })); })
      .catch((e) => { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: e.message })); });
    return;
  }

  if (req.url.startsWith('/github/')) {
    const subPath = req.url.slice('/github'.length);
    forwardToGitHub(req, res, subPath);
    return;
  }

  res.writeHead(404).end();
});

server.listen(PORT, HOST, () => {
  console.log('[auth-broker] listening on http://' + HOST + ':' + PORT);
  console.log('[auth-broker] proxies /github/* → https://api.github.com/* with token from `gh auth token`');
});
