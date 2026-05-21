import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  onWindowUpdate: (callback: (data: any) => void) => ipcRenderer.on('window-update', (_event, data) => callback(data)),
  toggleFocusMode: (enabled: boolean) => ipcRenderer.send('toggle-focus-mode', enabled),
  updateBlockList: (rules: any) => ipcRenderer.send('update-block-list', rules),
  
  // NEW: Emit preferences to the backend
  updatePreferences: (prefs: any) => ipcRenderer.send('update-preferences', prefs),

  // NEW: Save CSV
  saveCsv: (content: string) => ipcRenderer.invoke('save-csv', content),

  // NEW: Save PDF
  savePdf: (base64Str: string, filename?: string) => ipcRenderer.invoke('save-pdf', base64Str, filename)
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