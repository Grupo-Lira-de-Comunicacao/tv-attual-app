# Arquitetura técnica — TV Attual Streaming v0.1

Objetivo: streaming próprio ao vivo no início, sem YouTube, sem CDN paga, sem grade 24h obrigatória. Fluxo OBS/ATEM -> RTMPS 1936 com TLS e usuário/senha -> MediaMTX -> HLS interno -> proxy Nginx -> Nginx Proxy Manager HTTPS -> live.tvattual.com.br -> player iframe no site.

A VPS 2 já abriga ErsatzTV, File Browser, AzuraCast e ATLAS; nada disso é alterado. O aplicativo AttualPlay já consome tv.tvattual.com.br/iptv/channel/1.m3u8 e essa URL não deve ser substituída.

## Dependências de produção
1. Registros DNS A novos para live.tvattual.com.br e ingest.tvattual.com.br apontados a 179.198.124.163 (confirmar novamente).
2. Certificado público válido para os novos hosts, com renovação automatizada e chave protegida.
3. Pasta isolada e criada por mecanismo autorizado; Host Agent apresentado como somente leitura na auditoria N4_ROOT de 01/11/2026.
4. Network Docker nova tvattual-live-proxy; apenas ligação aditiva com Nginx Proxy Manager, sem reiniciar ou alterar hosts existentes.
5. Porta 1936/TCP para RTMPS autenticado; nenhum painel administrativo do MediaMTX exposto.
6. Status /status.json deve indicar false sem OBS; true quando manifest HLS está disponível.
7. Teste não listado com OBS 720p/30, x264 superfast, CBR 3000 kbps, keyframes 2s, áudio AAC 128 kbps.
8. Testar Android, iOS e desktop; perda de sinal, consumo de CPU, upload, atraso, recuperação e capacidade de público.
9. Página nova reversível no WordPress depois do streaming validado.

## Limites e segurança
Sem exclusões de dados/volumes/containers/logs/backups. Não usar docker prune, rm -rf, down -v, substituir roteamento ou atualizar serviços existentes. Código sem credenciais no Git. Sem gravar automaticamente vídeos. Arquivos de mídia e chaves TLS fora do repositório. Validar compatibilidade das imagens e da configuração MediaMTX antes de habilitar a porta 1936.
