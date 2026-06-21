## ADDED Requirements

### Requirement: Tarefa com título e link
O sistema SHALL permitir ao administrador adicionar uma tarefa com título não vazio e URL externa válida à fila de uma sala ativa.

#### Scenario: Adição da primeira tarefa
- **WHEN** o administrador adiciona a primeira tarefa válida a uma sala ativa
- **THEN** o sistema persiste a tarefa, torna-a atual e abre uma rodada vazia

#### Scenario: Dados inválidos
- **WHEN** o administrador informa título vazio ou link inválido
- **THEN** o sistema rejeita a inclusão sem alterar a fila

### Requirement: Manutenção da fila
O sistema SHALL permitir ao administrador editar título e link, remover e reordenar tarefas não concluídas enquanto a sala estiver ativa.

#### Scenario: Edição válida
- **WHEN** o administrador edita uma tarefa elegível com dados válidos
- **THEN** o sistema persiste os novos dados e mantém sua posição

#### Scenario: Reordenação válida
- **WHEN** o administrador envia uma nova ordem contendo exatamente as tarefas elegíveis da fila
- **THEN** o sistema persiste posições únicas e contíguas na ordem solicitada

#### Scenario: Remoção da tarefa atual
- **WHEN** o administrador remove a tarefa atual e existe outra tarefa pendente
- **THEN** o sistema promove a primeira tarefa na ordem e abre uma rodada vazia para ela

### Requirement: Tarefa atual consistente
O sistema SHALL manter exatamente uma tarefa atual quando uma sala ativa possuir tarefas pendentes e nenhuma quando não houver tarefa pendente.

#### Scenario: Conclusão da tarefa atual
- **WHEN** o administrador conclui a tarefa atual
- **THEN** o sistema marca a tarefa como concluída e promove a próxima tarefa pendente na ordem, se houver

#### Scenario: Fila sem pendências
- **WHEN** não existe tarefa pendente na sala
- **THEN** o sistema não apresenta tarefa atual nem aceita votos

### Requirement: Persistência da fila
O sistema SHALL persistir tarefas, posições, estados e resultados no PostgreSQL.

#### Scenario: Reabertura da sala
- **WHEN** participantes reabrem uma sala após uma alteração válida na fila
- **THEN** o sistema apresenta a fila na ordem e estado persistidos
