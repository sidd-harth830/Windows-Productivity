import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  onWindowUpdate: (callback: (data: any) => void) => ipcRenderer.on('window-update', (_event, data) => callback(data)),
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  onIconUpdate: (callback: (data: any) => void) => ipcRenderer.on('icon-update', (_event, data) => callback(data)),

  toggleFocusMode: (enabled: boolean) => ipcRenderer.send('toggle-focus-mode', enabled),
  updateBlockList: (rules: any) => ipcRenderer.send('update-block-list', rules),
  
  // NEW: Emit preferences to the backend
  updatePreferences: (prefs: any) => ipcRenderer.send('update-preferences', prefs),

  // NEW: Auto-Start Setup
  getAutoStartStatus: () => ipcRenderer.invoke('get-auto-start'),
  toggleAutoStart: (enabled: boolean) => ipcRenderer.send('toggle-auto-start', enabled),

  // NEW: Focus Timer & Mini Player Calls
  startFocusTimer: (minutes: number) => ipcRenderer.send('start-focus-timer', minutes),
  stopFocusTimer: () => ipcRenderer.send('stop-focus-timer'),
  openMiniPlayer: () => ipcRenderer.send('open-mini-player'),
  closeMiniPlayer: () => ipcRenderer.send('close-mini-player'),
  onFocusTimerTick: (callback: (data: any) => void) => ipcRenderer.on('focus-timer-tick', (_event, data) => callback(data)),

  // NEW: Save CSV
  saveCsv: (content: string) => ipcRenderer.invoke('save-csv', content),

  // NEW: Add Offline Time
  addOfflineTime: (activityName: string, minutes: number) => ipcRenderer.invoke('add-offline-time', activityName, minutes),

  // NEW: Remove App Usage
  removeAppUsage: (appName: string) => ipcRenderer.invoke('remove-app-usage', appName),

  // NEW: Refresh App Icon
  refreshAppIcon: (appName: string) => ipcRenderer.invoke('refresh-app-icon', appName),

  // NEW: Clear Usage Data
  clearUsageData: () => ipcRenderer.invoke('clear-usage-data'),

  // NEW: Browse for executable
  browseForExe: () => ipcRenderer.invoke('browse-for-exe'),

  // NEW: Get History
  getHistory: () => ipcRenderer.invoke('get-history')
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