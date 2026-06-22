# Security review

## Controls verified for the MVP

- Email requests always return the same neutral response; IP throttling and the persisted 60-second email cooldown reduce enumeration and abuse.
- Magic codes are random six-digit values, HMAC-hashed with the normalized email, expire after ten minutes, allow five attempts, and are consumed under a row lock.
- Session tokens are 32 random bytes. Only their HMAC is stored; cookies are `HttpOnly`, `SameSite=Lax`, path-scoped, and `Secure` in production.
- Room passwords accept exactly four digits and are stored with Argon2id. Join attempts are throttled per room and user.
- Mutating HTTP handlers enforce same-origin requests. Authentication, profile completion, participation, administrator role, and active-room state are checked server-side.
- Vote values are removed from open/closed projections. SSE carries only room-scoped invalidation event names and never vote snapshots.
- Room state transitions lock the room row in one PostgreSQL transaction, preventing vote/reveal/restart/advance races.
- Structured logs contain operation, error class/code, status, and timestamps only. Codes, session tokens, passwords, hashes, emails, and hidden votes are excluded.

## Operational assumptions

- Production must use HTTPS, a strong unique `AUTH_HASH_SECRET`, a shared rate-limit/event backend when running multiple instances, and restricted PostgreSQL/Mail credentials.
- Reverse proxies must replace, rather than append untrusted, forwarding headers used for rate limiting.
- Dependency audit findings are reviewed before deployment; breaking automatic upgrades are not applied without tests.
