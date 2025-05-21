import connection from './connection.js'

class RedisClient {
  constructor() {
    this.initialized = false
    this.init()
  }

  init() {
    // TODO: Refactor it
    connection.connect()
    connection.onConnect(() => {
      this.initialized = true
      console.log('Redis client ready')
    })
  }

  // Key-value операции
  async set(key, value, ttl = null) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    if (ttl) {
      return await connection.client.setex(key, ttl, valueStr)
    } else {
      return await connection.client.set(key, valueStr)
    }
  }

  async get(key) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const value = await connection.client.get(key)
    return connection.tryParseJson(value)
  }

  async del(key) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    return await connection.client.del(key)
  }

  async exists(key) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    return (await connection.client.exists(key)) === 1
  }

  async expire(key, seconds) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    return await connection.client.expire(key, seconds)
  }

  // Hash операции
  async hset(key, field, value) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
    return await connection.client.hset(key, field, valueStr)
  }

  async hget(key, field) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const value = await connection.client.hget(key, field)
    return connection.tryParseJson(value)
  }

  async hgetall(key) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const result = await connection.client.hgetall(key)
    const parsedResult = {}

    for (const [field, value] of Object.entries(result)) {
      parsedResult[field] = connection.tryParseJson(value)
    }

    return parsedResult
  }

  // List операции
  async lpush(key, value) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
    return await connection.client.lpush(key, valueStr)
  }

  async rpop(key) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const value = await connection.client.rpop(key)
    return connection.tryParseJson(value)
  }

  async lrange(key, start = 0, stop = -1) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const list = await connection.client.lrange(key, start, stop)
    return list.map(item => connection.tryParseJson(item))
  }

  // Set операции
  async sadd(key, member) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const memberStr = typeof member === 'string' ? member : JSON.stringify(member)
    return await connection.client.sadd(key, memberStr)
  }

  async smembers(key) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const set = await connection.client.smembers(key)
    return set.map(item => connection.tryParseJson(item))
  }

  // Pub/Sub
  subscribe(channel, callback) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    return connection.subscribe(channel, callback)
  }

  publish(channel, message) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    return connection.publish(channel, message)
  }

  // Pipeline
  async pipeline(commands) {
    if (!this.initialized) {
      throw new Error('Redis client not initialized yet')
    }

    const pipeline = connection.client.pipeline()

    commands.forEach(([command, ...args]) => {
      pipeline[command](...args)
    })

    const results = await pipeline.exec()
    return results.map(([err, result]) => {
      if (err) throw err
      return result
    })
  }
}

export default new RedisClient()
