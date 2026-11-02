'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

(async () => {
  const callbacks = {};
  let live = false;
  let poll = null;
  const sources = [];
  const classList = () => ({ toggle() {} });
  const field = () => ({
    hidden: false,
    textContent: '',
    classList: classList(),
    addEventListener(name, fn) { callbacks[name] = fn; },
  });
  const video = {
    ...field(),
    muted: true,
    paused: true,
    canPlayType() { return ''; },
    pause() { this.paused = true; },
    load() {},
    removeAttribute() {},
    play() { this.paused = false; return Promise.resolve(); },
  };
  const elements = {
    video,
    standby: field(),
    notice: field(),
    signal: field(),
    start: field(),
    refresh: field(),
  };
  class MockHls {
    static isSupported() { return true; }
    static Events = { MANIFEST_PARSED: 'manifest', ERROR: 'error' };
    static ErrorTypes = { MEDIA_ERROR: 'media', NETWORK_ERROR: 'network' };
    constructor() { this.listeners = {}; }
    on(name, fn) { this.listeners[name] = fn; }
    loadSource(url) { sources.push(url); }
    attachMedia() { setImmediate(() => this.listeners.manifest?.()); }
    startLoad() {}
    recoverMediaError() {}
    destroy() {}
  }
  const appWindow = {
    Hls: MockHls,
    addEventListener() {},
    postMessage() {},
  };
  appWindow.parent = appWindow;
  const context = {
    window: appWindow,
    document: {
      getElementById(id) { return elements[id]; },
      documentElement: { classList: { add() {} } },
    },
    location: { search: '' },
    fetch: async () => ({ ok: true, json: async () => ({ live }) }),
    AbortController,
    setTimeout,
    clearTimeout,
    setInterval(fn) { poll = fn; return 1; },
    console,
    Date,
  };
  const script = fs.readFileSync(path.resolve(__dirname, '../web/app.js'), 'utf8');
  vm.runInNewContext(script, context);
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  await flush(); await flush();
  assert.equal(sources.at(-1), 'https://tv.tvattual.com.br/iptv/channel/1.m3u8');
  assert.equal(elements.signal.textContent, 'PROGRAMAÇÃO 24H');

  live = true;
  await poll(); await flush();
  assert.equal(sources.at(-1), '/hls/tvattual-live/index.m3u8');
  assert.equal(elements.signal.textContent, 'AO VIVO');

  live = false;
  await poll(); await flush();
  assert.equal(sources.at(-1), '/hls/tvattual-live/index.m3u8',
    'one missing live poll must not switch the stream');
  await poll(); await flush();
  assert.equal(sources.at(-1), 'https://tv.tvattual.com.br/iptv/channel/1.m3u8');
  assert.equal(elements.signal.textContent, 'PROGRAMAÇÃO 24H');
  console.log('UNIFIED_PLAYER_SWITCH_AND_FALLBACK_PASS');
})().catch((error) => { console.error(error); process.exitCode = 1; });
