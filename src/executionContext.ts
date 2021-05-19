import { AsyncLocalStorage } from 'async_hooks'

type ContextKey = 'reqId'

export const executionContext = new AsyncLocalStorage<Map<ContextKey, string>>()
