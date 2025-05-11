export const databaseConfig = {
  mysql: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'my_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    reconnectOptions: {
      maxAttempts: 5,       // Максимальное количество попыток переподключения
      delay: 3000,          // Задержка между попытками (мс)
      backoffFactor: 2,      // Множитель для экспоненциальной задержки
    },
  },
}
