#!/bin/bash

PKG_DIR=./node_modules
DB_TEST_DATA=./testdata/db/migrations

docker compose down mysql redis
docker compose up -d mysql redis
sleep 60s

# Миграция схем и таблиц
node $PKG_DIR/@testing/migration up --dir $DB_TEST_DATA/0001-privileges
node $PKG_DIR/@testing/migration up --dir $DB_TEST_DATA/0002-databases
node $PKG_DIR/@testing/migration up --dir $DB_TEST_DATA/0003-schemas/0001-global
node $PKG_DIR/@testing/migration up --dir $DB_TEST_DATA/0003-schemas/0002-casino
node $PKG_DIR/@testing/migration up --dir $DB_TEST_DATA/0003-schemas/0003-local

# Генерация тестовых данных
node $PKG_DIR/@testing/foodb bake
