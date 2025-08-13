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
      getConnectionStatus: () => Promise<string>
      getConnectionMethod: () => Promise<string>
      getDebugInfo: () => Promise<object>
    }
  }
}
