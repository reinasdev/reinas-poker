# My Rooms

## Purpose

Define a área autenticada para listar e acessar salas criadas.

## Requirements

### Requirement: Área Minhas Salas autenticada

O sistema SHALL disponibilizar a tela "Minhas Salas" apenas a usuários autenticados com perfil completo.

#### Scenario: Usuário não autenticado

- **WHEN** uma pessoa sem sessão válida tenta acessar Minhas Salas
- **THEN** o sistema direciona a pessoa ao fluxo de autenticação

### Requirement: Listagem de salas criadas

O sistema SHALL listar as salas criadas pelo usuário autenticado e as salas nas quais o usuário autenticado já ingressou, e SHALL indicar para cada sala se ela está ativa ou finalizada.

#### Scenario: Usuário com salas

- **WHEN** o usuário acessa Minhas Salas
- **THEN** o sistema exibe suas salas criadas e salas ingressadas com nome, link personalizado e estado

#### Scenario: Usuário sem salas

- **WHEN** o usuário sem salas criadas ou ingressadas acessa Minhas Salas
- **THEN** o sistema exibe um estado vazio e a ação para criar uma sala

### Requirement: Ações de sala

O sistema SHALL permitir iniciar a criação de uma sala e acessar uma sala existente a partir de Minhas Salas.

#### Scenario: Acesso a sala listada

- **WHEN** o usuário seleciona uma sala da listagem
- **THEN** o sistema navega para a URL do link personalizado da sala
