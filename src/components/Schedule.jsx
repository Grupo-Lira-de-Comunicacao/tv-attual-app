import { useRef, useState } from 'react'
import { obterProgramacao } from '../services/programacaoService.js'
import { LINKS } from '../config/links.js'
import VideoPlayer from './VideoPlayer.jsx'

// Página Programação — grade completa do dia.
// A origem dos dados fica encapsulada no service para permitir troca futura por API/Supabase.
export default function Schedule({ onVoltar }) {
  const programacao = obterProgramacao()
  const audioRef = useRef(null)
  const [radioTocando, setRadioTocando] = useState(false)
  const [radioErro, setRadioErro] = useState(false)
  const [tvAberta, setTvAberta] = useState(false)

  const agora = new Date()
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes()
  const paraMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
  }
  const atual = [...programacao].reverse().find((item) => paraMinutos(item.hora) <= minutosAgora)
    || programacao[programacao.length - 1]

  function alternarRadio() {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      setRadioTocando(false)
      return
    }
    audio.play()
      .then(() => {
        setRadioTocando(true)
        setRadioErro(false)
      })
      .catch(() => {
        setRadioTocando(false)
        setRadioErro(true)
      })
  }

  return (
    <section className="programacao programacao-pagina">
      <audio ref={audioRef} src={LINKS.RADIO_STREAM_URL} preload="none" onEnded={() => setRadioTocando(false)} onError={() => setRadioErro(true)} />

      <div className="programacao-cabecalho">
        <span className="programacao-eyebrow">ATTUALPLAY</span>
        <h2>Programação</h2>
        <p>Confira os horários da TV Attual e Rádio Attual.</p>
      </div>

      <article className="programa-agora">
        <div className="programa-agora-topo">
          <span className="no-ar-badge"><span className="dot" /> AGORA NO AR</span>
          <span className="programa-hora">{atual.hora}</span>
        </div>
        <h3>{atual.titulo}</h3>
        <p>{atual.descricao}</p>
        <span className="programa-tipo">{atual.tipo}</span>
      </article>

      {tvAberta && (
        <div className="programacao-player">
          <div className="programacao-player-topo">
            <strong>TV Attual ao vivo</strong>
            <button onClick={() => setTvAberta(false)} aria-label="Fechar player">✕</button>
          </div>
          <VideoPlayer />
        </div>
      )}

      <h3 className="programacao-subtitulo">Programação de hoje</h3>
      <div className="programacao-lista">
        {programacao.map((programa) => (
          <article key={programa.hora} className={`programa ${programa === atual ? 'programa-atual' : ''}`}>
            <div className="programa-card-topo">
              <span className="programa-hora">{programa.hora}</span>
              <span className="programa-tipo">{programa.tipo}</span>
            </div>
            <div className="programa-conteudo">
              <h3>{programa.titulo}</h3>
              <p>{programa.descricao}</p>
            </div>
            <div className="programa-acoes">
              {programa.tipo.includes('TV') && (
                <button className="programa-botao programa-botao-tv" onClick={() => setTvAberta(true)}>▶ Assistir TV</button>
              )}
              {programa.tipo.includes('Rádio') && (
                <button className="programa-botao programa-botao-radio" onClick={alternarRadio}>
                  {radioTocando ? '❚❚ Pausar rádio' : '♫ Ouvir rádio'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {radioErro && (
        <a className="radio-fallback" href={LINKS.RADIO_EMBED_URL} target="_blank" rel="noopener noreferrer">Abrir o player oficial da rádio ↗</a>
      )}

      <button className="botao-voltar-inicio" onClick={onVoltar}>← Voltar ao início</button>
    </section>
  )
}
