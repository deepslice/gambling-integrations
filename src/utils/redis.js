import {createClient} from 'redis'

const client = createClient()

export async function getRedisClient() {
  if (!client.isOpen) {
    await client.connect()
  }
  return client
}


