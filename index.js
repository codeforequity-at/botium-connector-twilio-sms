const fs = require('fs')
const path = require('path')
const PluginClass = require('./src/connector')

const logo = fs.readFileSync(path.join(__dirname, 'logo.png')).toString('base64')

module.exports = {
  PluginVersion: 1,
  PluginClass: PluginClass,
  PluginDesc: {
    name: 'Botium Connector for SMS Messaging (with Twilio)',
    avatar: logo,
    capabilities: [
      {
        name: 'TWILIO_SMS_ACCOUNT_SID',
        label: 'Twilio Account SID',
        description: 'Account SID from Twilio account',
        type: 'string',
        required: true
      },
      {
        name: 'TWILIO_SMS_AUTH_TOKEN',
        label: 'Twilio Auth Token',
        description: 'Auth Token from Twilio account',
        type: 'secret',
        required: true
      },
      {
        name: 'TWILIO_SMS_FROM',
        label: 'Caller Id',
        description: 'Purchased or Verified phone number from Twilio account',
        type: 'string',
        required: true
      },
      {
        name: 'TWILIO_SMS_TO',
        label: 'SMS Phone Number',
        description: 'Phone number to send message',
        type: 'string',
        required: true
      }
    ]
  }
}
