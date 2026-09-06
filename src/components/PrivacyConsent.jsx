import { useMemo, useState } from 'react'
import {
  getMatrixConsent,
  hasMatrixConsentDecision,
  setMatrixConsent,
  startMatrixSession,
} from '../services/matrixTelemetry.js'
import './PrivacyConsent.css'

const POLICY_VERSION = 'attualplay-privacy-v1-2026-09-06'

export default function PrivacyConsent({ onAnalyticsGranted }) {
  const [open, setOpen] = useState(!hasMatrixConsentDecision())
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [consent, setConsent] = useState(() => getMatrixConsent())

  const analyticsEnabled = consent.analytics === true
  const statusLabel = useMemo(
    () => (analyticsEnabled ? 'Analytics autorizado' : 'Analytics desativado'),
    [analyticsEnabled],
  )

  function applyChoice(analytics) {
    const next = setMatrixConsent({
      analytics,
      personalization: false,
      marketing: false,
      policy_version: POLICY_VERSION,
    })
    setConsent(next)
    setOpen(false)
    if (analytics) {
      void startMatrixSession()
      onAnalyticsGranted?.()
    }
  }

  return (
    <>
      <button
        type="button"
        className="privacidade-atalho"
        onClick={() => {
          setConsent(getMatrixConsent())
          setDetailsOpen(true)
        }}
        aria-label="Abrir preferências de privacidade"
      >
        Privacidade
      </button>

      {open && (
        <section className="privacidade-banner" role="dialog" aria-modal="true" aria-labelledby="privacidade-titulo">
          <div className="privacidade-banner-conteudo">
            <strong id="privacidade-titulo">Sua privacidade no AttualPlay</strong>
            <p>
              A TV Attual pode usar dados analíticos minimizados para entender, de forma pseudonimizada,
              quais áreas do app são usadas e por quanto tempo TV e rádio são consumidas. Isso é opcional.
            </p>
            <button type="button" className="privacidade-link" onClick={() => setDetailsOpen(true)}>
              Ver detalhes de privacidade
            </button>
          </div>
          <div className="privacidade-acoes">
            <button type="button" className="privacidade-botao" onClick={() => applyChoice(false)}>
              Rejeitar analytics
            </button>
            <button type="button" className="privacidade-botao" onClick={() => applyChoice(true)}>
              Aceitar analytics
            </button>
          </div>
        </section>
      )}

      {detailsOpen && (
        <div className="privacidade-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetailsOpen(false)
        }}>
          <section className="privacidade-modal" role="dialog" aria-modal="true" aria-labelledby="privacidade-modal-titulo">
            <button type="button" className="privacidade-fechar" onClick={() => setDetailsOpen(false)} aria-label="Fechar">
              ×
            </button>
            <span className="privacidade-eyebrow">TV ATTUAL · GRUPO LIRA DE COMUNICAÇÃO</span>
            <h2 id="privacidade-modal-titulo">Privacidade e analytics</h2>
            <p>
              O analytics da Matrix é opcional e permanece desligado até uma escolha positiva do usuário.
              Rejeitar não limita TV, rádio, programação, chat ou qualquer outra função do AttualPlay.
            </p>

            <h3>O que pode ser enviado quando você aceita</h3>
            <ul>
              <li>identificador aleatório do navegador, convertido em hash pela Matrix;</li>
              <li>identificador de sessão e páginas/abas acessadas;</li>
              <li>início e fim de uso da TV ou rádio, com duração em faixas;</li>
              <li>idioma, classe de dispositivo, plataforma e classe de origem do acesso.</li>
            </ul>

            <h3>O que não faz parte deste analytics</h3>
            <p>
              Nome, e-mail, telefone, CPF, mensagens do chat, conteúdo enviado em participação, credenciais,
              dados sensíveis, marketing e personalização individual não fazem parte deste piloto.
            </p>

            <h3>Finalidade e base usada nesta fase</h3>
            <p>
              Medir uso do aplicativo e melhorar experiência, estabilidade e relevância editorial. Nesta fase,
              o tratamento analítico só ocorre mediante consentimento. A escolha fica registrada no seu navegador,
              e cada evento enviado carrega a versão da política e o estado do consentimento.
            </p>

            <h3>Seus controles</h3>
            <p>
              Você pode aceitar, rejeitar ou revogar o analytics a qualquer momento neste botão de Privacidade.
              Ao revogar, novos eventos deixam de ser enviados e os identificadores locais de analytics são apagados.
              Para exercer outros direitos previstos na LGPD, use os canais oficiais da TV Attual na área Contato.
            </p>

            <div className="privacidade-status" aria-live="polite">{statusLabel}</div>
            <div className="privacidade-acoes privacidade-acoes-modal">
              <button type="button" className="privacidade-botao" onClick={() => applyChoice(false)}>
                Rejeitar / revogar analytics
              </button>
              <button type="button" className="privacidade-botao" onClick={() => applyChoice(true)}>
                Aceitar analytics
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
