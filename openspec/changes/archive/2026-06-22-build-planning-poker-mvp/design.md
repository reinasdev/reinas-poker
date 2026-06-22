## Context

O repositório receberá uma aplicação web fullstack nova para sessões de Planning Poker. O fluxo atravessa autenticação por email, perfil, criação e ingresso em salas protegidas, fila ordenada, rodadas de votação com visibilidade por estado e finalização auditável. Todos os dados relevantes precisam sobreviver a reinícios e múltiplas instâncias, e toda mutação privilegiada precisa ser autorizada no servidor.

Os principais interessados são participantes de times de produto e engenharia, administradores de sala, desenvolvedores e operadores da aplicação. As restrições do MVP são Next.js App Router, TypeScript, shadcn/ui, PostgreSQL, responsividade, ambiente local reproduzível via Docker Compose e ausência de senha de usuário, integrações externas e recursos organizacionais.

## Goals / Non-Goals

**Goals:**

- Entregar uma arquitetura monolítica modular, simples de operar e com regras de domínio fora da UI.
- Persistir integralmente identidade, acesso, participação, fila, rodadas, votos e resultados.
- Garantir validação, autenticação, autorização e transições de estado no backend.
- Suportar concorrência segura entre participantes e preparar atualização de sala em tempo real.
- Oferecer uma UI acessível e responsiva baseada em componentes shadcn/ui.
- Permitir executar e testar localmente o sistema completo com um único comando e dependências isoladas em containers.

**Non-Goals:**

- Login com senha ou provedor social, times, organizações e múltiplos administradores.
- Integrações com Jira ou GitHub, convites, chat, comentários, pagamentos ou exportação.
- Templates configuráveis além de Scrum, Fibonacci e Camisetas.
- Separação inicial em microserviços ou garantia de entrega de eventos entre serviços independentes.

## Decisions

### Monólito modular com Next.js App Router

A aplicação usará Next.js App Router. Componentes de servidor farão leituras iniciais; Server Actions atenderão formulários internos e Route Handlers atenderão autenticação, ingresso e o canal de eventos quando um contrato HTTP explícito for útil. Nenhum handler acessará o banco diretamente: `application` orquestrará casos de uso, `domain` conterá políticas e transições, e `infrastructure` implementará repositórios, email, hashing e realtime.

Essa divisão mantém uma única unidade de implantação sem espalhar regras em páginas e componentes. Uma API separada ou microserviços aumentariam custo operacional sem benefício proporcional no MVP.

### PostgreSQL com Drizzle ORM e Drizzle Kit

PostgreSQL será a fonte de verdade, Drizzle ORM será usado para schema tipado e transações explícitas, e Drizzle Kit será a ferramenta oficial para gerar e aplicar migrations SQL versionadas. A combinação mantém o modelo TypeScript, o histórico SQL e a configuração de migrations no mesmo ecossistema, preserva proximidade com SQL e facilita constraints e bloqueios necessários à votação. Prisma com Prisma Migrate foi considerado, mas adicionaria outro modelo declarativo e oferece menos controle direto sobre alguns padrões concorrentes sem consultas específicas; scripts SQL manuais isolados foram descartados por não fornecerem geração, metadados e fluxo consistente.

O modelo incluirá `users`, `magic_codes`, `sessions`, `rooms`, `room_participants`, `tasks`, `voting_rounds` e `votes`. `rooms` guarda administrador, slug normalizado único, hash da senha, estilo e estado. `tasks` guarda posição, estado e resultado final anulável. Uma rodada pertence a uma tarefa; um voto pertence à combinação rodada/participante, protegida por constraint única. Chaves estrangeiras, índices e timestamps serão definidos no banco.

O schema inicial e toda evolução posterior serão materializados exclusivamente por migrations do Drizzle Kit armazenadas em diretório versionado no repositório, incluindo os metadados exigidos pela ferramenta. Nenhuma tabela, enum, constraint ou índice poderá depender de criação manual, de sincronização implícita do ORM ou de comando de push direto em ambientes compartilhados. O banco registrará as migrations aplicadas para que a execução seja ordenada e idempotente.

Quando o modelo mudar, o fluxo obrigatório será: alterar o schema Drizzle; gerar uma nova migration nomeada com Drizzle Kit; revisar o SQL produzido; commitar juntos o schema atualizado, os arquivos SQL, os metadados do Drizzle Kit e qualquer configuração relacionada alterada; validar contra banco vazio e banco já migrado; e aplicar pelo comando oficial de migrate. O diretório de migrations e os metadados pertencem ao histórico Git. Migrations já integradas não deverão ser reescritas; correções serão novas migrations. Seeds opcionais poderão criar dados descartáveis somente depois que o schema estiver migrado e permanecerão separados dos comandos de migration.

`drizzle-kit push` não será o fluxo padrão em desenvolvimento, CI, staging ou produção e não substituirá migrations versionadas. Criação manual de tabelas, enums, índices ou constraints é proibida. A tabela interna de controle do banco registra o que foi aplicado, enquanto o repositório permanece a fonte do histórico revisável.

### Autenticação própria por código mágico e sessão opaca

O código será numérico de 6 dígitos, gerado aleatoriamente, válido por 10 minutos, de uso único, sujeito a cooldown de reenvio de 60 segundos e máximo de 5 tentativas por código. Será armazenado apenas como hash com identificador, expiração, contador de tentativas e instante de consumo. Solicitações responderão de forma neutra para reduzir enumeração de emails. O consumo ocorrerá em transação e só poderá criar uma sessão uma vez.

A sessão terá duração padrão de 30 dias e usará token opaco aleatório. Somente o hash do token será persistido. O token será enviado em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção; em desenvolvimento local, `Secure` poderá ser desabilitado para HTTP local. Expiração e revogação serão validadas no backend.

Adotar um provedor completo de autenticação foi considerado, mas o fluxo restrito permite uma implementação pequena e controlável. O envio de email ficará atrás de uma interface para trocar provedor sem alterar o domínio.

### Proteção de sala e autorização centralizada

A senha numérica será validada no limite da aplicação e armazenada com Argon2id e salt individual. Após a senha correta, será persistida a participação do usuário na sala; acessos posteriores autenticados reutilizarão essa associação. O slug será normalizado, limitado a seis caracteres e protegido por índice único case-insensitive.

Cada comando carregará usuário e sala no servidor e aplicará políticas `authenticated`, `participant`, `administrator` e `room-active`. Ocultar botões é apenas uma consequência de apresentação, nunca o controle de segurança. Senhas, hashes, códigos e votos ocultos não serão incluídos em respostas ao cliente.

### Máquina de estados para sala, tarefa e rodada

Sala terá estados `ACTIVE` e `FINISHED`. Rodada terá `OPEN` e `REVEALED`; tarefa terá `PENDING`, `VOTING` e `COMPLETED`. Em uma sala ativa com tarefas não concluídas, exatamente uma tarefa será atual. Adicionar a primeira tarefa abre sua primeira rodada. Revelar fecha a visibilidade dos votos; reiniciar cria uma nova rodada aberta e preserva rodadas anteriores para auditoria. Concluir uma tarefa pode registrar um resultado final opcional, promove a próxima tarefa e abre uma rodada vazia.

Transições usarão transação e bloqueio da sala ou controle otimista por versão para impedir duas tarefas atuais, revelações duplicadas e votos após mudança de estado. Finalizar a sala encerra qualquer rodada aberta e bloqueia todas as mutações funcionais.

O administrador poderá finalizar a sala a qualquer momento, inclusive com tarefas pendentes. A transição impedirá novos votos, alterações de fila e novos ingressos como participante e marcará atomicamente todas as tarefas remanescentes como `COMPLETED`, preservando resultado final nulo quando não houver consenso. O resumo exibirá todas as tarefas como concluídas, mantendo votos históricos e resultado quando existente.

### Estilos de votação como catálogo de domínio

Os baralhos Scrum, Fibonacci e Camisetas serão constantes versionadas no domínio. O backend validará cada voto contra o estilo persistido da sala. Valores serão armazenados como tokens textuais para preservar frações, tamanhos, `?` e `café` sem coerção numérica.

Templates customizáveis e tabelas de cartas foram descartados no MVP porque adicionariam configuração sem requisito correspondente.

### Realtime por eventos pós-commit e adaptador substituível

Casos de uso produzirão eventos como `participant.joined`, `vote.cast`, `round.revealed`, `queue.changed` e `room.finished`. Eventos só serão publicados depois do commit. Server-Sent Events será o transporte principal do MVP; WebSocket fica fora do escopo. Comandos de escrita continuam via HTTP, Server Actions ou Route Handlers. A interface `RoomEventPublisher` permanecerá substituível para evolução posterior e poderá receber um adaptador de pub/sub compartilhado quando houver múltiplas instâncias.

Eventos SSE serão notificações de invalidação, não snapshots de estado: o cliente buscará novamente a projeção autorizada da sala. Nenhum evento carregará valores de votos ocultos. Essa estratégia evita dados sensíveis no barramento e tolera reconexão. Polling é fallback de recuperação, mas não o contrato principal.

### Projeções diferentes antes e depois da revelação

A consulta da sala devolverá, para rodada aberta, apenas participante e indicador `hasVoted`. Em rodada revelada, devolverá os valores. A filtragem ocorrerá na consulta do backend, não na UI. O resumo final usará dados persistidos de tarefas, resultados e rodadas reveladas, em modo somente leitura.

### Validação e interface

Schemas Zod compartilhados nos limites validarão email, nome, slug, senha, URLs, títulos e comandos. Erros de domínio serão mapeados para códigos estáveis e mensagens localizáveis. A UI usará shadcn/ui, formulários acessíveis, estados de carregamento/erro, foco visível e layouts mobile-first.

### Continuidade de navegação e estado localizado

Links protegidos carregarão um parâmetro `next` contendo apenas caminhos internos relativos. Login, verificação do código e onboarding preservarão esse destino, rejeitando URLs absolutas ou iniciadas por `//` para evitar redirecionamento aberto. Após concluir o fluxo, o usuário retornará ao link original e seguirá para ingresso ou resumo da sala.

Telas autenticadas oferecerão ações consistentes para voltar, acessar Minhas Salas, criar uma sala e encerrar a sessão. A ação Voltar usará um destino interno determinístico (`/rooms`) em vez do histórico do navegador, impedindo saída acidental da aplicação. Estados persistidos continuarão usando enums estáveis em inglês no domínio e banco, mas serão traduzidos na camada de apresentação.

Quando `room.finished` invalidar a projeção, clientes participantes e administradores detectarão `FINISHED` na nova projeção e solicitarão refresh da rota server-side. Assim todos migram da mesa ativa para o resumo somente leitura, inclusive pelo fallback de polling.

### Ambiente local com Docker Compose

O repositório terá um `Dockerfile` para a aplicação Next.js e um `docker-compose.yml` que orquestra, no mínimo, os serviços `app`, `postgres` e `mailpit`. O fluxo principal será um comando versionado como `make dev` ou equivalente, que sobe PostgreSQL e Mailpit, aguarda o banco saudável, aplica explicitamente as migrations versionadas e somente então inicia a aplicação Next.js. `docker compose up --build` continuará documentado como operação de baixo nível, mas não ocultará nem substituirá a etapa de migration. O serviço da aplicação receberá URLs internas para PostgreSQL e SMTP pela rede do Compose; a interface web do Mailpit será publicada no host.

O PostgreSQL usará volume Docker nomeado para preservar usuários, salas, tarefas, rodadas, votos e resumos entre reinícios normais. Um healthcheck com `pg_isready` indicará prontidão, e `app` dependerá da condição saudável ou usará script de espera equivalente. Isso evita que o processo Next.js tente conectar antes do banco aceitar conexões.

As migrations do Drizzle Kit serão explícitas, revisáveis e versionadas. O startup normal da aplicação não gerará nem aplicará migrations de forma automática, invisível ou destrutiva. A documentação fornecerá comandos separados para gerar migration, aplicar migrations, abrir Drizzle Studio ou ferramenta de inspeção equivalente, visualizar logs, parar containers e remover intencionalmente o volume local. O orquestrador `make dev` apenas encadeará etapas explícitas e observáveis e interromperá o startup se migrate falhar.

O Mailpit será o adaptador SMTP padrão apenas em desenvolvimento, sem envio para a internet. O mesmo contrato de email usado em produção apontará para host e porta SMTP do serviço local. Assim, o fluxo real de solicitação, recebimento e consumo do código mágico é testado sem criar um caminho especial de autenticação.

Um `.env.example` versionado listará todas as variáveis necessárias, valores locais não sensíveis e comentários suficientes para configuração. Segredos reais e arquivos `.env` preenchidos permanecerão fora do versionamento. A documentação distinguirá endereços vistos pelo host dos nomes DNS internos do Compose e incluirá comandos de inicialização, migrations, logs, parada e remoção intencional do volume.

Executar PostgreSQL e email no host foi considerado, mas produziria diferenças de versão e setup entre desenvolvedores. Containerizar também a aplicação atende ao requisito de comando único; a possibilidade de executar Next.js no host com as dependências em containers pode ser documentada como fluxo opcional, sem substituir o caminho suportado.

## Risks / Trade-offs

- [Entrega de email lenta ou indisponível] → Isolar o provedor, registrar métricas e aplicar reenvio com cooldown e respostas neutras.
- [Força bruta em código mágico ou senha de sala] → Rate limit por IP e identidade, expiração, limite de tentativas, Argon2id e auditoria sem segredos.
- [Corridas entre voto, revelação, reinício e avanço] → Executar comandos em transações, verificar estado dentro da transação e usar lock ou versão otimista.
- [SSE limitado a uma instância] → Manter publisher abstrato e introduzir pub/sub compartilhado antes de escalar horizontalmente.
- [Histórico cresce com reinícios] → Indexar por sala/tarefa/rodada e definir retenção somente após requisitos operacionais reais.
- [Slug curto reduz o espaço disponível] → Validar unicidade atomicamente, retornar conflito claro e não reservar slugs fora da criação transacional.
- [Resultado final não é inferível de votos não numéricos] → Exigir escolha explícita opcional do administrador entre cartas válidas; não calcular média automaticamente.
- [Build Docker lento ou experiência ruim com hot reload] → Usar estágios e cache de dependências adequados, bind mounts somente no perfil de desenvolvimento e documentar requisitos mínimos do Docker.
- [Aplicação inicia antes do banco] → Usar healthcheck do PostgreSQL e dependência condicionada, mantendo retry limitado na conexão como proteção adicional.
- [Volume local mascara mudanças de schema] → Manter migrations explícitas, documentar aplicação e rollback e oferecer comando destrutivo de reset apenas como ação intencional.
- [Configuração Docker diverge da produção] → Compartilhar o mesmo build da aplicação e contratos de configuração, limitando Mailpit e bind mounts ao ambiente local.
- [Migration gerada remove ou transforma dados de forma insegura] → Exigir revisão do SQL, testes contra banco atualizado, estratégia explícita de backfill e migration corretiva em vez de editar histórico aplicado.
- [Schema Drizzle diverge das migrations versionadas] → Validar em CI a criação de banco vazio e falhar quando mudanças de modelo não estiverem acompanhadas da migration correspondente.

## Migration Plan

1. Criar migrações aditivas com tabelas, enums, constraints e índices.
2. Criar e validar o ambiente Docker Compose local com PostgreSQL, Mailpit, healthcheck, volume e `.env.example`.
3. Configurar segredos, conexão PostgreSQL, provedor de email e parâmetros de hashing/rate limit.
4. Implantar a aplicação com migrações executadas antes de aceitar tráfego.
5. Validar autenticação, criação/ingresso, concorrência de votação e resumo em ambiente local e de homologação.
6. Habilitar observabilidade e o transporte realtime; manter polling de recuperação no cliente.

Como não há dados legados, rollback consiste em reverter a aplicação e, antes de uso em produção, remover as tabelas pela migração reversa. Após existir dado real, rollback de aplicação deve preservar o schema e dados; migrações destrutivas exigirão plano separado.

## Open Questions

- Qual provedor de email e quais limites operacionais serão usados por ambiente?
- O primeiro deploy será de instância única, permitindo SSE em memória, ou já exigirá pub/sub compartilhado?
- O fluxo Docker local priorizará hot reload por bind mount ou imagem imutável com rebuild? A implementação deve preservar o comando único em ambos os casos.
