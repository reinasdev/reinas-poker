# Planning Poker

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-20232a?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-migrations-c5f74f)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2ead33?logo=playwright&logoColor=white)

Sala de estimativas colaborativa para times ágeis: fila de tarefas, votação
escondida até a revelação e resumo somente leitura ao final.

Este repositório contém apenas o produto. Duas peças vivem fora dele:

| Projeto                                                        | Papel                                        |
| -------------------------------------------------------------- | -------------------------------------------- |
| [`reinas-id`](https://github.com/reinasdev/reinas-id)           | Login, sessões e autorização — banco próprio  |
| [`reinas-ui`](https://github.com/reinasdev/reinas-ui)           | Design system, instalado como dependência Git |

## Quick start

```bash
npm install
cp .env.example .env

make infra          # Postgres em :5432
npm run db:migrate
npm run dev         # http://localhost:3000
```

O login exige o **reinas-id rodando em :3001**. No repositório dele:

```bash
make infra && npm run db:migrate && npm run dev
```

| Endereço                | O quê                             |
| ----------------------- | --------------------------------- |
| http://localhost:3000   | Planning Poker                    |
| http://localhost:3001   | Reinas ID (outro repositório)     |
| http://localhost:8025   | Mailpit — códigos de acesso       |

## Funcionalidades

- Decks Scrum, Fibonacci e camisetas.
- Salas com slug próprio, senha de quatro dígitos e convite via `?senha=`.
- QR code de convite para entrar pelo celular.
- Fila de tarefas com reordenação, edição e remoção.
- Votação com revelação controlada pelo administrador, reinício de rodada e
  conclusão com ou sem consenso.
- Sincronização em tempo real por Server-Sent Events.
- Resumo somente leitura com o histórico de rodadas e votos.
- Tema claro/escuro.

## Fluxo do produto

1. Abrir o Planning Poker leva ao login do Reinas ID, carregando o destino.
2. O código de seis dígitos chega por email; o primeiro acesso pede um nome.
3. O Reinas ID devolve o navegador com um código de uso único.
4. Crie uma sala com slug, senha e deck.
5. Compartilhe link, senha ou QR code.
6. Adicione tarefas, vote, revele e conclua rodadas.
7. Finalize a sala e consulte o resumo somente leitura.

## Autenticação

Não há tela de login aqui. Visitante sem sessão é mandado para o `/authorize` do
Reinas ID, carregando o destino em `state`; a volta cai em `/auth/callback`, que
troca o código por uma sessão e grava o cookie.

```
poker /sala ──▶ reinas-id /authorize ──▶ código por email ──▶ perfil
     ◀── /auth/callback?code=… ◀────────────────────────────────┘
     └──▶ POST /api/oauth/token ──▶ sessão + cookie próprio
```

Durante a navegação, cada requisição valida o token contra o Reinas ID, com
cache em memória de `SESSION_CACHE_SECONDS` (padrão 60s) para não pagar uma ida
à rede por render.

A tabela `users` daqui é um **espelho**: id (sempre o do Reinas ID), email e
nome, atualizada de tempos em tempos. Ela existe só para o `JOIN` que mostra
nomes de participantes sem chamada de rede — a fonte da verdade é o Reinas ID.

Sair passa pelo `/logout` do Reinas ID. Apagar só o cookie local faria o próximo
redirecionamento reautenticar em silêncio.

## Arquitetura

```
src/
  app/               rotas, API e páginas
  application/       casos de uso (auth, rooms)
  domain/            regras puras: decks, validação, projeção, navegação
  infrastructure/
    config/          env validado com zod
    db/              schema, cliente, migrations, repositórios
    identity/        cliente do reinas-id, com cache de introspecção
    observability/   log estruturado e métricas
    realtime/        publisher de eventos por sala
    security/        hash de senha de sala
  components/        UI específica do poker
  presentation/      rótulos legíveis
```

## Notas de performance

- Ícones vêm do `lucide-react`, com `optimizePackageImports`.
- O QR code entra por import dinâmico, sem SSR, e só para o administrador.
- A sala é dividida em componentes memoizados: uma mudança de voto não
  re-renderiza a fila nem o compartilhamento.
- Eventos SSE em rajada viram uma releitura só (coalescência de 120ms), com a
  requisição anterior abortada.
- `/api/rooms/[id]/projection` responde `304` via ETag quando nada mudou — o
  estado nem é tocado, então não há re-render.
- A recuperação periódica só roda com a aba visível, e a volta ao foco força uma
  releitura.
- A projeção lê sala, participação, tarefas e participantes em paralelo.
- O resumo da sala finalizada usa três consultas no total, em vez de duas por
  tarefa.

## Banco

Seis tabelas em `reinas_poker`: `users` (espelho), `rooms`, `room_participants`,
`tasks`, `voting_rounds`, `votes`.

## Testes

```bash
npm test                    # unitários
RUN_DB_TESTS=1 npm test     # + integração com PostgreSQL
npm run test:e2e            # Playwright; exige o reinas-id de pé
```

O E2E cobre o fluxo inteiro com dois navegadores simultâneos (administrador e
participante), incluindo sincronização por SSE, e grava a sequência de telas em
`test-results/screenshots/`.

## Documentação

- [Desenvolvimento local](./DEVELOPMENT.md)
- [Deploy e migrations](./DEPLOYMENT.md)
- [Política de segurança](./SECURITY.md)

## Licença

Projeto privado.
