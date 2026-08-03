import { LINKS } from '../config/links.js'

// Os links vêm de src/config/links.js — edite lá, não aqui.
const redesSociais = [
  { nome: 'Instagram', icone: '📸', url: LINKS.INSTAGRAM_URL },
  { nome: 'Facebook', icone: '👍', url: LINKS.FACEBOOK_URL },
  { nome: 'YouTube', icone: '▶️', url: LINKS.YOUTUBE_URL },
  { nome: 'TikTok', icone: '🎵', url: LINKS.TIKTOK_URL },
  { nome: 'WhatsApp', icone: '💬', url: LINKS.WHATSAPP_URL },
  { nome: 'Site', icone: '🌐', url: LINKS.SITE_URL },
]

export default function SocialLinks() {
  return (
    <section className="redes">
      <h2 className="secao-titulo">Siga a TV Attual</h2>
      <div className="redes-grid">
        {redesSociais.map((rede) => (
          <a
            key={rede.nome}
            href={rede.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rede-link"
          >
            <span className="rede-icone">{rede.icone}</span>
            <span>{rede.nome}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
