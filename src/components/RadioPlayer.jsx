import { useRef, useState } from 'react'
import { LINKS, linkConfigurado } from '../config/links.js'

/*
  Rádio Attual:
  1º tenta tocar o stream direto (RADIO_STREAM_URL) na tag <audio>;
  se o navegador não conseguir, mostra o botão "Abrir player da rádio",
  que expande o player oficial (RADIO_EMBED_URL) em um iframe.
*/
export default function RadioPlayer() {
  const [tocando, setTocando] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const [embedAberto, setEmbedAberto] = useState(false)
  const audioRef = useRef(null)
  const radioConfigurada = linkConfigurado(LINKS.RADIO_STREAM_URL)

  function marcarFalha() {
    setTocando(false)
    setFalhou(true)
  }

  function alternar() {
    const audio = audioRef.current
    if (!radioConfigurada || !audio) {
      setTocando(!tocando)
      return
    }

    if (tocando) {
      audio.pause()
      setTocando(false)
      return
    }

    audio
      .play()
      .then(() => {
        setTocando(true)
        setFalhou(false)
      })
      .catch(marcarFalha)
  }

  return (
    <section className="radio-area">
      {radioConfigurada && (
        <audio
          ref={audioRef}
          src={LINKS.RADIO_STREAM_URL}
          preload="none"
          onError={marcarFalha}
        />
      )}

      <button
        className={`botao-radio ${tocando ? 'tocando' : ''}`}
        onClick={alternar}
      >
        <span className="radio-icone">📻</span>
        <span className="radio-texto">
          <strong>{tocando ? 'RÁDIO NO AR' : 'OUVIR RÁDIO'}</strong>
          <small>Rádio Attual · música e informação</small>
        </span>
        <span className="radio-play">{tocando ? '⏸' : '▶'}</span>
      </button>

      {/* Fallback: player oficial da rádio em iframe expansível */}
      {falhou && (
        <button
          className="botao-radio-abrir"
          onClick={() => setEmbedAberto(!embedAberto)}
        >
          {embedAberto ? '✕ Fechar player da rádio' : '🎧 Abrir player da rádio'}
        </button>
      )}

      {embedAberto && (
        <iframe
          className="radio-embed"
          src={LINKS.RADIO_EMBED_URL}
          title="Player da Rádio Attual"
          allow="autoplay"
        />
      )}
    </section>
  )
}
