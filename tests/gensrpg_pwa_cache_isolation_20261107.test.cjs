'use strict';
// C2 regression: a GenSrpg update must never delete preview PWA caches on
// the SAME github.io origin. Test the real service worker, not a duplicate.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../service-worker.js'), 'utf8');

function boot(initialNames) {
  const handlers = new Map();
  const names = new Set(initialNames);
  const deleted = [];
  const stored = new Map();
  let claims = 0;
  let updates = 0;
  const caches = {
    keys: async () => [...names],
    delete: async name => { deleted.push(name); names.delete(name); return true; },
    open: async name => ({
      put: async (request, response) => stored.set(name + ':' + request.url, response.clone()),
      match: async request => stored.get(name + ':' + request.url)
    }),
    match: async () => undefined
  };
  const self = {
    location: { origin: 'https://example.github.io' },
    registration: {
      scope: 'https://example.github.io/Zombicide-40k/',
      update: async () => { updates++; }
    },
    skipWaiting() {},
    clients: { claim: async () => { claims++; } },
    addEventListener(type, cb) { handlers.set(type, cb); }
  };
  vm.runInNewContext(source, {
    self, URL, Request, Response, caches,
    fetch: async () => new Response('FRESH-APP', {status: 200}),
    console
  }, {filename: 'service-worker.js'});
  return {
    handlers, names, deleted, stored,
    get claims() { return claims; },
    get updates() { return updates; }
  };
}

test('RED: activation removes ONLY old root GenSrpg caches, preserves preview and other PWA data', async () => {
  const current = source.match(/^const CACHE_NAME = "([^"]+)";/m)?.[1];
  assert.ok(current?.startsWith('gensrpg-cache-'), 'root cache namespace required');
  const rootOld = 'gensrpg-cache-16.78.116-capture-offline-media-v1';
  const preview = 'gensrpg-preview-capture-v2-d58677893322';
  const exploration = 'exploration-v80-local-cache';
  const foreign = 'foreign-application-cache';
  const h = boot([current, rootOld, preview, exploration, foreign]);
  let pending;
  h.handlers.get('activate')({waitUntil(promise) { pending = promise; }});
  await pending;
  assert.equal(h.claims, 1, 'new worker takes control without reinstall');
  assert.deepEqual(h.deleted, rootOld === current ? [] : [rootOld],
    'do not delete caches owned by another installed PWA or preview');
  assert.equal(h.names.has(preview), true);
  assert.equal(h.names.has(exploration), true);
  assert.equal(h.names.has(foreign), true);
});

test('installed root app checks the service worker and fetches current HTML on navigation', async () => {
  const h = boot([]);
  const request = {
    method: 'GET',
    url: 'https://example.github.io/Zombicide-40k/',
    destination: 'document',
    mode: 'navigate'
  };
  let answer, pending;
  h.handlers.get('fetch')({
    request,
    respondWith(promise) { answer = Promise.resolve(promise); },
    waitUntil(promise) { pending = Promise.resolve(promise); }
  });
  assert.equal((await answer).status, 200);
  await pending;
  assert.equal(h.updates, 1, 'installed launcher must re-check for latest SW');
  assert.match([...h.stored.keys()].join('\n'), /Zombicide-40k/,
    'fresh root HTML must be cached as offline fallback');
});
