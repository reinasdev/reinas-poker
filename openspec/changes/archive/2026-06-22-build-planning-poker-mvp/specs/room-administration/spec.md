## ADDED Requirements

### Requirement: Administrador único
O sistema SHALL definir o criador como único administrador da sala e MUST impedir transferência ou inclusão de outro administrador no MVP.

#### Scenario: Sala criada
- **WHEN** uma sala é criada com sucesso
- **THEN** somente o identificador do criador fica associado ao papel de administrador

### Requirement: Comandos exclusivos do administrador
O backend MUST permitir somente ao administrador revelar votos, reiniciar rodada, concluir ou avançar tarefa, alterar a fila e finalizar a sala.

#### Scenario: Administrador executa comando
- **WHEN** o administrador autenticado executa um comando permitido em uma sala ativa
- **THEN** o backend autoriza o comando sujeito às regras de estado aplicáveis

#### Scenario: Participante tenta comando administrativo
- **WHEN** um participante comum tenta revelar, reiniciar, avançar, alterar a fila ou finalizar a sala
- **THEN** o backend rejeita o comando sem alterar dados

### Requirement: Capacidades do participante
O sistema SHALL permitir ao participante ingressado consultar a fila e o estado de votação, votar na tarefa atual e alterar o próprio voto enquanto a rodada estiver aberta.

#### Scenario: Participante consulta sala ativa
- **WHEN** um participante ingressado abre a sala ativa
- **THEN** o sistema exibe a fila, a tarefa atual e o estado permitido da rodada

### Requirement: Autorização independente da interface
O backend MUST validar sessão, participação, papel e estado da sala para toda mutação, independentemente dos controles exibidos no frontend.

#### Scenario: Requisição direta não autorizada
- **WHEN** um cliente chama diretamente um comando sem possuir a permissão exigida
- **THEN** o backend rejeita a operação e preserva o estado da sala
