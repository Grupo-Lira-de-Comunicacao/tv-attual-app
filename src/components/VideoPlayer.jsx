import { useState, useEffect, useRef, useCallback } from 'react'
import { LINKS } from '../config/links.js'
import { matrixDurationBucket, trackMatrixEvent } from '../services/matrixTelemetry.js'
import './VideoPlayer.css'

// TV Attual has one canonical player for app and website.
// It switches to MediaMTX live when available, otherwise ErsatzTV 24h.
function StreamPlayer({ onSourceChange }) {
  const iframeRef = useRef(null)
  const watchStartedAtRef = useRef(null)

  useEffect(() => {
    const stop = () => {
      if (!watchStartedAtRef.current) return
      const seconds = (Date.now() - watchStartedAtRef.current) / 1000
      watchStartedAtRef.current = null
      void trackMatrixEvent('tv_stopped', {
        channel_key: 'tv-attual-live',
        watch_seconds_bucket: matrixDurationBucket(seconds),
      })
    }
    const onMessage = (event) => {
      if (event.origin !== 'https://live.tvattual.com.br') return
      if (event.source !== iframeRef.current?.contentWindow) return
      const msg = event.data
      if (!msg || typeof msg !== 'object') return
      if (msg.type === 'tvattual:source' && ['live', 'recorded'].includes(msg.mode)) {
        onSourceChange(msg.mode)
      }
      if (msg.type === 'tvattual:playback') {
        if (msg.state === 'playing' && !watchStartedAtRef.current) {
          window.dispatchEvent(new Event('attualplay:tv-playing'))
          watchStartedAtRef.current = Date.now()
          void trackMatrixEvent('tv_started', { channel_key: 'tv-attual-live' })
        } else if (msg.state === 'paused') {
          stop()
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      stop()
    }
  }, [onSourceChange])

  return (
    <iframe
      ref={iframeRef}
      className="stream-embed"
      title="TV Attual — canal 24 horas e transmissões ao vivo"
      src={LINKS.TV_UNIFIED_PLAYER_URL + '?embed=1'}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      loading="eager"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  )
}

function LinksExternos() {
  return (
    <div className="tv-links-row">
      <a className="tv-link-web" href={LINKS.TV_UNIFIED_PLAYER_URL}
        target="_blank" rel="noopener noreferrer">
        Abrir TV Attual em nova aba ↗
      </a>
    </div>
  )
}

export default function VideoPlayer({ onSourceChange }) {
  const [expandido, setExpandido] = useState(false)
  const [source, setSource] = useState('unknown')

  useEffect(() => {
    if (!expandido) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setExpandido(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [expandido])

  const handleSourceChange = useCallback((mode) => {
    if (mode !== 'live' && mode !== 'recorded') return
    setSource(mode)
    onSourceChange?.(mode)
  }, [onSourceChange])

  const statusText = source === 'unknown' ? 'CANAL TV ATTUAL' : 'NO AR'

  return (
    <>
      <section className="tv-player" aria-label="TV Attual — Canal 24 Horas">
        <div className="tv-tela">
          {expandido ? (
            <div className="tv-overlay">
              <p className="tv-overlay-aviso">Reproduzindo no modo ampliado</p>
            </div>
          ) : (
            <StreamPlayer onSourceChange={handleSourceChange} />
          )}

          <span className="tag-live">{source === 'live' && <span className="dot" />} {statusText}</span>
          <button
            className="botao-ampliar"
            onClick={() => setExpandido(true)}
            title="Ampliar" aria-label="Ampliar player">
            ⛶
          </button>
        </div>
        <LinksExternos />
      </section>

      {expandido && (
        <div className="modal-overlay" onClick={() => setExpandido(false)}>
          <div className="modal-conteudo" onClick={(event) => event.stopPropagation()}>
            <div className="modal-topo">
              <span className="modal-titulo">
                {source === 'live' && <span className="dot" />} TV Attual — {statusText}
              </span>
              <button className="modal-fechar" onClick={() => setExpandido(false)}
                title="Fechar" aria-label="Fechar player expandido">✕</button>
            </div>
            <div className="tv-tela tv-tela-grande">
              <StreamPlayer onSourceChange={handleSourceChange} />
            </div>
            <LinksExternos />
          </div>
        </div>
      )}
    </>
  )
}
