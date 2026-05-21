import { ElectronAPI } from '@electron-toolkit/preload'

export type BlockRule = 'fully_blocked' | number;

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onWindowUpdate: (callback: (data: { name: string, title: string, focusTime: number, allUsage: Record<string, number>, appIcons: Record<string, string> }) => void) => void
      toggleFocusMode: (enabled: boolean) => void
      updateBlockList: (rules: Record<string, BlockRule>) => void
      updatePreferences: (prefs: { trackSystemApps: boolean, trackSelf: boolean, hiddenApps: string[], stopTrackingOnIdle: boolean }) => void
      
      // NEW: Auto-Start APIs
      getAutoStartStatus: () => Promise<boolean>
      toggleAutoStart: (enabled: boolean) => void
      
      // NEW: Focus Timer & Mini Player APIs
      startFocusTimer: (minutes: number) => void
      stopFocusTimer: () => void
      openMiniPlayer: () => void
      closeMiniPlayer: () => void
      onFocusTimerTick: (callback: (data: { active: boolean, timeLeft: number, total: number }) => void) => void
    }
  }
}