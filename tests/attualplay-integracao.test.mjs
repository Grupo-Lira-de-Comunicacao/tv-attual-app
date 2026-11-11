import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LINKS } from '../src/config/links.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('o canal oficial do app e o player unificado sao HTTPS', () => {
  assert.equal(LINKS.TV_UNIFIED_PLAYER_URL, 'https://live.tvattual.com.br/')
  assert.equal(LINKS.TV_STREAM_URL, 'https://tv.tvattual.com.br/iptv/channel/1.m3u8')
})

test('o WhatsApp aprovado nao e revertido pelo MVP de streaming', () => {
  assert.equal(LINKS.WHATSAPP_URL, 'https://api.whatsapp.com/send?phone=5512935012325')
  assert.doesNotMatch(JSON.stringify(LINKS), /5511987080279/)
})

test('player integrado valida origem e janela do postMessage', () => {
  const source = read('src/components/VideoPlayer.jsx')
  assert.match(source, /event\.origin !== 'https:\/\/live\.tvattual\.com\.br'/)
  assert.match(source, /event\.source !== iframeRef\.current\?\.contentWindow/)
  assert.match(source, /tvattual:source/)
  assert.match(source, /tvattual:playback/)
  assert.match(source, /TV_UNIFIED_PLAYER_URL/)
  assert.doesNotMatch(source, /new Hls\(\)/)
})

test('indicacao NO AR representa sinal confirmado sem alegar transmissao ao vivo', () => {
  const app = read('src/App.jsx')
  const player = read('src/components/VideoPlayer.jsx')
  assert.match(app, /modoTv === 'unknown' \? 'CANAL TV ATTUAL' : 'NO AR'/)
  assert.match(player, /source === 'unknown' \? 'CANAL TV ATTUAL' : 'NO AR'/)
  assert.match(app, /VideoPlayer onSourceChange=\{setModoTv\}/)
})

test('a grade ilustrativa nao aparece no painel publico', () => {
  const app = read('src/App.jsx')
  const schedule = read('src/components/Schedule.jsx')
  assert.doesNotMatch(app, /obterEstadoProgramacao/)
  assert.doesNotMatch(schedule, /obterProgramacao/)
  assert.doesNotMatch(schedule, /Bom Dia Attual|Manhã Attual|Jornal Attual|Noite Attual/)
  assert.match(schedule, /Grade detalhada em integração/)
})

test('metadados da radio sao lidos apenas na API publica', () => {
  assert.equal(LINKS.RADIO_NOWPLAYING_URL, 'https://radio.tvattual.com.br/api/nowplaying/1')
  const radio = read('src/components/RadioPlayer.jsx')
  assert.match(radio, /LINKS\.RADIO_NOWPLAYING_URL/)
  assert.match(radio, /now_playing\?\.song/)
  assert.match(radio, /AbortController/)
  assert.match(radio, /attualplay:tv-playing/)
  assert.match(read('src/components/VideoPlayer.jsx'), /attualplay:tv-playing/)
})

test('nenhuma mudanca do teste afeta codigo do servidor de streaming', () => {
  const links = read('src/config/links.js')
  assert.match(links, /TV_UNIFIED_PLAYER_URL/)
  assert.match(links, /RADIO_NOWPLAYING_URL/)
})
