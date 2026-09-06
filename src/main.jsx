import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startMatrixSession } from './services/matrixTelemetry.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// O piloto Matrix e fail-safe: a funcao nao envia nada se feature flag,
// endpoint, chave publicavel ou consentimento de analytics nao estiverem ativos.
window.addEventListener('load', () => {
  void startMatrixSession()
})

// Registra o service worker (PWA) apenas na versão de produção,
// para não interferir no hot reload durante o desenvolvimento.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sem service worker o app continua funcionando normalmente
    })
  })
}
