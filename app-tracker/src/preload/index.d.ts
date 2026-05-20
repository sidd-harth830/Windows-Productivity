import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onWindowUpdate: (callback: (data: { name: string, title: string, focusTime: number, allUsage: Record<string, number> }) => void) => void
      toggleFocusMode: (enabled: boolean) => void
      updateBlockList: (list: string[]) => void // NEW
    }
  }
}