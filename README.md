# Botium Connector for Twilio SMS

[![NPM](https://nodei.co/npm/botium-connector-twilio-sms.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-connector-twilio-sms/)

[![Codeship Status for codeforequity-at/botium-connector-twilio-sms](https://app.codeship.com/projects/4500048a-b36f-4108-98ee-6fbf668e4286/status?branch=master)](https://app.codeship.com/projects/428350)
[![npm version](https://badge.fury.io/js/botium-connector-twilio-sms.svg)](https://badge.fury.io/js/botium-connector-twilio-sms)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

This is a [Botium](https://github.com/codeforequity-at/botium-core) connector for testing SMS
bots.

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

## How it works
Connector using [Programmable SMS](https://www.twilio.com/docs/sms) of [Twilio](https://www.twilio.com/) 
to send and receive SMS messages in order to test any SMS bot.

The Connector can be used as any other Botium connector with all Botium Stack components:
* [Botium CLI](https://github.com/codeforequity-at/botium-cli/)
* [Botium Bindings](https://github.com/codeforequity-at/botium-bindings/)
* [Botium Box](https://www.botium.at)

To receive messages from Twilio API a public endpoint is required. 
* This endpoint has to be configured depending on usage:
  * If used from [Botium Box](https://www.botium.at), its provided automatical. Redis is required for communication between Connector and Box.
  * Connector can be started with integrated endpoint (see TWILIO_SMS_INBOUNDPORT and TWILIO_SMS_INBOUNDENDPOINT capabilities)
  * Endpoint is provided by the Botium Twilio Webhook Proxy included in this module. Redis is required for communication between Connector and Box.
* This endpoint has to be public:
  * If used from [Botium Box](https://www.botium.at), then no addititional steps are required.
  * If the server is not public, then the easiest way to use Twilio cli (which uses ngrok internally) to make it public: ```twilio phone-numbers:update "<<TELEPHONE NUMBER TO LISTEN>>" --sms-url="http://localhost:<<PORT FROM PROXY OR CONNECTOR>>/sms"```
  * If you use Botium Twilio Webhook Proxy, then it displays the complete command for Twilio cli
* This endpoint has to be registered in Twilio:
  * If you use Twilio cli to make endpoint public, then it registers the endpoint.
  * You can use Twilio cli just for registering ```twilio phone-numbers:update [PN sid or E.164] --sms-url http://url``` ([see more](https://www.twilio.com/docs/twilio-cli/general-usage#webhooks)) 
  * [Or you can use Twilio console to do it](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js#configure-your-webhook-url)
  
Twilio API is not free, see pricing [here](https://www.twilio.com/voice/pricing).

## Prerequisites

* __Node.js and NPM__
* (optional) a __Redis__ instance (Cloud hosted free tier for example from [redislabs](https://redislabs.com/) will do as a starter)
* __Twilio Account__ (See trial account limitation of Twilio [here](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account#trial-account-restrictions-and-limitations)) 
    * [Note accountSid and authToken](https://www.twilio.com/docs/voice/quickstart/node#replace-the-placeholder-credential-values) 
* __[Purchased](https://www.twilio.com/docs/voice/quickstart/node#sign-up-for-twilio-and-get-a-phone-number), or [verified](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account#verify-your-personal-phone-number) Twilio phone number with SMS capabilities enabled__ 
* A __project directory__ on your workstation to hold test cases and Botium configuration    

## Install Botium and Twilio SMS Connector

When using __Botium CLI__:

```
> npm install -g botium-cli
> npm install -g botium-connector-twilio-sms
> botium-cli init
> botium-cli run
```

When using __Botium Bindings__:

```
> npm install -g botium-bindings
> npm install -g botium-connector-twilio-sms
> botium-bindings init mocha
> npm install && npm run mocha
```

When using __Botium Box__:

_Already integrated into Botium Box, no setup required_

## Install and Run the Botium Twilio Webhook Proxy

Proxy has two goals:
* Provides endpoint for Twilio to receive incoming messages
* Sends messages to Connector using Redis.

Installation with NPM:

    > npm install -g botium-connector-twilio-sms
    > botium-twilio-sms-proxy-cli start --help

There are several options required for running the Botium webhook service:

_--port_: Local port to listen (optional, default _5002_)

_--redisurl_: Redis connection url (optional, default _redis://localhost:6379_) 

## Connecting Twilio to Botium

Open the file _botium.json_ in your working directory fill it. See Supported Capabilities. 

Connect the Connector to the Proxy using Redis:
```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "<whatever>",
      "CONTAINERMODE": "twilio-sms",
      "TWILIO_SMS_ACCOUNT_SID": "...",
      "TWILIO_SMS_AUTH_TOKEN": "...",
      "TWILIO_SMS_FROM": "...",
      "TWILIO_SMS_TO": "...",
      "TWILIO_SMS_REDISURL" : "..."
    }
  }
}
```
Or start a standalone connector with own endpoint:
```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "<whatever>",
      "CONTAINERMODE": "twilio-sms",
      "TWILIO_SMS_ACCOUNT_SID": "...",
      "TWILIO_SMS_AUTH_TOKEN": "...",
      "TWILIO_SMS_FROM": "...",
      "TWILIO_SMS_TO": "...",
      "TWILIO_SMS_INBOUNDPORT": "..."
    }
  }
}
```

Botium setup is ready, you can begin to write your [BotiumScript](https://github.com/codeforequity-at/botium-core/wiki/Botium-Scripting) files.

## Supported Capabilities

Set the capability __CONTAINERMODE__ to __twilio-sms__ to activate this connector.

### TWILIO_SMS_ACCOUNT_SID

See accountSid in Prerequisites

### TWILIO_SMS_AUTH_TOKEN

See authToken in Prerequisites

### TWILIO_SMS_FROM

[Purchased](https://www.twilio.com/docs/voice/quickstart/node#sign-up-for-twilio-and-get-a-phone-number), or [verified](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account#verify-your-personal-phone-number) phone number  

### TWILIO_SMS_TO

Telephone number.

### TWILIO_SMS_INBOUNDPORT and TWILIO_SMS_INBOUNDENDPOINT
_only required when **NOT** using the Botium Twilio Webhook Proxy_

Local port and endpoint to be used for launching the webhook

The default of `TWILIO_SMS_INBOUNDENDPOINT` is `"\"`

### TWILIO_SMS_REDISURL and TWILIO_SMS_REDIS_TOPICBASE
_only required when using the Botium Twilio Webhook Proxy_

Redis Url and base topic name for Redis subscription topic.

The default url for local redis is _redis://localhost:6379_

`TWILIO_SMS_INBOUNDENDPOINT` is optional.
