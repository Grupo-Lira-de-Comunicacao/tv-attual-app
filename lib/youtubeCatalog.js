// YouTube público do canal oficial AttualPlay; não busca vídeos de outros canais.
export const YOUTUBE_CHANNEL_ID = 'UC5u5RAdVyJ_jarLlAnt4gXA'
export const YOUTUBE_FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + YOUTUBE_CHANNEL_ID

function xmlText(valor) {
  return String(valor || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_whole, val) => {
      const n = val.startsWith('x') ? Number.parseInt(val.slice(1), 16) : Number(val)
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''
    })
    .replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) =>
      ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" })[entity])
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mesmoCanal(id) {
  const valor = String(id || '').trim()
  // Algumas versões do Atom do YouTube omitem o prefixo UC no yt:channelId.
  return valor === YOUTUBE_CHANNEL_ID || valor === YOUTUBE_CHANNEL_ID.slice(2)
}

function tag(xml, nome) {
  // Nome vem apenas de constantes do código.
  const re = new RegExp('<' + nome + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + nome + '>', 'i')
  return xmlText(re.exec(xml)?.[1] || '')
}

export function lerFeedYoutube(xml) {
  if (typeof xml !== 'string' || xml.length > 1_200_000) throw new Error('Feed ausente ou muito grande')
  const indice = xml.search(/<entry\b/i)
  const cabecalho = indice < 0 ? xml : xml.slice(0, indice)
  if (!mesmoCanal(tag(cabecalho, 'yt:channelId'))) throw new Error('Feed de canal incorreto')

  const videos = []
  const encontrados = new Set()
  for (const [, bloco] of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const id = tag(bloco, 'yt:videoId')
    const canal = tag(bloco, 'yt:channelId')
    const title = tag(bloco, 'title').slice(0, 240)
    const originalPublished = tag(bloco, 'published')
    const published = Date.parse(originalPublished)
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !mesmoCanal(canal) || !title
      || !Number.isFinite(published) || encontrados.has(id)) continue
    encontrados.add(id)
    const summary = tag(bloco, 'media:description').slice(0, 320)
    videos.push({
      id, title, duration: null, publishedAt: new Date(published).toISOString(),
      ...(summary ? { summary } : {}),
    })
    if (videos.length >= 25) break
  }
  if (videos.length === 0) throw new Error('Feed não trouxe vídeos verificáveis')
  return videos
}

export function unirCatalogoYoutube(catalogo, novidades) {
  if (catalogo?.channelId !== YOUTUBE_CHANNEL_ID) throw new Error('Canal do catálogo não confere')
  const mapa = new Map()
  for (const video of catalogo.videos || []) {
    if (/^[A-Za-z0-9_-]{11}$/.test(video?.id || '') && typeof video?.title === 'string') {
      mapa.set(video.id, {
        id: video.id,
        title: video.title.slice(0, 240),
        duration: typeof video.duration === 'string' ? video.duration : null,
        publishedAt: video.publishedAt || null,
        ...(video.summary ? { summary: String(video.summary).slice(0, 320) } : {}),
      })
    }
  }
  for (const video of novidades) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(video?.id || '')) continue
    const anterior = mapa.get(video.id)
    mapa.set(video.id, {
      id: video.id,
      title: String(video.title).slice(0, 240),
      duration: anterior?.duration || video.duration || null,
      publishedAt: video.publishedAt || anterior?.publishedAt || null,
      ...(video.summary || anterior?.summary ? { summary: String(video.summary || anterior?.summary).slice(0, 320) } : {}),
    })
  }
  const videos = [...mapa.values()]
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '') || a.id.localeCompare(b.id))
    .slice(0, 2000)
  return {
    channelId: YOUTUBE_CHANNEL_ID,
    source: 'verified public uploads; bootstrap partial, future updates via channel feed',
    videos,
  }
}

export function textoNormalizado(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function serieDe(texto) {
  const t = textoNormalizado(texto)
  if (/\battual saude\b|\bsaude attual\b/.test(t)) return 'attual-saude'
  if (/\batitude feminina\b/.test(t)) return 'atitude-feminina'
  if (/\bconversa 360\b|\bconversa360\b/.test(t)) return 'conversa-360'
  if (/\bsem roteiro\b/.test(t)) return 'sem-roteiro'
  if (/\bconexao attual\b/.test(t)) return 'conexao-attual'
  if (/\bpapo de hoje\b/.test(t)) return 'papo-de-hoje'
  if (/\bcacapava news\b/.test(t)) return 'cacapava-news'
  return null
}

function episodioDe(texto) {
  const nome = textoNormalizado(texto)
  const sigla = /\bs\s*0*(\d{1,2})\s*e\s*0*(\d{1,3})\b/.exec(nome)
  if (sigla) return Number(sigla[1]) + '-' + Number(sigla[2])
  const escrito = /\btemporada\s+0*(\d{1,2})\s+episodio\s+0*(\d{1,3})\b/.exec(nome)
  return escrito ? Number(escrito[1]) + '-' + Number(escrito[2]) : null
}

export function duracaoYoutubeSegundos(iso) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(String(iso || ''))
  if (!m) return null
  const seconds = Number(m[1] || 0) * 86400 + Number(m[2] || 0) * 3600
    + Number(m[3] || 0) * 60 + Number(m[4] || 0)
  return seconds > 0 && Number.isFinite(seconds) ? seconds : null
}

// Só é vinculada uma correspondência única; caso ambíguo permanece sem link.
export function encontrarVideoCorrespondente(tituloGrade, duracaoSegundos, catalogo = []) {
  if (!(duracaoSegundos >= 180) || !Array.isArray(catalogo)) return null
  const nome = textoNormalizado(tituloGrade)
  const serie = serieDe(tituloGrade)
  const episodio = episodioDe(tituloGrade)
  const candidatos = []
  for (const video of catalogo) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(video?.id || '') || typeof video.title !== 'string') continue
    const candidatoTitulo = textoNormalizado(video.title)
    const candidatoSerie = serieDe(video.title)
    const candidatoEp = episodioDe(video.title)
    const segundos = duracaoYoutubeSegundos(video.duration)
    if (segundos != null && Math.abs(segundos - duracaoSegundos) > 120) continue
    const tituloEspecifico = nome.length >= 24 && nome.split(' ').length >= 4
      && (nome === candidatoTitulo || candidatoTitulo.startsWith(nome + ' '))
    const mesmaSerieEpisodio = serie && episodio && serie === candidatoSerie && episodio === candidatoEp
    if (tituloEspecifico || mesmaSerieEpisodio) candidatos.push(video)
  }
  // S01E02 ocorre em vários programas e um mesmo episódio pode ter duplicatas.
  if (candidatos.length !== 1) return null
  return {
    id: candidatos[0].id,
    titulo: candidatos[0].title,
    youtubeUrl: 'https://www.youtube.com/watch?v=' + candidatos[0].id,
  }
}
