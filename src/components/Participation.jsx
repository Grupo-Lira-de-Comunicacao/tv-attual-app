import { LINKS } from '../config/links.js'

const ACOES = [
  {
    icone: '💬',
    titulo: 'Fale com a TV Attual',
    descricao: 'Envie uma mensagem diretamente para nossa equipe.',
    botao: 'Falar no WhatsApp',
    mensagem: 'Olá, TV Attual! Vim pelo AttualPlay e gostaria de falar com vocês.',
  },
  {
    icone: '📰',
    titulo: 'Sugira uma pauta',
    descricao: 'Tem uma notícia, história ou assunto importante de Caçapava e região? Conte para a gente.',
    botao: 'Sugerir pauta',
    mensagem: 'Olá, TV Attual! Gostaria de sugerir uma pauta para a programação:',
  },
  {
    icone: '🎵',
    titulo: 'Peça sua música',
    descricao: 'Peça sua música e participe da programação da Rádio Attual.',
    botao: 'Pedir música',
    mensagem: 'Olá, Rádio Attual! Gostaria de pedir uma música:',
  },
  {
    icone: '📺',
    titulo: 'Participe ao vivo',
    descricao: 'Quer participar dos nossos programas? Fale com a produção.',
    botao: 'Quero participar',
    mensagem: 'Olá, TV Attual! Gostaria de participar da programação ao vivo.',
  },
  {
    icone: '📸',
    titulo: 'Envie foto ou vídeo',
    descricao: 'Registre o que está acontecendo na sua comunidade e envie para a TV Attual.',
    botao: 'Enviar conteúdo',
    mensagem: 'Olá, TV Attual! Gostaria de enviar uma foto ou vídeo para a equipe.',
  },
  {
    icone: '📢',
    titulo: 'Denúncia / Comunidade',
    descricao: 'Envie informações sobre problemas, acontecimentos e situações importantes da sua região.',
    botao: 'Enviar informação',
    mensagem: 'Olá, TV Attual! Gostaria de enviar uma informação sobre um acontecimento da comunidade:',
  },
]

function criarLinkWhatsApp(mensagem) {
  const separador = LINKS.WHATSAPP_URL.includes('?') ? '&' : '?'
  return `${LINKS.WHATSAPP_URL}${separador}text=${encodeURIComponent(mensagem)}`
}

export default function Participation({ onVoltar }) {
  return (
    <section className="participacao-pagina" aria-labelledby="participacao-titulo">
      <div className="participacao-cabecalho">
        <span className="participacao-eyebrow">SUA VOZ NA ATTUAL</span>
        <h2 id="participacao-titulo">Participe da TV Attual</h2>
        <p>
          Sua voz também faz parte da nossa programação. Fale com a TV Attual,
          mande sugestões, peça músicas e participe.
        </p>
      </div>

      <div className="participacao-destaque">
        <span className="participacao-destaque-icone" aria-hidden="true">📲</span>
        <div>
          <strong>Contato direto pelo WhatsApp</strong>
          <small>Escolha uma opção abaixo e sua mensagem já vai preparada.</small>
        </div>
      </div>

      <div className="participacao-grid">
        {ACOES.map((acao) => (
          <article className="participacao-card" key={acao.titulo}>
            <div className="participacao-card-topo">
              <span className="participacao-icone" aria-hidden="true">{acao.icone}</span>
              <div>
                <h3>{acao.titulo}</h3>
                <p>{acao.descricao}</p>
              </div>
            </div>

            <a
              className="participacao-botao"
              href={criarLinkWhatsApp(acao.mensagem)}
              target="_blank"
              rel="noreferrer"
              aria-label={`${acao.botao} pelo WhatsApp`}
            >
              {acao.botao}
              <span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>

      <p className="participacao-aviso">
        Ao continuar, o WhatsApp será aberto para você revisar e enviar a mensagem.
      </p>

      <button className="botao-voltar-inicio" type="button" onClick={onVoltar}>
        ← Voltar para a tela principal
      </button>
    </section>
  )
}
