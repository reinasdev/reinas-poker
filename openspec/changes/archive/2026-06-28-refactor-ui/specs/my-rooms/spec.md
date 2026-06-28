## MODIFIED Requirements

### Requirement: Listagem de salas criadas
O sistema SHALL listar as salas criadas pelo usuário autenticado e as salas nas quais o usuário autenticado já ingressou, e SHALL indicar para cada sala se ela está ativa ou finalizada.

#### Scenario: Usuário com salas
- **WHEN** o usuário acessa Minhas Salas
- **THEN** o sistema exibe suas salas criadas e salas ingressadas com nome, link personalizado e estado

#### Scenario: Usuário sem salas
- **WHEN** o usuário sem salas criadas ou ingressadas acessa Minhas Salas
- **THEN** o sistema exibe um estado vazio e a ação para criar uma sala
