import { useEffect, useRef, useState } from 'react'
import {
  fetchMatrixRecommendation,
  getMatrixConsent,
  trackMatrixRecommendationClicked,
  trackMatrixRecommendationShown,
} from '../services/matrixTelemetry.js'
import './MatrixForYou.css'

const TOPIC_COPY = {
  'tv-ao-vivo': { icon: '📺', title: 'TV ao vivo', description: 'Continue acompanhando a programação da TV Attual.' },
  radio: { icon: '📻', title: 'Rádio Attual', description: 'Música e informação ao vivo na Rádio Attual.' },
  programacao: { icon: '📅', title: 'Programação', description: 'Veja os próximos programas e horários.' },
  participacao: { icon: '💬', title: 'Participação', description: 'Participe da TV Attual e envie sua mensagem.' },
  audiovisual: { icon: '🎬', title: 'Conteúdo em vídeo', description: 'Explore mais conteúdo audiovisual da TV Attual.' },
  musica: { icon: '🎵', title: 'Música', description: 'Acompanhe a programação musical da Rádio Attual.' },
  eventos: { icon: '📍', title: 'Eventos', description: 'Fique de olho na programação e nos acontecimentos da região.' },
}

export default function MatrixForYou({ refreshKey = 0, onSelectTopic }) {
  const [recommendation, setRecommendation] = useState(null)
  const shownRef = useRef(null)

  useEffect(() => {
    let active = true
    const consent = getMatrixConsent()
    if (!consent.personalization) {
      setRecommendation(null)
      return () => { active = false }
    }

    void fetchMatrixRecommendation().then((next) => {
      if (!active) return
      setRecommendation(next)
      if (next?.recommendation_id && shownRef.current !== next.recommendation_id) {
        shownRef.current = next.recommendation_id
        void trackMatrixRecommendationShown(next.recommendation_id)
      }
    })
    return () => { active = false }
  }, [refreshKey])

  if (!recommendation?.items?.length) return null

  function select(item) {
    void trackMatrixRecommendationClicked(recommendation.recommendation_id, item.rank)
    onSelectTopic?.(item.topic_key)
  }

  return (
    <section className="matrix-for-you" aria-labelledby="matrix-for-you-title">
      <div className="matrix-for-you-header">
        <div>
          <span className="matrix-for-you-eyebrow">MATRIX · PERSONALIZAÇÃO OPCIONAL</span>
          <h2 id="matrix-for-you-title">Você pode gostar</h2>
        </div>
        <span className="matrix-for-you-badge">Baseado no seu uso</span>
      </div>
      <p className="matrix-for-you-intro">
        Sugestões de tópicos liberadas somente após sua autorização e quando há sinais suficientes.
      </p>
      <div className="matrix-for-you-grid">
        {recommendation.items.map((item) => {
          const copy = TOPIC_COPY[item.topic_key] || {
            icon: '✨',
            title: item.topic_label || item.topic_key,
            description: 'Um tópico que pode combinar com seu uso do AttualPlay.',
          }
          return (
            <button
              type="button"
              key={`${recommendation.recommendation_id}:${item.rank}`}
              className="matrix-for-you-card"
              onClick={() => select(item)}
            >
              <span className="matrix-for-you-icon" aria-hidden="true">{copy.icon}</span>
              <span className="matrix-for-you-copy">
                <strong>{copy.title}</strong>
                <small>{copy.description}</small>
              </span>
              <span className="matrix-for-you-arrow" aria-hidden="true">→</span>
            </button>
          )
        })}
      </div>
      <small className="matrix-for-you-note">
        Você pode desligar a personalização a qualquer momento em Privacidade. Isso não afeta TV, rádio ou outras funções do app.
      </small>
    </section>
  )
}
