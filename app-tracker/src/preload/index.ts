import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Group ALL custom APIs together into one single object
const api = {
  onWindowUpdate: (callback: (data: any) => void) => 
    ipcRenderer.on('window-update', (_event, data) => callback(data)),
  
  toggleFocusMode: (enabled: boolean) => ipcRenderer.send('toggle-focus-mode', enabled),
  
  // NEW: Emit the updated blocklist record to the main process
  updateBlockList: (rules: Record<string, 'fully_blocked' | number>) => ipcRenderer.send('update-block-list', rules)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose APIs via contextBridge:', error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}