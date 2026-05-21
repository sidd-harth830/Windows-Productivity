import { ElectronAPI } from '@electron-toolkit/preload'

export type BlockRule = 'fully_blocked' | number;

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onWindowUpdate: (callback: (data: { name: string, title: string, focusTime: number, allUsage: Record<string, number>, appIcons: Record<string, string> }) => void) => void
      toggleFocusMode: (enabled: boolean) => void
      updateBlockList: (rules: Record<string, BlockRule>) => void
      // NEW: Preference Sync Channel
      updatePreferences: (prefs: { trackSystemApps: boolean, trackSelf: boolean, hiddenApps: string[] }) => void
    }
  }
}