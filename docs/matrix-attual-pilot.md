# Piloto AttualPlay -> Matrix Attual

## Estado de produção — 2026-09-19

A integração Matrix está **habilitada tecnicamente em produção**, mas continua estritamente condicionada a consentimento explícito.

Produção atual:

- `VITE_MATRIX_TRACKING_ENABLED=true`;
- `VITE_MATRIX_ANALYTICS_DEFAULT=denied`;
- endpoint Matrix configurado;
- chave publicável de baixa autoridade configurada;
- nenhum evento é enviado enquanto analytics não for aceito;
- analytics exige confirmação de 18+;
- personalização exige opt-in separado;
- marketing permanece `false`;
- ações externas automáticas permanecem desligadas.

Deployment de ativação:
`dpl_GE2B5A5zJtMm8BuBLagjAPEFHTQ7`

SHA do AttualPlay:
`6f4f6c2286465beec8887f894c6ee36362066bf2`

## Eventos

Eventos suportados:

- `session_started`;
- `page_viewed`;
- `tv_started` / `tv_stopped` com faixa de tempo;
- `radio_started` / `radio_stopped` com faixa de tempo;
- `preference_updated`;
- `recommendation_shown`;
- `recommendation_clicked`.

Nome, e-mail, telefone, mensagens do chat, conteúdo de participação, CPF, IP, credenciais ou atributos sensíveis não fazem parte da telemetria.

## Identidade

O navegador cria um identificador aleatório local. A Matrix armazena somente o hash técnico associado ao perfil anônimo.

M4 está presente em produção e permite vínculo explícito com uma conta compatível do ATTUAL ONE por código temporário de uso único.

Não existe descoberta oculta de identidade.

## Consentimento

`matrixTelemetry.js` mantém:

- `analytics=false` como estado padrão;
- confirmação 18+ obrigatória para analytics;
- `personalization=false` até autorização separada;
- `marketing=false` sempre neste fluxo.

A variável `VITE_MATRIX_TRACKING_ENABLED=true` apenas disponibiliza a capacidade técnica. Ela **não concede consentimento**.

## M2 / M3 / M4

Backend Matrix:

- M2 shadow engine ativo;
- M3 control engine ativo;
- M4 control engine ativo;
- retenção automática ativa;
- marketing desabilitado;
- n8n external actions desabilitadas.

AttualPlay:

- M3 “Você pode gostar” em produção;
- M4 controles de identidade em produção;
- identidade ainda sem uso real no read-back de 19/09/2026;
- novos eventos dependem de consentimento real do usuário.

## Rollback

Para desligar imediatamente a capacidade de telemetria:

`VITE_MATRIX_TRACKING_ENABLED=false`

Depois deve ser feito novo deployment do AttualPlay, pois as variáveis `VITE_*` são incorporadas no build.

TV, rádio, programação, PWA e demais funções essenciais continuam funcionando sem Matrix.

## Observabilidade de referência

No read-back realizado antes da ativação consent-gated:

- eventos totais: 2;
- perfis anônimos: 2;
- recomendações: 0;
- M4 person sessions: 0;
- M4 bridge tokens: 0;
- M4 context promotions: 0.

Esses números são baseline; crescimento posterior deve representar somente uso autorizado.

## Princípio

```text
tracking capability = habilitada

consentimento = negado por padrão

analytics = somente opt-in adulto

personalização = opt-in separado

marketing = desligado
```
