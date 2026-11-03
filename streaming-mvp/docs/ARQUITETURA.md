# Arquitetura técnica — TV Attual Streaming v0.1

OBJETIVO: streaming próprio ao vivo, sem YouTube e sem CDN paga. Fluxo: OBS ou aplicativo móvel RTMPS (TCP 1936 com TLS e senha) -> MediaMTX -> HLS interno -> Nginx web interno -> Nginx Proxy Manager HTTPS -> live.tvattual.com.br -> player próprio.

A VPS 2 já abriga ErsatzTV, File Browser, AzuraCast e ATLAS. Não alterar esses serviços ou seus domínios. O AttualPlay atual consome `tv.tvattual.com.br/iptv/channel/1.m3u8`; preservar a URL e a grade já existente.

## Decisão de diretório — Host Agent

- `/opt/tvattual-live`: **NÃO USAR** (não está nos ReadWritePaths do Host Agent).
- `/var/lib/atlas-host-agent/tvattual-live`: caminho **previsto e permitido** pelo unit file do Host Agent (confirmar permissões reais no runtime).
- Motivo: unit `host-agent/atlas-host-agent.service` usa `ProtectSystem=strict` e `ReadWritePaths=/opt/atlas-dev-flow /var/lib/atlas-host-agent /var/log/atlas-host-agent /run/docker.sock`.
- Precedente: projeto A1 em 03/10/2026 gravou com sucesso `/var/lib/atlas-host-agent/a1-deploy`.
- O script `infra/stage-on-host-agent.sh` utiliza exclusivamente o caminho autorizado e aborta se ele não for gravável ou se já existir, preservando dados.
- **Não** corrigir alterando/removendo segurança systemd; **não** usar Docker como contorno de permissões.

## Dependências de produção

1. Preparar novo Objective Scope N4_ROOT válido, com uma única aprovação para a cadeia de ações permitidas. O escopo anterior expirou; não reutilizar autorizações vencidas.
2. Checar existência e permissão de escrita na raiz `/var/lib/atlas-host-agent`; em seguida executar staging isolado com SHA do GitHub confirmado.
3. DNS A de `live.tvattual.com.br` e `ingest.tvattual.com.br` para VPS 2 (endereço observado anteriormente: 179.198.124.163; verificar novamente).
4. Certificado confiável para os novos hosts, renovação automática e chaves protegidas; não expor credenciais.
5. Rede Docker nova, conexão aditiva ao NPM existente, sem reiniciar ou alterar hosts atuais.
6. Porta TCP 1936 apenas para ingest RTMPS autenticado; não publicar portas administrativas.
7. Status `/status.json` deve indicar false sem OBS e true durante publicação HLS.
8. Testar sinal OBS 720p/30 FPS, vídeo 3000 kbps, keyframes 2s, AAC 128 kbps. Testar Larix/PRISM em sessão separada, sem sobrescrever transmissão do estúdio.
9. Testar Android/iOS/desktop, falha de upload, perda de sinal, métricas e consumo.
10. Criar página WordPress nova somente após streaming validado.

## Proibições

Sem exclusões, sem `docker prune`, sem `rm -rf`, sem `docker compose down -v`, sem reinícios/alterações de serviços alheios. Nenhum segredo no Git. Sem gravação automática. Implantação só após homologação completa.
