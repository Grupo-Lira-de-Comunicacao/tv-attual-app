# TV Attual Streaming — MVP ao vivo

Projeto isolado para transmitir OBS diretamente para a VPS 2, com RTMPS de entrada, MediaMTX, HLS em HTTPS e player próprio responsivo.

**Estado:** código preparado, testes estáticos aprovados; implantação ainda não concluída. Na auditoria de 01/11/2026, o Host Agent aceitou N4_ROOT mas o filesystem usado pelos comandos estava somente leitura (mkdir em /opt retornou Read-only file system). Os domínios live.tvattual.com.br e ingest.tvattual.com.br não possuíam DNS nem certificado próprios.

Requisitos para ligar em produção:
- Disponibilidade de criação de pasta nova por mecanismo oficialmente suportado na VPS (não contornar proteções);
- Registros A de live.tvattual.com.br e ingest.tvattual.com.br apontando para 179.198.124.163;
- Certificados públicos válidos com renovação e senha de publicação mantida fora do Git;
- Nova rota NPM sem editar/remover os hosts existentes, firewall estritamente aditivo;
- Testes reais OBS -> HLS, player e dispositivos móveis.

Este módulo não envolve YouTube ou CDN paga e não deve afetar Rádio Attual, ErsatzTV, n8n, File Browser ou ATLAS.
