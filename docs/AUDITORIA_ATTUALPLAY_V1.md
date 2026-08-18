# Auditoria Técnica — AttualPlay v1

Data: 2026-08-04
Branch de trabalho: `codex/auditoria-attualplay-v1`
Base: `main`

## Objetivo

Registrar o estado técnico inicial do aplicativo TV Attual + Rádio Attual antes de qualquer evolução estrutural, sem alterar produção, Vercel ou Supabase.

## Estado confirmado

- Repositório: `Grupo-Lira-de-Comunicacao/tv-attual-app`
- Visibilidade: privado
- Branch oficial: `main`
- Branch de auditoria: `codex/auditoria-attualplay-v1`
- Stack: React + Vite + hls.js
- PWA ativa por `manifest.json` + `sw.js`
- TV ao vivo por HLS direto no navegador
- Rádio por stream MP3 com fallback para iframe oficial
- Links oficiais centralizados em `src/config/links.js`
- Programação ainda baseada em dados mockados locais
- Bloco “No ar agora” ainda estático no `App.jsx`

## Pontos positivos

1. Player de TV usa HLS direto e não atravessa API intermediária.
2. Compatibilidade com hls.js e HLS nativo em Safari/iOS.
3. Player de rádio tem fallback funcional.
4. URLs oficiais estão centralizadas.
5. PWA já possui manifesto, ícones e service worker.
6. Service worker não tenta cachear streams de vídeo/áudio ao vivo.
7. Estrutura atual é pequena e adequada para evolução incremental.

## Pontos a evoluir

1. Substituir programação mockada por fonte dinâmica oficial.
2. Tornar “No ar agora” e “A seguir” derivados da programação real.
3. Definir fonte oficial dos dados antes de criar integrações.
4. Revisar tratamento de estado de transmissão: horário programado não deve, sozinho, significar “AO VIVO”.
5. Atualizar README, hoje ainda baseado no template padrão do Vite.
6. Preparar integração futura com Supabase/n8n/Atlas somente após confirmação do projeto Supabase correto.
7. Manter mídia fora da API do app; API deve transportar apenas metadados e estados.

## Arquitetura recomendada de evolução

```text
ErsatzTV/HLS ───────────────> Player TV
AzuraCast/MP3 ──────────────> Player Rádio

Supabase ─┐
          ├─> metadados/programação/estado ─> AttualPlay
n8n/Atlas ┘
```

## Regras de segurança desta fase

- Nenhuma alteração em `main` sem autorização de nível 4.
- Nenhum merge nesta fase.
- Nenhum deploy em produção.
- Não conectar GitHub à Vercel durante a auditoria.
- Não alterar Supabase, SQL ou banco.
- Não registrar tokens, senhas, chaves ou conteúdo sensível de `.env`.

## Próxima etapa sugerida

Completar o inventário funcional dos componentes e, depois, preparar uma proposta de Fase 1 dinâmica contendo apenas:

1. programação oficial;
2. cálculo de “No ar agora” e “A seguir”;
3. estado real do stream;
4. documentação do contrato de dados.

Nenhuma dessas mudanças deve ser promovida para produção antes de teste e autorização específica.
