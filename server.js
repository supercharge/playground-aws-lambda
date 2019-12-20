'use strict'

const App = require('@supercharge/framework/application')
const HapiOnLambda = require('@supercharge/hapi-aws-lambda')

let handler

module.exports.handler = async event => {
  if (!handler) {
    const { server } = await App.fromAppRoot(__dirname).httpForServerless()
    handler = HapiOnLambda.for(server)
  }

  return handler.proxy(event)
}
