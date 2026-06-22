## Why

Times precisam de uma forma simples, persistente e acessível em desktop e mobile para estimar tarefas colaborativamente sem depender de contas com senha ou integrações externas. O MVP do Planning Poker estabelece esse fluxo completo, da autenticação por código mágico ao resumo auditável de uma sala finalizada.

## What Changes

- Introduzir autenticação sem senha por email, com código mágico numérico de 6 dígitos, validade de 10 minutos, uso único, limites de reenvio e tentativa, sessão opaca de 30 dias e coleta do nome no primeiro acesso.
- Criar a área autenticada "Minhas Salas" para listar, criar e acessar salas, distinguindo salas ativas e finalizadas.
- Permitir criação de salas com nome, link personalizado único de até 6 caracteres, senha numérica de 4 dígitos armazenada de forma segura e estilo Scrum, Fibonacci ou Camisetas.
- Permitir ingresso de usuários autenticados em salas ativas mediante senha e manter salas finalizadas acessíveis em modo somente leitura.
- Estabelecer o criador como único administrador, com autorização de comandos validada no backend.
- Adicionar fila persistente e ordenável de tarefas, com título e link externo, e uma tarefa atual quando houver itens pendentes.
- Adicionar votação por tarefa com atualizações via Server-Sent Events, voto alterável e oculto antes da revelação, revelação e reinício controlados pelo administrador.
- Permitir que o administrador finalize a sala a qualquer momento, concluir as tarefas remanescentes sem inventar resultado e exibir resumo somente leitura com o histórico preservado.
- Persistir usuários, salas, participantes, tarefas, votos, rodadas e estado da sala em PostgreSQL.
- Usar Server-Sent Events como transporte realtime do MVP para invalidar projeções autorizadas, mantendo o domínio desacoplado do transporte e WebSocket fora do escopo.
- Fornecer ambiente local reproduzível via Docker Compose, iniciado por um único comando, com aplicação Next.js, PostgreSQL persistente, captura local de emails, healthchecks, migrations e configuração documentada.
- Criar e evoluir todo o schema PostgreSQL exclusivamente por migrations Drizzle Kit revisáveis e versionadas no Git, executáveis no ambiente Docker e documentadas para o fluxo de desenvolvimento.
- Preservar o destino original durante autenticação e onboarding, oferecer navegação autenticada consistente, atualizar todos os participantes ao finalizar a sala e apresentar estados da fila em português.

## Capabilities

### New Capabilities

- `magic-code-auth`: Solicitação, expiração, consumo único e validação de códigos mágicos enviados por email.
- `user-profile`: Coleta e persistência do nome no primeiro acesso e reutilização nos acessos seguintes.
- `my-rooms`: Listagem autenticada das salas criadas pelo usuário, com estado e ações de criação e acesso.
- `room-access`: Criação de salas, links personalizados, senha segura, estilos de votação, ingresso de participantes e acesso somente leitura.
- `room-administration`: Papel único de administrador e autorização backend para comandos exclusivos da sala.
- `task-queue`: Inclusão, edição, remoção, reordenação e seleção da tarefa atual na fila persistente.
- `room-voting`: Cartas por estilo, registro e alteração de voto por participante e tarefa, com ocultação antes da revelação.
- `vote-reveal`: Revelação e reinício de rodadas pelo administrador e exposição controlada dos votos.
- `room-finalization`: Finalização irreversível da sessão de votação e bloqueio de comandos mutáveis.
- `room-summary`: Resumo persistente e somente leitura de tarefas, votos e resultados de uma sala finalizada.
- `local-development`: Ambiente Docker reproduzível para executar e testar localmente a aplicação completa, PostgreSQL, emails e migrations.
- `database-migrations`: Criação e evolução rastreável do schema PostgreSQL por migrations versionadas, sem etapas manuais ou substituição por seeds.

### Modified Capabilities

Nenhuma. O projeto não possui capabilities existentes afetadas por esta change.

## Impact

- Nova aplicação fullstack em Next.js App Router e TypeScript, com interface responsiva baseada em shadcn/ui.
- Novo modelo relacional e migrações PostgreSQL para autenticação, usuários, salas, participantes, tarefas, rodadas e votos.
- Novos comandos via Server Actions ou Route Handlers, validação de entrada, sessões autenticadas e autorização no backend.
- Integração com provedor de email e armazenamento seguro de códigos mágicos e senhas de sala.
- Contrato de eventos de domínio com adaptador SSE substituível, payloads sem votos ocultos e evolução futura do transporte fora do MVP.
- Novos artefatos de desenvolvimento local: `Dockerfile`, `docker-compose.yml`, `.env.example`, volume PostgreSQL, healthchecks e documentação de setup e migrations.
- Drizzle Kit como ferramenta de geração e aplicação de migrations; SQL, metadados e configuração relacionada são versionados no Git e `drizzle-kit push` não substitui esse histórico.
