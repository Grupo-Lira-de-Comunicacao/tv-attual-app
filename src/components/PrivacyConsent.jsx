import { useMemo, useState } from 'react'
import {
  getMatrixConsent,
  hasMatrixConsentDecision,
  MATRIX_POLICY_VERSION,
  setMatrixConsent,
  startMatrixSession,
  trackMatrixPreferenceUpdated,
} from '../services/matrixTelemetry.js'
import './PrivacyConsent.css'

export default function PrivacyConsent({ onAnalyticsGranted, onPersonalizationChanged }) {
  const [open, setOpen] = useState(!hasMatrixConsentDecision())
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [adultConfirmed, setAdultConfirmed] = useState(() => getMatrixConsent().adult_confirmed === true)
  const [personalization, setPersonalization] = useState(() => getMatrixConsent().personalization === true)
  const [consent, setConsent] = useState(() => getMatrixConsent())

  const analyticsEnabled = consent.analytics === true
  const statusLabel = useMemo(() => {
    if (!analyticsEnabled) return 'Analytics e personalização desativados'
    return consent.personalization ? 'Analytics + personalização autorizados' : 'Analytics autorizado · personalização desativada'
  }, [analyticsEnabled, consent.personalization])

  function refreshFromStorage() {
    const current = getMatrixConsent()
    setConsent(current)
    setAdultConfirmed(current.adult_confirmed === true)
    setPersonalization(current.personalization === true)
  }

  function applyChoice(analytics) {
    const previous = getMatrixConsent()
    const next = setMatrixConsent({
      analytics,
      adult_confirmed: analytics ? adultConfirmed : false,
      personalization: analytics ? personalization : false,
      marketing: false,
      policy_version: MATRIX_POLICY_VERSION,
    })
    setConsent(next)
    setPersonalization(next.personalization === true)
    if (!analytics) setAdultConfirmed(false)
    setOpen(false)

    if (next.analytics) {
      void startMatrixSession()
      onAnalyticsGranted?.()
      if (previous.personalization !== next.personalization) {
        void trackMatrixPreferenceUpdated(next.personalization ? 'granted' : 'denied')
      }
      onPersonalizationChanged?.(next.personalization)
    } else {
      onPersonalizationChanged?.(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="privacidade-atalho"
        onClick={() => {
          refreshFromStorage()
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
              A TV Attual pode usar dados analíticos minimizados para entender o uso do app. Se você quiser,
              também pode autorizar uma personalização leve para mostrar tópicos que combinam com seu consumo.
              As duas escolhas são opcionais e marketing continua desativado.
            </p>
            <label className="privacidade-maioridade">
              <input
                type="checkbox"
                checked={adultConfirmed}
                onChange={(event) => {
                  setAdultConfirmed(event.target.checked)
                  if (!event.target.checked) setPersonalization(false)
                }}
              />
              <span>Confirmo que tenho 18 anos ou mais para autorizar analytics.</span>
            </label>
            <label className="privacidade-maioridade">
              <input
                type="checkbox"
                checked={personalization}
                disabled={!adultConfirmed}
                onChange={(event) => setPersonalization(event.target.checked)}
              />
              <span>Quero receber recomendações personalizadas dentro do AttualPlay.</span>
            </label>
            <button type="button" className="privacidade-link" onClick={() => setDetailsOpen(true)}>
              Ver detalhes de privacidade
            </button>
          </div>
          <div className="privacidade-acoes">
            <button type="button" className="privacidade-botao" onClick={() => applyChoice(false)}>
              Rejeitar analytics
            </button>
            <button type="button" className="privacidade-botao" disabled={!adultConfirmed} onClick={() => applyChoice(true)}>
              Salvar preferências
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
            <h2 id="privacidade-modal-titulo">Privacidade, analytics e personalização</h2>
            <p>
              Analytics e personalização são opcionais. Rejeitar não limita TV, rádio, programação, chat ou
              qualquer outra função essencial do AttualPlay. Personalização só pode funcionar quando analytics
              também estiver autorizado, pois ela depende dos sinais de uso consentidos.
            </p>

            <h3>O que pode ser enviado quando você aceita analytics</h3>
            <ul>
              <li>identificador aleatório do navegador, convertido em hash pela Matrix;</li>
              <li>identificador de sessão e páginas/abas acessadas;</li>
              <li>início e fim de uso da TV ou rádio, com duração em faixas;</li>
              <li>idioma, classe de dispositivo, plataforma e classe de origem do acesso;</li>
              <li>quando personalização estiver ativa, exibição e clique em recomendações para medir qualidade.</li>
            </ul>

            <h3>Como funciona a personalização M3</h3>
            <p>
              A Matrix calcula afinidades de formato de mídia por regras determinísticas e só libera uma recomendação
              quando score, confiança e quantidade de sinais atingem limites mínimos. A recomendação é de tópicos como
              TV ao vivo, rádio ou programação. Ela não infere política, saúde, religião, renda, sexualidade ou outros
              atributos sensíveis.
            </p>

            <h3>O que não faz parte</h3>
            <p>
              Nome, e-mail, telefone, CPF, mensagens do chat, conteúdo enviado em participação, credenciais e dados
              sensíveis não fazem parte desta personalização. Autorizar personalização não autoriza marketing, campanhas,
              WhatsApp, e-mail ou outras abordagens comerciais.
            </p>

            <h3>Retenção e descarte</h3>
            <p>
              Eventos analíticos brutos e o perfil pseudonimizado associado são mantidos por até 90 dias após a atividade.
              Cópias técnicas em filas de falha também têm limite de 90 dias. Registros técnicos de auditoria podem ser
              mantidos por até 365 dias. A Matrix executa descarte automático periódico.
            </p>

            <h3>Seus controles</h3>
            <p>
              Você pode aceitar, rejeitar ou revogar analytics e personalização a qualquer momento. Ao revogar analytics,
              novos eventos deixam de ser enviados e os identificadores locais de analytics são apagados. Ao manter
              analytics e revogar apenas personalização, a medição continua, mas recomendações deixam de ser consultadas
              e exibidas.
            </p>

            <label className="privacidade-maioridade">
              <input
                type="checkbox"
                checked={adultConfirmed}
                onChange={(event) => {
                  setAdultConfirmed(event.target.checked)
                  if (!event.target.checked) setPersonalization(false)
                }}
              />
              <span>Confirmo que tenho 18 anos ou mais para autorizar analytics.</span>
            </label>
            <label className="privacidade-maioridade">
              <input
                type="checkbox"
                checked={personalization}
                disabled={!adultConfirmed}
                onChange={(event) => setPersonalization(event.target.checked)}
              />
              <span>Autorizo personalização de tópicos dentro do AttualPlay.</span>
            </label>

            <div className="privacidade-status" aria-live="polite">{statusLabel}</div>
            <div className="privacidade-acoes privacidade-acoes-modal">
              <button type="button" className="privacidade-botao" onClick={() => applyChoice(false)}>
                Rejeitar / revogar analytics
              </button>
              <button type="button" className="privacidade-botao" disabled={!adultConfirmed} onClick={() => applyChoice(true)}>
                Salvar preferências
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
