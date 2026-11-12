# AttualPlay — Catálogo público de vídeos YouTube sincronizado automaticamente

**Data:** 11/11/2026  
**Objetivo:** ligar o título do programa efetivamente programado no ErsatzTV ao vídeo certo do canal oficial AttualPlay no YouTube, sem cadastrado manual para cada novo episódio e sem usar o vídeo do YouTube como motor da transmissão.

## Fontes verificadas
- Grade: \`https://tv.tvattual.com.br/iptv/xmltv.xml\`, canal \`C1.145.ersatztv.org\`.
- Canal próprio no YouTube: \`@attualplay\`, ID \`UC5u5RAdVyJ_jarLlAnt4gXA\`.
- Atom/RSS público: \`https://www.youtube.com/feeds/videos.xml?channel_id=UC5u5RAdVyJ_jarLlAnt4gXA\`. Disponibiliza as 15 publicações mais recentes (sem API key e sem login).
- Catálogo inicial de **26 vídeos públicos**, obtidos na consulta conectada de publicações do próprio canal (25 registros exibidos) mais entrevista verificada da Dra. Lívia Ferraz Campos (\`_mgU8E6fSds\`). O canal contabilizava ~386 uploads na consulta; **não** se afirma que o catálogo histórico esteja completo, porque a consulta paginada do vidIQ atingiu o limite de créditos, renovação indicada para 22/11/2026.
- Os metadados do feed são públicos. Nunca incluir vídeos privados ou não listados.

## Arquitetura
1. \`data/youtube-catalog.json\`: somente os vídeos públicos indexados; sem credenciais.
2. \`lib/youtubeCatalog.js\`: valida o canal, lê feed Atom, normaliza texto e episódios, unifica novos vídeos mantendo duração e arquivos antigos, rejeita matches ambíguos.
3. \`lib/tvGuide.js\`: preserva a exceção editorial verificada da Dra. Lívia e, para outros vídeos, tenta associação conservadora. Só aceita título específico equivalente, ou **mesma série + mesma temporada/episódio**. Se há duração conhecida, exige diferença menor ou igual a 120 s; se há mais de um candidato válido, exibe EPG sem botão YouTube.
4. \`api/tv-programacao.js\`: consulta EPG e feed público em paralelo; cache em memória até 5 minutos para o feed em instância quente da função, fallback silencioso ao catálogo persistido. Retorna diagnóstico mínimo \`catalogoYoutube.statusFeed\`, \`videosIndexados\`, \`videosRecentes\` e \`origem\`.
5. \`scripts/sync-youtube-catalog.mjs\`: incorpora e preserva as novas entradas do RSS e não altera o arquivo caso não tenha diferenças.
6. \`.github/workflows/youtube-catalog-sync.yml\`: agenda a cada **3 horas (17m da hora UTC)** e disparo manual disponível na aba Actions. Usa somente \`GITHUB_TOKEN\` temporário com \`contents:write\` para gravar \`data/youtube-catalog.json\` na branch principal após testes e build; sem push forçado. Em mudanças do catálogo, integração GitHub→Vercel publica novo build. Um atraso na agenda não impede atualização recente via feed direto na API.

## Garantias e limites
- **Não adivinhar** link por "S01E02" isolado, por nome genérico do programa ou por ser o vídeo mais recente do canal.
- **Vinhetas de poucos segundos** continuam sem botão.
- **Caso ambíguo** continua mostrando o título do ErsatzTV e nenhum link YouTube; o espectador não é enviado para entrevista errada.
- **YouTube indisponível:** mantém os 26 vídeos iniciais e o último catálogo sincronizado; não afeta sinal HLS, OBS, ErsatzTV ou Rádio Attual.
- **RSS não é catálogo completo:** somente 15 itens recentes no feed; catálogo histórico é incremental a partir desta data. Uma importação histórica completa poderá usar a fonte oficial YouTube Data API com a autorização necessária ou uma exportação do canal; não usar resultados privados no app.
- **Vercel Serverless:** cache em memória é por instância; a publicação não depende dele para conservar novos vídeos após cron.
- **GitHub Actions:** execuções programadas podem atrasar/ser desativadas por inatividade; acompanhar primeiros agendamentos para verificar permissão de escrita e publicação de catálogo.
- **Player:** não alterado; a grade indica programação agendada, não substitui prova de transmissão ao vivo. A futura PR #16 do player unificado precisa preservar a seção \`NowPlaying\` do app e ocultar o EPG gravado quando sinal real \`live\` estiver confirmado.

## Homologação técnica
- Node 22: \`npm test\` e \`npm run build\`.
- Endpoint protegido de prévia da Vercel consultado: retorno real \`status="ok"\`, vídeo da Dra. Lívia com o endereço correto, \`catalogoYoutube.statusFeed="ok"\`, \`videosRecentes=15\`, \`videosIndexados=26\`. **A associação automática com outros episódios foi testada com EPG de ensaio em testes Node**, sem manipular programação real.
- Conferir produção \`https://app.tvattual.com.br/api/tv-programacao\`, seção NO AR AGORA, YouTube em nova aba, áudio/TV inalterados; validação física Android/iOS continua recomendada.
- Programa em live via OBS necessita suporte ao modo real do player unificado, na PR #16, sem bloquear esta atualização.

## Segurança e governança
Sem alteração de logotipos, marcas, contatos, links de player, volumes, DNS, OBS, VPS, media playout, canal YouTube ou vídeos originais. Apenas código e dados públicos do aplicativo, com testes e rollback via GitHub/Vercel. Preflight GL-CONDUTA-PREFLIGHT-20261102 aplicado. Evitar acesso automático a credenciais ou endpoints administrativos.
