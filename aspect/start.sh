#!/bin/bash

set -e

HOST=${DB_HOST:-mysql}
PORT=${DB_PORT:-3306}

echo "⏳ Ожидание запуска MySQL на ${HOST}:${PORT}..."

# Функция проверки порта через /dev/tcp
wait_for_mysql() {
  while ! (echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1; do
    echo "❌ MySQL недоступен, жду 2 секунды..."
    sleep 2
  done
}

wait_for_mysql
echo "✅ MySQL готов!"

# Запускаем миграции
echo "🚀 Запуск миграций..."
npm run migrate up

# Запуск основного сервиса
echo "🚀 Запуск приложения..."
npm run start
