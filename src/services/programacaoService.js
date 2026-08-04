import { programacao } from '../data/programacao.js'

function paraMinutos(hhmm) {
  const [hora, minuto] = hhmm.split(':').map(Number)
  return hora * 60 + minuto
}

export function obterProgramacao() {
  return programacao
}

export function obterEstadoProgramacao(agora = new Date()) {
  if (!programacao.length) {
    return {
      atual: null,
      proximo: null,
      programacao: [],
      fonte: 'mock-local',
    }
  }

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes()
  let indiceAtual = -1

  for (let i = 0; i < programacao.length; i += 1) {
    if (paraMinutos(programacao[i].hora) <= minutosAgora) {
      indiceAtual = i
    }
  }

  const atual = indiceAtual >= 0 ? programacao[indiceAtual] : null
  const proximoIndice = indiceAtual >= 0 ? indiceAtual + 1 : 0
  const proximo = proximoIndice < programacao.length ? programacao[proximoIndice] : programacao[0]

  return {
    atual,
    proximo,
    programacao,
    fonte: 'mock-local',
  }
}
