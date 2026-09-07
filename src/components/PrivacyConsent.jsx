import { useMemo, useState } from 'react'
import {
  getMatrixConsent,
  getMatrixIdentityState,
  hasMatrixConsentDecision,
  linkMatrixIdentity,
  MATRIX_POLICY_VERSION,
  setMatrixConsent,
  startMatrixSession,
  syncMatrixConsentServer,
  trackMatrixPreferenceUpdated,
  unlinkMatrixIdentity,
} from '../services/matrixTelemetry.js'
import './PrivacyConsent.css'

export default function PrivacyConsent({ onAnalyticsGranted, onPersonalizationChanged }) {
  const [open, setOpen] = useState(!hasMatrixConsentDecision())
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [adultConfirmed, setAdultConfirmed] = useState(() => getMatrixConsent().adult_confirmed === true)
  const [personalization, setPersonalization] = useState(() => getMatrixConsent().personalization === true)
  const [consent, setConsent] = useState(() => getMatrixConsent())
  const [identity, setIdentity] = useState(() => getMatrixIdentityState())
  const [bridgeCode, setBridgeCode] = useState('')
  const [identityBusy, setIdentityBusy] = useState(false)
  const [identityMessage, setIdentityMessage] = useState('')

  const analyticsEnabled = consent.analytics === true
  const statusLabel = useMemo(() => {
    if (!analyticsEnabled) return 'Analytics, personalização e identidade Matrix desativados'
    if (identity.connected && consent.personalization) return 'Analytics + personalização autorizados · identidade conectada'
    return consent.personalization ? 'Analytics + personalização autorizados' : 'Analytics autorizado · personalização desativada'
  }, [analyticsEnabled, consent.personalization, identity.connected])

  function refreshFromStorage() {
    const current = getMatrixConsent()
    setConsent(current)
    setAdultConfirmed(current.adult_confirmed === true)
    setPersonalization(current.personalization === true)
    setIdentity(getMatrixIdentityState())
  }

  async function applyChoice(analytics) {
    const previous = getMatrixConsent()
    const wasIdentified = getMatrixIdentityState().connected
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

    if (wasIdentified) {
      if (!next.analytics) {
        await unlinkMatrixIdentity()
      } else {
        const synced = await syncMatrixConsentServer(next)
        if (!synced.ok) setIdentityMessage('A preferência local foi salva; a sincronização com a Matrix será tentada novamente quando você reconectar.')
      }
      setIdentity(getMatrixIdentityState())
    }

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

  async function connectIdentity() {
    setIdentityBusy(true)
    setIdentityMessage('')
    const result = await linkMatrixIdentity(bridgeCode)
    if (result.ok) {
      setIdentity(getMatrixIdentityState())
      setBridgeCode('')
      setIdentityMessage('Conta conectada. A Matrix agora pode manter continuidade de contexto usando apenas a identidade explícita que você autorizou.')
      onPersonalizationChanged?.(true)
    } else {
      setIdentityMessage(result.error || 'Não foi possível concluir a conexão.')
    }
    setIdentityBusy(false)
  }

  async function disconnectIdentity() {
    setIdentityBusy(true)
    setIdentityMessage('')
    const result = await unlinkMatrixIdentity()
    setIdentity(getMatrixIdentityState())
    setIdentityMessage(result.ok
      ? 'Identidade desconectada. O vínculo e a sessão Matrix foram revogados.'
      : 'A sessão local foi removida. A Matrix poderá concluir a revogação assim que estiver disponível.')
    setIdentityBusy(false)
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
              As escolhas são opcionais e marketing continua desativado.
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
              Ver detalhes de privacidade e identidade
            </button>
          </div>
          <div className="privacidade-acoes">
            <button type="button" className="privacidade-botao" onClick={() => void applyChoice(false)}>
              Rejeitar analytics
            </button>
            <button type="button" className="privacidade-botao" disabled={!adultConfirmed} onClick={() => void applyChoice(true)}>
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
            <h2 id="privacidade-modal-titulo">Privacidade, personalização e identidade Matrix</h2>
            <p>
              Analytics, personalização e conexão de identidade são opcionais. Rejeitar não limita TV, rádio,
              programação, chat ou qualquer função essencial do AttualPlay. Personalização só funciona quando
              analytics também estiver autorizado.
            </p>

            <h3>O que pode ser enviado quando você aceita analytics</h3>
            <ul>
              <li>identificador aleatório do navegador, convertido em hash pela Matrix;</li>
              <li>identificador de sessão e páginas/abas acessadas;</li>
              <li>início e fim de uso da TV ou rádio, com duração em faixas;</li>
              <li>idioma, classe de dispositivo, plataforma e classe de origem do acesso;</li>
              <li>quando personalização estiver ativa, exibição e clique em recomendações para medir qualidade.</li>
            </ul>

            <h3>Como funciona a personalização</h3>
            <p>
              A Matrix calcula afinidades de formato de mídia por regras determinísticas e só libera uma recomendação
              quando score, confiança e quantidade de sinais atingem limites mínimos. Ela não infere política, saúde,
              religião, renda, sexualidade ou outros atributos sensíveis.
            </p>

            <h3>M4 — conexão opcional com sua conta ATTUAL ONE</h3>
            <p>
              Se você tiver uma conta compatível no ATTUAL ONE, pode gerar lá um código temporário e digitá-lo abaixo.
              Essa ação cria um vínculo explícito entre sua sessão Matrix e um identificador técnico da conta. O fluxo
              não envia nome, e-mail, telefone ou CPF para a Matrix. Não existe descoberta oculta de identidade.
            </p>

            {identity.connected ? (
              <div className="privacidade-identidade">
                <strong>Identidade conectada</strong>
                <p>A sessão identificada fica revogável e só é usada enquanto os consentimentos necessários estiverem ativos.</p>
                <button type="button" className="privacidade-botao" disabled={identityBusy} onClick={() => void disconnectIdentity()}>
                  {identityBusy ? 'Desconectando...' : 'Desconectar identidade Matrix'}
                </button>
              </div>
            ) : (
              <div className="privacidade-identidade">
                <label htmlFor="matrix-bridge-code">Código temporário do ATTUAL ONE</label>
                <input
                  id="matrix-bridge-code"
                  value={bridgeCode}
                  onChange={(event) => setBridgeCode(event.target.value.toUpperCase())}
                  placeholder="M4-..."
                  autoComplete="off"
                  disabled={!analyticsEnabled || !consent.personalization || identityBusy}
                />
                <button
                  type="button"
                  className="privacidade-botao"
                  disabled={!analyticsEnabled || !consent.personalization || bridgeCode.trim().length < 12 || identityBusy}
                  onClick={() => void connectIdentity()}
                >
                  {identityBusy ? 'Conectando...' : 'Conectar conta de forma explícita'}
                </button>
                {(!analyticsEnabled || !consent.personalization) && (
                  <p>Salve primeiro analytics + personalização para habilitar uma conexão identificada.</p>
                )}
              </div>
            )}
            {identityMessage && <div className="privacidade-mensagem" aria-live="polite">{identityMessage}</div>}

            <h3>Consentimento no servidor e revogação</h3>
            <p>
              Depois de uma conexão explícita, as escolhas de analytics e personalização também são registradas no
              ledger de consentimento da Matrix. Revogar analytics encerra a sessão identificada e interrompe novos
              eventos. Revogar apenas personalização mantém analytics, mas bloqueia recomendações e elegibilidade para
              novos sinais qualificados.
            </p>

            <h3>O que não faz parte</h3>
            <p>
              Nome, e-mail, telefone, CPF, mensagens do chat, conteúdo enviado em participação, credenciais e dados
              sensíveis não fazem parte da personalização Matrix. Autorizar personalização ou conectar identidade não
              autoriza marketing, campanhas, WhatsApp, e-mail, push ou outras abordagens comerciais automáticas.
            </p>

            <h3>Retenção e descarte</h3>
            <p>
              Eventos analíticos brutos e o perfil pseudonimizado associado são mantidos por até 90 dias após a atividade.
              Cópias técnicas em filas de falha também têm limite de 90 dias. Registros técnicos de auditoria podem ser
              mantidos por até 365 dias. Identidade e consentimentos possuem controles próprios de revogação e serão
              tratados conforme finalidade, necessidade e direitos aplicáveis.
            </p>

            <h3>Seus controles</h3>
            <p>
              Você pode aceitar, rejeitar ou revogar analytics e personalização a qualquer momento e pode desconectar
              uma identidade vinculada. Solicitações de acesso, correção, revogação e exclusão devem seguir o fluxo de
              atendimento ao titular do Grupo Lira, sem depender deste dispositivo específico.
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
              <button type="button" className="privacidade-botao" onClick={() => void applyChoice(false)}>
                Rejeitar / revogar analytics
              </button>
              <button type="button" className="privacidade-botao" disabled={!adultConfirmed} onClick={() => void applyChoice(true)}>
                Salvar preferências
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
