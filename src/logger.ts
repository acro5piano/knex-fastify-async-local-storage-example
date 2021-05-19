import pino from 'pino'
import { executionContext } from './executionContext'

export const logger = pino({
  prettyPrint: true,
  mixin() {
    return {
      reqId: executionContext.getStore()?.get('reqId'),
    }
  },
})
