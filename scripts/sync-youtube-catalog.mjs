import { readFile, writeFile } from 'node:fs/promises'
import { YOUTUBE_FEED_URL, lerFeedYoutube, unirCatalogoYoutube } from '../lib/youtubeCatalog.js'

const destino = new URL('../data/youtube-catalog.json', import.meta.url)
const atualTexto = await readFile(destino, 'utf8')
const catalogo = JSON.parse(atualTexto)

const resposta = await fetch(YOUTUBE_FEED_URL, {
  signal: AbortSignal.timeout(15000),
  headers: { Accept: 'application/atom+xml, application/xml' },
})
if (!resposta.ok) throw new Error('YouTube Feed HTTP ' + resposta.status)
const tamanho = Number(resposta.headers.get('content-length') || 0)
if (tamanho > 1_200_000) throw new Error('Feed excede tamanho máximo')
const novos = lerFeedYoutube(await resposta.text())
const atualizado = unirCatalogoYoutube(catalogo, novos)
const novoTexto = JSON.stringify(atualizado, null, 2) + '\n'
if (novoTexto !== atualTexto) {
  await writeFile(destino, novoTexto, 'utf8')
  console.log('Catálogo público atualizado: ' + atualizado.videos.length + ' vídeos (' + novos.length + ' no feed)')
} else {
  console.log('Catálogo já está atualizado: ' + atualizado.videos.length + ' vídeos')
}
