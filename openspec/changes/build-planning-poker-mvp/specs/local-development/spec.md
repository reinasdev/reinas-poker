## ADDED Requirements

### Requirement: Ambiente local reproduzível por comando único
O projeto SHALL fornecer `make dev` ou comando equivalente que suba PostgreSQL e Mailpit, aguarde prontidão, aplique explicitamente as migrations versionadas e então inicie a aplicação Next.js.

#### Scenario: Inicialização a partir de checkout limpo
- **WHEN** um desenvolvedor com Docker compatível configura as variáveis conforme a documentação e executa o comando de inicialização
- **THEN** a aplicação Next.js, o PostgreSQL e o serviço local de email iniciam sem instalação manual dessas dependências no host

#### Scenario: Repetição do setup
- **WHEN** dois desenvolvedores usam a mesma revisão do projeto e o procedimento documentado
- **THEN** ambos recebem as mesmas versões e topologia de serviços locais

### Requirement: PostgreSQL local persistente e pronto
O ambiente Docker SHALL executar PostgreSQL com volume persistente e MUST usar healthcheck ou estratégia equivalente para impedir que a aplicação dependa de um banco ainda indisponível.

#### Scenario: Banco ainda inicializando
- **WHEN** os containers são iniciados e o PostgreSQL ainda não aceita conexões
- **THEN** a aplicação aguarda a prontidão ou repete a conexão de forma controlada em vez de falhar permanentemente

#### Scenario: Reinício sem remoção de volume
- **WHEN** o ambiente é parado e iniciado novamente mantendo o volume Docker
- **THEN** usuários, salas, participantes, tarefas, rodadas, votos, estados e resumos persistidos continuam disponíveis

### Requirement: Captura local de emails
O ambiente Docker SHALL incluir Mailpit ou serviço equivalente e SHALL configurar o adaptador de email de desenvolvimento para capturar localmente os códigos mágicos sem enviá-los à internet.

#### Scenario: Solicitação de código mágico local
- **WHEN** um usuário solicita autenticação no ambiente local
- **THEN** o email com o código mágico aparece na interface do serviço local de captura

#### Scenario: Login completo local
- **WHEN** o usuário lê o código capturado e o informa na aplicação antes da expiração
- **THEN** o fluxo normal de validação autentica o usuário sem bypass específico de desenvolvimento

### Requirement: Configuração local documentada
O projeto SHALL versionar um `.env.example` sem segredos reais e SHALL documentar variáveis, portas, URLs, pré-requisitos, `make dev`, `docker compose up --build`, geração e aplicação de migrations, inspeção do banco, logs, parada e reset intencional do volume.

#### Scenario: Preparação das variáveis
- **WHEN** um desenvolvedor consulta `.env.example` e a documentação
- **THEN** ele consegue criar a configuração local sem descobrir variáveis obrigatórias por tentativa e erro

#### Scenario: Proteção de segredos
- **WHEN** o `.env.example` é versionado
- **THEN** ele contém somente exemplos seguros e nenhum segredo de produção

### Requirement: Migrations executáveis no ambiente local
O projeto SHALL fornecer e documentar comandos para gerar e executar migrations PostgreSQL versionadas usando o ambiente Docker e SHALL propagar falhas ao processo chamador.

#### Scenario: Banco novo
- **WHEN** um desenvolvedor executa o comando documentado de migrations contra o banco local vazio
- **THEN** o schema necessário à aplicação é criado e o comando termina com sucesso

#### Scenario: Migration com falha
- **WHEN** uma migration não pode ser aplicada
- **THEN** o comando termina com erro observável e a aplicação não apresenta o ambiente como corretamente preparado

#### Scenario: Mudança local do modelo
- **WHEN** um desenvolvedor altera o schema Drizzle e executa o comando documentado de geração
- **THEN** o Drizzle Kit produz uma nova migration revisável no diretório versionado do projeto

#### Scenario: Falha ao aplicar migration no fluxo principal
- **WHEN** migrate falha durante o comando principal de desenvolvimento
- **THEN** a aplicação Next.js não inicia como se o ambiente estivesse preparado e a falha permanece visível

### Requirement: Validação funcional do ambiente completo
O ambiente local SHALL permitir testar autenticação por email e persistência do fluxo principal sem substituir PostgreSQL ou o adaptador de email por implementações em memória.

#### Scenario: Jornada persistente local
- **WHEN** um desenvolvedor autentica por código capturado, cria uma sala, adiciona tarefas, registra e revela votos e finaliza a sala
- **THEN** o ambiente permite consultar o resumo e mantém os dados no PostgreSQL após reinício normal
