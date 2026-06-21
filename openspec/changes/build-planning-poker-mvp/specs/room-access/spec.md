## ADDED Requirements

### Requirement: Criação de sala
O sistema SHALL permitir que um usuário autenticado crie uma sala informando nome, link personalizado, senha numérica e estilo de votação.

#### Scenario: Criação válida
- **WHEN** um usuário autenticado informa dados válidos para uma nova sala
- **THEN** o sistema cria uma sala ativa, define o usuário como administrador e participante e disponibiliza sua URL

### Requirement: Link personalizado válido e único
O sistema SHALL aceitar somente links personalizados não vazios com no máximo 6 caracteres do conjunto permitido e SHALL garantir unicidade após normalização.

#### Scenario: Link disponível
- **WHEN** o usuário cria uma sala com link válido ainda não utilizado
- **THEN** o sistema reserva o link atomicamente para a nova sala

#### Scenario: Link duplicado
- **WHEN** o usuário tenta criar uma sala com link personalizado já utilizado
- **THEN** o sistema rejeita a criação com indicação de conflito

#### Scenario: Link maior que o limite
- **WHEN** o usuário informa link personalizado com mais de 6 caracteres
- **THEN** o sistema rejeita a criação

### Requirement: Senha de sala protegida
O sistema SHALL exigir senha composta por exatamente 4 dígitos para criar ou ingressar em sala ativa e MUST armazená-la apenas como hash seguro.

#### Scenario: Formato inválido
- **WHEN** o criador informa senha que não possui exatamente 4 dígitos
- **THEN** o sistema rejeita a criação da sala

#### Scenario: Senha correta
- **WHEN** um usuário autenticado acessa uma sala ativa e informa a senha correta
- **THEN** o sistema registra sua participação e permite ingresso na sala

#### Scenario: Senha incorreta
- **WHEN** um usuário informa senha incorreta para uma sala ativa
- **THEN** o sistema rejeita o ingresso sem revelar informações sobre o hash

### Requirement: Estilos e cartas disponíveis
O sistema SHALL permitir escolher Scrum, Fibonacci ou Camisetas na criação e SHALL disponibilizar somente as cartas do estilo persistido.

#### Scenario: Sala Fibonacci
- **WHEN** a sala usa o estilo Fibonacci
- **THEN** as cartas disponíveis são 1, 2, 3, 5, 8, 13, 21, ?, café

#### Scenario: Sala Scrum
- **WHEN** a sala usa o estilo Scrum
- **THEN** as cartas disponíveis são 0, 1/2, 1, 2, 3, 5, 8, 13, ?, café

#### Scenario: Sala Camisetas
- **WHEN** a sala usa o estilo Camisetas
- **THEN** as cartas disponíveis são PP, P, M, G, GG, XG, ?, café

### Requirement: Acesso de sala por estado
O sistema SHALL exigir autenticação para qualquer sala, SHALL exigir a senha para ingresso em sala ativa e SHALL manter sala finalizada acessível pelo link em modo somente leitura.

#### Scenario: Acesso não autenticado
- **WHEN** uma pessoa sem sessão válida abre um link de sala
- **THEN** o sistema solicita autenticação antes de continuar

#### Scenario: Acesso a sala finalizada
- **WHEN** um usuário autenticado abre o link de uma sala finalizada
- **THEN** o sistema exibe o resumo somente leitura e não solicita ingresso para votar
