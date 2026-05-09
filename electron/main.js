const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, screen, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow = null
let tray = null
let isHidden = false  // 边缘隐藏状态
let hideTimer = null
let edgeHideEnabled = true
let currentEdge = null  // 'left' | 'right' | null

// 数据文件路径（延迟初始化）
let dataFile = null
let settingsFile = null

// 读取 JSON 数据文件
function readData(file, defaultVal) {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8')
      const data = JSON.parse(content)
      console.log(`[readData] ${path.basename(file)}: 读取成功, ${Array.isArray(data) ? data.length + ' 条' : 'object'}, 路径: ${file}`)
      return data
    } else {
      console.log(`[readData] ${path.basename(file)}: 文件不存在, 返回默认值, 预期路径: ${file}`)
    }
  } catch (e) {
    console.error(`[readData] ${path.basename(file)}: 读取失败 -`, e.message, e.stack)
  }
  return defaultVal
}

// 写入 JSON 数据文件（确保目录存在）
function writeData(file, data) {
  try {
    const dir = path.dirname(file)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`[writeData] 创建目录: ${dir}`)
    }
    const content = JSON.stringify(data, null, 2)
    fs.writeFileSync(file, content, 'utf-8')
    console.log(`[writeData] ${path.basename(file)}: 写入成功, ${Array.isArray(data) ? data.length + ' 条' : 'object'}, 大小: ${Buffer.byteLength(content)} bytes, 路径: ${file}`)
    return true
  } catch (e) {
    console.error(`[writeData] ${path.basename(file)}: 写入失败 -`, e.message, e.stack)
    return false
  }
}

// 初始化数据存储路径
function initDataPaths() {
  // 确保 userData 路径稳定
  let userDataPath
  if (!app.isPackaged) {
    // 开发模式：使用项目目录下的 userdata 文件夹
    userDataPath = path.join(__dirname, '..', 'userdata')
    app.setPath('userData', userDataPath)
    console.log('[Main] 开发模式：userData 已设置为', userDataPath)
  } else {
    // 生产模式：使用 Electron 默认的 userData 路径
    userDataPath = app.getPath('userData')
    console.log('[Main] 生产模式：userData 使用默认路径', userDataPath)
  }

  // 确保 userData 目录存在
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
    console.log('[Main] 已创建 userData 目录:', userDataPath)
  }

  dataFile = path.join(userDataPath, 'todos.json')
  settingsFile = path.join(userDataPath, 'settings.json')

  console.log('[Main] todos.json 路径:', dataFile)
  console.log('[Main] settings.json 路径:', settingsFile)

  return { userDataPath, dataFile, settingsFile }
}

// ============ 创建主窗口 ============
function createWindow() {
  const settings = readData(settingsFile, {
    x: 100, y: 100,
    width: 320, height: 580,
    opacity: 0.92,
    bgColor: '#1e1e2e',
    alwaysOnTop: true,
    edgeHide: true
  })

  mainWindow = new BrowserWindow({
    x: settings.x || 100,
    y: settings.y || 100,
    width: settings.width || 320,
    height: settings.height || 580,
    minWidth: 260,
    minHeight: 400,
    maxWidth: 500,
    frame: false,           // 无边框
    transparent: true,      // 透明背景
    alwaysOnTop: settings.alwaysOnTop !== false,
    skipTaskbar: true,      // 不显示在任务栏
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 设置窗口透明度
  mainWindow.setOpacity(settings.opacity || 0.92)

  // 加载页面
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 开发模式打开 DevTools，方便调试
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  // 监听窗口移动，检测边缘吸附
  mainWindow.on('moved', () => {
    checkEdgeAttach()
    saveWindowState()
  })

  mainWindow.on('resized', saveWindowState)

  mainWindow.on('closed', () => { mainWindow = null })

  // 鼠标进入窗口时，如果处于隐藏状态则弹出
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('settings-loaded', readData(settingsFile, {}))
  })
}

// ============ 保存窗口位置 ============
function saveWindowState() {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  const settings = readData(settingsFile, {})
  settings.x = bounds.x
  settings.y = bounds.y
  settings.width = bounds.width
  settings.height = bounds.height
  writeData(settingsFile, settings)
}

// ============ 边缘吸附检测 ============
function checkEdgeAttach() {
  if (!mainWindow || !edgeHideEnabled) return
  const { workAreaSize } = screen.getPrimaryDisplay()
  const bounds = mainWindow.getBounds()
  const threshold = 20  // 距边缘20px触发吸附

  if (bounds.x <= threshold) {
    attachToEdge('left')
  } else if (bounds.x + bounds.width >= workAreaSize.width - threshold) {
    attachToEdge('right')
  } else {
    currentEdge = null
  }
}

function attachToEdge(edge) {
  if (!mainWindow) return
  currentEdge = edge
  const { workAreaSize } = screen.getPrimaryDisplay()
  const bounds = mainWindow.getBounds()

  if (edge === 'left') {
    mainWindow.setPosition(0, bounds.y)
  } else if (edge === 'right') {
    mainWindow.setPosition(workAreaSize.width - bounds.width, bounds.y)
  }
}

// ============ 边缘隐藏/弹出 ============
function hideToEdge() {
  if (!mainWindow || !currentEdge || isHidden) return
  const bounds = mainWindow.getBounds()
  const peekWidth = 4  // 露出4px作为触发区域

  isHidden = true
  if (currentEdge === 'left') {
    mainWindow.setPosition(-(bounds.width - peekWidth), bounds.y)
  } else if (currentEdge === 'right') {
    const { workAreaSize } = screen.getPrimaryDisplay()
    mainWindow.setPosition(workAreaSize.width - peekWidth, bounds.y)
  }
  mainWindow.webContents.send('edge-hide-changed', true)
}

function showFromEdge() {
  if (!mainWindow || !isHidden) return
  isHidden = false
  const { workAreaSize } = screen.getPrimaryDisplay()
  const bounds = mainWindow.getBounds()

  if (currentEdge === 'left') {
    mainWindow.setPosition(0, bounds.y)
  } else if (currentEdge === 'right') {
    mainWindow.setPosition(workAreaSize.width - bounds.width, bounds.y)
  }
  mainWindow.webContents.send('edge-hide-changed', false)
}

// ============ 系统托盘 ============
function createTray() {
  // 使用内联图标（base64 PNG）
  const iconPath = path.join(__dirname, 'icon.png')
  let trayIcon

  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath)
  } else {
    // 生成一个简单的16x16 PNG图标
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('灵动便签 FloatTask')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: toggleWindow
    },
    {
      label: '始终置顶',
      type: 'checkbox',
      checked: mainWindow ? mainWindow.isAlwaysOnTop() : true,
      click: (item) => {
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(item.checked)
          const settings = readData(settingsFile, {})
          settings.alwaysOnTop = item.checked
          writeData(settingsFile, settings)
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', toggleWindow)
}

function toggleWindow() {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

// ============ IPC 通信 ============

// 读取待办数据
ipcMain.handle('get-todos', () => {
  console.log('[IPC] get-todos →', dataFile)
  const data = readData(dataFile, [])
  return data
})

// 保存待办数据
ipcMain.handle('save-todos', (event, todos) => {
  console.log('[IPC] save-todos ←', todos ? todos.length : 0, '条')
  const ok = writeData(dataFile, todos)
  if (!ok) {
    return { success: false, error: '写入失败' }
  }
  // 回读验证
  try {
    const verify = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    console.log('[IPC] save-todos 验证: 回读到', verify.length, '条')
    return { success: true, count: verify.length }
  } catch (e) {
    console.error('[IPC] save-todos 验证失败:', e.message)
    return { success: false, error: '验证失败: ' + e.message }
  }
})

// 读取设置
ipcMain.handle('get-settings', () => {
  return readData(settingsFile, {
    opacity: 0.92,
    bgColor: '#1e1e2e',
    alwaysOnTop: true,
    edgeHide: true,
    theme: 'dark'
  })
})

// 保存设置
ipcMain.handle('save-settings', (event, settings) => {
  const old = readData(settingsFile, {})
  const merged = { ...old, ...settings }
  writeData(settingsFile, merged)

  // 实时应用设置
  if (mainWindow) {
    if (settings.opacity !== undefined) {
      mainWindow.setOpacity(Math.min(1, Math.max(0.1, settings.opacity)))
    }
    if (settings.alwaysOnTop !== undefined) {
      mainWindow.setAlwaysOnTop(settings.alwaysOnTop)
    }
    if (settings.edgeHide !== undefined) {
      edgeHideEnabled = settings.edgeHide
    }
  }
  return true
})

// 窗口控制
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.hide()
})

ipcMain.on('window-drag-start', () => { })

// 边缘隐藏
ipcMain.on('hide-to-edge', () => hideToEdge())
ipcMain.on('show-from-edge', () => showFromEdge())

// 发送系统通知
ipcMain.on('show-notification', (event, { title, body }) => {
  // Win7 不支持 Notification API，使用托盘气泡通知作为 fallback
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  } else {
    // Win7 fallback：通过托盘显示气泡提示
    if (tray) {
      tray.displayBalloon({
        iconType: 'info',
        title: title || '灵动便签',
        content: body || ''
      })
    }
  }
})

// 获取/设置开机自启状态
ipcMain.handle('get-auto-launch', () => {
  const loginItem = app.getLoginItemSettings()
  return loginItem.openAtLogin || false
})

ipcMain.handle('set-auto-launch', (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: app.execPath
  })
  const result = app.getLoginItemSettings()
  return result.openAtLogin || false
})

// ============ 鼠标悬停检测（用于边缘弹出）============
function startMouseWatcher() {
  setInterval(() => {
    if (!mainWindow || !isHidden || !currentEdge) return

    const { workAreaSize } = screen.getPrimaryDisplay()
    const cursor = screen.getCursorScreenPoint()
    const triggerZone = 8  // 触发区域宽度

    let inTriggerZone = false
    if (currentEdge === 'left' && cursor.x <= triggerZone) {
      inTriggerZone = true
    } else if (currentEdge === 'right' && cursor.x >= workAreaSize.width - triggerZone) {
      inTriggerZone = true
    }

    if (inTriggerZone) {
      showFromEdge()
      mainWindow.show()
      mainWindow.focus()
    }
  }, 100)

  // 监测鼠标离开窗口区域
  setInterval(() => {
    if (!mainWindow || isHidden || !currentEdge) return
    if (!edgeHideEnabled) return

    const bounds = mainWindow.getBounds()
    const cursor = screen.getCursorScreenPoint()
    const margin = 30

    const inWindow = cursor.x >= bounds.x - margin &&
      cursor.x <= bounds.x + bounds.width + margin &&
      cursor.y >= bounds.y - margin &&
      cursor.y <= bounds.y + bounds.height + margin

    if (!inWindow) {
      // 鼠标离开窗口区域，延迟隐藏
      if (!hideTimer) {
        hideTimer = setTimeout(() => {
          hideTimer = null
          if (!mainWindow) return
          const cur = screen.getCursorScreenPoint()
          const b = mainWindow.getBounds()
          const still = cur.x >= b.x - margin &&
            cur.x <= b.x + b.width + margin &&
            cur.y >= b.y - margin &&
            cur.y <= b.y + b.height + margin
          if (!still) hideToEdge()
        }, 1500)
      }
    } else {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    }
  }, 200)
}

// ============ 应用生命周期 ============
app.whenReady().then(() => {
  // 首先初始化数据存储路径
  initDataPaths()

  createWindow()
  createTray()
  startMouseWatcher()

  // 全局快捷键 Alt+T 呼出/隐藏
  globalShortcut.register('Alt+T', () => {
    if (!mainWindow) return
    if (isHidden) {
      showFromEdge()
      mainWindow.show()
      mainWindow.focus()
    } else {
      toggleWindow()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // 不退出，保持托盘运行
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('before-quit', () => {
  if (tray) tray.destroy()
})
