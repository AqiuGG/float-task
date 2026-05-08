/**
 * 等待 Vite 开发服务器就绪后启动 Electron
 */
const { spawn } = require('child_process')
const http = require('http')
const path = require('path')

const VITE_URL = 'http://localhost:5173'
const MAX_RETRY = 30
const RETRY_DELAY = 1000

function checkServer(url, retries = 0) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve()
    }).on('error', () => {
      if (retries >= MAX_RETRY) {
        reject(new Error('Vite server did not start in time'))
        return
      }
      setTimeout(() => {
        checkServer(url, retries + 1).then(resolve).catch(reject)
      }, RETRY_DELAY)
    })
  })
}

console.log('⏳ Waiting for Vite server...')

checkServer(VITE_URL).then(() => {
  console.log('✅ Vite ready, launching Electron...')

  // Windows: electron 模块提供真实可执行文件路径
  const electronExe = require('electron')
  const proc = spawn(electronExe, ['.'], {
    env: { ...process.env, VITE_DEV_SERVER_URL: VITE_URL },
    stdio: 'inherit',
    shell: false,
    cwd: path.join(__dirname, '..')
  })

  proc.on('close', (code) => {
    process.exit(code)
  })
}).catch((err) => {
  console.error('❌ Failed to start:', err.message)
  process.exit(1)
})
