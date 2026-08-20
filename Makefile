.PHONY: help up infra migrate generate validate studio logs down reset build lint typecheck test test-e2e

help:
	@echo "up        sobe Postgres e a aplicação em containers"
	@echo "infra     sobe apenas o Postgres (para rodar a app no host)"
	@echo "migrate   aplica as migrations versionadas"
	@echo "test      testes unitários e de integração"
	@echo "test-e2e  Playwright; exige o reinas-id de pé (repositório separado)"
	@echo "down      derruba os containers | reset apaga também o volume"

up:
	docker compose up -d postgres
	docker compose run --rm app npm run db:migrate
	docker compose up --build app

infra:
	docker compose up -d postgres

migrate:
	npm run db:migrate

generate:
	npm run db:generate

validate:
	npm run db:validate

studio:
	npm run db:studio

logs:
	docker compose logs -f

down:
	docker compose down

reset:
	docker compose down -v

build:
	npm run build

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm test

test-e2e:
	npm run test:e2e
