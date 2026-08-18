# PROPOSTA SUPABASE — ATTUALPLAY V1

## Estado observado

Projeto Supabase acessível identificado: `attualplay@gmail.com's Project`

Project ref: `onrmaojjvcbqbgwuhzwq`

Região: `sa-east-1`

Status observado: `ACTIVE_HEALTHY`

O projeto não está vazio e não deve ser tratado como banco exclusivo do AttualPlay sem decisão explícita. Foram observadas tabelas já existentes relacionadas a outras frentes do ecossistema, incluindo Casting Attual 360 e ATLAS.

Nenhuma tabela específica de programação, programas, episódios ou status de transmissão foi encontrada na auditoria atual.

## Guardrails desta proposta

- Nenhum SQL foi executado.
- Nenhuma tabela foi criada, alterada ou removida.
- Nenhuma policy RLS foi alterada.
- Nenhuma credencial ou chave foi registrada no repositório.
- Nenhuma mudança foi feita em produção.
- Este documento é somente preparação arquitetural.

## Objetivo

Transformar a programação hoje mockada em uma fonte administrável, preservando o contrato atual do `programacaoService` e evitando acoplamento direto da interface ao banco.

Arquitetura pretendida:

```text
Painel administrativo
        |
        v
Supabase
        |
        v
programacaoService
        |
        +--> Programação
        +--> No ar agora
        +--> A seguir
```

## Modelo mínimo proposto

### `attual_programas`

Catálogo editorial dos programas.

Campos propostos:

- `id` uuid primary key
- `slug` text unique
- `titulo` text not null
- `descricao` text
- `imagem_url` text nullable
- `apresentadores` jsonb default `[]`
- `ativo` boolean default true
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

### `attual_grade`

Grade efetiva por dia/horário.

Campos propostos:

- `id` uuid primary key
- `programa_id` uuid foreign key -> `attual_programas.id`
- `dia_semana` smallint
- `hora_inicio` time not null
- `hora_fim` time nullable
- `titulo_override` text nullable
- `descricao_override` text nullable
- `ativo` boolean default true
- `ordem` integer nullable
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

### `attual_transmissao_status`

Separação entre programação prevista e transmissão real.

Campos propostos:

- `id` uuid primary key
- `canal` text
- `esta_ao_vivo` boolean default false
- `programa_id` uuid nullable
- `titulo_ao_vivo` text nullable
- `mensagem` text nullable
- `iniciado_em` timestamptz nullable
- `updated_at` timestamptz default now()

## Evolução posterior

Somente depois do MVP da grade:

- `attual_episodios`
- banners e destaques
- convidados
- links de replay
- metadados de produção
- integração com ATTUAL ONE
- painel editorial central

## Estratégia de leitura no frontend

O `programacaoService` deve preservar fallback local durante a transição:

1. tenta obter a grade oficial da fonte remota;
2. valida resposta;
3. em erro ou indisponibilidade, usa `src/data/programacao.js`;
4. informa internamente a fonte (`supabase` ou `mock-local`);
5. a interface continua consumindo o mesmo contrato.

Isso evita que uma indisponibilidade do Supabase retire do ar a tela pública do AttualPlay.

## Segurança proposta

Para leitura pública da programação, a recomendação é expor somente linhas ativas por políticas RLS específicas. Escrita administrativa deve exigir autenticação e políticas separadas.

Nenhuma service role key deve ser enviada ao frontend. O frontend deve usar somente chave publicável/anon apropriada para leitura autorizada pelas policies.

## Próxima decisão protegida

Antes de qualquer SQL, deve ser decidido explicitamente se:

1. o projeto Supabase atual será compartilhado pelo ecossistema e receberá tabelas prefixadas `attual_*`; ou
2. será criado um projeto Supabase dedicado ao AttualPlay.

Essa decisão deve preceder criação de tabelas, migrations ou policies.
