## ADDED Requirements

### Requirement: Resumo somente leitura
O sistema SHALL exibir para uma sala finalizada um resumo somente leitura contendo todas as tarefas concluídas, com votos históricos e resultado final quando existente.

#### Scenario: Tarefa com resultado
- **WHEN** um usuário consulta o resumo de uma tarefa concluída com resultado final
- **THEN** o sistema exibe título, link, votos registrados e resultado final

#### Scenario: Tarefa sem resultado
- **WHEN** um usuário consulta o resumo de uma tarefa sem resultado final
- **THEN** o sistema exibe a tarefa e os votos existentes sem inventar ou calcular um resultado

#### Scenario: Tarefa pendente na finalização
- **WHEN** a sala é finalizada antes da votação de uma tarefa pendente
- **THEN** o sistema conclui a tarefa e o resumo a exibe sem votos ou resultado final inventados

### Requirement: Histórico preservado
O sistema SHALL construir o resumo a partir dos dados persistidos de tarefas, rodadas e votos e SHALL manter a associação entre voto, participante e tarefa.

#### Scenario: Múltiplas tarefas votadas
- **WHEN** uma sala finalizada contém várias tarefas votadas
- **THEN** o resumo apresenta cada tarefa na ordem persistida com seus próprios votos

### Requirement: Ausência de controles mutáveis
O sistema MUST omitir controles de votação e administração no resumo e MUST rejeitar comandos mesmo que chamados diretamente.

#### Scenario: Visualização do resumo
- **WHEN** um usuário abre o resumo de uma sala finalizada
- **THEN** a interface não oferece ações para votar, revelar, reiniciar, avançar ou alterar a fila

### Requirement: Acesso responsivo ao resumo
O sistema SHALL disponibilizar o resumo pelo link personalizado em interface utilizável em desktop e mobile para usuários autenticados.

#### Scenario: Consulta em tela pequena
- **WHEN** um usuário autenticado abre o resumo em viewport móvel
- **THEN** tarefas, votos e resultados permanecem legíveis sem exigir controles exclusivos de desktop
