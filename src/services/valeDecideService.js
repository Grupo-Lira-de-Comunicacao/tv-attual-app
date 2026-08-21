export function filtrarCandidatos(candidatos, filtros = {}) {
  const { cidade = 'Todas', cargo = 'Todos', busca = '' } = filtros
  const termo = busca.trim().toLocaleLowerCase('pt-BR')

  return candidatos.filter((candidato) => {
    const cidadeOk = cidade === 'Todas' || candidato.cidade === cidade
    const cargoOk = cargo === 'Todos' || candidato.cargo === cargo
    const buscaOk = !termo || [
      candidato.nome,
      candidato.nomeCompleto,
      candidato.partido,
      candidato.federacao,
      candidato.cidade,
      candidato.cargo,
    ].filter(Boolean).some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo))

    return cidadeOk && cargoOk && buscaOk
  })
}

export function resumirPorCidade(candidatos) {
  return candidatos.reduce((resumo, candidato) => {
    resumo[candidato.cidade] = (resumo[candidato.cidade] || 0) + 1
    return resumo
  }, {})
}

export function listarOpcoes(candidatos, campo) {
  return [...new Set(candidatos.map((item) => item[campo]).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
