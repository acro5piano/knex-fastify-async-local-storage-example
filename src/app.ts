import Fastify from 'fastify'
import { nanoid } from 'nanoid'
import { logger } from './logger'
import { executionContext } from './executionContext'
import { db } from './db'

export const app = Fastify({
  logger,
  genReqId: () => nanoid(),
})

app.addHook('preHandler', (_, __, next) => {
  executionContext.run(new Map(), next)
})

app.addHook('preHandler', (request, _, next) => {
  executionContext.getStore()?.set('reqId', request.id)
  next()
})

app.addHook('onReady', async () => {
  await db.schema.createTable('logs', (t) => {
    t.bigIncrements()
    t.string('message').notNullable()
    t.string('req_id').notNullable()
    t.timestamp('created_at').notNullable().defaultTo(db.fn.now())
  })
})

app.get('/', async (_, reply) => {
  await db('logs').insert({
    message: 'incoming request',
    req_id: executionContext.getStore()!.get('reqId'),
  })
  reply.send('ok')
})

app.addHook('onSend', async () => {
  logger.info(
    await db('logs').orderBy('created_at', 'desc').limit(5),
    'latest 5 request logs',
  )
})
