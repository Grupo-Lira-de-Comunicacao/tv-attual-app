const API_URL = String(import.meta.env.VITE_MATRIX_API_URL || '').replace(/\/$/, '')
const PUBLIC_KEY = String(import.meta.env.VITE_MATRIX_PUBLIC_KEY || '')
const TRACKING_ENABLED = String(import.meta.env.VITE_MATRIX_TRACKING_ENABLED || '').toLowerCase() === 'true'
const ANALYTICS_DEFAULT = String(import.meta.env.VITE_MATRIX_ANALYTICS_DEFAULT || '').toLowerCase() === 'granted'

const CONSENT_STORAGE_KEY = 'matrix:consent:v1'
const ANON_STORAGE_KEY = 'matrix:anonymous-id:v1'
const SESSION_STORAGE_KEY = 'matrix:session-id:v1'
const SESSION_STARTED_KEY = 'matrix:session-started:v1'

function safeGet(storage, key) {
  try { return storage.getItem(key) } catch { return null }
}

function safeSet(storage, key, value) {
  try { storage.setItem(key, value) } catch { /* storage unavailable: tracking remains best effort */ }
}

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`
}

function getAnonymousId() {
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

export function getMatrixConsent() {
  const fallback = {
    essential: true,
    analytics: ANALYTICS_DEFAULT,
    personalization: false,
    marketing: false,
    policy_version: 'matrix-consent-v1',
  }
  const raw = safeGet(localStorage, CONSENT_STORAGE_KEY)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return {
      ...fallback,
      analytics: parsed.analytics === true,
      personalization: parsed.personalization === true,
      marketing: parsed.marketing === true,
      policy_version: String(parsed.policy_version || fallback.policy_version).slice(0, 80),
    }
  } catch {
    return fallback
  }
}

export function setMatrixConsent(next) {
  const current = getMatrixConsent()
  const value = {
    ...current,
    analytics: next?.analytics === true,
    personalization: next?.personalization === true,
    marketing: next?.marketing === true,
    policy_version: String(next?.policy_version || current.policy_version).slice(0, 80),
  }
  safeSet(localStorage, CONSENT_STORAGE_KEY, JSON.stringify(value))
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
    app_version: 'attualplay-matrix-pilot-v1',
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
  return TRACKING_ENABLED && Boolean(API_URL) && Boolean(PUBLIC_KEY) && consent.analytics === true
}

export async function trackMatrixEvent(eventType, properties = {}, object = null) {
  if (!readyForAnalytics()) return false

  const eventId = newId()
  const sessionId = getSessionId()
  const payload = {
    event_id: eventId,
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    project_key: 'attualplay',
    anonymous_id: getAnonymousId(),
    session_id: sessionId,
    properties,
    context: context(),
    consent: getMatrixConsent(),
    idempotency_key: `attualplay:${sessionId}:${eventType}:${eventId}`,
  }
  if (object?.type && object?.id) payload.object = { type: String(object.type), id: String(object.id) }

  try {
    const response = await fetch(`${API_URL}/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Matrix-Client': 'attualplay',
        'X-Matrix-Key': PUBLIC_KEY,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    })
    return response.ok
  } catch {
    return false
  }
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

export function matrixDurationBucket(seconds) {
  const value = Math.max(0, Number(seconds) || 0)
  if (value <= 30) return '0-30s'
  if (value <= 120) return '31-120s'
  if (value <= 300) return '121-300s'
  return '300s+'
}
