const redis = {
  host: 'localhost',
  port: 6379,
  password: null,
  db: 0,
  reconnectOptions: {
    maxAttempts: 5,       // Максимальное количество попыток переподключения
    delay: 3000,          // Задержка между попытками (мс)
    backoffFactor: 2,     // Множитель для экспоненциальной задержки
    retryStrategy: (times) => {
      // Стандартная стратегия повторного подключения для Redis
      const delay = Math.min(times * 1000, 5000)
      return delay
    },
  },
  // Дополнительные опции для ioredis
  options: {
    connectTimeout: 10000,
    lazyConnect: true,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
  },
}

export default redis
