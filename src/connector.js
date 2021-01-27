const Redis = require('ioredis')
const twilio = require('twilio')
const debug = require('debug')('botium-connector-twilio-sms-connector')

const {
  EVENT_BOT_SAYS,
  getTopicInbound
} = require('./shared')

const { startProxy } = require('./proxy')

const Capabilities = {
  TWILIO_SMS_ACCOUNT_SID: 'TWILIO_SMS_ACCOUNT_SID',
  TWILIO_SMS_AUTH_TOKEN: 'TWILIO_SMS_AUTH_TOKEN',
  TWILIO_SMS_FROM: 'TWILIO_SMS_FROM',
  TWILIO_SMS_TO: 'TWILIO_SMS_TO',
  TWILIO_SMS_REDISURL: 'TWILIO_SMS_REDISURL',
  TWILIO_SMS_REDIS_TOPICBASE: 'TWILIO_SMS_REDIS_TOPICBASE',
  TWILIO_SMS_INBOUNDPORT: 'TWILIO_SMS_INBOUNDPORT',
  TWILIO_SMS_INBOUNDENDPOINT: 'TWILIO_SMS_INBOUNDENDPOINT'
}

const RequiredCapabilities = [
  Capabilities.TWILIO_SMS_ACCOUNT_SID,
  Capabilities.TWILIO_SMS_AUTH_TOKEN,
  Capabilities.TWILIO_SMS_FROM,
  Capabilities.TWILIO_SMS_TO
]

class BotiumConnectorTwilioSms {
  constructor ({ container, queueBotSays, caps }) {
    this.container = container
    this.queueBotSays = queueBotSays
    this.caps = caps
    this.processingEvents = false
  }

  async Validate () {
    debug('Validate called')
    for (const capName of RequiredCapabilities) {
      if (!this.caps[capName]) throw new Error(`${capName} capability required`)
    }
  }

  async Build () {
    debug('Build called')
    this.client = twilio(this.caps[Capabilities.TWILIO_SMS_ACCOUNT_SID], this.caps[Capabilities.TWILIO_SMS_AUTH_TOKEN])
    this.from = this.caps[Capabilities.TWILIO_SMS_FROM]
    this.to = this.caps[Capabilities.TWILIO_SMS_TO]
    await this._buildInbound()
  }

  async Start () {
    await this._subscribeInbound()
  }

  async UserSays (msg) {
    debug('Sending outboundEvent EVENT_USER_SAYS')
    await this._processOutboundEvent({
      messageText: msg.messageText
    })
  }

  async Stop () {
    await this._unsubscribeInbound()
  }

  async Clean () {
    return this._cleanInbound()
  }

  async _processOutboundEvent ({ messageText }) {
    const opts = {
      body: messageText,
      from: this.from,
      to: this.to
    }
    return this.client.messages
      .create(opts)
      .then(message => debug(`Sending message. "${JSON.stringify(opts)}"`))
      .catch(err => {
        debug(`Failed to send message. Parameters may be incorrect: "${JSON.stringify(opts)}" Error: "${err}"`)
        throw err
      })
  }

  async _processInboundEvent ({ type, ...event }) {
    if (type === EVENT_BOT_SAYS) {
      // from and to in received message is inverted
      if (event.From === this.to && event.To === this.from) {
        debug(`Processing message ${JSON.stringify(event, null, 2)} `)
        const botSays = { sender: 'bot', sourceData: event, messageText: event.Body }
        this.queueBotSays(botSays)
      } else {
        // from and to in received message is inverted
        debug(`Ignoring message. Expected from-number ${this.to} to-number ${this.from}. ${JSON.stringify(event, null, 2)} `)
      }
    }
  }

  async _buildInbound () {
    if (this.caps[Capabilities.TWILIO_SMS_REDISURL]) {
      const redisurl = this.caps[Capabilities.TWILIO_SMS_REDISURL]
      this.redisSubscriber = new Redis(redisurl)
      this.redisSubscriber.on('connect', () => {
        debug(`Redis subscriber connected to ${JSON.stringify(redisurl || 'default')}`)
      })
      this.redisClient = new Redis(redisurl)
      this.redisClient.on('connect', () => {
        debug(`Redis client connected to ${JSON.stringify(redisurl || 'default')}`)
      })
      this.redisSubscriber.on('message', (channel, event) => {
        try {
          event = JSON.parse(event)
        } catch (err) {
          return debug(`WARNING: received non-json message from ${channel}, ignoring: ${event}`)
        }
        if (this.processingEvents) {
          this._processInboundEvent(event)
            .catch((err) => debug(`Processing Inbound Event failed: ${err.message} - ${JSON.stringify(event)}`))
        }
      })
    } else if (this.caps[Capabilities.TWILIO_SMS_INBOUNDPORT]) {
      const { proxy } = await startProxy({
        port: this.caps[Capabilities.TWILIO_SMS_INBOUNDPORT],
        endpointBase: this.caps[Capabilities.TWILIO_SMS_INBOUNDENDPOINT],
        processInboundEvent: (event) => {
          if (this.processingEvents) {
            this._processInboundEvent(event)
              .catch((err) => debug(`Processing Inbound Event failed: ${err.message} - ${JSON.stringify(event)}`))
          }
        }
      })
      this.proxy = proxy
    } else {
      throw new Error('No inbound channel configured (either HTTP inbound or redis')
    }
  }

  async _subscribeInbound () {
    this.processingEvents = true
    if (this.redisSubscriber) {
      const topicInbound = getTopicInbound(this.caps[Capabilities.TWILIO_SMS_REDIS_TOPICBASE])
      try {
        const count = await this.redisSubscriber.subscribe(topicInbound)
        debug(`Redis subscribed to ${count} channels. Listening for inbound messages on the ${topicInbound} channel.`)
      } catch (err) {
        debug(err)
        throw new Error(`Redis failed to subscribe channel ${topicInbound}: ${err.message || err}`)
      }
    }
  }

  async _unsubscribeInbound () {
    this.processingEvents = false
    if (this.redisSubscriber) {
      const topicInbound = getTopicInbound(this.caps[Capabilities.TWILIO_SMS_REDIS_TOPICBASE])
      try {
        await this.redisSubscriber.unsubscribe(topicInbound)
        debug(`Redis unsubscribed from ${topicInbound} channel.`)
      } catch (err) {
        debug(err)
        throw new Error(`Redis failed to unsubscribe channel ${topicInbound}: ${err.message || err}`)
      }
    }
  }

  async _cleanInbound () {
    if (this.redisSubscriber) {
      this.redisSubscriber.disconnect()
      this.redisSubscriber = null
    }
    if (this.redisClient) {
      this.redisClient.disconnect()
      this.redisClient = null
    }
    if (this.proxy) {
      this.proxy.close()
      this.proxy = null
    }
  }
}

module.exports = BotiumConnectorTwilioSms
