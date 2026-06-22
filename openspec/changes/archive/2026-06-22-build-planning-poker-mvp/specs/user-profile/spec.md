## ADDED Requirements

### Requirement: Nome obrigatório no primeiro acesso
O sistema SHALL solicitar um nome não vazio após a primeira autenticação de um usuário que ainda não possui perfil completo e SHALL impedir acesso às áreas autenticadas até o cadastro.

#### Scenario: Primeiro acesso sem nome
- **WHEN** um usuário valida o código mágico e não possui nome salvo
- **THEN** o sistema direciona o usuário ao cadastro de nome

#### Scenario: Cadastro de nome
- **WHEN** o usuário informa um nome válido no primeiro acesso
- **THEN** o sistema persiste o nome e libera o acesso a Minhas Salas

### Requirement: Reutilização do perfil
O sistema SHALL associar o perfil ao email normalizado e SHALL reutilizar o nome salvo nos acessos seguintes.

#### Scenario: Acesso posterior
- **WHEN** um usuário com nome salvo autentica novamente pelo mesmo email normalizado
- **THEN** o sistema não solicita o nome e direciona o usuário a Minhas Salas
