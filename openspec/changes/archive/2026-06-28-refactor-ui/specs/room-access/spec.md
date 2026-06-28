## MODIFIED Requirements

### Requirement: Acesso de sala por estado

O sistema SHALL exigir autenticação para qualquer sala, SHALL exigir a senha para o primeiro ingresso em sala ativa, SHALL permitir que um membro já ingressado acesse novamente a sala ativa sem informar a senha, e SHALL manter sala finalizada acessível pelo link em modo somente leitura.

#### Scenario: Acesso não autenticado

- **WHEN** uma pessoa sem sessão válida abre um link de sala
- **THEN** o sistema solicita autenticação antes de continuar

#### Scenario: Acesso de membro existente a sala ativa

- **WHEN** um usuário autenticado que já é membro abre o link de uma sala ativa
- **THEN** o sistema exibe a sala sem solicitar a senha novamente

#### Scenario: Acesso por convite com senha na URL

- **WHEN** um usuário autenticado com perfil completo abre o link de uma sala ativa com parâmetro `senha` válido
- **THEN** o sistema registra o ingresso na sala e exibe a sala sem solicitar digitação manual da senha

#### Scenario: Convite com senha inválida

- **WHEN** um usuário autenticado com perfil completo abre o link de uma sala ativa com parâmetro `senha` inválido
- **THEN** o sistema exibe o formulário de senha manual da sala

#### Scenario: Convite preservado durante autenticação

- **WHEN** uma pessoa sem sessão abre um link de sala ativa com parâmetro `senha`
- **THEN** o sistema solicita autenticação e preserva o link completo para entrada automática após login e perfil completo

#### Scenario: Acesso a sala finalizada

- **WHEN** um usuário autenticado abre o link de uma sala finalizada
- **THEN** o sistema exibe o resumo somente leitura e não solicita ingresso para votar
