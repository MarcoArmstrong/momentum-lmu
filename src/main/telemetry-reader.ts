import { SharedMemoryReader } from './shared-memory-reader'
import { RestApiReader } from './rest-api-reader'

// rF2 Data structure
interface rF2Data {
  rpm: number
  maxRpm: number
  speed: number
  gear: number
  engineMaxRpm: number
  buildVersionNumber: number
  gameMode: number
  raceState: number
  lapNumber: number
  lapTime: number
  lastLapTime: number
  bestLapTime: number
  fuel: number
  maxFuel: number
  brake: number
  throttle: number
  clutch: number
  steering: number
  trackTemp: number
  ambientTemp: number
  weatherType: number
  trackName: string
  carName: string
}

export class TelemetryReader {
  private sharedMemoryReader: SharedMemoryReader
  private restApiReader: RestApiReader
  private currentMethod: 'sharedmemory' | 'restapi' | 'none' = 'none'
  private connectionStatus = 'Disconnected - Start Le Mans Ultimate'
  // private debugMode = true

  constructor() {
    console.log('🚗 Initializing unified telemetry reader...')
    console.log('📋 Will try both shared memory and REST API approaches')
    console.log('💡 Note: Shared memory may not work with Le Mans Ultimate')
    
    this.sharedMemoryReader = new SharedMemoryReader()
    this.restApiReader = new RestApiReader()
    
    // Check which method works
    this.detectWorkingMethod()
  }

  private async detectWorkingMethod(): Promise<void> {
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check shared memory first (better performance, real-time data)
    if (this.sharedMemoryReader.isGameRunning()) {
      // Verify shared memory is actually working by trying to read data
      const testData = this.sharedMemoryReader.readRPMData()
      if (testData && this.isValidSharedMemoryData(testData)) {
        this.currentMethod = 'sharedmemory'
        this.connectionStatus = 'Connected via Shared Memory'
        return
      }
    }
    
    // Check REST API as fallback
    if (this.restApiReader.isGameRunning()) {
      this.currentMethod = 'restapi'
      this.connectionStatus = 'Connected via REST API'
      return
    }
    
    this.currentMethod = 'none'
    this.connectionStatus = 'Disconnected - Start Le Mans Ultimate'
    
    // Keep trying to detect a working method
    this.startDetectionRetry()
  }

  private isValidSharedMemoryData(data: rF2Data): boolean {
    // Check for obviously invalid data that indicates shared memory is not working
    if (isNaN(data.speed) || data.speed < 0 || data.speed > 350) {
      return false
    }
    
    if (isNaN(data.rpm) || data.rpm < 0 || data.rpm > 25000) {
      return false
    }
    
    if (isNaN(data.gear) || data.gear < -1 || data.gear > 10) {
      return false
    }
    
    return true
  }

  private startDetectionRetry(): void {
    setInterval(async () => {
      if (this.currentMethod === 'none') {
        await this.detectWorkingMethod()
      }
    }, 5000)
  }

  public async readTelemetryData(): Promise<rF2Data | null> {
    switch (this.currentMethod) {
      case 'restapi': {
        const restApiData = await this.restApiReader.readRPMData()
        if (restApiData) {
          this.connectionStatus = 'Connected via REST API'
          return restApiData
        } else {
          // REST API failed, try shared memory
          this.currentMethod = 'none'
          await this.detectWorkingMethod()
          return null
        }
      }
        
      case 'sharedmemory': {
        const sharedMemoryData = this.sharedMemoryReader.readRPMData()
        if (sharedMemoryData && this.isValidSharedMemoryData(sharedMemoryData)) {
          this.connectionStatus = 'Connected via Shared Memory'
          return sharedMemoryData
        } else {
          // Shared memory failed or provided invalid data, try REST API
          this.currentMethod = 'none'
          await this.detectWorkingMethod()
          return null
        }
      }
        
      default:
        this.connectionStatus = 'Disconnected - Start Le Mans Ultimate'
        return null
    }
  }

  public isGameRunning(): boolean {
    switch (this.currentMethod) {
      case 'sharedmemory':
        return this.sharedMemoryReader.isGameRunning()
      case 'restapi':
        return this.restApiReader.isGameRunning()
      default:
        return false
    }
  }

  public getConnectionStatus(): string {
    return this.connectionStatus
  }

  public getCurrentMethod(): string {
    switch (this.currentMethod) {
      case 'sharedmemory': {
        const connectionInfo = this.sharedMemoryReader.getConnectionInfo()
        return `Shared Memory (${connectionInfo.memoryName || 'Unknown'})`
      }
      case 'restapi':
        return 'REST API'
      default:
        return 'None'
    }
  }

  public getDebugInfo(): object {
    const sharedMemoryInfo = this.sharedMemoryReader.getConnectionInfo()
    return {
      currentMethod: this.currentMethod,
      connectionStatus: this.connectionStatus,
      sharedMemory: {
        isConnected: sharedMemoryInfo.isConnected,
        memoryName: sharedMemoryInfo.memoryName,
        accessMethod: sharedMemoryInfo.accessMethod
      },
      restApi: {
        isConnected: this.restApiReader.isGameRunning()
      }
    }
  }

  public disconnect(): void {
    this.sharedMemoryReader.disconnect()
    this.restApiReader.disconnect()
    this.currentMethod = 'none'
    this.connectionStatus = 'Disconnected'
  }
}
