# Desenvolvimento

Guia técnico para rodar, testar e validar o Planning Poker localmente.

## Pré-requisitos

- Node.js 22+.
- Docker Desktop com Docker Compose, para PostgreSQL.
- Git — o `@reinas/ui` é instalado clonando o repositório do design system.
- O [`reinas-id`](https://github.com/reinasdev/reinas-id) clonado ao lado: sem
  ele não há login.

## Ambiente local

```bash
npm install
cp .env.example .env

make infra          # Postgres em :5432
npm run db:migrate
npm run dev         # http://localhost:3000
```

Em outro terminal, no repositório do `reinas-id`:

```bash
make infra          # Postgres em :5433 e Mailpit em :8025
npm run db:migrate
npm run dev         # http://localhost:3001
```

| Endereço                | Serviço                              |
| ----------------------- | ------------------------------------ |
| http://localhost:3000   | Planning Poker                       |
| http://localhost:3001   | Reinas ID (repositório separado)     |
| http://localhost:8025   | Mailpit — códigos de acesso          |
| localhost:5432          | PostgreSQL (`reinas_poker`)           |

`make up` sobe este projeto em container. O `reinas-id` continua fora dele: o
compose daqui aponta para `host.docker.internal:3001`.

## Comandos

| Comando               | Finalidade                                                       |
| --------------------- | ---------------------------------------------------------------- |
| `make up`             | Sobe Postgres, migra e inicia a aplicação em containers           |
| `make infra`          | Sobe apenas o PostgreSQL                                          |
| `make migrate`        | Aplica as migrations versionadas                                  |
| `make generate`       | Gera migration Drizzle após mudança de schema                     |
| `make validate`       | Valida migrations em banco vazio e no upgrade da versão anterior  |
| `make studio`         | Abre o Drizzle Studio                                             |
| `make down` / `reset` | Para os containers / remove também o volume                       |
| `make test`           | Vitest                                                            |
| `make test-e2e`       | Playwright                                                        |

## Ligação com o Reinas ID

Em `.env`:

```env
REINAS_ID_URL=http://localhost:3001          # usada pelo servidor
REINAS_ID_PUBLIC_URL=http://localhost:3001   # para onde o navegador é mandado
REINAS_ID_CLIENT_ID=reinas-poker
REINAS_ID_CLIENT_SECRET=development-client-secret-change-me
SESSION_CACHE_SECONDS=60                     # janela de cache da introspecção
```

Esta aplicação precisa estar cadastrada no `.env` do `reinas-id`, com o mesmo
segredo:

```env
REINAS_ID_CLIENTS=[{"id":"reinas-poker","name":"Planning Poker","secret":"development-client-secret-change-me","redirectUris":["http://localhost:3000/auth/callback"]}]
```

O `redirect_uri` é comparado **exatamente**. As duas URLs do ID só divergem
quando há rede interna: em container, o servidor usa
`http://host.docker.internal:3001` e o navegador continua em `http://localhost:3001`.

## Design system

Os componentes vêm de `@reinas/ui`, instalado direto do GitHub:

```jsonc
"dependencies": { "@reinas/ui": "git+https://github.com/reinasdev/reinas-ui.git#main" }
```

Para atualizar depois de uma mudança lá: `npm update @reinas/ui`.

Para iterar nos dois ao mesmo tempo, aponte para a pasta local e reverta antes
de commitar:

```bash
npm install ../reinas-ui
```

O Tailwind precisa enxergar as classes usadas dentro do pacote — daí o `@source`
explícito em `src/app/globals.css`, já que `node_modules` é ignorado por padrão.

## Migrations

Mudanças de schema sempre passam pelo Drizzle Kit:

1. Altere `src/infrastructure/db/schema.ts`.
2. Rode `make generate`.
3. Renomeie o arquivo gerado para algo legível e ajuste o `tag` em
   `drizzle/meta/_journal.json`.
4. Revise o SQL.
5. Commit schema, SQL e `drizzle/meta/` juntos.
6. Rode `make migrate`.

`npm run db:validate` recria dois bancos descartáveis e confere que as migrations
funcionam tanto do zero quanto a partir da versão anterior, inclusive o número de
tabelas esperado. Não edite migrations já integradas; crie uma corretiva.
`drizzle-kit push` não é usado em lugar nenhum, e há teste garantindo isso.

## Testes

Sem PostgreSQL (os testes de banco são pulados):

```bash
npm test
```

Com PostgreSQL:

```bash
make infra
npm run db:migrate
RUN_DB_TESTS=1 npm test
```

End-to-end com Playwright. Sobe o servidor desta aplicação sozinho, mas exige o
`reinas-id` e o Mailpit dele de pé — um `globalSetup` confere isso antes de
rodar e falha com instrução caso falte algo:

```bash
npx playwright install chromium
make infra
npm run db:migrate
npm run test:e2e
```

Para apontar para instâncias já rodando em outro endereço, use
`PLAYWRIGHT_IDENTITY_URL` e `MAILPIT_URL`.

Os prints ficam em `test-results/screenshots/`. O fluxo completo gera a sequência
numerada de telas, de login a logout.

No CI, o job de E2E faz checkout do repositório do `reinas-id` e o sobe antes de
rodar os testes.

## Notas de implementação

- **Hidratação nos testes.** O Playwright espera o elemento, não o React. Os
  helpers usam `waitForHydration` antes de clicar em formulários; sem isso o
  clique cai num formulário ainda estático e some.
- **Cookies.** O Next não permite gravar cookie durante o render de uma página.
  Por isso `/auth/callback` é Route Handler, não página.
- **Cache de sessão.** A introspecção fica em memória por `SESSION_CACHE_SECONDS`
  e é descartada no logout, para que a revogação tenha efeito imediato.
- **Espelho de usuários.** `users` guarda o id emitido pelo `reinas-id`, nunca um
  id local. As factories de teste refletem isso gerando o id explicitamente.
