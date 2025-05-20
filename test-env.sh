#!/bin/bash

docker rm -f $(docker ps -a -q)
docker compose up -d mysql redis
sleep 60s

# Миграция схем и таблиц
node node_modules/migration/index.js up --dir ./testdata/db/migrations/0001-privileges
node node_modules/migration/index.js up --dir ./testdata/db/migrations/0002-databases
node node_modules/migration/index.js up --dir ./testdata/db/migrations/0003-schemas/0001-global
node node_modules/migration/index.js up --dir ./testdata/db/migrations/0003-schemas/0002-casino
node node_modules/migration/index.js up --dir ./testdata/db/migrations/0003-schemas/0003-local

# Генерация тестовых данных
node node_modules/foodb/index.js bake
