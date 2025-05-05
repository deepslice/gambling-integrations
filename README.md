# Aspect Monorepo

* Aspect Adapter
* Common Auth
* Common Config Observer/Provider
* Common Wallet

```bash
integration-monorepo/
├── __tests__/              # Тестовые сценарии
├── database/migrations/    # SQL миграции для базы данных
├── src/                   
│   ├── providers/          # Точка входа: экспортирует основную функцию сервиса
│   ├── config/             # Структуры передачи данных с валидацией
│   ├── wallet/             # Контроллеры API
│   ├── auth/               # Библиотека "чистых" функций
│   └── infrastructure/     # Бизнес-логика приложения
│
├── .env.test               # Переменные окружения для локального запуска
├── Dockerfile              # Инструкции для создания Docker-образа
├── docker-compose.yml      # Для запуска сервиса и окружения через docker-compose
├── package.json            # Метаинформация о проекте и зависимости
└── tsconfig.json           # Конфигурация TypeScript
```
