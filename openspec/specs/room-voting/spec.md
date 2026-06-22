# Room Voting

## Purpose

Define registro, alteração, ocultação e persistência de votos.

## Requirements

### Requirement: Voto único por rodada
O sistema SHALL permitir que cada participante ingressado registre no máximo um voto vigente na rodada aberta da tarefa atual e SHALL validar o valor contra o estilo da sala.

#### Scenario: Primeiro voto válido
- **WHEN** um participante escolhe uma carta válida durante a rodada aberta
- **THEN** o sistema persiste seu voto associado à tarefa e à rodada atuais

#### Scenario: Carta inválida
- **WHEN** um participante envia um valor que não pertence ao estilo da sala
- **THEN** o sistema rejeita o voto sem modificar o voto vigente

### Requirement: Alteração antes da revelação
O sistema SHALL permitir ao participante substituir o próprio voto enquanto a rodada estiver aberta.

#### Scenario: Mudança de voto
- **WHEN** um participante que já votou escolhe outra carta válida antes da revelação
- **THEN** o sistema substitui atomicamente seu voto vigente

### Requirement: Votos ocultos
Antes da revelação, o sistema MUST expor aos participantes somente se cada pessoa votou e MUST ocultar o valor de todos os votos.

#### Scenario: Consulta durante rodada aberta
- **WHEN** um participante consulta uma rodada aberta com votos registrados
- **THEN** o sistema retorna indicadores de participação sem retornar os valores votados

### Requirement: Persistência por tarefa e rodada
O sistema SHALL persistir cada voto com participante, tarefa e rodada para preservar o histórico mesmo após reinício ou avanço.

#### Scenario: Avanço para nova tarefa
- **WHEN** o administrador avança para a próxima tarefa
- **THEN** a nova rodada começa sem votos e os votos da tarefa anterior permanecem persistidos

### Requirement: Atualização do estado de votação
O sistema SHALL usar Server-Sent Events no MVP para notificar clientes sobre mudanças confirmadas e fazê-los recarregar a projeção autorizada, sem transportar valores de votos ocultos.

#### Scenario: Participante vota
- **WHEN** um voto é persistido com sucesso
- **THEN** os clientes da sala recebem uma invalidação SSE e recarregam a projeção que indica que o participante votou sem expor o valor

#### Scenario: Escrita durante conexão SSE
- **WHEN** um participante ou administrador envia um comando de sala
- **THEN** o comando continua sendo processado via HTTP, Server Action ou Route Handler e não pelo canal SSE
