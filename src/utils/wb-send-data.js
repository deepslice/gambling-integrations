import amqplib from 'amqplib'
import genericPool from 'generic-pool'
import {parseJSON} from './parse-json.js'
import {getCurrentDatetime} from './get-current-datetime.js'
import {wait} from './wait.js'
import {gzipJSON} from './compress.js'

const AMQP = parseJSON(process.env.WB_AMQP_CONFIG)

const factory = {
  async create() {
    console.log(getCurrentDatetime(), 'factory-create', JSON.stringify(AMQP))
    const connection = await amqplib.connect(AMQP)
    console.error(getCurrentDatetime(), 'factory-create', 'connected')

    const channel = await connection.createChannel()
    await channel.assertQueue(`sports-wagering-bonus`, {durable: true})

    return {
      connection, channel,
    }
  },
  async validate({connection, channel}) {
    console.error('factory.validate()', connection.isConnected(), channel.isOpen())
    return connection && channel && connection.isConnected() && channel.isOpen()
  },

  async destroy({connection, channel}) {
    await wait(500)

    await channel.close()
    await connection.close()
  },
}

const mqPool = genericPool.createPool(factory, {max: 10, min: 3})


export async function wbSendData(prefix, userId, roundId, wageringId) {
  const tm = Date.now()
  try {
    const payload = {action: 'check', prefix, userId, roundId, wageringId, tm}
    const buffer = await gzipJSON(payload)

    const config = await mqPool.acquire()

    try {
      const result = await Promise.race([
        config.channel.sendToQueue(`casino-wagering-bonus`, buffer),
        new Promise(resolve => setTimeout(resolve, 200, null)),
      ]).catch(err => console.error(getCurrentDatetime(), err))

      if (!result) {
        console.error(getCurrentDatetime(), 'data not sent', JSON.stringify(payload))
      } else {
        console.error(getCurrentDatetime(), 'data successfully sent', JSON.stringify(payload))
      }
    } catch (e) {
      console.error(getCurrentDatetime(), e)
    } finally {
      await mqPool.release(config)
    }
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }
}
