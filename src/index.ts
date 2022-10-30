import { LogFunction, logJson, logLevels, LogLevel, setContext } from './log-json'
import { env } from './env'

export type Logger = Record<LogLevel, LogFunction>

const makeLogger = () => {
  if (env.NODE_ENV === 'test') return makeTestLogger()
  if (env.NODE_ENV === 'production' || env.AWS_LAMBDA_FUNCTION_NAME) return makeProdLogger()
  return makeDevLogger()
}

const makeProdLogger = () =>
  Object.fromEntries(logLevels.map((level) => [level, logJson(level)])) as Logger

const makeDevLogger = () =>
  Object.fromEntries(logLevels.map((level) => [level, console[level]])) as Logger

const makeTestLogger = () =>
  Object.fromEntries(logLevels.map((level) => [level, logNothing])) as Logger

const logNothing: LogFunction = () => {}

export const log: Logger = makeLogger()
export { setContext }
