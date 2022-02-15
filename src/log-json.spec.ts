import mockConsole from 'jest-mock-console'
import { setContext } from '.'
import { logJson, normalizeArg, mergeArgs } from './log-json'

Date.now = () => 1234567890123
mockConsole(['info'])

describe('normalizeArg', () => {
  it('should use string argument as "msg" property', () => {
    expect(normalizeArg('message')).toEqual({ msg: 'message' })
  })

  it('should convert array argument to "msg" property', () => {
    const meta = normalizeArg([1, 2])
    expect(meta.msg).toEqual('1,2')
  })

  it('should convert number argument to "msg" property', () => {
    const meta = normalizeArg(1.2)
    expect(meta.msg).toEqual('1.2')
  })

  it('should convert boolean argument to "msg" property', () => {
    const meta = normalizeArg(false)
    expect(meta.msg).toEqual('false')
  })

  it('should extract Error information', () => {
    const meta = normalizeArg(Error('hullebulle'))
    expect(meta.msg).toEqual('hullebulle')
    expect(meta.stack).toMatch(/at .*.spec.ts/)
  })

  it('should pass objects unmodified', () => {
    const meta = normalizeArg({ duration: 123, data: 'some data', obj: { nested: 1 } })
    expect(meta).toEqual({ duration: 123, data: 'some data', obj: { nested: 1 } })
  })
})

describe('mergeArgs', () => {
  it('should merge multiple "msg" properties', () => {
    const merged = mergeArgs(['message', { msg: 'one' }, { msg: 'two' }])
    expect(merged.msg).toEqual('message one two')
  })

  it('should overwrite non "msg" properties from right to left', () => {
    const merged = mergeArgs([{ bla: 1 }, undefined, { bla: 2 }])
    expect(merged.bla).toEqual(2)
  })
})

describe('logJson', () => {
  afterEach(() => setContext({}))

  it('should add level and timestamp if not running on lambda', () => {
    logJson('info')('message')

    expect(console.info).toHaveBeenLastCalledWith(
      '{"time":1234567890123,"level":"info","msg":"message"}'
    )
  })

  it('should add context', () => {
    setContext({ app: 'someApp' })
    logJson('info')('message')

    expect(console.info).toHaveBeenLastCalledWith(
      '{"app":"someApp","time":1234567890123,"level":"info","msg":"message"}'
    )
  })
})
