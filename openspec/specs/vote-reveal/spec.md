# Vote Reveal

## Purpose

Define revelação, reinício de rodadas e conclusão com resultado opcional.

## Requirements

### Requirement: Revelação administrativa
O sistema SHALL permitir somente ao administrador revelar uma rodada aberta da tarefa atual e SHALL tornar os votos registrados visíveis a todos os participantes.

#### Scenario: Revelação com votos
- **WHEN** o administrador revela uma rodada aberta que possui votos
- **THEN** o sistema marca a rodada como revelada e expõe participante e valor de cada voto

#### Scenario: Participante tenta revelar
- **WHEN** um participante comum solicita a revelação
- **THEN** o sistema rejeita a operação e mantém os votos ocultos

### Requirement: Bloqueio após revelação
O sistema MUST rejeitar novos votos e alterações de voto em uma rodada revelada.

#### Scenario: Voto tardio
- **WHEN** um participante tenta votar depois da revelação
- **THEN** o sistema rejeita o voto e preserva os resultados revelados

### Requirement: Reinício de rodada
O sistema SHALL permitir somente ao administrador reiniciar a votação da tarefa atual, criando uma nova rodada aberta e vazia sem apagar o histórico anterior.

#### Scenario: Reinício após revelação
- **WHEN** o administrador reinicia a votação da tarefa atual
- **THEN** o sistema preserva a rodada anterior e cria uma nova rodada sem votos e com valores ocultos

### Requirement: Resultado final opcional
Após a revelação, o sistema SHALL permitir ao administrador concluir a tarefa com um resultado final opcional que pertença ao estilo da sala.

#### Scenario: Conclusão com resultado
- **WHEN** o administrador seleciona uma carta válida como resultado e conclui a tarefa revelada
- **THEN** o sistema persiste o resultado na tarefa e avança a fila

#### Scenario: Conclusão sem consenso
- **WHEN** o administrador conclui a tarefa revelada sem informar resultado
- **THEN** o sistema mantém o resultado vazio, preserva os votos e avança a fila
