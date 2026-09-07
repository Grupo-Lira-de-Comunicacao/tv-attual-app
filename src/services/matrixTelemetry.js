const API_URL = String(import.meta.env.VITE_MATRIX_API_URL || '').replace(/\/$/, '')
const PUBLIC_KEY = String(import.meta.env.VITE_MATRIX_PUBLIC_KEY || '')
const TRACKING_ENABLED = String(import.meta.env.VITE_MATRIX_TRACKING_ENABLED || '').toLowerCase() === 'true'
const ANALYTICS_DEFAULT = String(import.meta.env.VITE_MATRIX_ANALYTICS_DEFAULT || '').toLowerCase() === 'granted'

export const MATRIX_POLICY_VERSION = 'attualplay-privacy-v4-2026-09-07'

const CONSENT_STORAGE_KEY = 'matrix:consent:v1'
const ANON_STORAGE_KEY = 'matrix:anonymous-id:v1'
const PERSON_SESSION_STORAGE_KEY = 'matrix:person-session:v1'
const SESSION_STORAGE_KEY = 'matrix:session-id:v1'
const SESSION_STARTED_KEY = 'matrix:session-started:v1'

function safeGet(storage, key) {
  try { return storage.getItem(key) } catch { return null }
}

function safeSet(storage, key, value) {
  try { storage.setItem(key, value) } catch { /* storage unavailable: Matrix remains best effort */ }
}

function safeRemove(storage, key) {
  try { storage.removeItem(key) } catch { /* storage unavailable */ }
}

function consentFallback() {
  return {
    essential: true,
    analytics: ANALYTICS_DEFAULT,
    personalization: false,
    marketing: false,
    adult_confirmed: false,
    policy_version: MATRIX_POLICY_VERSION,
  }
}

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`
}

export function getMatrixAnonymousId() {
  let value = safeGet(localStorage, ANON_STORAGE_KEY)
  if (!value) {
    value = `anon_${newId()}`
    safeSet(localStorage, ANON_STORAGE_KEY, value)
  }
  return value
}

function getSessionId() {
  let value = safeGet(sessionStorage, SESSION_STORAGE_KEY)
  if (!value) {
    value = `session_${newId()}`
    safeSet(sessionStorage, SESSION_STORAGE_KEY, value)
  }
  return value
}

export function getMatrixIdentityState() {
  const raw = safeGet(localStorage, PERSON_SESSION_STORAGE_KEY)
  if (!raw) return { connected: false, person_id: null, expires_at: null }
  try {
    const parsed = JSON.parse(raw)
    const expiresAt = typeof parsed.expires_at === 'string' ? parsed.expires_at : ''
    if (!parsed.person_token || !parsed.person_id || !expiresAt || Number.isNaN(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now()) {
      safeRemove(localStorage, PERSON_SESSION_STORAGE_KEY)
      return { connected: false, person_id: null, expires_at: null }
    }
    return { connected: true, person_id: String(parsed.person_id), expires_at: expiresAt }
  } catch {
    safeRemove(localStorage, PERSON_SESSION_STORAGE_KEY)
    return { connected: false, person_id: null, expires_at: null }
  }
}

function getMatrixPersonToken() {
  const state = getMatrixIdentityState()
  if (!state.connected) return null
  try {
    const parsed = JSON.parse(safeGet(localStorage, PERSON_SESSION_STORAGE_KEY) || '{}')
    return typeof parsed.person_token === 'string' ? parsed.person_token : null
  } catch {
    return null
  }
}

function storePersonSession(identity) {
  const personToken = String(identity?.person_token || '')
  const personId = String(identity?.matrix_person_id || '')
  const expiresAt = String(identity?.expires_at || '')
  if (!personToken || !personId || !expiresAt || Number.isNaN(Date.parse(expiresAt))) return false
  safeSet(localStorage, PERSON_SESSION_STORAGE_KEY, JSON.stringify({
    person_token: personToken,
    person_id: personId,
    expires_at: expiresAt,
    linked_at: new Date().toISOString(),
  }))
  return true
}

export function clearMatrixPersonSession() {
  safeRemove(localStorage, PERSON_SESSION_STORAGE_KEY)
}

export function hasMatrixConsentDecision() {
  const raw = safeGet(localStorage, CONSENT_STORAGE_KEY)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw)
    if (parsed.policy_version !== MATRIX_POLICY_VERSION || typeof parsed.analytics !== 'boolean') return false
    return parsed.analytics === false || parsed.adult_confirmed === true
  } catch {
    return false
  }
}

export function getMatrixConsent() {
  const fallback = consentFallback()
  const raw = safeGet(localStorage, CONSENT_STORAGE_KEY)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    if (parsed.policy_version !== MATRIX_POLICY_VERSION) return fallback
    const adultConfirmed = parsed.adult_confirmed === true
    const analytics = parsed.analytics === true && adultConfirmed
    return {
      ...fallback,
      analytics,
      personalization: analytics && parsed.personalization === true,
      adult_confirmed: adultConfirmed,
      marketing: false,
      policy_version: MATRIX_POLICY_VERSION,
      decided_at: typeof parsed.decided_at === 'string' ? parsed.decided_at : undefined,
    }
  } catch {
    return fallback
  }
}

export function setMatrixConsent(next) {
  const adultConfirmed = next?.adult_confirmed === true
  const analytics = next?.analytics === true && adultConfirmed
  const value = {
    essential: true,
    analytics,
    personalization: analytics && next?.personalization === true,
    marketing: false,
    adult_confirmed: adultConfirmed,
    policy_version: MATRIX_POLICY_VERSION,
    decided_at: new Date().toISOString(),
  }
  safeSet(localStorage, CONSENT_STORAGE_KEY, JSON.stringify(value))

  if (!value.analytics) {
    safeRemove(localStorage, ANON_STORAGE_KEY)
    safeRemove(sessionStorage, SESSION_STORAGE_KEY)
    safeRemove(sessionStorage, SESSION_STARTED_KEY)
  }

  return value
}

function deviceClass() {
  const width = globalThis.innerWidth || 1024
  if (width <= 767) return 'mobile'
  if (width <= 1180) return 'tablet'
  return 'desktop'
}

function context() {
  return {
    locale: navigator.language || 'pt-BR',
    device_class: deviceClass(),
    platform: String(navigator.userAgentData?.platform || navigator.platform || 'web').slice(0, 80),
    app_version: 'attualplay-matrix-m4-v1',
  }
}

function classifyReferrer() {
  const referrer = document.referrer
  if (!referrer) return 'direct'
  try {
    const host = new URL(referrer).hostname.toLowerCase()
    if (host === window.location.hostname.toLowerCase()) return 'same_site'
    if (/(google|bing|duckduckgo|yahoo)\./.test(host)) return 'search'
    if (/(facebook|instagram|youtube|tiktok|linkedin|x\.com|twitter)\./.test(host)) return 'social'
    return 'external'
  } catch {
    return 'external'
  }
}

function readyForAnalytics() {
  const consent = getMatrixConsent()
  return TRACKING_ENABLED && hasMatrixConsentDecision() && Boolean(API_URL) && Boolean(PUBLIC_KEY) && consent.analytics === true && consent.adult_confirmed === true
}

function readyForPersonalization() {
  const consent = getMatrixConsent()
  return readyForAnalytics() && consent.personalization === true
}

function matrixHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Matrix-Client': 'attualplay',
    'X-Matrix-Key': PUBLIC_KEY,
  }
}

async function matrixPost(path, payload, { keepalive = false } = {}) {
  if (!API_URL || !PUBLIC_KEY) return null
  try {
    return await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: matrixHeaders(),
      body: JSON.stringify(payload),
      keepalive,
    })
  } catch {
    return null
  }
}

export async function trackMatrixEvent(eventType, properties = {}, object = null) {
  if (!readyForAnalytics()) return false

  const eventId = newId()
  const sessionId = getSessionId()
  const personToken = getMatrixPersonToken()
  const payload = {
    event_id: eventId,
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    project_key: 'attualplay',
    anonymous_id: getMatrixAnonymousId(),
    ...(personToken ? { person_token: personToken } : {}),
    session_id: sessionId,
    properties,
    context: context(),
    consent: getMatrixConsent(),
    idempotency_key: `attualplay:${sessionId}:${eventType}:${eventId}`,
  }
  if (object?.type && object?.id) payload.object = { type: String(object.type), id: String(object.id) }

  const response = await matrixPost('/v1/events', payload, { keepalive: true })
  if (response?.status === 401 && personToken) clearMatrixPersonSession()
  return Boolean(response?.ok)
}

export async function startMatrixSession() {
  if (!readyForAnalytics()) return false
  const sessionId = getSessionId()
  if (safeGet(sessionStorage, SESSION_STARTED_KEY) === sessionId) return true
  const sent = await trackMatrixEvent('session_started', {
    entry_path: `${window.location.pathname}${window.location.search}`.slice(0, 300),
    referrer_class: classifyReferrer(),
  })
  if (sent) safeSet(sessionStorage, SESSION_STARTED_KEY, sessionId)
  return sent
}

export function trackMatrixPage(page) {
  const normalized = String(page || 'home').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'home'
  return trackMatrixEvent('page_viewed', {
    path: normalized === 'home' ? '/' : `/${normalized}`,
    page_type: 'app_tab',
  })
}

export function trackMatrixPreferenceUpdated(preference) {
  return trackMatrixEvent('preference_updated', {
    topic_key: 'personalization',
    preference: preference === 'granted' ? 'granted' : 'denied',
  })
}

async function recommendationRequest(payload) {
  const response = await matrixPost('/v1/recommendations/query', payload)
  if (!response?.ok) return null
  try {
    const body = await response.json()
    return body?.recommendation || null
  } catch {
    return null
  }
}

export async function fetchMatrixRecommendation() {
  if (!readyForPersonalization()) return null
  const consent = getMatrixConsent()
  const personToken = getMatrixPersonToken()
  const anonymousId = getMatrixAnonymousId()

  if (personToken) {
    const identified = await recommendationRequest({
      project_key: 'attualplay',
      person_token: personToken,
      consent,
    })
    if (identified) return identified
  }

  return recommendationRequest({
    project_key: 'attualplay',
    anonymous_id: anonymousId,
    consent,
  })
}

export async function linkMatrixIdentity(bridgeCode) {
  const consent = getMatrixConsent()
  if (!readyForPersonalization()) {
    return { ok: false, error: 'Ative analytics, confirme 18+ e autorize personalização antes de conectar sua conta.' }
  }
  const code = String(bridgeCode || '').trim()
  if (code.length < 12) return { ok: false, error: 'Código de conexão inválido.' }

  const response = await matrixPost('/v1/identity/link', {
    project_key: 'attualplay',
    anonymous_id: getMatrixAnonymousId(),
    bridge_code: code,
    consent,
  })
  if (!response) return { ok: false, error: 'Matrix indisponível no momento.' }
  let body = null
  try { body = await response.json() } catch { /* safe fallback below */ }
  if (!response.ok || !body?.identity || !storePersonSession(body.identity)) {
    return { ok: false, error: body?.error?.message || 'Código inválido, expirado ou já utilizado.' }
  }
  return { ok: true, identity: getMatrixIdentityState(), attual_one_link_status: body.attual_one_link_status || 'linked' }
}

export async function syncMatrixConsentServer(consentOverride = null) {
  const personToken = getMatrixPersonToken()
  if (!personToken) return { ok: true, identified: false }
  const consent = consentOverride || getMatrixConsent()
  const response = await matrixPost('/v1/consents', {
    project_key: 'attualplay',
    person_token: personToken,
    consent: {
      analytics: consent.analytics === true,
      personalization: consent.analytics === true && consent.personalization === true,
      adult_confirmed: consent.analytics === true && consent.adult_confirmed === true,
      marketing: false,
      policy_version: MATRIX_POLICY_VERSION,
    },
  })
  if (!response) return { ok: false, identified: true }
  if (response.status === 401) {
    clearMatrixPersonSession()
    return { ok: false, identified: false }
  }
  return { ok: response.ok, identified: true }
}

export async function unlinkMatrixIdentity() {
  const personToken = getMatrixPersonToken()
  if (!personToken) {
    clearMatrixPersonSession()
    return { ok: true, identified: false }
  }
  const response = await matrixPost('/v1/identity/unlink', {
    project_key: 'attualplay',
    person_token: personToken,
  })
  clearMatrixPersonSession()
  return { ok: Boolean(response?.ok), identified: false }
}

export function trackMatrixRecommendationShown(recommendationId) {
  if (!readyForPersonalization()) return Promise.resolve(false)
  return trackMatrixEvent('recommendation_shown', { recommendation_id: String(recommendationId) })
}

export function trackMatrixRecommendationClicked(recommendationId, itemRank) {
  if (!readyForPersonalization()) return Promise.resolve(false)
  return trackMatrixEvent('recommendation_clicked', {
    recommendation_id: String(recommendationId),
    item_rank: Number(itemRank),
  })
}

export function matrixDurationBucket(seconds) {
  const value = Math.max(0, Number(seconds) || 0)
  if (value <= 30) return '0-30s'
  if (value <= 120) return '31-120s'
  if (value <= 300) return '121-300s'
  return '300s+'
}
