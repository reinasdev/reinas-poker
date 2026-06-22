## 1. Fundação da aplicação

- [x] 1.1 Inicializar a aplicação Next.js com App Router, TypeScript, lint, testes e estrutura modular `domain`, `application`, `infrastructure` e `app`
- [x] 1.2 Configurar Tailwind CSS e shadcn/ui com tema, layout raiz, feedback de erro e padrões acessíveis
- [x] 1.3 Definir e validar variáveis de ambiente para PostgreSQL, sessão, email, hashing, rate limit e URL pública
- [x] 1.4 Configurar suíte de testes unitários, integração com PostgreSQL e testes end-to-end responsivos
- [x] 1.5 Criar `Dockerfile` da aplicação Next.js com instalação reproduzível de dependências e modo de desenvolvimento adequado
- [x] 1.6 Criar `docker-compose.yml` com serviços para aplicação Next.js, PostgreSQL e Mailpit ou equivalente
- [x] 1.7 Configurar volume Docker nomeado para persistência local do PostgreSQL entre reinícios
- [x] 1.8 Configurar healthcheck do PostgreSQL e dependência ou espera equivalente antes da inicialização da aplicação
- [x] 1.9 Configurar o adaptador SMTP local para enviar códigos mágicos ao serviço de captura de emails e publicar sua interface web
- [x] 1.10 Criar `.env.example` completo com valores locais seguros e referências às variáveis exigidas pela aplicação e pelo Compose
- [x] 1.11 Criar `make dev` ou comando equivalente que suba PostgreSQL e Mailpit, aguarde o banco, execute migrate explicitamente e inicie a aplicação somente após sucesso
- [x] 1.12 Criar comandos separados para gerar migration, aplicar migrations, abrir Drizzle Studio ou equivalente, visualizar logs, parar containers e resetar intencionalmente o volume
- [x] 1.13 Validar a partir de checkout limpo que o ambiente inicia aplicação Next.js, PostgreSQL e Mailpit saudáveis sem exigir features de produto
- [x] 1.14 Validar a conexão da aplicação ao PostgreSQL local e que o comando migrate no container aplica o schema completo em banco vazio

## 2. Persistência e modelo de domínio

- [x] 2.1 Configurar Drizzle ORM, Drizzle Kit, conexão PostgreSQL, diretório versionado de migrations e tabela de histórico
- [x] 2.2 Modelar `users`, `magic_codes` e `sessions` com constraints, hashes, expiração, consumo e índices
- [x] 2.3 Modelar `rooms` e `room_participants` com administrador único, slug normalizado único, senha protegida, estilo e estado
- [x] 2.4 Modelar `tasks`, `voting_rounds` e `votes` com posições, estados, resultado, histórico e unicidade por rodada/participante
- [x] 2.5 Gerar, revisar e versionar a migration inicial completa, incluindo tabelas, enums, chaves estrangeiras, índices e constraints de integridade
- [x] 2.6 Validar que a migration inicial cria o schema completo em PostgreSQL vazio sem qualquer etapa manual
- [x] 2.7 Implementar verificação automatizada de que alterações no schema Drizzle exigem nova migration versionada e de que migrations aplicam em ordem usando a tabela de controle do banco
- [x] 2.8 Documentar o fluxo para alterar schema, gerar migration, revisar SQL e commitar juntos schema, SQL, metadados do Drizzle Kit e configuração relacionada
- [x] 2.9 Proibir no fluxo documentado e CI criação manual de estruturas e uso de `drizzle-kit push` como substituto de migrations em desenvolvimento, CI, staging ou produção
- [x] 2.10 Implementar seeds locais opcionais separados das migrations e executados somente após o schema estar atualizado
- [x] 2.11 Implementar repositórios transacionais e fixtures/factories para os agregados persistidos

## 3. Autenticação por código mágico e perfil

- [x] 3.1 Implementar schemas Zod e políticas de domínio para email normalizado, código, nome e sessão
- [x] 3.2 Implementar solicitação de código numérico de 6 dígitos com hash, expiração de 10 minutos, cooldown de 60 segundos, máximo de 5 tentativas e resposta neutra
- [x] 3.3 Implementar adaptador de email e templates para envio do código mágico
- [x] 3.4 Implementar consumo transacional de uso único e sessão opaca de 30 dias com hash no banco e cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção
- [x] 3.5 Implementar middleware/helpers server-side para sessão válida e redirecionamento por perfil incompleto
- [x] 3.6 Implementar telas responsivas de email, inserção do código e cadastro inicial do nome usando shadcn/ui
- [x] 3.7 Testar códigos válidos, expirados, reutilizados, tentativas excessivas, cookies e reutilização do perfil

## 4. Criação, listagem e acesso a salas

- [x] 4.1 Implementar catálogo de cartas Scrum, Fibonacci e Camisetas e validação de valores no domínio
- [x] 4.2 Implementar criação transacional de sala com slug de até 6 caracteres, conflito de unicidade e hash Argon2id da senha de 4 dígitos
- [x] 4.3 Implementar ingresso em sala ativa com rate limit, verificação da senha e participação idempotente
- [x] 4.4 Implementar consulta Minhas Salas limitada ao criador, com estado ativa/finalizada e links de acesso
- [x] 4.5 Implementar telas responsivas de Minhas Salas, criação e solicitação de senha da sala
- [x] 4.6 Testar validações, slug duplicado, senha nunca persistida em texto puro, ingresso e acesso autenticado

## 5. Autorização e projeções da sala

- [x] 5.1 Implementar políticas backend para usuário autenticado, perfil completo, participante, administrador único e sala ativa
- [x] 5.2 Implementar executor de comandos que carregue contexto e aplique políticas antes de qualquer mutação
- [x] 5.3 Implementar projeção de sala aberta que exponha fila, tarefa atual, participantes e `hasVoted` sem valores ocultos
- [x] 5.4 Implementar projeção de rodada revelada que exponha os votos somente após a transição persistida
- [x] 5.5 Criar testes de autorização direta para todos os comandos administrativos e de participante

## 6. Fila de tarefas

- [x] 6.1 Implementar inclusão de tarefa com título e URL validados e promoção automática da primeira tarefa
- [x] 6.2 Implementar edição e remoção transacionais de tarefas elegíveis, incluindo promoção após remoção da atual
- [x] 6.3 Implementar reordenação atômica com conjunto completo e posições únicas e contíguas
- [x] 6.4 Implementar regras que mantenham exatamente uma tarefa atual quando houver pendências
- [x] 6.5 Implementar painel administrativo responsivo para adicionar, editar, remover e reordenar a fila
- [x] 6.6 Testar manutenção concorrente, invariantes da tarefa atual, validação de URL e persistência da ordem

## 7. Votação, revelação e avanço

- [x] 7.1 Implementar registro e substituição atômica do voto na rodada aberta, validando participação e catálogo da sala
- [x] 7.2 Implementar revelação administrativa transacional e bloqueio de votos posteriores
- [x] 7.3 Implementar reinício administrativo criando nova rodada vazia sem apagar o histórico
- [x] 7.4 Implementar conclusão da tarefa com resultado final opcional válido, avanço e abertura de rodada vazia para a próxima tarefa
- [x] 7.5 Implementar mesa responsiva com cartas, estado de participantes, votos ocultos/revelados e controles condicionados ao papel
- [x] 7.6 Testar voto único, alteração, ocultação na resposta, carta inválida, revelação, reinício, histórico e nova tarefa sem votos
- [x] 7.7 Testar corridas entre voto, revelação, reinício e avanço usando transações e lock ou versão otimista

## 8. Atualização em tempo real

- [x] 8.1 Definir SSE como transporte do MVP e eventos de invalidação via interface substituível `RoomEventPublisher`, sem incluir votos ocultos
- [x] 8.2 Publicar eventos somente após commit nos casos de ingresso, fila, voto, revelação, reinício, avanço e finalização
- [x] 8.3 Implementar adaptador SSE e endpoint autenticado/autorizado para eventos da sala, com heartbeat e reconexão
- [x] 8.4 Implementar cliente que invalida e recarrega a projeção autorizada após eventos, com fallback de recuperação
- [x] 8.5 Testar isolamento entre salas, reconexão, recarga da projeção autorizada e ausência de valores ocultos no canal SSE

## 9. Finalização e resumo

- [x] 9.1 Implementar finalização transacional exclusiva do administrador a qualquer momento, persistindo instante e encerrando rodada aberta
- [x] 9.2 Bloquear no backend toda mutação funcional e novo ingresso para participação após finalização
- [x] 9.3 Implementar resumo com tarefas pendentes sem resultado e tarefas concluídas com votos históricos e resultado final anulável
- [x] 9.4 Implementar tela de resumo somente leitura responsiva pelo link personalizado, sem controles mutáveis
- [x] 9.5 Testar finalização autorizada, imutabilidade, reabertura do link e resumos com e sem resultado

## 10. Qualidade, segurança e entrega

- [x] 10.1 Executar análise de segurança para enumeração de email, força bruta, cookies, CSRF, autorização e vazamento de hashes ou votos
- [x] 10.2 Adicionar logs estruturados, métricas e trilha de erros sem registrar códigos, tokens, senhas ou hashes
- [x] 10.3 Verificar acessibilidade por teclado, foco, contraste e leitores de tela nos fluxos principais
- [x] 10.4 Verificar layouts desktop e mobile para autenticação, Minhas Salas, criação, mesa, fila e resumo
- [x] 10.5 Executar lint, typecheck, testes unitários, integração e end-to-end do fluxo completo
- [x] 10.6 Documentar configuração local, migrações, provedor de email, execução, estratégia realtime e procedimento de deploy/rollback
- [x] 10.7 Validar em CI a aplicação das migrations versionadas tanto em banco vazio quanto em banco com a versão anterior do schema
- [x] 10.8 Validar end-to-end no ambiente Docker o fluxo completo de código mágico, perfil, salas, fila, votação, revelação, finalização e resumo persistido

## 11. Continuidade e navegação da experiência

- [x] 11.1 Preservar e validar o destino interno original durante login por email, código mágico e onboarding, retornando o convidado ao slug acessado
- [x] 11.2 Adicionar navegação autenticada acessível para voltar, abrir Minhas Salas, criar sala e sair
- [x] 11.3 Atualizar todos os navegadores conectados para o resumo somente leitura quando a sala for finalizada via SSE ou polling
- [x] 11.4 Traduzir os estados da fila para português apenas na camada de apresentação
- [x] 11.5 Testar end-to-end retorno ao link após autenticação, navegação, localização de estados e atualização do convidado após finalização

## 12. Navegação segura e conclusão na finalização

- [x] 12.1 Tornar o botão Voltar determinístico e interno, direcionando para Minhas Salas sem usar o histórico do navegador
- [x] 12.2 Ao finalizar uma sala, marcar atomicamente todas as tarefas remanescentes como concluídas sem inventar resultado final
- [x] 12.3 Validar integração, resumo e navegação para a nova regra de finalização
