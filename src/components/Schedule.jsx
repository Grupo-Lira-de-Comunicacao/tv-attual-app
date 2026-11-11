import { useState } from 'react'
import VideoPlayer from './VideoPlayer.jsx'
import RadioPlayer from './RadioPlayer.jsx'
import NowPlaying from './NowPlaying.jsx'
import { LINKS } from '../config/links.js'

// A tela não deve exibir horários fictícios. Fonte editorial: EPG do ErsatzTV.
export default function Schedule({ onVoltar }) {
  const [tvAberta, setTvAberta] = useState(false)

  return (
    <section className="programacao programacao-pagina">
      <div className="programacao-cabecalho">
        <span className="programacao-eyebrow">ATTUALPLAY</span>
        <h2>Programação</h2>
        <p>O conteúdo atual é atualizado conforme a grade oficial do canal.</p>
      </div>

      <NowPlaying />

      <div className="programa-acoes">
        <button className="programa-botao programa-botao-tv" type="button" onClick={() => setTvAberta(!tvAberta)}>
          {tvAberta ? '✕ Fechar TV' : '▶ Assistir TV Attual'}
        </button>
      </div>

      {tvAberta && (
        <div className="programacao-player">
          <div className="programacao-player-topo">
            <strong>TV Attual — NO AR</strong>
            <button onClick={() => setTvAberta(false)} type="button" aria-label="Fechar player">✕</button>
          </div>
          <VideoPlayer />
        </div>
      )}

      <article className="programa">
        <div className="programa-conteudo">
          <h3>Rádio Attual</h3>
          <p>Ouça nossa rádio, 24 horas.</p>
        </div>
        <RadioPlayer />
      </article>

      <p className="programacao-aviso">
        Os horários detalhados são apresentados somente quando confirmados pela grade de programação.
      </p>

      <a className="programa-botao programa-botao-tv" href={LINKS.YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
        Ver outros programas no YouTube ↗
      </a>

      <button className="botao-voltar-inicio" type="button" onClick={onVoltar}>← Voltar ao início</button>
    </section>
  )
}
