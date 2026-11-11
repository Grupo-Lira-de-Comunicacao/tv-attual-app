# AttualPlay — "NO AR AGORA" com EPG real e link verificado de YouTube
Data: 11/11/2026

## Problema
O aplicativo em produção usava a constante \`src/data/programacao.js\` para afirmar que "Jornal Attual" (19h) e "Noite Attual" (23h) estavam no ar. Esta grade era ilustrativa, não conectada ao canal realmente programado.

## Evidências
- Endpoint público do ErsatzTV confirmado: \`https://tv.tvattual.com.br/iptv/xmltv.xml\`. Fonte com canal \`C1.145.ersatztv.org\`, campos start, stop, title e 295 entradas em 11/11/2026.
- Às 20h36 de 11/11/2026 (São Paulo), EPG indicava \`S01E02 - Attual Saúde\` entre 20h06m44s e 20h49m06s. Depois há vinhetas curtas e repetição do mesmo episódio. A grade não contém links de YouTube.
- Biblioteca YouTube do próprio canal \`@attualplay\` identificou vídeo público \`_mgU8E6fSds\`: \`S01E02 - Por que você sente tudo na barriga? A conexão Mente e Intestino - Dra. Lívia Ferraz Campos\`, duração 42m31s.
- Correspondência por título exato e duração aproximada do programa (até 2 minutos de diferença), não por busca genérica nem pelo vídeo mais recente.

## Implementação — branch isolada
1. \`lib/tvGuide.js\` extrai entradas do XMLTV sem dependências, converte fuso/UTC, encontra programa atual e próximo bloco editorial maior que 2 minutos; omite "A seguir" para vinhetas e repetições.
2. \`api/tv-programacao.js\` consulta apenas XMLTV público, retorna JSON mínimo no próprio domínio com cache CDN de 20 segundos; erro de fonte vira resposta indisponível (nunca título inventado).
3. \`src/components/NowPlaying.jsx\` mostra programa real na capa e na página de programação, recarrega a cada 45 segundos e quando a página volta para primeiro plano; link individual só quando há vídeo mapeado e verificado.
4. A página de programação e a capa deixam de renderizar dados fictícios de \`programacao.js\`.
5. Service Worker \`tv-attual-v2\` não intercepta \`/api/\` (não mostra grade atrasada via cache offline).
6. CI: tests Node para timestamps, títulos, links, bloco seguinte, erro e não-regressão do frontend, seguidos de build/audit.

## Escopo/segurança
Não houve alteração ao player HLS, ao OBS, à VPS, ao ErsatzTV, à grade na origem, ao YouTube, ao WhatsApp \`5512935012325\` ou a imagens/logotipos. Não há API key pública nem nova contratação. O link YouTube leva ao vídeo oficial, **não** é usado como fonte da transmissão.

## Limites conhecidos
- O XMLTV é a grade programada, não prova quadro a quadro do vídeo real. Atrasos de reprodução podem causar pequena diferença nos instantes de troca.
- Se entrar transmissão direta do OBS por sobreposição ao playout 24h, a interface deverá preferir o sinal real recebido do canal unificado (PR #16). Uma simples grade XMLTV não identifica a sobreposição.
- O YouTube não traz por si só a identidade do vídeo em exibição no ErsatzTV. Novos vídeos precisam de associação verificada entre ID da mídia na grade e URL oficial; futuramente essa etapa pode vir de catálogo/painel editorial protegido.
- Se não houver correspondência, o app usa título do XMLTV sem botão de YouTube; se o XMLTV falhar, mostra mensagem neutra.
- Não exibir intervalos curtos como programa "A seguir".
- A PR #16, que está em draft, poderá precisar de reconciliação de \`App.jsx\`, \`Schedule.jsx\`, \`App.css\`, \`sw.js\`, \`package.json\` e workflow antes de ser mesclada; nunca sobrescrever o recurso de grade real.

## Homologação
CI \`npm ci\`, \`npm audit --audit-level=high\`, \`npm test\`, \`npm run build\`; deploy Vercel preview; confirmar \`/api/tv-programacao\` retorna \`status=ok\` e YouTube só quando episódio coincide; revisar Android/iOS, reprodução da TV, substituição ao vivo, cache PWA, rollback. Em caso de erro de EPG, verificar que player continua intacto. Após publicação, confirmar \`app.tvattual.com.br\`.
