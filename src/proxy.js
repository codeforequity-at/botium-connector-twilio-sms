const express = require('express')
const bodyParser = require('body-parser')
const Redis = require('ioredis')
const debug = require('debug')('botium-connector-twilio-sms-proxy')

const {
  EVENT_BOT_SAYS,
  getTopicInbound
} = require('./shared')

const setupEndpoints = ({ app, endpointBase, middleware, processInboundEvent }) => {
  if (!endpointBase) endpointBase = '/'
  else if (!endpointBase.endsWith('/')) endpointBase = endpointBase + '/'

  app.post(endpointBase + 'sms', ...(middleware || []), async (req, res) => {
    debug('Event received on \'sms\' webhook')
    processInboundEvent({
      type: EVENT_BOT_SAYS,
      ...req.body
    })
  })
}

const startProxy = async ({ port, endpointBase, processInboundEvent }) => {
  return new Promise((resolve, reject) => {
    const app = express()

    setupEndpoints({
      app,
      middleware: [
        bodyParser.json(),
        bodyParser.urlencoded({ extended: true })
      ],
      endpointBase: endpointBase || '/',
      processInboundEvent
    })

    const proxy = app.listen(port, () => {
      console.log(`Botium Twilio Inbound Messages proxy is listening on port ${port}`)
      console.log(`Botium Twilio Inbound Messages endpoint available at http://127.0.0.1:${port}${endpointBase}`)
      resolve({ proxy })
    })
  })
}

const buildRedisHandlers = async (redisurl, topicBase) => {
  const topicInbound = getTopicInbound(topicBase)

  const redisSubscriber = new Redis(redisurl)
  redisSubscriber.on('connect', () => {
    console.log(`Redis subscriber connected to ${JSON.stringify(redisurl || 'default')}`)
  })
  const redisClient = new Redis(redisurl)
  redisClient.on('connect', () => {
    console.log(`Redis client connected to ${JSON.stringify(redisurl || 'default')}`)
  })

  return {
    disconnect: async () => {
      redisSubscriber.disconnect()
      redisClient.disconnect()
    },
    processInboundEvent: async (event) => {
      try {
        redisClient.publish(topicInbound, JSON.stringify(event))
      } catch (err) {
        debug(`Error while publishing to redis: ${err.message}`)
      }
    }
  }
}

module.exports = {
  buildRedisHandlers,
  setupEndpoints,
  startProxy
}
