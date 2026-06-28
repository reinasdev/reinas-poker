# Security Policy

## Reporting a Vulnerability

Please do not disclose security vulnerabilities in public issues.

Use GitHub private vulnerability reporting if it is enabled for this repository. If it is not available, contact the repository maintainer directly before publishing details.

When reporting, include:

- affected route, workflow, or component;
- reproduction steps;
- expected impact;
- relevant logs or screenshots with secrets removed.

## Supported Version

This repository is currently maintained from the `main` branch. Security fixes are applied to the active codebase only.

## Security Controls

- Email login requests return a neutral response to reduce account enumeration.
- Magic codes are random six-digit values, HMAC-hashed with the normalized email, expire after ten minutes, allow limited attempts, and are consumed under a row lock.
- Session tokens are random bytes. Only their HMAC is stored.
- Session cookies are `HttpOnly`, `SameSite=Lax`, path-scoped, and `Secure` in production.
- Room passwords accept exactly four digits and are stored with Argon2id.
- Join attempts are throttled per room and user.
- Mutating HTTP handlers enforce same-origin requests.
- Authentication, profile completion, participation, administrator role, and active-room state are checked server-side.
- Hidden vote values are removed from open and closed projections.
- Server-Sent Events carry only room-scoped invalidation events, never vote snapshots.
- Room state transitions lock the room row in one PostgreSQL transaction.
- Structured logs exclude magic codes, session tokens, passwords, hashes, emails, and hidden votes.

## Production Requirements

- Serve the app over HTTPS.
- Use a strong unique `AUTH_HASH_SECRET`.
- Use restricted PostgreSQL and SMTP credentials.
- Use a shared rate-limit and event backend when running multiple app instances.
- Configure reverse proxies to replace, not append, untrusted forwarding headers used for rate limiting.
- Review dependency audit findings before deployment.
