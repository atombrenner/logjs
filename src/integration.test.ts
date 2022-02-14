import { spawn } from 'child_process'

async function execNodeScript(
  script: string,
  env: Record<string, string> = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    const childProcess = spawn('npx', ['ts-node', '-T'], {
      env: { ...process.env, ...env },
    })
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    childProcess.on('close', () =>
      resolve({ stdout, stderr, exitCode: childProcess.exitCode || 0 })
    )
    childProcess.stdin.write(script)
    childProcess.stdin.end()
  })
}

describe('log', () => {
  const script = `
   import { log } from './src'
   log.debug('a debug message')
   log.info('an info message', { meta: 1 })
   log.warn('Warning message:', Error('error'))
   log.error('Error message:', Error('error'), { meta: 2 })
  `

  describe('with NODE_ENV=test', () => {
    it('should log only debug messages', async () => {
      const { stdout, stderr, exitCode } = await execNodeScript(script, { NODE_ENV: 'test' })

      expect(exitCode).toEqual(0)
      expect(stderr).toEqual('')
      expect(stdout).toEqual('')
    })
  })

  describe('with NODE_ENV=production', () => {
    it('should output json lines', async () => {
      const { stdout, stderr, exitCode } = await execNodeScript(script, { NODE_ENV: 'production' })

      expect(exitCode).toEqual(0)
      expect(stderr).toEqual('')

      const lines = stdout.split('\n')
      expect(lines[0]).toEqual('{"level":"debug","msg":"a debug message"}')
      expect(lines[1]).toEqual('{"level":"info","msg":"an info message","meta":1}')

      const line2 = JSON.parse(lines[2])
      expect(line2).toMatchObject({ level: 'warn', msg: 'Warning message: error' })
      expect(line2.stack).toMatch(/^Error: error/)

      const line3 = JSON.parse(lines[3])
      expect(line3).toMatchObject({ level: 'error', msg: 'Error message: error', meta: 2 })
      expect(line3.stack).toMatch(/^Error: error/)
    })
  })

  describe('with NODE_ENV=', () => {
    it('should use console.log ', async () => {
      const { stdout, stderr, exitCode } = await execNodeScript(script, { NODE_ENV: '' })

      expect(exitCode).toEqual(0)
      expect(stderr).toMatch(
        /Warning message: Error: error.*at .*Error message: Error: error.*at /s
      )
      expect(stdout).toEqual('a debug message\nan info message { meta: 1 }\n')
    })
  })
})
