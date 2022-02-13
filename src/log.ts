import { mergeArgs } from './normalize'

const isProd = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

export type LogFunction = (msg: unknown, ...optional: unknown[]) => void

export type Logger = {
  debug: LogFunction
  info: LogFunction
  warn: LogFunction
  error: LogFunction
}

function logJson(level: string) {
  return (...args: any[]) => {
    console.log(JSON.stringify({ level, ...mergeArgs(args) }))
  }
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
  debug: console.debug,
  info: logNothing,
  warn: logNothing,
  error: logNothing,
}

export const log: Logger = isTest ? testLogger : isProd ? prodLogger : devLogger
