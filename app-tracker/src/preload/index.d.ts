import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onWindowUpdate: (callback: (data: { name: string, title: string, focusTime: number }) => void) => void
    }
  }
}