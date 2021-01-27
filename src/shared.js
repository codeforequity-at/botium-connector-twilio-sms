// proxy -> connector events
module.exports.EVENT_BOT_SAYS = 'EVENT_BOT_SAYS'

module.exports.getTopicInbound = (topicBase) => `${topicBase || 'BOTIUM_TWILIO_IVR'}_INBOUND`
