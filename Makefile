.PHONY: dev infra migrate generate studio logs down reset test

dev:
	docker compose up -d postgres mailpit
	docker compose run --rm app npm run db:migrate
	docker compose up --build app

infra:
	docker compose up -d postgres mailpit

migrate:
	docker compose run --rm app npm run db:migrate

generate:
	docker compose run --rm app npm run db:generate

studio:
	docker compose run --rm --service-ports app npm run db:studio -- --host 0.0.0.0

logs:
	docker compose logs -f

down:
	docker compose down

reset:
	docker compose down -v

test:
	docker compose run --rm app npm test
