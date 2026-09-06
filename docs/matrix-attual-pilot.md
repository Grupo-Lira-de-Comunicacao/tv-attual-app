# Piloto AttualPlay -> Matrix Attual

## Estado
Integracao preparada em codigo, desligada por padrao. Nenhum evento e enviado sem:
1. `VITE_MATRIX_TRACKING_ENABLED=true`;
2. endpoint Matrix configurado;
3. chave publicavel configurada;
4. consentimento de analytics concedido.

## Eventos iniciais
- `session_started`;
- `page_viewed` para as abas do app;
- `tv_started` / `tv_stopped` com faixa de tempo assistido;
- `radio_started` / `radio_stopped` com faixa de tempo ouvido.

Nao sao enviados nome, e-mail, telefone, mensagens do chat, conteudo de participacao, CPF, IP ou credenciais.

## Identidade
O navegador cria um identificador aleatorio local. A Matrix recebe esse identificador e armazena somente o hash SHA-256 no perfil anonimo. A integracao atual nao identifica pessoas.

## Consentimento
`matrixTelemetry.js` possui `getMatrixConsent()` e `setMatrixConsent()`. O default e `analytics=false`, salvo configuracao explicita de ambiente para um ambiente de teste controlado.

## Feature flag / rollback
Para desligar imediatamente:

`VITE_MATRIX_TRACKING_ENABLED=false`

O player de TV, radio, programacao, PWA e navegacao continuam funcionando sem Matrix.

## Configuracao futura de producao
- `VITE_MATRIX_API_URL`: URL publica da Event API;
- `VITE_MATRIX_PUBLIC_KEY`: chave publicavel de baixa autoridade do cliente `attualplay`;
- `VITE_MATRIX_TRACKING_ENABLED`: ativacao gradual;
- `VITE_MATRIX_ANALYTICS_DEFAULT`: manter `denied` ate decisao de consentimento/UX.
