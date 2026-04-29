const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  selectSavePath: (options) => ipcRenderer.invoke('select-save-path', options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  getFilename: (filePath) => ipcRenderer.invoke('get-filename', filePath),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action))
})
