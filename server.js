'use strict'

const Querystring = require('querystring')
const App = require('@supercharge/framework/application')

module.exports.handler = async event => {
  const app = await new App().fromAppRoot(__dirname).httpForLambda()

  const { server } = app
  const querystring = Querystring.stringify(event.multiValueQueryStringParameters)

  const { statusCode, rawPayload, headers } = await server.inject({
    method: event.httpMethod,
    url: querystring ? `${event.path}?${querystring}` : event.path,
    payload: event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body,
    headers: Object.entries(event.multiValueHeaders || {})
      .reduce((collect, [name, value]) => ({
        ...collect,
        [name]: (value.length === 1) ? value[0] : value
      }), {})
  })

  // chunked transfer not currently supported by API Gateway
  if (headers['transfer-encoding'] === 'chunked') {
    delete headers['transfer-encoding']
  }

  const { 'content-type': type, 'content-encoding': encoding } = headers
  const isBase64Encoded = Boolean(type && !type.match(/; *charset=/)) || Boolean(encoding && encoding !== 'identity')

  const finalHeaders = Object
    .entries(headers)
    .reduce((collect, [name, value]) => ({
      ...collect,
      [name]: [].concat(value)
    }), {})

  return {
    statusCode,
    isBase64Encoded,
    body: rawPayload.toString(isBase64Encoded ? 'base64' : 'utf8'),
    multiValueHeaders: finalHeaders
  }
}
