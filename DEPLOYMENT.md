# Deploy

Guia para publicar o Planning Poker com PostgreSQL gerenciado e migrations
versionadas executadas antes do build.

## Modelo de deploy

O runtime não executa migrations. O deploy roda:

```bash
npm run build:deploy   # = npm run db:migrate && npm run build
```

Se a migration falhar, o build falha antes de a nova versão subir.

**O [`reinas-id`](https://github.com/reinasdev/reinas-id) precisa estar no ar
antes.** Sem ele não há login, e a aplicação trata todo visitante como anônimo.

## Configuração da plataforma

- Build Command: `npm run build:deploy`
- O `@reinas/ui` é uma dependência Git: a plataforma precisa ter `git` disponível
  na instalação. Como o repositório do design system é público, não é necessário
  nenhum segredo.

## Variáveis de ambiente

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
APP_URL=https://poker.seu-dominio
SESSION_COOKIE_NAME=reinas_poker_session

REINAS_ID_URL=https://id.seu-dominio
REINAS_ID_PUBLIC_URL=https://id.seu-dominio
REINAS_ID_CLIENT_ID=reinas-poker
REINAS_ID_CLIENT_SECRET=<o mesmo segredo cadastrado no reinas-id>
SESSION_CACHE_SECONDS=60
```

Não existem SMTP nem `AUTH_HASH_SECRET` aqui: quem autentica é o `reinas-id`.

`REINAS_ID_URL` e `REINAS_ID_PUBLIC_URL` só diferem quando há rede interna — com
domínios públicos as duas são iguais.

O `redirect_uri` cadastrado no `reinas-id` precisa ser exatamente
`${APP_URL}/auth/callback`.

Nunca versione URLs reais de banco ou o segredo de cliente.

## Docker

```bash
docker build --target production -t reinas-poker .
docker run -p 3000:3000 --env-file .env.production reinas-poker
```

O `docker-compose.yml` usa o alvo `development`, com volume montado — serve para
desenvolvimento, não para produção.

## Banco gerenciado

Use a connection string do provedor em `DATABASE_URL`. Este banco é separado do
banco do `reinas-id`: bancos distintos, não schemas do mesmo banco. Se o provedor
oferecer URLs distintas para conexão direta e pooling, prefira a recomendada para
execução serverless e confirme que o comando de migration aplica DDL corretamente.

## Preview e staging

Preview/staging e produção compartilham o mesmo banco remoto. O risco é
explícito: qualquer build remoto com a mesma `DATABASE_URL` roda migrations no
banco real.

Antes de abrir preview com migrations pendentes, valide localmente:

```bash
npm run lint
npm run typecheck
RUN_DB_TESTS=1 npm test
npm run db:validate
npm run build
```

## Ordem de deploy

1. Publique o `reinas-id`, com esta aplicação cadastrada em `REINAS_ID_CLIENTS`.
2. Gere e revise as migrations localmente.
3. Valide com `npm run db:validate`.
4. Commit schema, SQL, metadados Drizzle e código juntos.
5. Configure as variáveis na plataforma.
6. Publique com `npm run build:deploy`.
7. Confira os logs de migration e build.

## Múltiplas instâncias

Duas peças vivem em memória e não sobrevivem a mais de uma instância:

- o publisher de eventos das salas (SSE), que perderia participantes conectados
  a outra instância;
- o rate limit de entrada em sala.

Antes de escalar horizontalmente, troque as duas por um backend compartilhado.
O cache de introspecção de sessão é seguro: cada instância mantém o seu, e a
janela é curta.

## Rollback

Rollback da aplicação não desfaz migrations já aplicadas.

Para mudanças de schema arriscadas, use fases:

1. **Expandir:** adicionar estrutura compatível com a versão atual.
2. **Usar:** publicar código que usa a nova estrutura.
3. **Contrair:** remover a estrutura antiga só depois de ninguém usar.

Correções de schema são novas migrations para frente, nunca edição de migrations
já aplicadas.

## Segurança operacional

- Sirva via HTTPS.
- Use um segredo de cliente forte, distinto do de qualquer outra aplicação.
- Use credenciais PostgreSQL restritas.
- Não exponha `DATABASE_URL` em logs ou arquivos versionados.
- Revise alertas de dependências antes de publicar.

Para os controles de segurança da aplicação, veja [SECURITY.md](./SECURITY.md).
