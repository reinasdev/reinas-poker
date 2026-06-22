# Room Finalization

## Purpose

Define a finalização irreversível e a atualização dos participantes.

## Requirements

### Requirement: Finalização pelo administrador
O sistema SHALL permitir somente ao administrador finalizar uma sala ativa a qualquer momento, inclusive com tarefas pendentes, e SHALL persistir o instante de finalização.

#### Scenario: Finalização válida
- **WHEN** o administrador confirma a finalização de uma sala ativa
- **THEN** o sistema marca a sala como finalizada, encerra a rodada aberta existente e conclui todas as tarefas remanescentes sem inventar resultado

#### Scenario: Participante tenta finalizar
- **WHEN** um participante comum tenta finalizar a sala
- **THEN** o sistema rejeita a operação e mantém a sala ativa

### Requirement: Sala finalizada imutável
Após a finalização, o backend MUST rejeitar votos, ingresso para participação, alterações na fila, revelação, reinício, avanço e qualquer outra mutação funcional da sala.

#### Scenario: Voto após finalização
- **WHEN** um usuário tenta registrar voto em uma sala finalizada
- **THEN** o sistema rejeita o voto sem alterar os dados

#### Scenario: Alteração de fila após finalização
- **WHEN** o administrador tenta alterar a fila de uma sala finalizada
- **THEN** o sistema rejeita a alteração

#### Scenario: Novo ingresso após finalização
- **WHEN** um usuário tenta ingressar como participante em uma sala finalizada
- **THEN** o sistema rejeita o ingresso e permite somente a consulta autorizada do resumo

### Requirement: Persistência do estado final
O sistema SHALL manter o estado finalizado após reinícios e novos acessos.

#### Scenario: Reabertura do link
- **WHEN** um usuário acessa novamente o link de uma sala finalizada
- **THEN** o sistema mantém a sala finalizada e apresenta o fluxo somente leitura

### Requirement: Atualização dos participantes conectados
O sistema SHALL invalidar a projeção após a finalização e SHALL atualizar administradores e participantes conectados para o resumo somente leitura via SSE ou fallback de recuperação.

#### Scenario: Administrador finaliza com convidado conectado
- **WHEN** o administrador finaliza uma sala enquanto outro participante está na mesa
- **THEN** ambos os navegadores deixam a mesa ativa e exibem o resumo finalizado sem recarga manual
