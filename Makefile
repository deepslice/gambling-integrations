ENV_FILE = .env
NODE_ENV = development

all:

.PHONY: build
build:

docker-start: docker-stop
	@ echo "Starting app in docker..."
	@ docker compose build --no-cache && docker compose up -d

docker-stop:
	@ echo "Stopping app..."
	@ docker compose down -v --remove-orphans # --rmi=all

migration:
	@ node scripts/migrate.js up
