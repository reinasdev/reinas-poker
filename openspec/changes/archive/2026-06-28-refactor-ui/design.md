## Context

O Planning Poker atual é uma aplicação Next.js com Tailwind CSS, uma pequena camada de primitivas no estilo shadcn/ui e rotas/componentes voltados para autenticação, gestão de salas, votação, fila de tarefas, revelação de votos e resumo final. A UI anterior era funcional, mas genérica: tokens com prioridade ao modo claro, fonte de sistema padrão, cards básicos, pouco tratamento de estados e ênfase técnica inconsistente para slugs, senhas, votos, labels e badges.

Esta mudança é majoritariamente visual, com um refinamento de produto: depois que o usuário entra em uma sala, ela deve aparecer em "Minhas salas" e futuros acessos não devem pedir senha novamente. A associação existente em `room_participants` já suporta isso, então não é necessária mudança de schema ou migration.

## Goals / Non-Goals

**Goals:**

- Estabelecer uma identidade visual orientada a desenvolvedores em preto e branco, inspirada em terminais, dashboards de observabilidade e painéis técnicos.
- Dar suporte a modos claro e escuro explícitos com superfícies, controles e textos em escala de cinza; cores ficam restritas a tags/badges de estado.
- Carregar JetBrains Mono via `next/font` e aplicá-la como fonte principal ou dominante em elementos técnicos.
- Padronizar tokens globais, tipografia, cards, badges, botões, inputs, selects, erros, focus rings, estados disabled e espaçamento responsivo.
- Atualizar visualmente login, verificação por código mágico, configuração/edição de perfil, minhas salas, criação de sala, entrada em sala, sala de votação, fila de tarefas, revelação de votos e resumo final.
- Adicionar navegação autenticada com ações de rota à esquerda e controles de tema, perfil e logout à direita.
- Permitir alterar o nome do perfil pelo menu da navegação.
- Listar em "Minhas salas" as salas em que o usuário já entrou, junto das salas criadas por ele.

**Non-Goals:**

- Não alterar decks de voto, transições de tarefa, ciclo de vida da sala, lógica de autenticação, permissões ou payloads de comandos da sala.
- Não substituir a estrutura atual de rotas nem os limites server/client components, salvo quando necessário para composição visual.
- Não criar novo workflow de produto, comando de sala, permissão ou modelo de dados.
- Não criar landing page de marketing; a primeira tela continua sendo o login real da aplicação.

## Decisions

1. Usar um sistema de tokens em escala de cinza em `globals.css`.

   A aplicação deve definir variáveis CSS semânticas para fundo, texto, card, borda, texto secundário, primário, perigo, focus ring e superfícies técnicas nos modos claro e escuro. Botões, cards, inputs, navegação e superfícies de layout devem permanecer em preto/branco/cinza; badges podem usar cores para diferenciar estados.

   Alternativa considerada: adicionar um tema completo gerado pelo shadcn. Isso traria mais churn do que o necessário para a camada pequena de primitivas atual.

2. Carregar JetBrains Mono em `src/app/layout.tsx` com `next/font/google`.

   JetBrains Mono deve ser anexada por variável/classe CSS na raiz. Ela pode ser a fonte principal da aplicação para reforçar a identidade orientada a desenvolvedores, com legibilidade garantida por espaçamento, contraste e escala tipográfica.

   Alternativa considerada: usar JetBrains Mono apenas em elementos code-like. Isso atenderia aos elementos técnicos, mas deixaria a marca visual geral menos distinta.

3. Fortalecer as primitivas existentes em vez de introduzir um conjunto grande de componentes.

   `Button`, `Card`, `Badge` e `Input` devem concentrar a consistência visual. Variantes devem ser adicionadas ou refinadas apenas quando necessárias nas telas existentes, como badges de status, badges técnicos, botões danger, ghost e ações compactas com ícone. Selects podem ser estilizados localmente ou extraídos se a repetição justificar.

   Alternativa considerada: instalar ou gerar muitos componentes shadcn/ui. O projeto já tem primitivas no estilo shadcn e o escopo pedido é refatoração visual, então expansão ampla de dependências/arquivos não é necessária.

4. Tratar refatorações de tela como composição visual sobre fluxos de dados existentes.

   Páginas e componentes de apresentação devem reorganizar headers, painéis, metadados, badges e grids sem mudar fetches, redirects, formulários, endpoints ou payloads de comando. A sala de votação pode usar layout de dashboard com painel principal, participantes e fila lateral, mas sem alterar comportamento dos comandos.

   Alternativa considerada: criar novo view model de sala ou alterar o contrato da projection. Isso atravessaria contratos de comportamento/dados e fica fora do escopo.

5. Preferir estados nativos acessíveis e padrões responsivos simples.

   Hover, focus-visible, disabled, alert e estados ativos/revelados devem ser visíveis no tema escuro. Layouts devem usar grids responsivos, larguras controladas, wrapping de controles e dimensões estáveis para impedir sobreposição de texto e deslocamentos inesperados.

   Alternativa considerada: adicionar animações pesadas ou elementos decorativos. A identidade solicitada é operacional e developer-first, então uma estética técnica e contida é mais adequada.

6. Implementar controles de tema e perfil na navegação autenticada.

   `AppNavigation` deve receber o nome do usuário a partir dos server components e dividir ações em grupos esquerdo/direito. O grupo direito deve conter alternância de tema, menu de perfil e logout icon-only. Atualizações de nome reutilizam o endpoint `/api/auth/profile` e fazem refresh da rota.

   Alternativa considerada: criar uma página dedicada de perfil. A interação pedida é um menu compacto na navegação e o endpoint existente já permite atualizar o nome.

7. Reutilizar a persistência de membership para salas acessíveis.

   `joinRoom` já armazena membership de forma idempotente. "Minhas salas" deve buscar salas em que o usuário é admin ou participante, e o acesso à sala pode continuar usando `getMembership` para evitar pedido de senha para membros.

   Alternativa considerada: criar uma tabela separada de salas recentes. Isso geraria schema e migration desnecessários porque membership já representa que o usuário entrou na sala.

8. Reforçar a rodada de feedback sobre contraste, largura e compartilhamento.

   O modo claro deve usar fundo branco com cards, controles, inputs e superfícies técnicas em cinzas claramente mais escuros. O modo escuro deve redefinir todas as superfícies para preto/cinza escuro ao alternar de volta. Login, lista de salas, criação de sala, entrada em sala e sala devem compartilhar a mesma largura externa para manter a navegação no topo esperado. A tela de admin deve exibir um painel de compartilhamento com URL da sala, código público, ação de copiar e QR code derivado da URL atual.

   Alternativa considerada: criar rota separada de convite ou modelo persistido de invite. O slug e a senha já existentes bastam para essa affordance visual/utilitária.

9. Manter ownership e atribuição visíveis sem criar novo comportamento.

   "Minhas salas" identifica salas em que o usuário é admin comparando `room.adminId` com o id do usuário atual e renderiza a badge `Admin`. O formulário de criação de sala usa o mesmo ritmo de largura total dos dashboards autenticados. O layout raiz renderiza um rodapé compacto em escala de cinza em todas as rotas com ícones Font Awesome de dev/OpenAI e a atribuição solicitada.

10. Persistir o código de acesso compartilhável para convites.

A criação de sala deve continuar armazenando `passwordHash` para validação, mas também deve registrar um `accessCode` compartilhável usado somente para exibição ao admin, texto copiado e QR code. O link de convite deve apontar para a rota da sala com `?senha=<accessCode>`; usuários autenticados e com perfil completo entram automaticamente quando a senha é válida, e usuários não autenticados preservam a query no retorno pós-login/onboarding.

Alternativa considerada: derivar a senha a partir do hash ou manter apenas no client após criação. Hash não é reversível, e manter no client impediria compartilhar salas antigas ou recarregadas.

## Risks / Trade-offs

- Mudanças visuais alterarem comandos de sala por acidente -> manter payloads, estrutura de rotas, decks e transições intactos; validar com lint, typecheck, testes e build.
- Regressões de contraste no tema -> usar tokens de alto contraste em claro/escuro e verificar textos secundários, bordas, disabled e danger.
- Monospace em toda a aplicação reduzir legibilidade -> usar hierarquia clara, comprimentos de linha moderados e espaçamento adequado.
- Arquivos compactos existentes ficarem difíceis de manter -> reformatar apenas quando necessário e manter mudanças focadas na UI.
- Estilo de status sugerir nova semântica -> mapear badges somente para estados e labels existentes.
- Listagem de salas acessíveis expor salas erradas -> listar apenas salas com `room_participants` do usuário autenticado ou em que ele é admin.
- Toggle de tema parecer quebrado por tokens próximos ou stale -> definir explicitamente cada token de superfície/controle nos dois modos e validar por screenshots.
- Screenshot capturar loading de rota -> esperar headings/conteúdo estáveis e ocultar overlays de dev antes de capturar.
- Senha em query string aparecer em histórico/clipboard -> aceitar explicitamente para o fluxo de convite solicitado e limitar a exposição do `accessCode` na projeção ao admin.
