#!/usr/bin/env node
const util = require('util')
const fs = require('fs')
const _ = require('lodash')
const yargsCmd = require('yargs')
const { buildRedisHandlers, startProxy } = require('../src/proxy')

const debug = require('debug')('botium-twilio-sms-proxy-cli')

try {
  const caps = JSON.parse(fs.readFileSync('./botium.json')).botium.Capabilities
  for (const [key, value] of Object.entries(caps)) {
    const envKey = `BOTIUM_${key}`
    if (key.startsWith('TWILIO_SMS') && _.isNil(process.env[envKey])) {
      process.env[envKey] = value
    }
  }
  console.log('botium.json detected')
} catch (ex) {
  console.log(ex)
}

const wrapHandler = (builder) => {
  const origHandler = builder.handler
  builder.handler = (argv) => {
    if (argv.verbose) {
      require('debug').enable('botium*')
    }
    debug(`command options: ${util.inspect(argv)}`)
    origHandler(argv)
  }
  return builder
}

yargsCmd.usage('Botium Twilio SMS Proxy\n\nUsage: $0 [options]') // eslint-disable-line
  .help('help').alias('help', 'h')
  .version('version', require('../package.json').version).alias('version', 'V')
  .showHelpOnFail(true)
  .strict(true)
  .demandCommand(1, 'You need at least one command before moving on')
  .command(wrapHandler({
    command: 'start',
    describe: 'Launch Botium Twilio SMS Proxy',
    builder: (yargs) => {
      yargs
        .option('port', {
          describe: 'Local port the proxy is listening to (also read from env variable "BOTIUM_TWILIO_SMS_INBOUNDPORT")',
          number: true,
          default: process.env.BOTIUM_TWILIO_SMS_INBOUNDPORT || 5002
        })
        .option('redisurl', {
          describe: 'Redis connection url, ex "redis://localhost:6379" (also read from env variable "BOTIUM_TWILIO_SMS_REDISURL")',
          default: process.env.BOTIUM_TWILIO_SMS_REDISURL || 'redis://localhost:6379'
        })
    },
    handler: async (argv) => {
      const { sessionStore, processInboundEvent } = await buildRedisHandlers(argv.redisurl)
      await startProxy({
        port: argv.inboundport,
        endpointBase: '/',
        processInboundEvent,
        sessionStore
      })
      // wait for redis connection succesful message
      setTimeout(() => {
        console.log('\nConnect proxy to Twilio with Twilio CLI (Optional):')
        console.log(`twilio phone-numbers:update "${process.env.BOTIUM_TWILIO_SMS_FROM || process.env.TWILIO_SMS_FROM || '+<TWILIO-TELEPHONE-NUMBER>'}" --sms-url="http://localhost:${argv.inboundport}/sms"`)
      }, 500)
    }
  }))
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    describe: 'Enable verbose output (also read from env variable "BOTIUM_TWILIO_SMS_VERBOSE" - "1" means verbose)',
    default: process.env.BOTIUM_TWILIO_SMS_REDISURL || 'redis://localhost:6379'
  })
  .argv
