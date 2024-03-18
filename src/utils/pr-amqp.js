import amqplib from 'amqplib'
import genericPool from 'generic-pool'
import {parseJSON} from './parse-json.js'
import {getPrData} from './get-pr-data.js'
import {gzipJSON} from './compress.js'
import {wait} from './wait.js'
import {getCurrentDatetime} from './get-current-datetime.js'

const AMQP = parseJSON(process.env.PR_AMQP_CONFIG)


const factory = {
  async create() {
    const connection = await amqplib.connect(AMQP)
    const channel = await connection.createChannel()
    await channel.assertExchange(`pr-exchange`, `topic`, {durable: true})
    await channel.assertQueue(`security-fee`, {durable: true})

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

const mqPool = genericPool.createPool(factory, {max: 20, min: 5})

export async function prSendData(month, user, data) {
  const tm = Date.now()
  try {
    const {uuid, payload, buffer} = await getPrData('USER', month, user, data)

    const config = await mqPool.acquire()

    try {
      const result = await Promise.race([
        config.channel.publish(`pr-exchange`, uuid, buffer),
        new Promise(resolve => setTimeout(resolve, 200, null)),
      ]).catch(err => console.error(getCurrentDatetime(), err))

      if (!result) {
        console.error(getCurrentDatetime(), 'data not sent', JSON.stringify(payload))
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

export async function sfSendData(prefix, txId, code, amount, month) {
  const tm = Date.now()
  try {
    const payload = {action: 'ggr', prefix, txId, code, amount, month, tm}
    const buffer = await gzipJSON(payload)

    const config = await mqPool.acquire()

    try {
      const result = await Promise.race([
        config.channel.sendToQueue(`security-fee`, buffer),
        new Promise(resolve => setTimeout(resolve, 200, null)),
      ]).catch(err => console.error(getCurrentDatetime(), err))

      if (!result) {
        console.error(getCurrentDatetime(), 'data not sent', JSON.stringify(payload))
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
