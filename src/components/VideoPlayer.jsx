import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { LINKS } from '../config/links.js'
import './VideoPlayer.css'

/*
  Player ao vivo da TV Attual — stream HLS direto (TV_STREAM_URL).
  - Chrome/Edge/Firefox/Android: hls.js (Hls.isSupported())
  - Safari/iOS: HLS nativo (video.src direto)
  - Sem autoplay: o usuário clica em "Assistir agora" (video.play()).
  - A tag <video> é real, com controls nativos — nunca só uma div preta.
*/
function StreamPlayer() {
  const videoRef = useRef(null)
  const [tocando, setTocando] = useState(false)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    let hls = null

    if (Hls.isSupported()) {
      hls = new Hls()
      hls.loadSource(LINKS.TV_STREAM_URL)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_evento, dados) => {
        if (dados.fatal) {
          setAviso('Não foi possível carregar a transmissão agora.')
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // HLS nativo (Safari, iOS)
      video.src = LINKS.TV_STREAM_URL
    } else {
      setAviso('Não foi possível carregar a transmissão agora.')
    }

    const aoTocar = () => {
      setTocando(true)
      setAviso('')
    }
    const aoPausar = () => setTocando(false)

    video.addEventListener('playing', aoTocar)
    video.addEventListener('pause', aoPausar)

    return () => {
      video.removeEventListener('playing', aoTocar)
      video.removeEventListener('pause', aoPausar)
      if (hls) hls.destroy()
    }
  }, [])

  function assistir() {
    const video = videoRef.current
    if (!video) return
    video
      .play()
      .catch(() => setAviso('Toque no player para iniciar a transmissão.'))
  }

  return (
    <>
      <video
        ref={videoRef}
        className="stream-video"
        controls
        playsInline
        preload="metadata"
      />

      {/* Overlay central — não bloqueia os controles nativos do vídeo */}
      {!tocando && (
        <div className="tv-overlay">
          <button className="botao-play" onClick={assistir}>
            <span className="play-icone">▶</span>
            Assistir agora
          </button>
          {aviso && <p className="tv-overlay-aviso">{aviso}</p>}
        </div>
      )}
    </>
  )
}

// Botão secundário: abre o mesmo stream em uma aba separada
function LinksExternos() {
  return (
    <div className="tv-links-row">
      <a
        className="tv-link-web"
        href={LINKS.TV_DIRECT_PLAYER_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir player em nova aba ↗
      </a>
    </div>
  )
}

export default function VideoPlayer() {
  const [expandido, setExpandido] = useState(false)

  // Modal aberto: fecha com Esc e trava o scroll da página
  useEffect(() => {
    if (!expandido) return undefined
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') setExpandido(false)
    }
    window.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [expandido])

  return (
    <>
      {/* ---------- Modo compacto (Home) ---------- */}
      <section className="tv-player" aria-label="TV Attual Ao Vivo">
        <div className="tv-tela">
          {expandido ? (
            // Enquanto o modal está aberto, o stream toca só lá (evita áudio duplicado)
            <div className="tv-overlay">
              <p className="tv-overlay-aviso">Reproduzindo no modo ampliado</p>
            </div>
          ) : (
            <StreamPlayer />
          )}

          <span className="tag-live"><span className="dot" /> AO VIVO</span>

          <button
            className="botao-ampliar"
            onClick={() => setExpandido(true)}
            title="Ampliar"
            aria-label="Ampliar player"
          >
            ⛶
          </button>
        </div>

        <LinksExternos />
      </section>

      {/* ---------- Modo expandido (modal, mesmo stream) ---------- */}
      {expandido && (
        <div className="modal-overlay" onClick={() => setExpandido(false)}>
          <div className="modal-conteudo" onClick={(evento) => evento.stopPropagation()}>
            <div className="modal-topo">
              <span className="modal-titulo">
                <span className="dot" /> TV Attual Ao Vivo
              </span>
              <button
                className="modal-fechar"
                onClick={() => setExpandido(false)}
                title="Fechar"
                aria-label="Fechar player expandido"
              >
                ✕
              </button>
            </div>

            <div className="tv-tela tv-tela-grande">
              <StreamPlayer />
            </div>

            <LinksExternos />
          </div>
        </div>
      )}
    </>
  )
}
