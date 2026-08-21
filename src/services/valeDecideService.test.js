import test from 'node:test'
import assert from 'node:assert/strict'
import { filtrarCandidatos, resumirPorCidade } from './valeDecideService.js'

const candidatos = [
  { nome: 'Delegado Hugo', cidade: 'Caçapava', cargo: 'Deputado Estadual', partido: 'PL' },
  { nome: 'Geninho da Funerária', cidade: 'Caçapava', cargo: 'Deputado Federal', partido: 'PSDB' },
  { nome: 'Eduardo Cury', cidade: 'São José dos Campos', cargo: 'Deputado Federal', partido: 'PL' },
]

test('filtra candidatos por cidade e cargo', () => {
  const resultado = filtrarCandidatos(candidatos, {
    cidade: 'Caçapava',
    cargo: 'Deputado Federal',
  })

  assert.deepEqual(resultado.map((item) => item.nome), ['Geninho da Funerária'])
})

test('retorna todos quando os filtros estão vazios', () => {
  assert.equal(filtrarCandidatos(candidatos, {}).length, 3)
})

test('resume a quantidade de candidaturas por cidade', () => {
  assert.deepEqual(resumirPorCidade(candidatos), {
    'Caçapava': 2,
    'São José dos Campos': 1,
  })
})
