import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getRpmData: () => Promise<{
        rpm: number
        maxRpm: number
        speed: number
        gear: number
        engineMaxRpm: number
      } | null>
      isGameRunning: () => Promise<boolean>
      debugMemory: () => Promise<boolean>
    }
  }
}
