import { normalizeArg, mergeArgs } from './log-json'

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
