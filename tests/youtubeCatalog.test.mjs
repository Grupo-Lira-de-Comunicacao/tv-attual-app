import test from 'node:test'
import assert from 'node:assert/strict'
import {
  YOUTUBE_CHANNEL_ID, YOUTUBE_FEED_URL,
  lerFeedYoutube, unirCatalogoYoutube, encontrarVideoCorrespondente,
  duracaoYoutubeSegundos,
} from '../lib/youtubeCatalog.js'
import { obterProgramacaoReal } from '../lib/tvGuide.js'
import catalogoInicial from '../data/youtube-catalog.json' with { type: 'json' }

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">',
  '<yt:channelId>' + YOUTUBE_CHANNEL_ID + '</yt:channelId>',
  '<entry><yt:videoId>bnez6zK5nm0</yt:videoId><yt:channelId>' + YOUTUBE_CHANNEL_ID + '</yt:channelId>',
  '<title>🌷 ATITUDE FEMININA — S01E35 | Simone Moreira &amp; comunidade</title>',
  '<published>2026-11-11T20:30:38+00:00</published><media:group><media:description>Atitude Feminina: Simone</media:description></media:group></entry>',
  '<entry><yt:videoId>oI0ttiifkNM</yt:videoId><yt:channelId>' + YOUTUBE_CHANNEL_ID + '</yt:channelId>',
  '<title>SEM ROTEIRO S01E03 | Cibele Velozo e Bruna Rizzo</title>',
  '<published>2026-11-09T21:03:00+00:00</published></entry>',
  '</feed>',
].join('')

test('feed público AttualPlay: valida canal, IDs e entidades XML, sem API key', () => {
  const videos = lerFeedYoutube(feed)
  assert.equal(videos.length, 2)
  assert.equal(videos[0].id, 'bnez6zK5nm0')
  assert.match(videos[0].title, /Simone Moreira & comunidade/)
  assert.ok(YOUTUBE_FEED_URL.includes(YOUTUBE_CHANNEL_ID))
  assert.equal(videos[0].summary, 'Atitude Feminina: Simone')
  assert.equal(lerFeedYoutube(feed.replaceAll(YOUTUBE_CHANNEL_ID, YOUTUBE_CHANNEL_ID.slice(2))).length, 2)
  assert.throws(() => lerFeedYoutube(feed.replaceAll(YOUTUBE_CHANNEL_ID, 'UC0000000000000000000000')))
  assert.throws(() => lerFeedYoutube('not a feed'))
  assert.throws(() => lerFeedYoutube('x'.repeat(1_200_001)))
})

test('catalogo preserva vídeos anteriores, durações e unifica novos sem duplicar', () => {
  const atual = unirCatalogoYoutube(catalogoInicial, lerFeedYoutube(feed))
  assert.ok(atual.videos.length >= 26)
  assert.equal(new Set(atual.videos.map(v => v.id)).size, atual.videos.length)
  assert.ok(atual.videos.some(v => v.id === '_mgU8E6fSds'))
  assert.ok(atual.videos.some(v => v.id === 'aBYW9CNIti4'))
  assert.equal(atual.videos.find(v => v.id === 'aBYW9CNIti4').duration, 'PT45M54S')
})

test('associa episódio Atitude Feminina ao vídeo correto sem necessidade de duração RSS', () => {
  const videos = unirCatalogoYoutube(catalogoInicial, lerFeedYoutube(feed)).videos
  const video = encontrarVideoCorrespondente('S01E35 - Atitude Feminina', 2700, videos)
  assert.equal(video.id, 'bnez6zK5nm0')
  assert.equal(video.youtubeUrl, 'https://www.youtube.com/watch?v=bnez6zK5nm0')
})

test('não associa S01E35 de Sem Roteiro ao episódio S01E35 de Atitude Feminina', () => {
  const videos = lerFeedYoutube(feed)
  assert.equal(encontrarVideoCorrespondente('S01E35 - Sem Roteiro', 2600, videos), null)
  assert.equal(encontrarVideoCorrespondente('S01E35', 2600, videos), null)
})

test('recusa duplicatas de mesma série e temporada/episódio', () => {
  const duplicados = [
    { id: '12345678901', title: 'Conversa 360 S03E14 | Amadeu', duration: null },
    { id: '12345678902', title: 'Conversa 360 S03E14 | Yoga', duration: null },
  ]
  assert.equal(encontrarVideoCorrespondente('S03E14 - Conversa 360', 4000, duplicados), null)
})

test('recusa links com duração incompatível e vinhetas curtas', () => {
  assert.equal(duracaoYoutubeSegundos('PT45M54S'), 2754)
  const video = { id: '12345678901', title: 'Atitude Feminina S01E34 | Rosilene', duration: 'PT45M54S' }
  assert.equal(encontrarVideoCorrespondente('S01E34 - Atitude Feminina', 3600, [video]), null)
  assert.equal(encontrarVideoCorrespondente('S01E34 - Atitude Feminina', 25, [video]), null)
  assert.equal(encontrarVideoCorrespondente('S01E34 - Atitude Feminina', 2754, [video])?.id, video.id)
})

test('EPG associa vídeo novo pela grade sem inventar identidade', () => {
  const xml = '<tv><programme start="20261111230000 +0000" stop="20261111234500 +0000" channel="C1.145.ersatztv.org"><title>S01E35 - Atitude Feminina</title></programme></tv>'
  const atual = obterProgramacaoReal(xml, '2026-11-11T23:15:00Z', lerFeedYoutube(feed))
  assert.equal(atual.status, 'ok')
  assert.equal(atual.atual.fonteYoutube, 'catalogo-automatico')
  assert.equal(atual.atual.youtubeUrl, 'https://www.youtube.com/watch?v=bnez6zK5nm0')
  const invalido = obterProgramacaoReal(xml.replace('Atitude Feminina', 'Programa Desconhecido'), '2026-11-11T23:15:00Z', lerFeedYoutube(feed))
  assert.equal(invalido.atual.youtubeUrl, null)
})

test('o catálogo inicial é composto de vídeos públicos e não contém credenciais', () => {
  assert.equal(catalogoInicial.channelId, YOUTUBE_CHANNEL_ID)
  assert.ok(catalogoInicial.videos.length >= 20)
  for (const video of catalogoInicial.videos) {
    assert.match(video.id, /^[A-Za-z0-9_-]{11}$/)
    assert.equal(typeof video.title, 'string')
    assert.ok(!('privacyStatus' in video))
  }
})
