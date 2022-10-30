import { env } from './env'

export type LogFunction = (msg: unknown, ...optional: unknown[]) => void
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export function logJson(level: LogLevel): LogFunction {
  return (...args: unknown[]) => {
    console[level](JSON.stringify({ ...context(), ...lambda(level), ...mergeArgs(args) }))
  }
}

export function mergeArgs(args: any[]): NormalizedArg {
  const normalized = args.map(normalizeArg)
  const msg = normalized
    .map((i) => i.msg?.trim())
    .filter(Boolean)
    .join(' ')
  return { ...normalized.reduce((a, arg) => Object.assign(a, arg), {}), msg }
}

export type NormalizedArg = {
  msg?: string
  stack?: string
} & Record<string | number | symbol, unknown>

export function normalizeArg(arg: unknown): NormalizedArg {
  if (arg instanceof Error) {
    return { msg: arg.message, ...(arg.stack && { stack: arg.stack }) }
  } else if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
    // We could verify more, e.g. that keys should not be numbers or symbols
    // But that has an impact on runtime and is better done during ingestion.
    // If it is an error it should be detected through application tests.
    return arg as NormalizedArg
  } else {
    return { msg: `${arg}` }
  }
}

const lambda = env.AWS_LAMBDA_FUNCTION_NAME
  ? () => ({}) // we can omit the level and time when running inside AWS_LAMBDA function
  : (level: LogLevel) => ({ time: Date.now(), level })

let context = () => ({})
export type Context = Record<string, unknown>
/**
 * set the properties that should be added to each log entry
 * @param context : an object or a function returning an object with properties that are added to each log document
 */
export function setContext(newContext: Context | (() => Context)) {
  if (typeof newContext === 'function') {
    context = () => {
      try {
        return newContext()
      } catch {
        return {}
      }
    }
  } else if (typeof newContext === 'object') {
    context = () => newContext
  }
}
