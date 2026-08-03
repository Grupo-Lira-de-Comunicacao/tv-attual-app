import { LINKS } from '../config/links.js'

// Canais oficiais de contato — links em src/config/links.js
const contatos = [
  { nome: 'Site oficial', icone: '🌐', detalhe: 'tvattual.com.br', url: LINKS.SITE_URL },
  { nome: 'WhatsApp', icone: '💬', detalhe: 'Fale com a nossa equipe', url: LINKS.WHATSAPP_URL },
  { nome: 'Instagram', icone: '📸', detalhe: '@attualplay', url: LINKS.INSTAGRAM_URL },
  { nome: 'YouTube', icone: '▶️', detalhe: '@AttualPlay', url: LINKS.YOUTUBE_URL },
  { nome: 'TikTok', icone: '🎵', detalhe: '@attualplayoficial', url: LINKS.TIKTOK_URL },
  { nome: 'Facebook', icone: '👍', detalhe: '/attualplay', url: LINKS.FACEBOOK_URL },
]

export default function Contact() {
  return (
    <section className="contato">
      <h2 className="secao-titulo">Fale com a TV Attual</h2>
      <p className="contato-intro">
        Sugestões de pauta, publicidade, parcerias e participação ao vivo.
      </p>
      <div className="contato-lista">
        {contatos.map((contato) => (
          <a
            key={contato.nome}
            href={contato.url}
            target="_blank"
            rel="noopener noreferrer"
            className="contato-item"
          >
            <span className="contato-icone">{contato.icone}</span>
            <span className="contato-info">
              <strong>{contato.nome}</strong>
              <small>{contato.detalhe}</small>
            </span>
            <span className="contato-seta">→</span>
          </a>
        ))}
      </div>
    </section>
  )
}
