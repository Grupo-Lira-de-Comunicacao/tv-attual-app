import { obterProgramacaoReal } from '../lib/tvGuide.js'
import { YOUTUBE_FEED_URL, lerFeedYoutube, unirCatalogoYoutube } from '../lib/youtubeCatalog.js'
import catalogoPublico from '../data/youtube-catalog.json' with { type: 'json' }

// O EPG e o feed do YouTube são públicos, somente leitura e sem credenciais.
const XMLTV_URL = 'https://tv.tvattual.com.br/iptv/xmltv.xml'
let proximaConsultaFeed = 0
let cacheFeed = []
let statusFeed = 'nao_consultado'
let feedEmAndamento = null

async function consultarFeed() {
  if (Date.now() < proximaConsultaFeed) return cacheFeed
  if (feedEmAndamento) return feedEmAndamento
  feedEmAndamento = (async () => {
    proximaConsultaFeed = Date.now() + 120_000
    statusFeed = 'consultando'
    try {
      const resposta = await fetch(YOUTUBE_FEED_URL, {
        signal: AbortSignal.timeout(4500),
        headers: { Accept: 'application/atom+xml, application/xml' },
        cache: 'no-store',
      })
      if (!resposta.ok) {
        statusFeed = 'http-' + resposta.status
        throw new Error('Feed temporariamente indisponível')
      }
      const tamanho = Number(resposta.headers.get('content-length') || 0)
      if (tamanho > 1_200_000) throw new Error('Feed extenso')
      cacheFeed = lerFeedYoutube(await resposta.text())
      statusFeed = 'ok'
      proximaConsultaFeed = Date.now() + 300_000
    } catch (erro) {
      if (!statusFeed.startsWith('http-')) {
        statusFeed = erro?.message === 'Feed de canal incorreto' ? 'canal-invalido' :
          erro?.message === 'Feed não trouxe vídeos verificáveis' ? 'feed-vazio' : 'erro-rede-ou-validacao'
      }
      // Nunca falhar a programação porque o YouTube demorou ou ficou indisponível.
    } finally {
      feedEmAndamento = null
    }
    return cacheFeed
  })()
  return feedEmAndamento
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ status: 'metodo_nao_permitido' })
  }
  try {
    const [resposta, novidades] = await Promise.all([
      fetch(XMLTV_URL, {
        headers: { Accept: 'application/xml, text/xml' },
        signal: AbortSignal.timeout(7000),
        cache: 'no-store',
      }),
      consultarFeed(),
    ])
    if (!resposta.ok) throw new Error('XMLTV indisponível')
    const tamanho = Number(resposta.headers.get('content-length') || 0)
    if (tamanho > 2_000_000) throw new Error('XMLTV excede limite')
    const xml = await resposta.text()
    const todos = unirCatalogoYoutube(catalogoPublico, novidades)
    const estado = obterProgramacaoReal(xml, Date.now(), todos.videos)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=30')
    return res.status(200).json({
      ...estado,
      catalogoYoutube: {
        origem: novidades.length ? 'feed-publico-e-historico' : 'historico',
        videosRecentes: novidades.length,
        videosIndexados: todos.videos.length,
        statusFeed,
      },
    })
  } catch {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(503).json({
      status: 'indisponivel',
      fonte: 'ersatztv-xmltv',
      atual: null,
      proximo: null,
    })
  }
}
