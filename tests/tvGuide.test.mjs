import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { horarioXmltv, obterProgramacaoReal } from '../lib/tvGuide.js'
import handler from '../api/tv-programacao.js'

const xml = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<tv>',
  '<programme start="20261111230644 +0000" stop="20261111234906 +0000" channel="C1.145.ersatztv.org"><title>S01E02 - Attual Saúde</title></programme>',
  '<programme start="20261111234906 +0000" stop="20261111234917 +0000" channel="C1.145.ersatztv.org"><title>Introdução Attual Saúde</title></programme>',
  '<programme start="20261111234917 +0000" stop="20261111234925 +0000" channel="C1.145.ersatztv.org"><title>apresentacao</title></programme>',
  '<programme start="20261111234925 +0000" stop="20261111234933 +0000" channel="C1.145.ersatztv.org"><title>Criação_de_Vídeo_a_Partir_de_Imagem</title></programme>',
  '<programme start="20261111234933 +0000" stop="20261112003156 +0000" channel="C1.145.ersatztv.org"><title>S01E02 - Attual Saúde</title></programme>',
  '</tv>',
].join('')

const noArAgora = Date.parse('2026-11-11T23:36:00Z')

test('converte horários XMLTV UTC em instantes absolutos', () => {
  assert.equal(horarioXmltv('20261111230644 +0000'), Date.parse('2026-11-11T23:06:44Z'))
  assert.equal(horarioXmltv('20261111200644 -0300'), Date.parse('2026-11-11T23:06:44Z'))
  assert.ok(Number.isNaN(horarioXmltv('horario_invalido')))
})

test('identifica programa correto às 20h36 no horário de São Paulo', () => {
  const estado = obterProgramacaoReal(xml, noArAgora)
  assert.equal(estado.status, 'ok')
  assert.equal(estado.atual.tituloGrade, 'S01E02 - Attual Saúde')
  assert.match(estado.atual.titulo, /Lívia Ferraz Campos/)
  assert.match(estado.atual.titulo, /intestino/)
  assert.equal(estado.atual.youtubeUrl, 'https://www.youtube.com/watch?v=_mgU8E6fSds')
  assert.equal(estado.atual.inicio, '2026-11-11T23:06:44.000Z')
  assert.equal(estado.proximo, null) // vinhetas e repetição não são novo programa
})

test('não cria link de YouTube para título não confirmado', () => {
  const fonte = '<tv><programme start="20261111230000 +0000" stop="20261111235500 +0000" channel="C1.145.ersatztv.org"><title>Programa desconhecido</title></programme></tv>'
  const estado = obterProgramacaoReal(fonte, noArAgora)
  assert.equal(estado.atual.titulo, 'Programa desconhecido')
  assert.equal(estado.atual.youtubeUrl, null)
})

test('não confunde canais e não inventa programa sem grade válida', () => {
  const outro = xml.replaceAll('C1.145.ersatztv.org', 'CANAL-EQUIVOCADO')
  assert.equal(obterProgramacaoReal(outro, noArAgora).status, 'indisponivel')
  assert.equal(obterProgramacaoReal(xml, Date.parse('2026-11-15T23:36:00Z')).atual, null)
  assert.throws(() => obterProgramacaoReal('x'.repeat(2_000_001), noArAgora))
})

test('ignora vinhetas curtas e mostra próximo programa quando confirmado', () => {
  const fonte = xml.replace(
    '</tv>',
    '<programme start="20261112003156 +0000" stop="20261112010156 +0000" channel="C1.145.ersatztv.org"><title>Conversa 360</title></programme></tv>'
  )
  const estado = obterProgramacaoReal(fonte, noArAgora)
  assert.equal(estado.proximo.titulo, 'Conversa 360')
  assert.equal(estado.proximo.youtubeUrl, null)
})

test('a UI deixa de usar a grade de exemplo e inclui link editorial contextual', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const schedule = readFileSync(new URL('../src/components/Schedule.jsx', import.meta.url), 'utf8')
  const now = readFileSync(new URL('../src/components/NowPlaying.jsx', import.meta.url), 'utf8')
  const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
  assert.match(app, /<NowPlaying \/>/)
  assert.doesNotMatch(app, /obterEstadoProgramacao|Jornal Attual/)
  assert.doesNotMatch(schedule, /obterProgramacao/)
  assert.match(now, /atual\.youtubeUrl/)
  assert.match(now, /\/api\/tv-programacao/)
  assert.match(now, /NO AR AGORA/)
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
})

test('endpoint JSON usa somente origem pública e trata falhas sem falsa programação', async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(url)
    return {
      ok: true,
      headers: { get: () => null },
      text: async () => xml,
    }
  }
  const response = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; return this },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  try {
    await handler({ method: 'GET' }, response)
    assert.equal(response.statusCode, 200)
    assert.deepEqual(calls, ['https://tv.tvattual.com.br/iptv/xmltv.xml'])
    assert.equal(response.body.fonte, 'ersatztv-xmltv')
    assert.ok(response.headers['Cache-Control'].includes('s-maxage'))
    const denied = { ...response, headers: {}, statusCode: 200 }
    await handler({ method: 'POST' }, denied)
    assert.equal(denied.statusCode, 405)
  } finally {
    globalThis.fetch = originalFetch
  }
})
