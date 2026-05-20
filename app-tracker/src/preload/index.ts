import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  onWindowUpdate: (callback: (data: any) => void) => ipcRenderer.on('window-update', (_event, data) => callback(data)),
  toggleFocusMode: (enabled: boolean) => ipcRenderer.send('toggle-focus-mode', enabled),
  updateBlockList: (rules: any) => ipcRenderer.send('update-block-list', rules),
  
  // NEW: Emit preferences to the backend
  updatePreferences: (prefs: any) => ipcRenderer.send('update-preferences', prefs)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}