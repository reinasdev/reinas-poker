# Política de Segurança

## Reporte de vulnerabilidades

Não divulgue vulnerabilidades de segurança em issues públicas.

Use o recurso de private vulnerability reporting do GitHub, se estiver
habilitado. Se não estiver, contate o mantenedor do repositório diretamente
antes de publicar detalhes.

Inclua no reporte:

- rota, fluxo ou componente afetado;
- passos de reprodução;
- impacto esperado;
- logs ou screenshots relevantes com segredos removidos.

Se a falha for de autenticação, reporte no
[`reinas-id`](https://github.com/reinasdev/reinas-id): é lá que ficam as
credenciais.

## Versão suportada

O repositório é mantido a partir da branch `main`. Correções de segurança são
aplicadas apenas ao código ativo.

## Fronteira de confiança

Esta aplicação não guarda credencial nenhuma. Ela recebe do `reinas-id` um token
opaco de sessão e o troca por dados do usuário; nunca vê email de código, senha
ou hash de identidade.

O espelho local de usuários guarda apenas id, email e nome.

## Controles

### Sessão

- Toda página autenticada valida a sessão contra o `reinas-id`; token
  desconhecido é tratado como visitante.
- O cache de introspecção é por processo, expira em `SESSION_CACHE_SECONDS` e é
  descartado no logout, para que a revogação tenha efeito.
- Sair passa pelo `/logout` do `reinas-id`: apagar só o cookie local faria o
  próximo redirecionamento reautenticar em silêncio.
- O cookie de sessão usa `HttpOnly`, `SameSite=Lax`, escopo de path e `Secure`
  em produção.
- O `state` do retorno é validado como caminho interno, o que evita usar o
  callback como redirecionamento aberto.

### Salas

- Senhas de sala aceitam exatamente quatro dígitos e são guardadas com Argon2id.
- Tentativas de entrada em sala são limitadas por sala e usuário.
- Participação, papel de administrador e estado ativo da sala são verificados no
  servidor, nunca no cliente.
- Transições de estado da sala bloqueiam a linha da sala em uma transação.

### Votos

- Votos ocultos são removidos da projeção enquanto a rodada não é revelada — o
  cliente jamais recebe um voto que não deveria ver.
- Server-Sent Events transportam apenas invalidações por sala, nunca snapshots.

### HTTP

- Handlers mutáveis validam mesma origem.
- A projeção responde `304` por ETag, sem corpo, quando nada mudou.

## Logs

Logs estruturados excluem tokens, segredo de cliente, senhas, hashes, emails e
votos ocultos.

## Requisitos de produção

- Sirva via HTTPS.
- Use um segredo de cliente forte e distinto do de qualquer outra aplicação.
- Use credenciais PostgreSQL restritas.
- Com múltiplas instâncias, troque o rate limit e o publisher de eventos em
  memória por um backend compartilhado.
- Configure proxies reversos para **substituir**, não anexar, os headers de
  encaminhamento usados no rate limit.
- Revise alertas de auditoria de dependências antes do deploy.

Detalhes operacionais ficam em [DEPLOYMENT.md](./DEPLOYMENT.md).
