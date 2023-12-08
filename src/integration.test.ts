import { spawn } from 'child_process'

async function execNodeScript(
  script: string,
  env: Record<string, string> = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    const childProcess = spawn('node', [], {
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
   const { log } = require('.')
   Date.now = () => 123456789
   log.debug('a debug message')
   log.info('an info message', { meta: 1 })
   log.warn('Warning message:', Error('error'))
   log.error('Error message:', Error('error'), { meta: 2 })
  `

  describe('with NODE_ENV=test', () => {
    it('should log only debug messages', async () => {
      const { stdout, stderr, exitCode } = await execNodeScript(script, { NODE_ENV: 'test' })

      expect(stderr).toEqual('')
      expect(stdout).toEqual('')
      expect(exitCode).toEqual(0)
    })
  })

  describe('with NODE_ENV=production', () => {
    it('should output json lines', async () => {
      const { stdout, stderr, exitCode } = await execNodeScript(script, { NODE_ENV: 'production' })

      const lines = stdout.split('\n')
      expect(lines[0]).toEqual('{"time":123456789,"level":"debug","msg":"a debug message"}')
      expect(lines[1]).toEqual('{"time":123456789,"level":"info","msg":"an info message","meta":1}')

      const stderrLines = stderr.split('\n').map((l) => l && JSON.parse(l))
      expect(stderrLines[0]).toMatchObject({ level: 'warn', msg: 'Warning message: error' })
      expect(stderrLines[0].stack).toMatch(/^Error: error/)
      expect(stderrLines[1]).toMatchObject({ level: 'error', msg: 'Error message: error', meta: 2 })
      expect(stderrLines[1].stack).toMatch(/^Error: error/)

      expect(exitCode).toEqual(0)
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

  describe('with AWS_LAMBDA_FUNCTION_NAME defined', () => {
    it('should not add time and level', async () => {
      const script = `
      const { log } = require('.')
      Date.now = () => 123456789
      log.info('message')`

      const { stdout, stderr, exitCode } = await execNodeScript(script, {
        NODE_ENV: 'production',
        AWS_LAMBDA_FUNCTION_NAME: 'someName',
      })

      expect(stderr).toEqual('')
      expect(stdout.trim()).toEqual('{"msg":"message"}')
      expect(exitCode).toEqual(0)
    })
  })
})
