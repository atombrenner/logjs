export type LogFunction = (msg: unknown, ...optional: unknown[]) => void

export function logJson(level: string): LogFunction {
  return (...args: unknown[]) => {
    console.log(JSON.stringify({ level, ...mergeArgs(args) }))
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
