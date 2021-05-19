import createKnex from 'knex'
import { logger } from './logger'

export const db = createKnex({
  client: 'sqlite3',
  connection: ':memory:',
  useNullAsDefault: false,
})

db.on('query', ({ sql, bindings }) => {
  logger.info({ sql, bindings }, 'SQL')
})
