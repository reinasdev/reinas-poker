---
name: commit-message
description: Use esta skill quando o usuário pedir para criar, sugerir, preparar ou executar um commit. Gere commits no padrão Conventional Commits, sem emoji, usando sempre o nome normalizado do branch atual como scope.
---

# Commit Message

Preparar commits seguindo estritamente estas regras.

## Objetivo

Criar mensagens de commit no padrão Conventional Commits, sem emoji, usando sempre o nome do branch atual como scope.

Formato obrigatório:

`type(branch-name): descrição curta`

Exemplo:

`feat(mvp-01): implementa autenticação por código mágico`

## Regras obrigatórias

- Usar sempre Conventional Commits.
- Nunca usar emoji.
- Usar sempre o nome do branch atual como scope.
- Colocar o scope entre parênteses logo após o type.
- Escrever descrição curta, objetiva e em português.
- Usar letras minúsculas no type.
- Não finalizar a descrição com ponto.
- Não inventar escopo diferente do branch.
- Não usar escopo baseado em pasta, módulo ou feature se houver branch disponível.
- Descobrir o branch atual com `git branch --show-current` antes de criar a mensagem.
- Se o branch contiver `/`, substituir `/` por `-` no scope. Exemplo: `feature/mvp-01` vira `feature-mvp-01`.
- Se não for possível descobrir o branch, parar e pedir confirmação do scope.

## Types permitidos

Usar apenas um destes types:

- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: documentação
- `style`: formatação sem mudança lógica
- `refactor`: refatoração sem mudança funcional
- `test`: testes
- `chore`: manutenção, configuração ou tooling
- `build`: build, dependências ou empacotamento
- `ci`: integração contínua
- `perf`: performance
- `revert`: reversão

## Como decidir o type

- Usar `feat` para nova funcionalidade de produto.
- Usar `fix` para correção de comportamento quebrado.
- Usar `docs` para mudanças em documentação, OpenSpec, README ou arquivos `.md`.
- Usar `chore` para setup, configurações, Docker, scripts, lint, formatter ou mudanças sem impacto direto no produto.
- Usar `build` para dependências, package manager, bundler ou build.
- Usar `ci` para pipelines e GitHub Actions.
- Usar `test` para criação ou ajuste de testes.
- Usar `refactor` quando o comportamento não muda.

## Fluxo antes de sugerir commit

1. Executar:
   - `git status --short`
   - `git diff --stat`
   - `git diff --cached --stat`
   - `git branch --show-current`
2. Identificar se há arquivos staged.
3. Se houver staged changes, gerar a mensagem com base no staged diff.
4. Se não houver staged changes, considerar o working tree e perguntar se deve stagear tudo ou apenas arquivos específicos.
5. Não incluir arquivos sensíveis, `.env`, segredos, tokens ou credenciais.
6. Se detectar arquivos sensíveis, parar e avisar antes de commitar.

## Ao criar commit

Quando o usuário pedir para executar o commit:

1. Revisar o status.
2. Confirmar quais arquivos serão incluídos.
3. Gerar uma única mensagem no formato obrigatório.
4. Executar `git commit -m "type(branch-name): descrição curta"`.
5. Após o commit, mostrar:
   - hash curto do commit;
   - mensagem usada;
   - status atual do Git.

## Exemplos

Branch: `mvp-01`

`feat(mvp-01): implementa fluxo inicial de salas`

Branch: `feature/mvp-01`

`feat(feature-mvp-01): implementa fluxo inicial de salas`

Branch: `fix/auth-code`

`fix(fix-auth-code): corrige validação do código mágico`

Branch: `docs/openspec`

`docs(docs-openspec): atualiza especificação do mvp`
