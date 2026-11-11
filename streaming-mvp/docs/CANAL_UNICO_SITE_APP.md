# TV Attual — Canal único 24 horas (site e AttualPlay)

## Objetivo

O espectador assiste **ao mesmo canal e no mesmo player**, na home do WordPress e no aplicativo AttualPlay:

- **Padrão:** o ErsatzTV mantém toda a programação gravada, sem interrupção da grade e sem parar o ErsatzTV.
- **Prioridade:** quando o OBS ou o Larix publica sinal no MediaMTX, o player troca automaticamente para a transmissão ao vivo.
- **Retorno:** após duas verificações negativas do sinal, o player volta à programação do ErsatzTV, sem precisar trocar de página.
- Intervalo de verificação: cerca de **8 segundos**; a troca pode incluir segundos de carregamento do novo HLS, não é uma mesa broadcast de corte sem perda de quadros.
- Se o endpoint de status ficar indisponível, o player prioriza o ErsatzTV. Se houver falha fatal no player ao vivo, volta ao ErsatzTV temporariamente.

## Centralização

O player público em `https://live.tvattual.com.br/` hospeda a lógica; `?embed=1` é a versão enxuta para incorporação.

Estado de sinal: `GET /status.json` (mesma origem do player), MediaMTX RTMPS protegido. O navegador só usa a URL pública HLS, nunca a senha do publicador.

- Gravação/Ersatz: `https://tv.tvattual.com.br/iptv/channel/1.m3u8`.
- Ao vivo: `https://live.tvattual.com.br/hls/tvattual-live/index.m3u8`.
- O ErsatzTV continua sempre rodando, preservando sua grade.

## Site WordPress

Página principal `https://tvattual.com.br/`, ID 22978, Elementor HTML widget ID `9f55f5d`.
Manter a identidade atual (tipografia Manrope, cores azul escuro, tarja vermelha ao vivo).
Código de substituição, pronto para revisão: `streaming-mvp/integrations/wordpress-home-html-widget.html`.
**Não alterar a home antes do novo player central passar nos testes reais de fallback, inclusive CORS do HLS ErsatzTV.**
Fazer backup da versão original do widget e usar o mecanismo oficial de edição Elementor, não SQL.

A página `https://tvattual.com.br/tv-attual-ao-vivo/` já utiliza o player central em iframe; ao atualizar a origem, passará a ter a mesma alternância.

## AttualPlay

`src/components/VideoPlayer.jsx` passa a incorporar a mesma URL `?embed=1`; `src/config/links.js` adiciona `TV_UNIFIED_PLAYER_URL`, mantendo a URL antiga do ErsatzTV como alternativa preservada.
`postMessage` de modo e reprodução permite atualizar o badge e manter telemetria anônima consentida.
No app o cabeçalho deixa de dizer “AO VIVO” enquanto está apenas reproduzindo programas gravados.
**Segurança do iframe liberada em 02/11/2026:** a política `Content-Security-Policy: frame-ancestors` do player agora permite **somente** `https://tvattual.com.br`, `https://www.tvattual.com.br`, `https://app.tvattual.com.br` e `self`. O ajuste está aplicado na VPS, validado em `nginx -t` e `curl`, com backup do nginx.conf em `streaming-mvp/infra/nginx.conf.before-official-app-frame-20261102`. O código correspondente está versionado em `infra/nginx.conf`.
**Não promover branch ao aplicativo público sem teste do PWA e deploy aprovado.** A Vercel apresenta preview READY com commit 49c83ed..., mas a produção em `app.tvattual.com.br` permanece no commit `a5db1f09...` em `main`. O CI geral falha por duas dependências vulneráveis do build (`vite@8.1.3` e `source-map-js@1.2.1`), e a PR deve permanecer draft até correção de segurança e validação.

## Qualidade e salvaguardas

- Scripts centralizados, sem `hls.js@latest` no widget da home (versão da biblioteca permanece fixada no player central).
- Móvel, desktop e PWA; inicialização silenciada para respeitar políticas de autoplay, áudio liberado após interação do usuário.
- Testes: Python e Node para comutação, build React/Vite, GitHub Actions de mídia H.264/AAC RTMPS → HLS com credenciais temporárias.
- Verificar compatibilidade CORS do ErsatzTV para o domínio `live.tvattual.com.br`. Se o ErsatzTV não permitir, bloquear a migração em vez de quebrar a home.
- Proibidas exclusões, troca de canal, parada do ErsatzTV, exposição de senhas, substituição dos serviços atuais.
- Reversão: restaurar o HTML anterior do widget e a versão de três arquivos do player, e manter a URL `tv.tvattual.com.br/iptv/channel/1.m3u8`.

## Estado (02/11/2026)

Código e templates **versionados na PR #14**, ainda em revisão. Player unificado **implantado na VPS** e **na home do WordPress**. CORS do ErsatzTV, playlist principal, playlist secundária e segmento HLS foram validados com HTTP 200. O **aplicativo público ainda não foi promovido** da branch em preview, para evitar ultrapassar o escopo aprovado e contornar a auditoria npm reprovada. O canal antigo continua funcionando.
