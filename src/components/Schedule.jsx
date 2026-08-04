import { obterProgramacao } from '../services/programacaoService.js'

// Página Programação — grade completa do dia.
// A origem dos dados fica encapsulada no service para permitir troca futura por API/Supabase.
export default function Schedule() {
  const programacao = obterProgramacao()

  return (
    <section className="programacao">
      <h2 className="secao-titulo">Programação</h2>
      <p className="contato-intro">Confira todos os horários da TV Attual.</p>
      <div className="programacao-lista">
        {programacao.map((programa) => (
          <article key={programa.hora} className="programa">
            <span className="programa-hora">{programa.hora}</span>
            <div>
              <h3>{programa.titulo}</h3>
              <p>{programa.descricao}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
