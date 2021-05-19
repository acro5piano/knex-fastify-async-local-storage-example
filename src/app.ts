import Fastify from 'fastify'
import { nanoid } from 'nanoid'
import { logger } from './logger'
import { executionContext } from './executionContext'
import { db } from './db'

export const app = Fastify({
  logger,
  genReqId: () => nanoid(),
  disableRequestLogging: true, // we do it on our own
})

// Add hook to run all operations on the request context
app.addHook('preHandler', (_, __, next) => {
  executionContext.run(new Map(), next)
})

// Set request ID to the context
app.addHook('preHandler', (request, _, next) => {
  executionContext.getStore()?.set('reqId', request.id)
  next()
})

// Log request
app.addHook('preHandler', (request, _, next) => {
  const { method, url, ip } = request
  logger.info({ method, url, ip }, 'incoming request')
  next()
})

// Create a database table for logging (just example)
app.addHook('onReady', async () => {
  await db.schema.createTable('logs', (t) => {
    t.bigIncrements()
    t.string('message').notNullable()
    t.string('req_id').notNullable()
    t.timestamp('created_at').notNullable().defaultTo(db.fn.now())
  })
})

// Main routing
app.get('/', async (_, reply) => {
  await db('logs').insert({
    message: 'incoming request',
    req_id: executionContext.getStore()!.get('reqId'),
  })
  reply.send('ok')
})

// Main routing
app.addHook('onSend', async (_, reply) => {
  logger.info(
    await db('logs').orderBy('created_at', 'desc').limit(5),
    'latest 5 request logs',
  )
  const { statusCode } = reply
  const responseTime = reply.getResponseTime()
  logger.info({ responseTime, res: { statusCode } }, 'request completed')
})
