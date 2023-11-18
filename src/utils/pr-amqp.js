import {parseJSON} from './parseJSON.js'
import {getPrData} from './get-pr-data.js'
import amqplib from 'amqplib'
import {getCurrentDatetime} from './get-current-datetime.js'

const AMQP = parseJSON(process.env.PR_AMQP_CONFIG)

const config = {
  connection: null,
  channel: null,
}

export async function prSendData(month, user, data) {
  try {
    const {uuid, payload, buffer} = await getPrData('USER', month, user, data)

    if (!config.connection) {
      config.connection = await amqplib.connect(AMQP)
    }
    if (!config.channel) {
      config.channel = await config.connection.createChannel()
    }

    await config.channel.assertExchange(`pr-exchange`, `topic`, {durable: true})

    const result = await Promise.race([
      config.channel.publish(`pr-exchange`, uuid, buffer),
      new Promise(resolve => setTimeout(resolve, 1000, null)),
    ]).catch(err => console.error(getCurrentDatetime(), err))

    console.error('RESULT Log: ', result)

    if (!result) {
      console.error(getCurrentDatetime(), 'data not sent', JSON.stringify(payload))
    }
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }
}
