# AGENTS — TV ATTUAL APP / ATTUALPLAY

Use como referência de governança o repositório `Grupo-Lira-de-Comunicacao/atlas-core`, especialmente `ATLAS_CORE_RULES.md` e `AGENTS.md`.

## Projeto
Aplicação/PWA da TV e Rádio Attual, com player de vídeo, rádio, programação, navegação e experiência mobile.

## Diretrizes locais
- Preserve funcionamento do player HLS e da experiência PWA.
- Considere instalação em Android, manifest, ícones, safe-area e responsividade.
- Evite mudanças que quebrem URLs públicas, streaming ou navegação existente.
- Valide build, carregamento do player, rotas principais e comportamento mobile após alterações.
- Nunca exponha credenciais ou endpoints sensíveis.
- Prefira mudanças incrementais e compatíveis com o deploy atual.
