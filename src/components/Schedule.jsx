import { useState } from 'react'
import { LINKS } from '../config/links.js'
import VideoPlayer from './VideoPlayer.jsx'
import RadioPlayer from './RadioPlayer.jsx'

// A grade de exemplo foi retirada da UI. Horários reais exigem uma fonte oficial
// de programação (ErsatzTV / Atlas), ainda não conectada ao app.
export default function Schedule({ onVoltar }) {
  const [tvAberta, setTvAberta] = useState(false)

  return (
    <section className="programacao programacao-pagina">
      <div className="programacao-cabecalho">
        <span className="programacao-eyebrow">ATTUALPLAY</span>
        <h2>Programação</h2>
        <p>Acompanhe a TV Attual e a Rádio Attual em seus canais oficiais.</p>
      </div>

      <article className="programa-agora">
        <div className="programa-agora-topo">
          <span className="no-ar-badge">CANAL TV ATTUAL</span>
          <span className="programa-tipo">24 horas</span>
        </div>
        <h3>TV Attual — canal oficial</h3>
        <p>
          O canal reúne programação gravada e transmissões ao vivo.
          O player identifica a fonte real do sinal.
        </p>
        <div className="programa-acoes">
          <button className="programa-botao programa-botao-tv" type="button" onClick={() => setTvAberta(!tvAberta)}>
            {tvAberta ? '✕ Fechar TV' : '▶ Assistir TV'}
          </button>
          <a className="programa-botao programa-botao-tv" href={LINKS.TV_UNIFIED_PLAYER_URL} target="_blank" rel="noopener noreferrer">
            Abrir canal oficial
          </a>
        </div>
      </article>

      {tvAberta && (
        <div className="programacao-player">
          <div className="programacao-player-topo">
            <strong>TV Attual — canal unificado</strong>
            <button onClick={() => setTvAberta(false)} type="button" aria-label="Fechar player">✕</button>
          </div>
          <VideoPlayer />
        </div>
      )}

      <article className="programa">
        <div className="programa-conteudo">
          <h3>Rádio Attual</h3>
          <p>Ouça a rádio e confira a música atual quando os metadados estiverem disponíveis.</p>
        </div>
        <RadioPlayer />
      </article>

      <article className="programa">
        <div className="programa-conteudo">
          <h3>Grade detalhada em integração</h3>
          <p>
            Os horários ilustrativos anteriores foram removidos. A grade por programa,
            com os horários confirmados, será mostrada depois da ligação com a
            programação oficial do ErsatzTV e da emissora.
          </p>
        </div>
        <div className="programa-acoes">
          <a className="programa-botao programa-botao-tv" href={LINKS.YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
            Ver programas publicados no YouTube
          </a>
        </div>
      </article>

      <button className="botao-voltar-inicio" type="button" onClick={onVoltar}>← Voltar ao início</button>
    </section>
  )
}
