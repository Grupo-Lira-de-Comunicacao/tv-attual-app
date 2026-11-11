import { obterProgramacaoReal } from '../lib/tvGuide.js'

// Apenas a grade de programação pública do canal 1, sem painel de administração.
const XMLTV_URL = 'https://tv.tvattual.com.br/iptv/xmltv.xml'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ status: 'metodo_nao_permitido' })
  }

  const timeout = AbortSignal.timeout(7000)
  try {
    const resposta = await fetch(XMLTV_URL, {
      headers: { Accept: 'application/xml, text/xml' },
      signal: timeout,
      cache: 'no-store',
    })
    if (!resposta.ok) throw new Error('XMLTV indisponível')
    const tamanho = Number(resposta.headers.get('content-length') || 0)
    if (tamanho > 2_000_000) throw new Error('XMLTV excede limite')
    const xml = await resposta.text()
    const estado = obterProgramacaoReal(xml)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=30')
    return res.status(200).json(estado)
  } catch {
    // Falha da grade nunca deve parar o player de TV ou mostrar informação falsa.
    res.setHeader('Cache-Control', 'no-store')
    return res.status(503).json({
      status: 'indisponivel',
      fonte: 'ersatztv-xmltv',
      atual: null,
      proximo: null,
    })
  }
}
