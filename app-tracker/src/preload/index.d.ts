import { ElectronAPI } from '@electron-toolkit/preload'

export type BlockRule = 'fully_blocked' | number;

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // UPGRADED: Added appIcons dictionary to the payload
      onWindowUpdate: (callback: (data: { name: string, title: string, focusTime: number, allUsage: Record<string, number>, appIcons: Record<string, string> }) => void) => void
      toggleFocusMode: (enabled: boolean) => void
      updateBlockList: (rules: Record<string, BlockRule>) => void
    }
  }
}