import { useEffect, useRef, useState } from 'react'
import { LINKS, linkConfigurado } from '../config/links.js'
import { matrixDurationBucket, trackMatrixEvent } from '../services/matrixTelemetry.js'

const METADATA_REFRESH_MS = 45_000

function validarCapaRadio(url) {
  if (typeof url !== 'string') return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'radio.tvattual.com.br'
      ? parsed.href
      : null
  } catch {
    return null
  }
}

// O streaming e a leitura pública de metadados são independentes.
// Erro da API de músicas não pode interromper o áudio da rádio.
export default function RadioPlayer() {
  const [tocando, setTocando] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const [embedAberto, setEmbedAberto] = useState(false)
  const [faixa, setFaixa] = useState(null)
  const [online, setOnline] = useState(null)
  const [capaFalhou, setCapaFalhou] = useState(false)
  const audioRef = useRef(null)
  const listeningStartedAtRef = useRef(null)
  const radioConfigurada = linkConfigurado(LINKS.RADIO_STREAM_URL)

  useEffect(() => {
    let active = true
    let controller = null

    async function atualizarMusica() {
      controller?.abort()
      controller = new AbortController()
      try {
        const resposta = await fetch(LINKS.RADIO_NOWPLAYING_URL, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!resposta.ok) throw new Error('A API pública da rádio não respondeu')
        const dados = await resposta.json()
        if (!active) return

        setOnline(dados.is_online === true)
        const musica = dados.now_playing?.song
        if (typeof musica?.title === 'string' && musica.title.trim()) {
          setFaixa({
            titulo: musica.title.trim().slice(0, 140),
            artista: typeof musica.artist === 'string' ? musica.artist.trim().slice(0, 120) : '',
            capa: validarCapaRadio(musica.art),
          })
        } else {
          setFaixa(null)
        }
        setCapaFalhou(false)
      } catch (erro) {
        if (!active || erro?.name === 'AbortError') return
        setOnline(null)
        setFaixa(null)
      }
    }

    void atualizarMusica()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void atualizarMusica()
    }, METADATA_REFRESH_MS)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void atualizarMusica()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      active = false
      controller?.abort()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [])

  useEffect(() => {
    // Ao iniciar o vídeo oficial, pausa a rádio para evitar áudio duplicado.
    const quandoTvTocar = () => audioRef.current?.pause()
    window.addEventListener('attualplay:tv-playing', quandoTvTocar)
    return () => window.removeEventListener('attualplay:tv-playing', quandoTvTocar)
  }, [])

  function registrarParada() {
    if (!listeningStartedAtRef.current) return
    const seconds = (Date.now() - listeningStartedAtRef.current) / 1000
    listeningStartedAtRef.current = null
    void trackMatrixEvent('radio_stopped', {
      station_key: 'radio-attual-live',
      listen_seconds_bucket: matrixDurationBucket(seconds),
    })
  }

  function aoTocar() {
    setTocando(true)
    setFalhou(false)
    if (!listeningStartedAtRef.current) {
      listeningStartedAtRef.current = Date.now()
      void trackMatrixEvent('radio_started', { station_key: 'radio-attual-live' })
    }
  }

  function aoPausar() {
    setTocando(false)
    registrarParada()
  }

  function marcarFalha() {
    registrarParada()
    setTocando(false)
    setFalhou(true)
  }

  function alternar() {
    const audio = audioRef.current
    if (!radioConfigurada || !audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    audio.play().catch(marcarFalha)
  }

  return (
    <section className="radio-area">
      {radioConfigurada && (
        <audio
          ref={audioRef}
          src={LINKS.RADIO_STREAM_URL}
          preload="none"
          onPlay={aoTocar}
          onPause={aoPausar}
          onEnded={aoPausar}
          onError={marcarFalha}
        />
      )}

      <button
        className={`botao-radio ${tocando ? 'tocando' : ''}`}
        onClick={alternar}
        type="button"
      >
        <span className="radio-icone">📻</span>
        <span className="radio-texto">
          <strong>{tocando ? 'RÁDIO REPRODUZINDO' : 'OUVIR RÁDIO'}</strong>
          <small>Rádio Attual · música e informação</small>
        </span>
        <span className="radio-play">{tocando ? '⏸' : '▶'}</span>
      </button>

      {online === true && faixa && (
        <div className="radio-agora" aria-label="Música tocando agora na Rádio Attual">
          {faixa.capa && !capaFalhou
            ? <img className="radio-agora-capa" src={faixa.capa} alt="Capa da música atual" loading="lazy" onError={() => setCapaFalhou(true)} />
            : <span className="radio-agora-sem-capa" aria-hidden="true">♫</span>}
          <div className="radio-agora-info">
            <span className="radio-agora-label">TOCANDO AGORA</span>
            <strong>{faixa.titulo}</strong>
            {faixa.artista && <small>{faixa.artista}</small>}
          </div>
        </div>
      )}
      {online === false && <p className="radio-aviso">O sinal da rádio está indisponível no momento.</p>}

      {falhou && (
        <button className="botao-radio-abrir" onClick={() => setEmbedAberto(!embedAberto)} type="button">
          {embedAberto ? '✕ Fechar player da rádio' : '🎧 Abrir player da rádio'}
        </button>
      )}
      {embedAberto && (
        <iframe className="radio-embed" src={LINKS.RADIO_EMBED_URL} title="Player da Rádio Attual" allow="autoplay" />
      )}
    </section>
  )
}
