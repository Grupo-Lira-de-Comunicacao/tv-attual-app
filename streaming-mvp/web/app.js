'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const video = $('video');
  const standby = $('standby');
  const notice = $('notice');
  const signal = $('signal');
  const start = $('start');
  const manifest = '/hls/tvattual-live/index.m3u8';
  let hls = null;
  let live = false;
  let playbackRequested = false;
  function resetPlayer() {
    if (hls) { hls.destroy(); hls = null; }
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden = true;
    standby.hidden = false;
    playbackRequested = false;
    start.hidden = true;
  }
  function setLive(next) {
    live = Boolean(next);
    signal.textContent = live ? 'AO VIVO' : 'FORA DO AR';
    signal.classList.toggle('online', live);
    signal.classList.toggle('offline', !live);
    if (!live) { resetPlayer(); notice.textContent = 'Nenhuma transmissão ao vivo neste momento. Volte no horário do próximo programa.'; }
    else if (!playbackRequested) { notice.textContent = 'A transmissão está disponível.'; start.hidden = false; }
  }
  function begin() {
    if (!live || playbackRequested) return;
    playbackRequested = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifest;
    } else if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({ maxBufferLength: 20, liveSyncDurationCount: 3 });
      hls.loadSource(manifest);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else { resetPlayer(); notice.textContent = 'Não foi possível reproduzir. Tente novamente.'; start.hidden = false; }
        }
      });
    } else {
      playbackRequested = false;
      notice.textContent = 'Seu navegador não suporta HLS. Tente Chrome, Edge ou Safari atualizados.';
      return;
    }
    video.hidden = false;
    standby.hidden = true;
    video.play().catch(() => { video.controls = true; });
  }
  async function refresh() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      let response;
      try { response = await fetch('/status.json', { cache: 'no-store', signal: controller.signal }); }
      finally { clearTimeout(timer); }
      if (!response.ok) throw new Error('Status indisponível');
      setLive((await response.json()).live === true);
    } catch (error) {
      if (!playbackRequested) { setLive(false); notice.textContent = 'Não foi possível verificar o sinal. Tente novamente.'; }
    }
  }
  $('refresh').addEventListener('click', refresh);
  start.addEventListener('click', begin);
  refresh();
  setInterval(refresh, 10000);
})();
