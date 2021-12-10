const fs = require('fs')
const path = require('path')
const PluginClass = require('./src/connector')

const logo = fs.readFileSync(path.join(__dirname, 'logo.png')).toString('base64')

module.exports = {
  PluginVersion: 1,
  PluginClass: PluginClass,
  PluginDesc: {
    name: 'Botium Connector for SMS Messaging (with Twilio)',
    avatar: logo
  }
}
