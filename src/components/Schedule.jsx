import { programacao } from '../data/programacao.js'

// Página Programação — grade completa do dia
export default function Schedule() {
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
