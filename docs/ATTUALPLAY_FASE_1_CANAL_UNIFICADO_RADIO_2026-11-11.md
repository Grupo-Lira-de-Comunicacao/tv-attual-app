# ATTUALPLAY — INTEGRAÇÃO DO CANAL E RÁDIO — FASE 1
**Data:** 11/11/2026 · **Status:** desenvolvimento isolado / PR de homologação
**Objetivo:** melhorar a experiência pública sem tocar no OBS, na VPS, no ErsatzTV, no AzuraCast ou na programação no ar.

## Fatos verificados antes da alteração
- Produção do app: `app.tvattual.com.br`, branch `main`, commit `bbb6c6f7659173d489917f76be1c832f231381bc`.
- O app em produção recebe HLS direto do ErsatzTV e exibe horários ilustrativos como se fossem reais.
- O player `live.tvattual.com.br` dispõe de fallback do sinal gravado, estado `/status.json` e eventos `postMessage` do tipo `tvattual:source` / `tvattual:playback`.
- A PR #14 do MVP de streaming ainda estava em rascunho: aproveitar seletivamente o componente público, sem mesclar nela nem importar o telefone antigo.
- API pública da rádio: `https://radio.tvattual.com.br/api/nowplaying/1`; dados lidos sem credenciais.
- Número WhatsApp aprovado e já publicado: `+55 12 93501-2325`.

## Implementado nesta branch
1. `TV_UNIFIED_PLAYER_URL` oficial no arquivo central de links. Mantidas as URLs HLS como referência e a versão anterior do WhatsApp.
2. Player público embutido em iframe oficial com verificação de origem e janela nos eventos; indicador "AO VIVO" apenas quando `mode=live`, "PROGRAMAÇÃO 24H" quando `mode=recorded`, e texto neutro se sem confirmação.
3. Página inicial não usa a programação fictícia para afirmar quais programas estão no ar.
4. Página "Programação" informa a pendência de integração com a grade oficial, sem inventar horários.
5. Mini-player público de rádio exibe música, artista e capa oficial fornecidos pelo AzuraCast quando disponível, sem token e sem acesso ao painel interno.
6. Quando o canal TV reporta vídeo em reprodução, o componente de rádio pausa sua própria saída de áudio; não existe promessa de controle de pausas remotas no iframe.
7. Testes automatizados Node via `npm test` passam a integrar o CI, além de `npm audit --audit-level=high` e `npm run build`.

## Não implementado — requer próxima fase
- Grade EPG real e "No ar / A seguir": precisa contrato confirmado de metadados do ErsatzTV / programação editorial, inclusive eventos ao vivo e fuso `America/Sao_Paulo`.
- Catálogo YouTube e estreia de episódios: hoje é apenas o link para o canal oficial; não afirmar integração automática autenticada.
- Operação OBS dentro do app público: **não fazer**. Controle sensível deve permanecer no ATTUAL STUDIO CONTROL, protegido e sem credenciais no frontend.
- Controle bidirecional da preferência TV/Rádio: o iframe oficial ainda não expõe contrato seguro de comando pause/play para o pai.
- Troca real OBS → canal → app, qualidade de imagem e áudio em Android/iOS/desktop: carecem de homologação humana com sinal real, sem mexer na produção.
- Logotipo: nenhum ativo foi trocado. Qualquer substituição futura depende da validação do arquivo mestre oficial no Google Drive.

## Plano de homologação antes de publicar
1. GitHub CI da branch aprovado: `npm ci`, `npm audit --audit-level=high`, `npm test`, `npm run build`.
2. Preview Vercel sem domínio público: confirmar que WhatsApp `5512935012325` foi preservado e que o iframe usa `https://live.tvattual.com.br/?embed=1`.
3. Em celulares Android e iOS, testar reprodução por toque, retorno do background, tela cheia e mensagens de erro sem conteúdo fictício.
4. Executar ensaio autenticado fora do ar com OBS + canal unificado; validar `live` e fallback `recorded` com logs da origem e imagem real.
5. Testar rádio online/offline e queda da API de metadados; o áudio deve continuar funcionando se a API falhar.
6. Depois de aceite, obter aprovação material `APROVO` conforme governança N4/N4_ROOT para promover a versão pública.
7. Registrar commit, resultado de CI, evidência de deploy e teste de leitura do domínio ao terminar.

## Risco e reversão
Esta PR é independente da PR #14 e não altera a infraestrutura de transmissão. Pode ser descartada sem afetar produção. A implantação final deve manter histórico de rollback Vercel e preservar o serviço público, rádio, OBS, WhatsApp e dados atuais.
