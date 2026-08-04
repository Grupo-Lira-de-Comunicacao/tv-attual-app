import { useState } from 'react'
import VideoPlayer from './components/VideoPlayer.jsx'
import RadioPlayer from './components/RadioPlayer.jsx'
import SocialLinks from './components/SocialLinks.jsx'
import Contact from './components/Contact.jsx'
import Schedule from './components/Schedule.jsx'
import { obterEstadoProgramacao } from './services/programacaoService.js'
import './App.css'

const menuItens = [
  { id: 'home', icone: '🏠', label: 'Início' },
  { id: 'programacao', icone: '📅', label: 'Programação' },
  { id: 'chat', icone: '💬', label: 'Chat' },
  { id: 'contato', icone: '📞', label: 'Contato' },
]

function App() {
  const [abaAtiva, setAbaAtiva] = useState('home')
  const { atual, proximo } = obterEstadoProgramacao()

  return (
    <div className="app">
      {/* Cabeçalho com logo e lema */}
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
          <Schedule />
        ) : (
          <>
            {/* Player de TV (modo compacto + modal expandido) */}
            <VideoPlayer />

            {/* Card No Ar Agora — preparado para futura fonte dinâmica */}
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

            {/* Botão de rádio */}
            <RadioPlayer />

            {/* Atalho para a página Programação */}
            <button
              className="botao-ver-programacao"
              onClick={() => setAbaAtiva('programacao')}
            >
              Ver programação completa →
            </button>

            {/* Redes sociais */}
            <SocialLinks />
          </>
        )}
      </main>

      {/* Menu inferior fixo */}
      <nav className="menu-inferior">
        {menuItens.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${abaAtiva === item.id ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva(item.id)}
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
