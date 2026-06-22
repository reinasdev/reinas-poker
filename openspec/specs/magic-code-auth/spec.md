# Magic Code Auth

## Purpose

Define autenticação sem senha por código mágico e sessão opaca.

## Requirements

### Requirement: Retorno ao destino protegido
O sistema SHALL preservar um caminho interno protegido acessado antes da autenticação durante as etapas de email, código mágico e perfil e MUST rejeitar destinos externos.

#### Scenario: Convidado abre link de sala
- **WHEN** uma pessoa não autenticada abre o slug de uma sala e conclui login e onboarding
- **THEN** o sistema retorna ao mesmo slug em vez de redirecionar para Minhas Salas

#### Scenario: Destino externo malicioso
- **WHEN** um cliente informa URL absoluta ou caminho iniciado por `//` como retorno
- **THEN** o sistema ignora esse destino e usa Minhas Salas

### Requirement: Solicitação de código mágico
O sistema SHALL permitir que uma pessoa solicite acesso informando um email válido e SHALL enviar um código mágico por email sem revelar se o endereço já está cadastrado.

#### Scenario: Solicitação válida
- **WHEN** uma pessoa informa um email válido na tela inicial
- **THEN** o sistema registra um código protegido e envia o código ao email informado

#### Scenario: Email inválido
- **WHEN** uma pessoa informa um valor que não é um email válido
- **THEN** o sistema rejeita a solicitação sem enviar um código

### Requirement: Código expirável e de uso único
O sistema SHALL gerar código mágico numérico de 6 dígitos, válido por 10 minutos e de uso único, e SHALL consumi-lo atomicamente ao autenticar o usuário.

#### Scenario: Código válido
- **WHEN** a pessoa apresenta o código correto antes da expiração
- **THEN** o sistema consome o código e cria uma sessão autenticada

#### Scenario: Código expirado
- **WHEN** a pessoa apresenta um código após sua expiração
- **THEN** o sistema rejeita a autenticação

#### Scenario: Reutilização de código
- **WHEN** a pessoa apresenta um código que já foi consumido
- **THEN** o sistema rejeita a autenticação e não cria outra sessão

### Requirement: Proteção de credenciais temporárias
O sistema MUST armazenar códigos mágicos de forma não reversível, MUST limitar cada código a 5 tentativas e MUST aplicar cooldown de 60 segundos entre reenvios no backend.

#### Scenario: Inspeção do armazenamento
- **WHEN** um código mágico é persistido
- **THEN** o valor em texto puro não está presente no banco de dados

#### Scenario: Excesso de tentativas
- **WHEN** um código recebe 5 tentativas inválidas
- **THEN** o sistema invalida novas validações desse código

#### Scenario: Reenvio durante cooldown
- **WHEN** uma nova solicitação ocorre antes de 60 segundos desde o último envio aplicável
- **THEN** o sistema não emite outro código e mantém resposta neutra

### Requirement: Sessão opaca protegida
O sistema SHALL criar sessão com duração padrão de 30 dias usando token opaco, MUST persistir somente o hash do token e MUST enviá-lo em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.

#### Scenario: Sessão criada
- **WHEN** um código válido é consumido
- **THEN** o sistema cria uma sessão que expira em 30 dias e não persiste o token em texto puro

#### Scenario: Cookie em produção
- **WHEN** uma sessão é emitida em ambiente de produção
- **THEN** o cookie possui atributos `HttpOnly`, `Secure` e `SameSite=Lax`
