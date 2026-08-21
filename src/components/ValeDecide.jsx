import { useEffect, useMemo, useState } from 'react'
import { valeDecideCandidates, valeDecideCidadesPrioritarias } from '../data/valeDecideCandidates.js'
import { carregarCandidatosPublicados } from '../services/valeDecideApi.js'
import { filtrarCandidatos, listarOpcoes, resumirPorCidade } from '../services/valeDecideService.js'
import './ValeDecide.css'

export default function ValeDecide({ onVoltar }) {
  const [cidade, setCidade] = useState('Todas')
  const [cargo, setCargo] = useState('Todos')
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [baseCandidatos, setBaseCandidatos] = useState(valeDecideCandidates)
  const [origemBase, setOrigemBase] = useState('local')

  useEffect(() => {
    let ativo = true

    carregarCandidatosPublicados()
      .then((dados) => {
        if (!ativo || !dados.length) return
        setBaseCandidatos(dados)
        setOrigemBase('supabase')
      })
      .catch(() => {
        if (ativo) setOrigemBase('local')
      })

    return () => {
      ativo = false
    }
  }, [])

  const cargos = useMemo(() => listarOpcoes(baseCandidatos, 'cargo'), [baseCandidatos])
  const resumo = useMemo(() => resumirPorCidade(baseCandidatos), [baseCandidatos])
  const candidatos = useMemo(
    () => filtrarCandidatos(baseCandidatos, { cidade, cargo, busca }),
    [baseCandidatos, cidade, cargo, busca],
  )

  if (selecionado) {
    return (
      <section className="vale-decide-pagina">
        <button className="vale-voltar" onClick={() => setSelecionado(null)}>← Voltar aos candidatos</button>
        <article className="vale-perfil">
          <span className="vale-selo">VALE DECIDE 2026</span>
          <h2>{selecionado.nome}</h2>
          <p className="vale-subtitulo">{selecionado.cargo} · {selecionado.partido} · {selecionado.numero}</p>
          <div className="vale-tags">
            <span>{selecionado.cidade}</span>
            <span>{selecionado.base}</span>
            <span>{selecionado.situacao}</span>
          </div>
          <dl className="vale-detalhes">
            <div><dt>Nome completo</dt><dd>{selecionado.nomeCompleto}</dd></div>
            {selecionado.federacao && <div><dt>Federação</dt><dd>{selecionado.federacao}</dd></div>}
            {selecionado.ocupacao && <div><dt>Ocupação</dt><dd>{selecionado.ocupacao}</dd></div>}
            <div><dt>Histórico</dt><dd>{selecionado.historico}</dd></div>
          </dl>
          <div className="vale-impacto">
            <strong>O que fez pela cidade</strong>
            <p>{selecionado.impactoCidade}</p>
          </div>
          <small className="vale-fonte">Fonte/status: {selecionado.fonteStatus}</small>
        </article>
      </section>
    )
  }

  return (
    <section className="vale-decide-pagina">
      <button className="vale-voltar" onClick={onVoltar}>← Voltar ao início</button>
      <header className="vale-hero">
        <span className="vale-selo">ELEIÇÕES 2026</span>
        <h2>Vale Decide</h2>
        <p>Quem disputa seu voto, de onde vem e o que já entregou para a região.</p>
      </header>

      <div className="vale-resumo">
        {valeDecideCidadesPrioritarias.map((nomeCidade) => (
          <button key={nomeCidade} onClick={() => setCidade(nomeCidade)}>
            <strong>{resumo[nomeCidade] || 0}</strong>
            <span>{nomeCidade}</span>
          </button>
        ))}
      </div>

      <div className="vale-filtros">
        <input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar candidato, partido ou cidade"
          aria-label="Buscar candidatos"
        />
        <select value={cidade} onChange={(event) => setCidade(event.target.value)} aria-label="Filtrar por cidade">
          <option>Todas</option>
          {valeDecideCidadesPrioritarias.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={cargo} onChange={(event) => setCargo(event.target.value)} aria-label="Filtrar por cargo">
          <option>Todos</option>
          {cargos.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="vale-lista">
        {candidatos.length ? candidatos.map((candidato) => (
          <button className="vale-card" key={candidato.id} onClick={() => setSelecionado(candidato)}>
            <div className="vale-card-numero">{candidato.numero}</div>
            <div className="vale-card-conteudo">
              <strong>{candidato.nome}</strong>
              <span>{candidato.cargo}</span>
              <small>{candidato.partido}{candidato.federacao ? ` · ${candidato.federacao}` : ''} · {candidato.cidade}</small>
            </div>
            <span className="vale-card-seta">›</span>
          </button>
        )) : (
          <div className="vale-vazio">
            <strong>Nenhuma candidatura local cadastrada neste filtro.</strong>
            <p>O radar regional continuará mostrando apoios, emendas, votação e presença política mesmo quando a cidade não tiver candidato próprio.</p>
          </div>
        )}
      </div>

      <p className="vale-aviso">
        {origemBase === 'supabase'
          ? 'Base verificada do Banco Vale Decide. Dados de mandato e situação eleitoral são publicados após revisão editorial.'
          : 'Base de contingência em uso. O Banco Vale Decide já está conectado e assumirá a exibição conforme os registros forem verificados e publicados.'}
      </p>
    </section>
  )
}
