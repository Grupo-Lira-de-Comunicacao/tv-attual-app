'use strict';
// TV Attual: one player, live first, ErsatzTV as the permanent 24h fallback.
// This file is hosted at live.tvattual.com.br, so /status.json is SAME ORIGIN.
(() => {
  const $ = (id) => document.getElementById(id);
  const video = $('video');
  const standby = $('standby');
  const notice = $('notice');
  const signal = $('signal');
  const start = $('start');

  const STREAMS = Object.freeze({
    live: '/hls/tvattual-live/index.m3u8',
    recorded: 'https://tv.tvattual.com.br/iptv/channel/1.m3u8',
  });

  let mode = null;
  let engine = null;
  let offlinePolls = 0;
  let liveCooldownUntil = 0;
  let sourceErrors = 0;
  let hadPlayback = false;
  let userPaused = false;

  // Only non-sensitive UI events are sent to the embedding official website/app.
  function report(type, detail) {
    if (window.parent !== window) {
      window.parent.postMessage({ type, ...detail }, '*');
    }
  }

  video.addEventListener('playing', () => report('tvattual:playback', { state: 'playing' }));
  video.addEventListener('pause', () => report('tvattual:playback', { state: 'paused' }));

  function showMode(next) {
    const isLive = next === 'live';
    signal.textContent = isLive ? 'AO VIVO' : 'PROGRAMAÇÃO 24H';
    report('tvattual:source', { mode: next });
    signal.classList.toggle('online', isLive);
    signal.classList.toggle('offline', !isLive);
    notice.textContent = isLive
      ? 'Transmissão ao vivo da TV Attual.'
      : 'Acompanhe a programação contínua da TV Attual.';
  }

  function offerPlayback(message) {
    notice.textContent = message;
    standby.hidden = false;
    start.hidden = false;
  }

  function tryPlay() {
    if (userPaused) return;
    video.play().then(() => {
      hadPlayback = true;
      standby.hidden = true;
      start.hidden = true;
    }).catch(() => {
      offerPlayback('Toque em Assistir para iniciar a TV Attual.');
    });
  }

  function onFatalError() {
    sourceErrors += 1;
    if (engine && sourceErrors === 1) {
      engine.startLoad();
      return;
    }
    // The live path is not healthy: never leave the viewer on a black screen.
    if (mode === 'live') {
      liveCooldownUntil = Date.now() + 15000;
      switchTo('recorded');
    } else {
      offerPlayback('Sinal da programação indisponível. Verifique sua conexão e tente novamente.');
    }
  }

  function switchTo(next) {
    if (mode === next) return;
    const wasPausedByViewer = hadPlayback && video.paused && standby.hidden;
    if (wasPausedByViewer) userPaused = true;

    if (engine) {
      engine.destroy();
      engine = null;
    }
    video.pause();
    video.removeAttribute('src');
    video.load();

    mode = next;
    sourceErrors = 0;
    showMode(next);
    standby.hidden = true;
    start.hidden = true;
    video.hidden = false;

    const source = STREAMS[next];
    // Safari and iOS use native HLS; hls.js handles Chromium, Firefox and Android.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
      video.addEventListener('error', onFatalError, { once: true });
    } else if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        maxBufferLength: 20,
        liveSyncDurationCount: 3,
      });
      engine = hls;
      hls.on(window.Hls.Events.MANIFEST_PARSED, tryPlay);
      hls.on(window.Hls.Events.ERROR, (_event, error) => {
        if (!error.fatal) return;
        if (error.type === window.Hls.ErrorTypes.MEDIA_ERROR && sourceErrors === 0) {
          sourceErrors += 1;
          hls.recoverMediaError();
        } else {
          onFatalError();
        }
      });
      hls.loadSource(source);
      hls.attachMedia(video);
    } else {
      offerPlayback('Este navegador não oferece reprodução HLS. Atualize seu navegador.');
    }
  }

  async function refresh() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      let response;
      try {
        response = await fetch('/status.json', { cache: 'no-store', signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) throw new Error('status_unavailable');
      const live = (await response.json()).live === true;
      if (live) {
        offlinePolls = 0;
        if (Date.now() >= liveCooldownUntil) switchTo('live');
      } else {
        offlinePolls += 1;
        // Two negative polls avoid switching during a short encoder/network hiccup.
        if (mode !== 'live' || offlinePolls >= 2) switchTo('recorded');
      }
    } catch (_error) {
      offlinePolls += 1;
      // A status outage never takes the 24-hour ErsatzTV channel down.
      if (mode === null || (mode === 'live' && offlinePolls >= 2)) {
        switchTo('recorded');
      }
    }
  }

  start.addEventListener('click', () => {
    userPaused = false;
    // Only a user gesture may request sound: autoplay starts muted by default.
    video.muted = false;
    tryPlay();
  });
  $('refresh').addEventListener('click', () => {
    if (mode === 'recorded' && video.paused) {
      userPaused = false;
      tryPlay();
    }
    refresh();
  });

  if (new URLSearchParams(location.search).get('embed') === '1') {
    document.documentElement.classList.add('attual-embed');
  }
  showMode('recorded');
  refresh();
  setInterval(refresh, 8000);
})();
