// Programação da TV Attual (dados mockados — futuramente virão de API/painel)

export const programacao = [
  { hora: '07:00', titulo: 'Bom Dia Attual', descricao: 'Notícias de Caçapava e região para começar o dia.', tipo: 'TV + Rádio' },
  { hora: '10:00', titulo: 'Manhã Attual', descricao: 'Música, variedades e participação do público.', tipo: 'Rádio' },
  { hora: '19:00', titulo: 'Jornal Attual', descricao: 'As principais notícias do dia com credibilidade.', tipo: 'TV + Rádio' },
  { hora: '23:00', titulo: 'Noite Attual', descricao: 'Entretenimento e convidados especiais.', tipo: 'Rádio' },
]

// Próximos programas a partir do horário atual (máximo `quantidade`).
// Se o dia já passou de todos os horários, volta para o início da grade.
export function proximosProgramas(quantidade = 2, agora = new Date()) {
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes()

  const paraMinutos = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
  }

  const futuros = programacao.filter((p) => paraMinutos(p.hora) > minutosAgora)
  const lista = futuros.length > 0 ? futuros : programacao
  return lista.slice(0, quantidade)
}
