import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const source = fs.readFileSync(new URL('../src/services/matrixTelemetry.js', import.meta.url), 'utf8')
  .replaceAll('import.meta.env.', 'globalThis.__matrixTestEnv.')

function storage() {
  const items = new Map()
  return { getItem: k => items.get(k) ?? null, setItem: (k, v) => items.set(k, String(v)), removeItem: k => items.delete(k) }
}
const tokenKey = 'matrix:person-session:v1'
const pendingKey = 'matrix:privacy-pending:v1'
let serial = 0
async function fixture() {
  globalThis.localStorage = storage()
  globalThis.sessionStorage = storage()
  globalThis.__matrixTestEnv = {
    VITE_MATRIX_API_URL: 'https://matrix.example.invalid',
    VITE_MATRIX_PUBLIC_KEY: 'fixture-public-key',
    VITE_MATRIX_TRACKING_ENABLED: 'true',
  }
  localStorage.setItem(tokenKey, JSON.stringify({
    person_token: 'synthetic-test-token', person_id: 'synthetic-person',
    expires_at: new Date(Date.now() + 60_000).toISOString()
  }))
  const module = await import('data:text/javascript;base64,' + Buffer.from(source + '\n// fixture ' + serial++).toString('base64'))
  module.setMatrixConsent({ analytics: true, adult_confirmed: true, personalization: true })
  return module
}
function response(status, body = {}) {
  return { status, ok: status >= 200 && status < 300, json: async () => body }
}
test('offline unlink preserves pending request, prevents tracking and retries only privacy', async () => {
  const m = await fixture()
  globalThis.fetch = async () => { throw Error('offline') }
  assert.equal((await m.unlinkMatrixIdentity()).ok, false)
  assert.ok(localStorage.getItem(tokenKey))
  assert.equal(m.getMatrixPrivacyPending().kind, 'unlink')
  assert.equal(m.getMatrixIdentityState().connected, false)
  assert.equal(await m.trackMatrixEvent('page_viewed'), false)
  assert.equal(await m.fetchMatrixRecommendation(), null)
  assert.equal((await m.linkMatrixIdentity('M4-fixture-test-code')).ok, false)
  globalThis.fetch = async (url, opts) => {
    assert.match(url, /\/identity\/unlink$/)
    assert.equal(JSON.parse(opts.body).person_token, 'synthetic-test-token')
    return response(200, { unlinked: true, attual_one_link_status: 'revoked' })
  }
  assert.equal((await m.retryMatrixPrivacySync()).ok, true)
  assert.equal(localStorage.getItem(tokenKey), null)
  assert.equal(localStorage.getItem(pendingKey), null)
})
test('401 or pending downstream callback is not falsely reported as confirmed revocation', async () => {
  const m = await fixture()
  globalThis.fetch = async () => response(401)
  assert.equal((await m.unlinkMatrixIdentity()).ok, false)
  globalThis.fetch = async () => response(200, { unlinked: true, attual_one_link_status: 'revoked_callback_pending' })
  assert.equal((await m.retryMatrixPrivacySync()).ok, false)
  assert.ok(localStorage.getItem(pendingKey))
  assert.ok(localStorage.getItem(tokenKey))
})
test('failed consent sync blocks collection and full revocation supersedes pending preference', async () => {
  const m = await fixture()
  globalThis.fetch = async () => response(503)
  m.setMatrixConsent({ analytics: true, adult_confirmed: true, personalization: false })
  assert.equal((await m.syncMatrixConsentServer()).ok, false)
  assert.equal(m.getMatrixPrivacyPending().kind, 'consent')
  assert.equal(await m.trackMatrixEvent('page_viewed'), false)
  m.setMatrixConsent({ analytics: false, adult_confirmed: false })
  globalThis.fetch = async (url) => {
    assert.match(url, /\/identity\/unlink$/)
    return response(200, { unlinked: true, attual_one_link_status: 'revoked' })
  }
  assert.equal((await m.unlinkMatrixIdentity()).ok, true)
  assert.equal(m.getMatrixPrivacyPending(), null)
  assert.equal(await m.trackMatrixEvent('page_viewed'), false)
})
test('retry confirms persisted consent without granting marketing', async () => {
  const m = await fixture()
  globalThis.fetch = async () => response(503)
  m.setMatrixConsent({ analytics: true, adult_confirmed: true, personalization: false })
  assert.equal((await m.syncMatrixConsentServer()).ok, false)
  globalThis.fetch = async (url, opts) => {
    assert.match(url, /\/consents$/)
    const consent = JSON.parse(opts.body).consent
    assert.equal(consent.personalization, false)
    assert.equal(consent.marketing, false)
    return response(200, { consent })
  }
  assert.equal((await m.retryMatrixPrivacySync()).ok, true)
  assert.ok(localStorage.getItem(tokenKey))
  assert.equal(m.getMatrixPrivacyPending(), null)
  assert.equal(await m.fetchMatrixRecommendation(), null)
})
