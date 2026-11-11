// Leitura da grade XMLTV pública do ErsatzTV. Não acessa painel ou credenciais.
export const XMLTV_CHANNEL_ID = 'C1.145.ersatztv.org'

const PUBLICACOES_VERIFICADAS = Object.freeze({
  'S01E02 - Attual Saúde': {
    titulo: 'Attual Saúde — A conexão entre mente e intestino | Dra. Lívia Ferraz Campos',
    descricao: 'Entrevista do Attual Saúde com a Dra. Lívia Ferraz Campos.',
    youtubeId: '_mgU8E6fSds',
    duracaoSegundos: 42 * 60 + 31,
  },
})

function textoXml(texto) {
  return String(texto || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi, (_m, entidade) => {
      const entidades = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
      const chave = entidade.toLowerCase()
      if (chave in entidades) return entidades[chave]
      const numero = chave.startsWith('#x')
        ? Number.parseInt(chave.slice(2), 16)
        : Number.parseInt(chave.slice(1), 10)
      return Number.isInteger(numero) && numero > 0 && numero <= 0x10ffff
        ? String.fromCodePoint(numero)
        : ''
    })
    .trim()
    .slice(0, 200)
}

function atributoXml(atributos, nome) {
  const pattern = new RegExp('(?:^|\\s)' + nome + '\\s*=\\s*(["\\x27])([^"\\x27]*)\\1', 'i')
  return pattern.exec(atributos)?.[2] || ''
}

// XMLTV: 20261111230644 +0000 -> millis UTC
export function horarioXmltv(entrada) {
  const match = /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)\s*([+-])(\d\d)(\d\d)$/.exec(String(entrada || '').trim())
  if (!match) return Number.NaN
  const [y, month, d, h, m, s, sinal, tzH, tzM] = match.slice(1)
  if (+month < 1 || +month > 12 || +d < 1 || +d > 31 || +h > 23 || +m > 59 || +s > 59 || +tzH > 14 || +tzM > 59) return Number.NaN
  const deslocamento = (sinal === '+' ? 1 : -1) * (+tzH * 60 + +tzM) * 60_000
  return Date.UTC(+y, +month - 1, +d, +h, +m, +s) - deslocamento
}

function enriquecerItem(item) {
  const publicacao = PUBLICACOES_VERIFICADAS[item.titulo]
  const duracaoSegundos = (item.fim - item.inicio) / 1_000
  // Evita associar um vídeo diferente que tenha o mesmo título de arquivo.
  const comprovado = publicacao && Math.abs(publicacao.duracaoSegundos - duracaoSegundos) < 120
  return {
    titulo: comprovado ? publicacao.titulo : item.titulo,
    descricao: comprovado ? publicacao.descricao : '',
    tituloGrade: item.titulo,
    inicio: new Date(item.inicio).toISOString(),
    fim: new Date(item.fim).toISOString(),
    youtubeUrl: comprovado ? 'https://www.youtube.com/watch?v=' + publicacao.youtubeId : null,
  }
}

export function obterProgramacaoReal(xml, instante = Date.now()) {
  if (typeof xml !== 'string' || xml.length > 2_000_000) throw new Error('XMLTV inválido ou muito extenso')
  const agora = typeof instante === 'number' ? instante : new Date(instante).getTime()
  if (!Number.isFinite(agora)) throw new Error('Hora de consulta inválida')
  const itens = []
  const blocos = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/gi

  for (const match of xml.matchAll(blocos)) {
    if (atributoXml(match[1], 'channel') !== XMLTV_CHANNEL_ID) continue
    const inicio = horarioXmltv(atributoXml(match[1], 'start'))
    const fim = horarioXmltv(atributoXml(match[1], 'stop'))
    if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) continue
    const tituloRaw = /<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i.exec(match[2])?.[1]
    const titulo = textoXml(tituloRaw)
    if (!titulo) continue
    itens.push({ titulo, inicio, fim })
  }
  itens.sort((a, b) => a.inicio - b.inicio)
  const atual = itens.find((item) => item.inicio <= agora && agora < item.fim)
  if (!atual) return { status: 'indisponivel', fonte: 'ersatztv-xmltv', atual: null, proximo: null }

  // Vinhetas e transições de segundos não são um novo "programa a seguir".
  // Se a mesma entrevista repete, não inventar um próximo programa diferente.
  const proximo = itens.find((item) =>
    item.inicio >= atual.fim
    && item.fim - item.inicio >= 120_000
    && item.titulo !== atual.titulo
  )

  return {
    status: 'ok',
    fonte: 'ersatztv-xmltv',
    atual: enriquecerItem(atual),
    proximo: proximo ? enriquecerItem(proximo) : null,
  }
}
