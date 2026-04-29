const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, '../icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 设置中文菜单
  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        { 
          label: '导入证书模板', 
          click: () => mainWindow.webContents.send('menu-action', 'load-template')
        },
        { 
          label: '导入Excel数据', 
          click: () => mainWindow.webContents.send('menu-action', 'load-excel')
        },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { label: '重置缩放', role: 'resetZoom' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { 
          label: '使用说明', 
          click: () => mainWindow.webContents.send('menu-action', 'show-help')
        },
        { type: 'separator' },
        { 
          label: '关于', 
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: 'HLM证书批量生成器 v3.0',
              detail: '制作者：连旗'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 选择文件对话框
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || []
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// 选择保存路径
ipcMain.handle('select-save-path', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  if (result.canceled) return null
  return result.filePath
})

// 选择目录
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// 读取文件
ipcMain.handle('read-file', async (event, filePath) => {
  return fs.readFileSync(filePath)
})

// 写入文件（支持 Uint8Array / ArrayBuffer / Buffer / Array）
ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    let buf
    if (Buffer.isBuffer(data)) {
      buf = data
    } else if (data instanceof Uint8Array) {
      buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    } else if (data instanceof ArrayBuffer) {
      buf = Buffer.from(data)
    } else if (Array.isArray(data)) {
      buf = Buffer.from(data)
    } else if (data && typeof data === 'object' && data.type === 'Buffer' && Array.isArray(data.data)) {
      buf = Buffer.from(data.data)
    } else {
      throw new Error('无法识别的数据类型: ' + (typeof data) + ' ' + (data?.constructor?.name || ''))
    }
    fs.writeFileSync(filePath, buf)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// 写入文件到指定目录（自动处理路径拼接）
ipcMain.handle('save-to-dir', async (event, dirPath, fileName, data) => {
  try {
    const fullPath = path.join(dirPath, fileName)
    fs.writeFileSync(fullPath, Buffer.from(data))
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// 获取文件名
ipcMain.handle('get-filename', async (event, filePath) => {
  return path.basename(filePath)
})
