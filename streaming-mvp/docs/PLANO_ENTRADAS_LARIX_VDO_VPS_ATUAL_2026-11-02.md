# TV Attual — duas entradas móveis usando a VPS 2 atual

**Data:** 02/11/2026  
**Situação:** plano técnico e pré-homologação; **nenhuma ativação WHIP/WebRTC em produção autorizada neste documento.**  
**Objetivo:** repórter em campo pode assumir o canal da TV Attual sozinho, sem equipe no estúdio e sem interromper a programação automática do ErsatzTV.

## Infraestrutura consultada pelo ATLAS (somente leitura)
- VPS 2, aproximadamente 2 vCPU, 8 GB RAM, 100 GB de armazenamento.
- RAM disponível: 5,31 GB; RAM utilizada: 3,02 GB (~36,2%).
- Root: 31,52 GB livres, 69,4% ocupados.
- Swap: ~1,52 GB em uso de 4,29 GB.
- Load average no diagnóstico: 4,49 / 5,44 / 5,69 (1/5/15 min). **Alto diante de 2 vCPU; identificar CPU vs I/O antes de codificar/transcodificar.**
- `tvattual-live-origin-1`, `tvattual-live-web-1`, `tvattual-live-status-1`, `ersatztv`, `azuracast`, `nginx-proxy-manager`, `atlas-gateway`, `n8n` em execução.
- Nenhum serviço reiniciado, alterado ou contratado durante essa consulta.

## Fluxo desejado

1. **Larix (RTMPS) — prioridade alta / emergência:** conserva `rtmps://ingest.tvattual.com.br:1936/tvattual-live` e autenticação privada já existentes.
2. **VDO.Ninja (WebRTC/WHIP) — opção padrão:** caminho separado, por exemplo `tvattual-vdo` em MediaMTX; WHIP de publicação somente por HTTPS, autenticado e com conectividade ICE/UDP segura. **Ainda não implantado.**
3. **ErsatzTV — 24 horas:** mantém `https://tv.tvattual.com.br/iptv/channel/1.m3u8` continuamente. Sempre a fonte de retorno quando não há entrada ao vivo autorizada/saudável.

**Regra:** se Larix disponível → Larix; senão, se VDO.Ninja disponível → VDO.Ninja; senão → ErsatzTV. Se a fonte atual falhar, voltar à alternativa saudável; não interromper o canal de programas gravados. Preferir debounce de 2 leituras antes de abandonar um ao vivo e pequena janela de estabilidade antes de promovê-lo.

O mesmo player canônico em `https://live.tvattual.com.br/` é incorporado na home `tvattual.com.br`. O aplicativo público `app.tvattual.com.br` ainda aguarda release validado da PR #14.

## Razões para separar os caminhos

- MediaMTX atualmente usa `overridePublisher: false` em `tvattual-live`; dois publicadores na mesma path disputam o recurso. Dois paths independentes permitem entradas simultâneas e uma decisão de qual exibir.
- Atualmente `webrtc: false`; habilitar WHIP exige alteração segura de MediaMTX, proxy HTTPS ou endpoint protegido, firewall/ICE e testes de publicação por 4G/5G.
- A VDO.Ninja pode publicar em MediaMTX por WHIP. A captura em navegador costuma usar H.264 ou VP8 e áudio Opus: **não presumir que HLS atual (`hlsVariant: mpegts`) tocará com áudio no Android/iOS/Chrome/Safari.** Comprovar codecs reais e o suporte do player. Transcodificação adicional só se carga/qualidade permitirem.
- O MediaMTX é um servidor de mídia e normalmente não faz transcodificação de vídeo por si só. Se precisar transcodificar áudio, dimensionar CPU e testar com limites; evitar custo constante em VPS com carga atual alta.

## Fases de implementação na VPS atual

### Etapa A — agora, sem alteração de produção
- Manter RTMPS Larix e ErsatzTV funcionando como hoje.
- Testar o celular Larix em 4G/5G com a chave entregue somente por meio autorizado, sem jamais registrá-la em logs, GitHub ou chat.
- Medir carga por processo, I/O, latência e consumo durante transmissão (diagnóstico N4_ROOT somente leitura quando autorizado).
- Preparar configurações e testes de WHIP em CI/laboratório com credenciais descartáveis.

### Etapa B — VDO.Ninja isolado
- Adicionar novo path `tvattual-vdo` para WHIP (não reutilizar a senha nem o path Larix).
- Autenticação forte e exclusiva para WHIP; TLS público válido para endpoint, acesso de administração fechado, configuração ICE pública/UDP limitada ao necessário.
- Não publicar endpoint de ingest sem proteção. Testar primeiro em homologação com publisher de laboratório e retorno sem credenciais reais.
- Medir H.264+Opus vs HLS, imagem e áudio em Chrome Android e Safari iOS; segurar a implantação se som ou vídeo falharem.
- Medir uso de CPU, swap, memória e temperatura/estabilidade da VPS, incluindo serviços antigos.

### Etapa C — seleção automática no canal canônico
- Expandir `status.py` para reportar estados de `larix`, `vdo` e `recorded` sem expor senha ou API administrativa ao público.
- Preservar no JSON o campo `live` para clientes atuais; adicionar campo controlado `source`.
- Atualizar JS do player para selecionar prioridades sem alterações no layout oficial. Tratar perda de sinal, pausa do espectador, atraso de HLS, autenticação e reconexão.
- Testar transições em todos os sentidos e duas fontes simultâneas, inclusive fallback para ErsatzTV.

### Etapa D — publicação controlada
- Atualização isolada, com backups novos, checksum e rollback pontual.
- Testar HTTPS, CSP de incorporação no WordPress e AttualPlay, player desktop/móvel, 4G/5G em pelo menos dois dispositivos.
- Validar gravação/replay conforme política editorial se for solicitado (por enquanto `record: false`).
- Solicitar aprovação N4_ROOT exata antes de gravar na VPS ou alterar firewall, DNS, proxy, segredos e serviços.

## Restrições
- Não comprar VPS, CDN, licenças, plugins ou ampliar custos recorrentes sem autorização.
- Não desligar, alterar ou reiniciar ErsatzTV, Rádio Attual, ATLAS, NPM existente, n8n e serviços de terceiros.
- Não abrir painel de administração ou servidor de streaming sem autenticação na internet.
- Não expor chaves, tokens, senhas nem URLs de publicação com segredos.
- Não considerar a solução WHIP entregue enquanto não houver áudio/vídeo validado ponta a ponta.

## Expansão futura (somente quando houver orçamento)
O usuário sinalizou interesse em KVM 4 por um ano, mas sem contratação imediata. Na captura do carrinho, o preço exibido era R$ 69,99/mês por 12 meses (total R$ 839,88), renovação anunciada R$ 159,99/mês e backup diário opcional R$ 65,99/mês. São **valores de tela, não cotação garantida para a data de compra**. KVM 4 tem, em catálogo, 4 vCPU, 16 GB, 200 GB NVMe e banda anunciada de 16 TB. Priorizar uma **migração planejada** e testes de capacidade, não assumir que só aumentar RAM resolve gargalo de CPU/I/O.

## Referências técnicas oficiais
- VDO.Ninja WHIP: https://vdo.ninja/whip
- Integração VDO.Ninja/MediaMTX: https://vdo.ninja/whip/clientarea.php
- MediaMTX publicação WebRTC e WHIP: https://mediamtx.org/docs/publish/webrtc
- MediaMTX HLS: https://mediamtx.org/docs/read/hls
- MediaMTX conectividade WebRTC/ICE: https://mediamtx.org/docs/features/webrtc-specific-features
- Tarefa atual: PR #14 do repositório `Grupo-Lira-de-Comunicacao/tv-attual-app`.

**Resultado deste documento:** decisão arquitetural documentada. A ativação da entrada VDO.Ninja e comutação dupla na VPS ainda dependem de homologação e novo escopo aprovado.
