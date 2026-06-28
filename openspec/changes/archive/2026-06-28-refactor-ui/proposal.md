## Why

A aplicação já oferece os fluxos de Planning Poker, mas a camada visual ainda era genérica e não expressava o contexto developer-first do produto. Uma interface em preto e branco, com modos claro/escuro explícitos, melhora a leitura das salas, votações e estados das tarefas sem alterar o fluxo de planejamento.

## What Changes

- Aplicar temas visuais globais claro e escuro usando tokens pretos, brancos e em escala de cinza; cores fora da escala de cinza ficam reservadas apenas para badges/tags.
- Carregar JetBrains Mono via `next/font` e usá-la como tipografia dominante da aplicação, especialmente em códigos de sala, senhas, votos, badges, labels e metadados técnicos.
- Refatorar a apresentação visual de login, configuração/edição de nome, minhas salas, criação de sala, entrada em sala, sala de votação, fila de tarefas, revelação de votos e resumo da sala finalizada.
- Padronizar cards, botões, inputs, badges, estados de hover/focus/disabled, espaçamentos, bordas, comportamento responsivo, agrupamento da navegação, labels técnicos e ações icon-only.
- Adicionar alternância de tema e menu de perfil na navegação autenticada, incluindo atualização do nome da sessão atual.
- Mostrar em "Minhas salas" as salas em que o usuário já entrou e permitir retorno sem redigitar senha.
- Persistir o código de acesso compartilhável da sala para que admin possa copiar convite e QR code com `?senha=1234`, mantendo o hash como mecanismo de validação de entrada.

## Capabilities

### New Capabilities

- `developer-first-ui-theme`: cobre os requisitos visuais da interface escura por padrão inspirada em ferramentas de desenvolvedor, os componentes compartilhados, tipografia, layout responsivo e estados visuais nas principais telas do Planning Poker.

### Modified Capabilities

- `my-rooms`: Minhas salas lista salas criadas pelo usuário e salas em que ele já entrou.
- `room-access`: membros que já entraram em uma sala ativa podem acessá-la novamente sem informar a senha, e links de convite com `?senha=` válida entram automaticamente após autenticação/perfil.

## Impact

- Código afetado: layout e estilos globais do Next.js, primitivas shadcn/ui em `src/components/ui`, componentes de navegação/formulários/sala, composição das páginas em `src/app`, consultas de listagem de salas, projeção da sala e schema/migration para código de acesso compartilhável.
- Dependências: pode usar `lucide-react`, `tailwind-merge`, `clsx`, Tailwind, `next/font`, Font Awesome e QR code existente.
- Validação: rodar as validações disponíveis do projeto, incluindo lint, typecheck, testes aplicáveis, build de produção e E2E quando necessário.
