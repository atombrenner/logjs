import { LogFunction, logJson, setContext } from './log-json'
import { env } from './env'

const isProd = env.NODE_ENV === 'production' || env.AWS_LAMBDA_FUNCTION_NAME
const isTest = env.NODE_ENV === 'test'

export { setContext }

export type Logger = {
  debug: LogFunction
  info: LogFunction
  warn: LogFunction
  error: LogFunction
}

function logNothing() {}

const devLogger: Logger = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

const prodLogger: Logger = {
  debug: logJson('debug'),
  info: logJson('info'),
  warn: logJson('warn'),
  error: logJson('error'),
}

const testLogger: Logger = {
  debug: logNothing,
  info: logNothing,
  warn: logNothing,
  error: logNothing,
}

export const log: Logger = isTest ? testLogger : isProd ? prodLogger : devLogger
