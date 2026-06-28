# Developer-First UI Theme

## Purpose

Define a camada visual developer-first do Planning Poker, incluindo tema, tipografia, primitivas de UI, navegação autenticada e layouts responsivos.

## Requirements

### Requirement: Tema global developer-first escuro

A aplicação SHALL apresentar um tema inspirado em ferramentas de desenvolvedor na experiência principal do Planning Poker, usando tokens visuais em preto, branco e escala de cinza, texto de alto contraste, bordas sutis e tratamento de superfícies técnicas.

#### Scenario: Usuário abre qualquer tela principal

- **WHEN** um usuário abre login, verificação, configuração de perfil, minhas salas, criação de sala, entrada em sala, sala ativa, fila de tarefas, revelação de votos ou resumo finalizado
- **THEN** a tela usa o tema em escala de cinza selecionado, com texto legível, bordas sutis e nenhuma cor fora da escala de cinza em superfícies ou controles, exceto tags.

#### Scenario: Usuário altera o tema

- **WHEN** um usuário autenticado aciona o controle de tema
- **THEN** a aplicação alterna entre modo escuro preto/branco e modo claro branco/preto usando tokens em escala de cinza.

#### Scenario: Usuário lê metadados técnicos

- **WHEN** uma tela exibe slugs de sala, senhas, valores de voto, labels de status, badges ou metadados similares
- **THEN** esses elementos usam um tratamento visual orientado a desenvolvedores, distinto, legível e consistente com o tema global.

### Requirement: Tipografia JetBrains Mono

A aplicação SHALL carregar JetBrains Mono via `next/font` e usá-la como fonte da aplicação ou fonte dominante nos elementos técnicos.

#### Scenario: Shell da aplicação renderiza

- **WHEN** o layout raiz renderiza a aplicação
- **THEN** JetBrains Mono é carregada pelo mecanismo de fontes do Next.js e aplicada pelos estilos globais.

#### Scenario: Valores técnicos renderizam

- **WHEN** códigos de sala, senhas, valores de voto, badges, labels ou metadados de tarefa são exibidos
- **THEN** a tipografia enfatiza JetBrains Mono de forma consistente.

### Requirement: Primitivas compartilhadas consistentes

A aplicação SHALL oferecer botões, cards, badges, inputs, selects, alertas, estados de hover, focus-visible e disabled visualmente consistentes em toda a camada visual.

#### Scenario: Usuário interage com controles

- **WHEN** um usuário passa o mouse, foca, ativa ou desabilita botões, inputs, selects e controles de sala
- **THEN** cada estado é visível, consistente no tema em escala de cinza ativo e não oculta texto nem muda o comportamento de negócio do controle.

#### Scenario: Badges de status renderizam

- **WHEN** estados de sala, tarefa, votação, participante, resultado ou erro são exibidos
- **THEN** badges e alertas apresentam o estado com espaçamento, borda e label legíveis, e badges PODEM usar cor para diferenciar estados.

### Requirement: Controles da navegação autenticada

Telas autenticadas SHALL separar controles de navegação em ações de rota à esquerda e controles de conta à direita.

#### Scenario: Navegação autenticada renderiza

- **WHEN** um usuário visualiza uma tela autenticada
- **THEN** Voltar, Minhas salas e Criar sala aparecem à esquerda, enquanto tema, perfil e logout aparecem à direita.

#### Scenario: Usuário atualiza o nome do perfil

- **WHEN** um usuário abre o menu de perfil e envia um novo nome válido
- **THEN** o sistema atualiza o nome usando o endpoint de perfil existente e atualiza o nome exibido.

#### Scenario: Logout icon-only renderiza

- **WHEN** a navegação renderiza o controle de logout
- **THEN** ele usa um botão apenas com ícone e label acessível em vez do texto visível "Sair".

### Requirement: Layouts responsivos das telas principais

A aplicação SHALL refatorar as telas principais do Planning Poker em layouts responsivos que preservam os fluxos existentes enquanto melhoram hierarquia visual e escaneabilidade.

#### Scenario: Usuário acessa telas de autenticação e perfil

- **WHEN** o usuário visualiza login, verificação por código mágico ou configuração/edição de perfil em mobile ou desktop
- **THEN** os formulários ficam centralizados ou claramente enquadrados, são legíveis, incluem labels técnicos como identificadores de login/auth/profile e seguem o tema developer-first em escala de cinza ativo.

#### Scenario: Usuário gerencia salas

- **WHEN** o usuário visualiza minhas salas, cria uma sala ou informa senha para entrar
- **THEN** a página apresenta metadados, formulários e navegação com espaçamento responsivo, cards consistentes e badges/labels developer-first como identificadores de criação, sala atual ou acesso.

#### Scenario: Usuário participa da votação

- **WHEN** o usuário visualiza uma sala de votação ativa
- **THEN** a tarefa atual, deck de votos, estados dos participantes, ações administrativas e fila de tarefas ficam organizados em layout responsivo de dashboard sem alterar ações disponíveis, e o voto escolhido pelo próprio usuário permanece visualmente selecionado enquanto a rodada permite consulta da própria escolha.

#### Scenario: Usuário revisa votos revelados ou resultados finais

- **WHEN** votos são revelados ou uma sala é finalizada
- **THEN** valores de voto, resultados dos participantes, resultados finais de tarefas e histórico de rodadas são agrupados visualmente para leitura rápida com badges e labels técnicos consistentes.

### Requirement: Limites de escopo

A refatoração SHALL NOT alterar autenticação, autorização, schema de banco, migrations, contratos de API, payloads de comando de sala, decks de voto, transições de tarefa ou ciclo de vida de sala, exceto pela listagem de salas já acessadas em Minhas salas.

#### Scenario: Workflows existentes rodam após a refatoração

- **WHEN** usuários autenticam, definem nome de perfil, criam salas, entram em salas, votam, revelam rodadas, reordenam tarefas, concluem tarefas e finalizam salas
- **THEN** os mesmos endpoints, comandos, redirects, permissões, dados persistidos e comportamentos de domínio anteriores continuam sendo usados.

#### Scenario: Validações do projeto rodam

- **WHEN** a mudança é concluída
- **THEN** as validações disponíveis do projeto, incluindo lint, typecheck, testes aplicáveis e build de produção, passam ou falhas preexistentes não relacionadas são documentadas.
