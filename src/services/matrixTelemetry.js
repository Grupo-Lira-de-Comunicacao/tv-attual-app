const API_URL = String(import.meta.env.VITE_MATRIX_API_URL || '').replace(/\/$/, '')
const PUBLIC_KEY = String(import.meta.env.VITE_MATRIX_PUBLIC_KEY || '')
const TRACKING_ENABLED = String(import.meta.env.VITE_MATRIX_TRACKING_ENABLED || '').toLowerCase() === 'true'
const ANALYTICS_DEFAULT = String(import.meta.env.VITE_MATRIX_ANALYTICS_DEFAULT || '').toLowerCase() === 'granted'

export const MATRIX_POLICY_VERSION = 'attualplay-privacy-v1-2026-09-06'

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

function safeRemove(storage, key) {
  try { storage.removeItem(key) } catch { /* storage unavailable */ }
}

function consentFallback() {
  return {
    essential: true,
    analytics: ANALYTICS_DEFAULT,
    personalization: false,
    marketing: false,
    policy_version: MATRIX_POLICY_VERSION,
  }
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

export function hasMatrixConsentDecision() {
  const raw = safeGet(localStorage, CONSENT_STORAGE_KEY)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw)
    return parsed.policy_version === MATRIX_POLICY_VERSION && typeof parsed.analytics === 'boolean'
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
    return {
      ...fallback,
      analytics: parsed.analytics === true,
      personalization: false,
      marketing: false,
      policy_version: MATRIX_POLICY_VERSION,
    }
  } catch {
    return fallback
  }
}

export function setMatrixConsent(next) {
  const value = {
    essential: true,
    analytics: next?.analytics === true,
    personalization: false,
    marketing: false,
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
  return TRACKING_ENABLED && hasMatrixConsentDecision() && Boolean(API_URL) && Boolean(PUBLIC_KEY) && consent.analytics === true
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
