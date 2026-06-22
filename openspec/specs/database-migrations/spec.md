# Database Migrations

## Purpose

Define o fluxo versionado e verificável de evolução do schema PostgreSQL.

## Requirements

### Requirement: Schema inicial criado por migrations
O sistema MUST criar o schema PostgreSQL inicial completo por migrations versionadas e MUST NOT depender de criação manual de tabelas, enums, índices ou constraints.

#### Scenario: Banco PostgreSQL vazio
- **WHEN** as migrations são executadas em um banco compatível sem schema da aplicação
- **THEN** todas as estruturas necessárias para autenticação, usuários, salas, participantes, tarefas, rodadas e votos são criadas em ordem

#### Scenario: Inicialização sem intervenção manual
- **WHEN** um desenvolvedor segue o procedimento documentado de setup
- **THEN** nenhuma instrução exige executar SQL manual para tornar a aplicação funcional

### Requirement: Histórico versionado e imutável
O projeto SHALL armazenar no Git o diretório de migrations, arquivos SQL e metadados do Drizzle Kit, SHALL commitar esses artefatos junto com o schema Drizzle e configuração relacionada alterada e MUST aplicar somente migrations ainda não registradas na tabela de controle do banco.

#### Scenario: Nova migration gerada
- **WHEN** uma mudança de modelo exige evolução do schema
- **THEN** os arquivos da nova migration são revisados e versionados junto com a alteração do schema Drizzle

#### Scenario: Migration já aplicada
- **WHEN** o comando de migration é executado em um banco atualizado
- **THEN** migrations registradas não são reaplicadas e o comando não recria estruturas existentes

#### Scenario: Correção posterior
- **WHEN** uma migration já integrada precisa de correção
- **THEN** o projeto adiciona uma nova migration em vez de reescrever o histórico aplicado

#### Scenario: Revisão da mudança de schema
- **WHEN** uma alteração de schema é submetida para integração
- **THEN** a revisão contém schema Drizzle, SQL da migration, metadados do Drizzle Kit e configuração relacionada alterada no mesmo conjunto de commits

### Requirement: Evolução do modelo documentada
O projeto SHALL documentar no README ou documentação local como alterar o schema Drizzle, gerar uma migration com Drizzle Kit, revisar o SQL, aplicá-la pelo Docker e versionar os artefatos.

#### Scenario: Desenvolvedor adiciona um campo
- **WHEN** um desenvolvedor precisa adicionar um campo persistido
- **THEN** a documentação fornece uma sequência verificável da mudança do modelo até a migration aplicada localmente

### Requirement: Validação automatizada das migrations
O projeto SHALL validar automaticamente que as migrations versionadas criam um banco vazio e evoluem um banco na versão anterior sem criação manual, sincronização implícita ou `drizzle-kit push`.

#### Scenario: Validação em banco vazio
- **WHEN** a verificação automatizada executa todas as migrations do repositório
- **THEN** o schema resultante corresponde ao modelo esperado e a verificação termina com sucesso

#### Scenario: Mudança de schema sem migration
- **WHEN** o schema Drizzle muda sem a migration versionada correspondente
- **THEN** a verificação automatizada falha antes da integração da mudança

### Requirement: Push não substitui migrations
O projeto MUST NOT usar `drizzle-kit push` como fluxo padrão de desenvolvimento, CI, staging ou produção e MUST NOT tratá-lo como substituto de migrations versionadas.

#### Scenario: Preparação de ambiente
- **WHEN** um ambiente local, de CI, staging ou produção precisa atualizar o schema
- **THEN** o comando oficial de migrate aplica os arquivos versionados e não executa `drizzle-kit push`

### Requirement: Estruturas não são criadas manualmente
Tabelas, enums, índices e constraints MUST ser criados ou alterados por migrations versionadas e MUST NOT depender de comandos manuais no banco.

#### Scenario: Nova constraint
- **WHEN** o modelo exige uma nova constraint
- **THEN** a mudança é expressa em uma nova migration revisável antes de ser aplicada

### Requirement: Seeds separados de migrations
Seeds opcionais para desenvolvimento, quando fornecidos, MUST executar somente após as migrations e MUST NOT criar ou evoluir estruturas do schema.

#### Scenario: Execução de seed local
- **WHEN** um desenvolvedor executa um seed opcional em banco migrado
- **THEN** apenas dados de desenvolvimento são inseridos sem criar tabelas ou substituir migrations

#### Scenario: Ambiente sem seed
- **WHEN** as migrations são executadas sem qualquer seed
- **THEN** o banco possui todo o schema necessário para a aplicação iniciar
