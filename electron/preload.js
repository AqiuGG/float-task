const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 待办数据
  getTodos: () => ipcRenderer.invoke('get-todos'),
  saveTodos: (todos) => ipcRenderer.invoke('save-todos', todos),

  // 设置
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),

  // 边缘隐藏
  hideToEdge: () => ipcRenderer.send('hide-to-edge'),
  showFromEdge: () => ipcRenderer.send('show-from-edge'),

  // 通知
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),

  // 开机自启
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('set-auto-launch', enabled),

  // 监听事件
  onEdgeHideChanged: (cb) => ipcRenderer.on('edge-hide-changed', (e, v) => cb(v)),
  onSettingsLoaded: (cb) => ipcRenderer.on('settings-loaded', (e, v) => cb(v))
})
