import { useEffect, useState } from 'react'

const INTERVALO_ATUALIZACAO_MS = 45_000

function formatarHora(iso) {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
}

export default function NowPlaying({ modoTv = 'recorded' }) {
  const [estado, setEstado] = useState({ atual: null, proximo: null, carregando: true })

  useEffect(() => {
    let ativo = true
    let controle = null

    async function atualizar() {
      controle?.abort()
      controle = new AbortController()
      try {
        const resposta = await fetch('/api/tv-programacao', {
          signal: controle.signal,
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        if (!resposta.ok) throw new Error('Programação não disponível')
        const dados = await resposta.json()
        if (!ativo) return
        const valida = dados && dados.status === 'ok' && dados.atual
        setEstado({
          atual: valida ? dados.atual : null,
          proximo: valida ? dados.proximo : null,
          carregando: false,
        })
      } catch (erro) {
        if (!ativo || erro?.name === 'AbortError') return
        setEstado({ atual: null, proximo: null, carregando: false })
      }
    }

    void atualizar()
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === 'visible') void atualizar()
    }, INTERVALO_ATUALIZACAO_MS)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void atualizar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      ativo = false
      controle?.abort()
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [])

  const tvDireta = modoTv === 'live'
  const atual = tvDireta ? null : estado.atual
  const proximo = tvDireta ? null : estado.proximo

  return (
    <section className="no-ar" aria-label="O que está no ar na TV Attual" aria-live="polite">
      <span className="no-ar-badge"><span className="dot" /> NO AR AGORA</span>

      {tvDireta ? (
        <>
          <h2>TV Attual — transmissão direta</h2>
          <p>Transmissão em andamento. A programação gravada será exibida quando o sinal direto terminar.</p>
        </>
      ) : atual ? (
        <>
          <h2>{atual.titulo}</h2>
          <p>{atual.descricao || 'Acompanhe o conteúdo atual da TV Attual.'}</p>
          {atual.youtubeUrl && (
            <a className="no-ar-youtube" href={atual.youtubeUrl} target="_blank" rel="noopener noreferrer">
              ▶ Ver este episódio no YouTube ↗
            </a>
          )}
          {proximo && (
            <span className="no-ar-proximo">
              <strong>A seguir:</strong> {proximo.titulo}
              {proximo.inicio && ' · ' + formatarHora(proximo.inicio)}
            </span>
          )}
        </>
      ) : (
        <>
          <h2>TV Attual — programação 24 horas</h2>
          <p>
            {estado.carregando
              ? 'Consultando a programação oficial...'
              : 'A programação continua no player. Os detalhes do episódio ainda não estão disponíveis.'}
          </p>
        </>
      )}
    </section>
  )
}
