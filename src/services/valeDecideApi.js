const SUPABASE_URL = 'https://mmheboqkeadipgtmyory.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_x4Y6rOnP0MXViQbLawJ6lA_LMm3U3hc'

function mapearCargo(cargo) {
  const mapa = {
    'deputado-estadual': 'Deputado Estadual',
    'deputado-federal': 'Deputado Federal',
    senador: 'Senador',
    governador: 'Governador',
    presidente: 'Presidente',
  }
  return mapa[cargo] || cargo
}

function mapearSituacao(status) {
  const mapa = {
    em_analise: 'Registro em análise',
    registrado: 'Registrado',
    deferido: 'Deferido',
    indeferido: 'Indeferido',
    sub_judice: 'Sub judice',
    renuncia: 'Renúncia',
  }
  return mapa[status] || status || 'Situação em verificação'
}

export async function carregarCandidatosPublicados() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/candidates`)
  url.searchParams.set('select', '*')
  url.searchParams.set('published', 'eq.true')
  url.searchParams.set('verification_status', 'eq.verificado')
  url.searchParams.set('order', 'editorial_priority.asc,ballot_name.asc')

  const resposta = await fetch(url, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
  })

  if (!resposta.ok) {
    throw new Error(`Vale Decide API: ${resposta.status}`)
  }

  const dados = await resposta.json()
  return dados.map((item) => ({
    id: item.id,
    nome: item.ballot_name,
    nomeCompleto: item.full_name || item.ballot_name,
    cidade: item.home_city || 'Regional',
    cargo: mapearCargo(item.office),
    partido: item.party,
    federacao: item.federation || '',
    numero: item.ballot_number || '—',
    situacao: mapearSituacao(item.registration_status),
    base: item.home_city ? 'Local/Regional' : 'Regional',
    ocupacao: item.occupation || '',
    historico: item.biography || 'Histórico em atualização.',
    impactoCidade: 'Emendas, entregas e atuação por município serão exibidas conforme verificação documental.',
    fonteStatus: item.last_verified_at
      ? `Banco Vale Decide · verificado em ${new Date(item.last_verified_at).toLocaleDateString('pt-BR')}`
      : 'Banco Vale Decide · verificação editorial',
  }))
}
