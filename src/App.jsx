import { useEffect, useState } from 'react'
import VideoPlayer from './components/VideoPlayer.jsx'
import RadioPlayer from './components/RadioPlayer.jsx'
import SocialLinks from './components/SocialLinks.jsx'
import Contact from './components/Contact.jsx'
import Schedule from './components/Schedule.jsx'
import Participation from './components/Participation.jsx'
import PrivacyConsent from './components/PrivacyConsent.jsx'
import MatrixForYou from './components/MatrixForYou.jsx'
import { obterEstadoProgramacao } from './services/programacaoService.js'
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
  const { atual, proximo } = obterEstadoProgramacao()

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
        <span className="badge-ao-vivo">
          <span className="dot" /> AO VIVO
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
            <VideoPlayer />

            <section className="no-ar">
              <span className="no-ar-badge"><span className="dot" /> NO AR AGORA</span>
              <h2>{atual?.titulo || 'TV Attual'}</h2>
              <p>{atual?.descricao || 'Acompanhe a programação ao vivo da TV Attual.'}</p>
              {proximo && (
                <span className="no-ar-proximo">
                  <strong>A seguir:</strong> {proximo.titulo} · {proximo.hora}
                </span>
              )}
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
