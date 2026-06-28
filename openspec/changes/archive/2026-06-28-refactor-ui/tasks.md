## 1. Fundação do tema

- [x] 1.1 Carregar JetBrains Mono com `next/font/google` em `src/app/layout.tsx` e aplicá-la pela classe ou variável CSS raiz.
- [x] 1.2 Substituir os tokens globais com prioridade ao modo claro em `src/app/globals.css` por tokens semânticos escuros por padrão para fundo, texto, card, borda, texto secundário, primário, accent, danger, ring e superfícies técnicas.
- [x] 1.3 Adicionar estilos globais de body, seleção, focus-visible, controles de formulário e estado disabled para sustentar o tema escuro de ferramenta para desenvolvedores.
- [x] 1.4 Verificar espaçamento do layout global e tratamento de background em viewports pequenas e desktop.

## 2. Primitivas compartilhadas de UI

- [x] 2.1 Refatorar variantes de `Button` para estilos consistentes de default, outline, ghost, danger e ação técnica, incluindo hover, focus-visible, active e disabled.
- [x] 2.2 Refatorar `Card` para usar bordas sutis, superfícies técnicas escuras, radius controlado e padding consistente sem aparência de card aninhado desnecessária.
- [x] 2.3 Refatorar `Input` e selects para que campos de texto, códigos numéricos, senhas e controles de sala compartilhem o mesmo tema e tratamento de foco.
- [x] 2.4 Expandir `Badge` com variantes para estados active, finished, pending, voting, completed, result, participant e metadados técnicos preservando labels existentes.
- [x] 2.5 Atualizar alertas/erros em formulários e componentes de sala para contraste acessível no tema escuro.

## 3. Telas de autenticação e perfil

- [x] 3.1 Refatorar login para exibir um painel escuro orientado a desenvolvedores com título, texto auxiliar, input de email e botão consistentes.
- [x] 3.2 Refatorar verificação por código mágico para enfatizar email e código de seis dígitos como metadados técnicos com JetBrains Mono.
- [x] 3.3 Refatorar configuração/edição de perfil para seguir o sistema visual de auth mantendo o mesmo comportamento de submissão.

## 4. Telas de gestão de salas

- [x] 4.1 Refatorar navegação para usar tratamentos consistentes de botão, wrapping responsivo e foco claro sem alterar destinos ou logout.
- [x] 4.2 Refatorar "Minhas salas" para layout de dashboard responsivo com cards escaneáveis, badges de status, metadados de slug/estilo e empty state escuro.
- [x] 4.3 Refatorar criação de sala para usar o tratamento compartilhado de formulário em nome, slug, senha e estilo de votação.
- [x] 4.4 Refatorar entrada em sala para apresentar senha como painel técnico de acesso preservando endpoint de join e refresh.

## 5. Sala de votação e resultados

- [x] 5.1 Refatorar header da sala ativa para mostrar nome, status, slug, estilo de votação e ação de finalizar do admin com estilo developer-first.
- [x] 5.2 Refatorar área de tarefa atual e deck de votos em um painel principal responsivo com botões de voto estáveis e estados disabled/revealed claros.
- [x] 5.3 Refatorar participantes para distinguir visualmente estados aguardando, votou e voto revelado.
- [x] 5.4 Refatorar ações administrativas de rodada e conclusão de tarefa sem mudar payloads ou regras de disponibilidade.
- [x] 5.5 Refatorar sidebar de fila de tarefas com badges de status, controles compactos de reordenar/editar/remover e formulário de adição consistente.
- [x] 5.6 Refatorar resumo de sala finalizada para agrupar resultados finais, estados das tarefas, rodadas e votos em layout de dashboard escuro legível.

## 6. Verificação

- [x] 6.1 Confirmar que a implementação não altera domínio, infraestrutura de banco, migrations, auth, permissões, persistência ou contratos de API; a rodada posterior de feedback intencionalmente atualiza a query de listagem de salas.
- [x] 6.2 Rodar `npm run lint` e corrigir problemas introduzidos pela refatoração visual.
- [x] 6.3 Rodar `npm run typecheck` e corrigir problemas de tipo introduzidos pela refatoração visual.
- [x] 6.4 Rodar `npm test` e documentar falhas preexistentes não relacionadas se ocorrerem.
- [x] 6.5 Rodar `npm run build` e corrigir problemas de build de produção introduzidos pela refatoração visual.

## 7. Rodada de ajustes

- [x] 7.1 Substituir cores fora de tags por temas claro/escuro apenas em preto, branco e escala de cinza.
- [x] 7.2 Adicionar alternância de tema e separar navegação autenticada entre ações de rota à esquerda e controles de conta à direita.
- [x] 7.3 Adicionar menu de perfil mostrando o nome do usuário com chevron para baixo e permitir troca de nome.
- [x] 7.4 Adicionar labels técnicos ao login e ao contexto da sala atual.
- [x] 7.5 Trocar ações visíveis selecionadas por ícones, incluindo logout e exibição do voto de café.
- [x] 7.6 Listar salas em que o usuário entrou em "Minhas salas" e manter retorno sem senha para salas já acessadas.
- [x] 7.7 Rodar lint, typecheck, testes e build após as mudanças de feedback.

## 8. Cobertura de fluxos e screenshots

- [x] 8.1 Revisar cobertura E2E existente e atualizar seletores/textos para a UI atual.
- [x] 8.2 Adicionar cobertura E2E para login sem nome, login com nome existente, troca de nome, alternância de tema, criação de sala, listagem de sala acessada, retorno sem senha, votação, revelação, conclusão de tarefa, finalização e logout.
- [x] 8.3 Adicionar fluxo de captura de screenshots com pastas separadas por fluxo da aplicação.
- [x] 8.4 Rodar lint, typecheck, testes unitários/integração, build e E2E completo.
- [x] 8.5 Gerar conjunto organizado de screenshots para validação manual.

## 9. QA visual

- [x] 9.1 Rebalancear variáveis de tema claro e escuro para que cards, inputs, botões e superfícies técnicas tenham contraste claro após alternar nos dois sentidos.
- [x] 9.2 Padronizar containers autenticados com a mesma largura máxima da sala de votação para manter a navegação alinhada acima do conteúdo em páginas estreitas.
- [x] 9.3 Adicionar painel de compartilhamento para admin em salas ativas com link da sala, código público, copiar para clipboard e QR code.
- [x] 9.4 Estabilizar captura de screenshots para aguardar conteúdo final e evitar prints do estado de loading.
- [x] 9.5 Rodar lint, typecheck, testes, build, E2E completo e regenerar screenshots.

## 10. Metadados de ownership

- [x] 10.1 Mostrar tag `Admin` nos cards de sala em que o usuário atual é admin.
- [x] 10.2 Fazer o card de criação de sala ocupar a largura padrão da página em vez de uma coluna estreita.
- [x] 10.3 Adicionar rodapé global com ícones Font Awesome de dev/OpenAI e texto "Criado por reinasdev, com codex".
- [x] 10.4 Rodar lint, typecheck, testes, build, E2E e regenerar screenshots.

## 11. QA de ícones

- [x] 11.1 Adicionar dimensionamento global para SVGs do Font Awesome para que ícones de rodapé e ações renderizem em tamanho de texto/ícone nas telas de auth e da aplicação.
- [x] 11.2 Adicionar cobertura E2E que verifica se os ícones do rodapé permanecem compactos em login, código mágico e primeiro acesso.
- [x] 11.3 Revisar visualmente a aplicação pelos screenshots regenerados.
- [x] 11.4 Rodar lint, typecheck, testes, build, testes com banco, E2E e regenerar screenshots.

## 12. Convite com senha e voto selecionado

- [x] 12.1 Persistir o código de acesso compartilhável da sala sem substituir o hash usado na validação de entrada.
- [x] 12.2 Atualizar painel de compartilhamento, clipboard e QR code para usar a senha da sala e URL com `?senha=`.
- [x] 12.3 Implementar entrada automática em sala ativa por link com `?senha=` válido, preservando o retorno após autenticação/onboarding.
- [x] 12.4 Destacar visualmente o voto escolhido pelo próprio usuário sem revelar votos de outros participantes.
- [x] 12.5 Atualizar testes, gerar migration e rodar validações completas da aplicação.

## 13. QA de contraste, largura e hidratação

- [x] 13.1 Ajustar carta selecionada para manter contraste em tema escuro e claro.
- [x] 13.2 Rebalancear badges/tags no light mode para não ficarem apagadas.
- [x] 13.3 Fazer o card de senha de entrada ocupar a largura padrão das páginas autenticadas.
- [x] 13.4 Corrigir hydration mismatch do ícone de tema na navegação.
- [x] 13.5 Atualizar cobertura E2E e rodar validações completas novamente.

## 14. QA de hidratação do compartilhamento

- [x] 14.1 Remover divergência SSR/client da URL exibida no painel de compartilhamento.
- [x] 14.2 Manter clipboard e QR code com URL absoluta após mount.
- [x] 14.3 Adicionar cobertura E2E para ausência de erro de hydration no painel de compartilhamento.
- [x] 14.4 Rodar validações completas novamente.

## 15. Tema público e e-mail developer-first

- [x] 15.1 Adicionar seletor de tema nas telas de login, código mágico e primeiro acesso.
- [x] 15.2 Personalizar o e-mail de código mágico com HTML inline no mesmo estilo preto/branco developer-first.
- [x] 15.3 Adicionar cobertura E2E para o seletor de tema nas telas públicas.
- [x] 15.4 Capturar screenshot do e-mail personalizado junto dos prints manuais.
- [x] 15.5 Rodar lint, typecheck, testes, build, testes com banco, E2E e captura de screenshots.

## 16. Redirecionamento de 404

- [x] 16.1 Redirecionar páginas inexistentes e slugs sem sala para `/`.
- [x] 16.2 Adicionar cobertura E2E para rota inexistente.
- [x] 16.3 Rodar validações novamente.

## 17. Ícones de tarefa e favicon

- [x] 17.1 Adicionar ícone de link do Font Awesome aos links "Abrir tarefa".
- [x] 17.2 Adicionar favicon bullseye do Font Awesome em preto para navegador claro e branco para navegador escuro.
- [x] 17.3 Adicionar cobertura E2E para ícone de tarefa e favicons por `prefers-color-scheme`.
- [x] 17.4 Rodar validações novamente.
