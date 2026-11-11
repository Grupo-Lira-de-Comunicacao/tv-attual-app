# TV Attual Streaming — MVP ao vivo

Projeto isolado para transmitir OBS diretamente para a VPS 2 por RTMPS (MediaMTX), HLS em HTTPS e player próprio responsivo, sem YouTube ou CDN de vídeo.

## Correção de ambiente Host Agent — 02/11/2026

**CAUSA CONFIRMADA:** o Host Agent é protegido pelo systemd com `ProtectSystem=strict` e permite escrita apenas nos caminhos de `ReadWritePaths`. A tentativa de criar `/opt/tvattual-live` falhou por isso, não por falta de espaço do disco da VPS. O unit file versionado em `atlas-core/host-agent/atlas-host-agent.service` autoriza `/var/lib/atlas-host-agent`.

**CAMINHO CORRETO:** `/var/lib/atlas-host-agent/tvattual-live`.

A solução foi usada e registrada no relatório de implantação A1 em 03/10/2026 (`/var/lib/atlas-host-agent/a1-deploy`). Não mudar o sandbox, `ProtectSystem`, `ReadWritePaths` ou qualquer serviço existente para acomodar este projeto.

### Staging sem sobrescrita

Execute `infra/stage-on-host-agent.sh` exclusivamente dentro de um Objective Scope N4_ROOT aprovado, de forma que o código seja copiado para a área persistente por um caminho oficialmente autorizado. O script falha se a raiz não for gravável ou se o destino existir; não remove nem substitui arquivos existentes.

O staging é separado do deploy: preparar o código não liga portas, não publica DNS e não cria containers. O deploy em produção só acontece após DNS, TLS, autenticação, validação das imagens e teste de OBS.

## Situação atual

- Código preparado, PR em revisão, e o caminho de staging corrigido.
- **Não presumir implantação na VPS.** O acesso de escrita em `/var/lib/atlas-host-agent` deve ser verificado em execução aprovada; a autorização N4_ROOT original venceu.
- `live.tvattual.com.br` e `ingest.tvattual.com.br` precisam de DNS e certificados TLS públicos.
- O canal antigo `tv.tvattual.com.br/iptv/channel/1.m3u8` e o AttualPlay devem permanecer inalterados.

## Requisitos operacionais

1. Resolver DNS dos dois novos subdomínios para o IP público da VPS (confirmar novamente em produção).
2. Emitir certificados públicos com renovação automatizada e gerar senha de publicação segura fora do Git.
3. Preparar a rede Docker exclusiva `tvattual-live-proxy` e conectar o Nginx Proxy Manager apenas se seguro e autorizado.
4. Publicar RTMPS autenticado na porta TCP 1936 e player HLS atrás de HTTPS. Nunca expor API ou HLS de origem publicamente.
5. Homologar com OBS e celular: ao vivo, fora do ar, navegador móvel, interrupção de sinal, CPU, rede e tráfego.

NENHUMA exclusão de dados/containers/volumes/arquivos/backups, reinício de ATLAS/Rádio Attual/ErsatzTV, alteração de hosts existentes ou contratação de serviços.
