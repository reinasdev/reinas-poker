# Planning Poker

MVP fullstack para estimativas colaborativas com Next.js App Router, PostgreSQL, Drizzle ORM, autenticação por código mágico e atualizações por Server-Sent Events.

## Pré-requisitos

- Docker Desktop com Docker Compose
- Make (ou execute os comandos equivalentes do `docker-compose.yml`)

## Ambiente local

1. Copie `.env.example` para `.env`. Os valores locais não são segredos de produção.
2. Execute `make dev`.
3. Abra a aplicação em http://localhost:3000.
4. Abra o Mailpit em http://localhost:8025 para ler códigos mágicos.

`make dev` sobe PostgreSQL e Mailpit, aguarda o healthcheck do banco, aplica explicitamente as migrations versionadas e inicia a aplicação. O startup normal de `npm run dev` não altera o schema.

Comandos disponíveis:

| Comando | Finalidade |
| --- | --- |
| `make dev` | Preparar dependências, migrar e iniciar a aplicação |
| `make infra` | Subir apenas PostgreSQL e Mailpit |
| `make generate` | Gerar migration com Drizzle Kit após alterar o schema |
| `make migrate` | Aplicar migrations versionadas |
| `npm run db:validate` | Validar migrations em banco vazio e a partir da versão anterior |
| `make studio` | Abrir Drizzle Studio para inspecionar o banco |
| `make logs` | Acompanhar logs dos containers |
| `make down` | Parar containers preservando dados |
| `make reset` | Remover containers e o volume PostgreSQL intencionalmente |
| `make test` | Executar testes no container da aplicação |

`docker compose up --build` é uma operação de baixo nível e não substitui `make migrate`.

## Migrations

O schema inicial e todas as evoluções usam Drizzle Kit. O fluxo obrigatório é:

1. alterar `src/infrastructure/db/schema.ts`;
2. executar `make generate` (ou `npm run db:generate -- --name nome_da_migration`);
3. revisar o SQL gerado em `drizzle/`;
4. commitar juntos o schema, SQL, `drizzle/meta/` e configurações relacionadas;
5. executar `make migrate`.

Não edite migrations já integradas: crie uma migration corretiva. Não crie tabelas, enums, índices ou constraints manualmente. Seeds (`npm run db:seed`) são opcionais, executam depois das migrations e nunca criam schema. `drizzle-kit push` não é usado em desenvolvimento, CI, staging ou produção.

## Desenvolvimento sem Docker para a aplicação

Com PostgreSQL e Mailpit já disponíveis, configure `DATABASE_URL` para o host e execute:

```text
npm install
npm run db:migrate
npm run dev
```

## Qualidade

```text
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Antes da primeira execução E2E, instale o Chromium com `npm run test:e2e:install`. A suíte Playwright executa o fluxo público em projetos desktop e mobile. Com a aplicação já iniciada, defina `PLAYWRIGHT_BASE_URL=http://localhost:3000` para reutilizá-la sem iniciar outro processo Next.js.

A CI aplica migrations em PostgreSQL vazio, verifica divergência entre schema e histórico, e executa lint, typecheck, testes e build.
A validação `db:validate` cria bancos isolados, aplica todo o histórico em banco vazio e aplica o histórico restante sobre a versão anterior.

## Validação manual do fluxo

1. Solicite acesso por email e copie o código de 6 dígitos exibido no Mailpit.
2. Complete o nome no primeiro acesso.
3. Crie uma sala com slug, senha de 4 dígitos e baralho.
4. Em outra sessão autenticada, abra o slug e ingresse com a senha.
5. Como administrador, adicione e reordene tarefas.
6. Vote nas duas sessões; confirme que apenas o estado “Votou” aparece antes da revelação.
7. Revele, reinicie uma rodada e confirme que o histórico anterior é preservado.
8. Conclua a tarefa com ou sem resultado e confirme que a próxima começa vazia.
9. Finalize a sala com uma tarefa pendente e confirme o resumo somente leitura.
10. Reinicie os containers sem remover o volume e confirme que usuários, sala, tarefas e votos permanecem.

## Variáveis de ambiente

Consulte `.env.example`. Tokens e códigos são persistidos somente como hash; senhas de sala usam Argon2id. O cookie de sessão é `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Não registre códigos, tokens, senhas, hashes ou votos ocultos.

## Arquitetura

- `src/domain`: validações, baralhos, erros e projeções seguras.
- `src/application`: casos de uso de autenticação e sala; autorização ocorre no backend.
- `src/infrastructure`: PostgreSQL/Drizzle, hashing, SMTP/Mailpit e publisher SSE.
- `src/app`: páginas e Route Handlers do App Router.

SSE transporta apenas notificações de invalidação; o cliente recarrega a projeção autorizada. Escritas usam HTTP. O publisher é substituível para futura infraestrutura compartilhada, mas WebSocket está fora do MVP.

## Deploy e rollback

Execute migrations versionadas antes de direcionar tráfego para uma nova versão. Falhas de migration interrompem o deploy. Rollback da aplicação deve preservar dados; mudanças destrutivas exigem migration e plano de recuperação próprios.
