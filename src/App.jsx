import { useEffect, useState } from 'react'
import VideoPlayer from './components/VideoPlayer.jsx'
import RadioPlayer from './components/RadioPlayer.jsx'
import SocialLinks from './components/SocialLinks.jsx'
import Contact from './components/Contact.jsx'
import Schedule from './components/Schedule.jsx'
import Participation from './components/Participation.jsx'
import PrivacyConsent from './components/PrivacyConsent.jsx'
import MatrixForYou from './components/MatrixForYou.jsx'
import { trackMatrixPage } from './services/matrixTelemetry.js'
import './App.css'

const menuItens = [
  { id: 'home', icone: '🏠', label: 'Início' },
  { id: 'programacao', icone: '📅', label: 'Programação' },
  { id: 'chat', icone: '💬', label: 'Chat' },
  { id: 'contato', icone: '📞', label: 'Contato' },
]

function App() {
  const [abaAtiva, setAbaAtiva] = useState('home')
  const [abaAnterior, setAbaAnterior] = useState('home')
  const [matrixRefreshKey, setMatrixRefreshKey] = useState(0)
  const [modoTv, setModoTv] = useState('unknown')

  useEffect(() => {
    void trackMatrixPage(abaAtiva)
  }, [abaAtiva])

  function abrirParticipacao() {
    if (abaAtiva !== 'chat') {
      setAbaAnterior(abaAtiva)
    }
    setAbaAtiva('chat')
  }

  function navegarPara(aba) {
    if (aba === 'chat') {
      abrirParticipacao()
      return
    }
    setAbaAtiva(aba)
  }

  function abrirTopicoMatrix(topicKey) {
    if (topicKey === 'programacao' || topicKey === 'eventos') {
      setAbaAtiva('programacao')
      return
    }
    if (topicKey === 'participacao') {
      abrirParticipacao()
      return
    }
    setAbaAtiva('home')
    window.setTimeout(() => {
      if (topicKey === 'radio' || topicKey === 'musica') {
        document.querySelector('.radio-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 50)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo-area">
          <img
            className="logo-simbolo"
            src="/icons/icon-192.png"
            alt="TV Attual"
            width="44"
            height="44"
          />
          <div>
            <h1 className="logo-titulo">TV Attual</h1>
            <p className="logo-lema">A informação que faz a diferença</p>
          </div>
        </div>
        <span className="badge-ao-vivo" aria-live="polite">
          {modoTv === 'live' && <span className="dot" />}
          {modoTv === 'unknown' ? 'CANAL TV ATTUAL' : 'NO AR'}
        </span>
      </header>

      <main className="conteudo">
        {abaAtiva === 'contato' ? (
          <Contact />
        ) : abaAtiva === 'programacao' ? (
          <Schedule onVoltar={() => setAbaAtiva('home')} />
        ) : abaAtiva === 'chat' ? (
          <Participation onVoltar={() => setAbaAtiva(abaAnterior)} />
        ) : (
          <>
            <VideoPlayer onSourceChange={setModoTv} />

            <section className="no-ar" aria-live="polite">
              <span className="no-ar-badge">
                {modoTv === 'live' ? 'TRANSMISSÃO DIRETA' : modoTv === 'recorded' ? 'PROGRAMAÇÃO GRAVADA' : 'CANAL TV ATTUAL'}
              </span>
              <h2>{modoTv === 'live' ? 'TV Attual — transmissão direta' : 'TV Attual — canal oficial'}</h2>
              <p>
                {modoTv === 'live'
                  ? 'Acompanhe a transmissão direta da TV Attual.'
                  : 'Assista à programação contínua. Os horários detalhados só serão mostrados quando vierem de uma fonte oficial atualizada.'}
              </p>
            </section>

            <RadioPlayer />

            <MatrixForYou refreshKey={matrixRefreshKey} onSelectTopic={abrirTopicoMatrix} />

            <button
              className="botao-participacao-home"
              onClick={abrirParticipacao}
            >
              <span className="botao-participacao-icone" aria-hidden="true">💬</span>
              <span className="botao-participacao-texto">
                <strong>Participe da TV Attual</strong>
                <small>Envie mensagens, pautas, músicas, fotos e vídeos</small>
              </span>
              <span className="botao-participacao-seta" aria-hidden="true">→</span>
            </button>

            <button
              className="botao-ver-programacao"
              onClick={() => setAbaAtiva('programacao')}
            >
              Ver programação completa →
            </button>

            <SocialLinks />
          </>
        )}
      </main>

      <PrivacyConsent
        onAnalyticsGranted={() => trackMatrixPage(abaAtiva)}
        onPersonalizationChanged={() => setMatrixRefreshKey((value) => value + 1)}
      />

      <nav className="menu-inferior">
        {menuItens.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${abaAtiva === item.id ? 'ativo' : ''}`}
            onClick={() => navegarPara(item.id)}
          >
            <span className="menu-icone">{item.icone}</span>
            <span className="menu-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
