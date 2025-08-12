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

  constructor() {
    console.log('Initializing unified telemetry reader...')
    console.log('Will try both shared memory and REST API approaches')
    
    this.sharedMemoryReader = new SharedMemoryReader()
    this.restApiReader = new RestApiReader()
    
    // Check which method works
    this.detectWorkingMethod()
  }

  private async detectWorkingMethod(): Promise<void> {
    console.log('Detecting working telemetry method...')
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check shared memory first
    if (this.sharedMemoryReader.isGameRunning()) {
      this.currentMethod = 'sharedmemory'
      this.connectionStatus = 'Connected via Shared Memory'
      console.log('✅ Using shared memory for telemetry')
      return
    }
    
    // Check REST API
    if (this.restApiReader.isGameRunning()) {
      this.currentMethod = 'restapi'
      this.connectionStatus = 'Connected via REST API'
      console.log('✅ Using REST API for telemetry')
      return
    }
    
    this.currentMethod = 'none'
    this.connectionStatus = 'Disconnected - Start Le Mans Ultimate'
    console.log('❌ No working telemetry method found')
    
    // Keep trying to detect a working method
    this.startDetectionRetry()
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
      case 'sharedmemory':
        const sharedMemoryData = this.sharedMemoryReader.readRPMData()
        if (sharedMemoryData) {
          this.connectionStatus = 'Connected via Shared Memory'
          return sharedMemoryData
        } else {
          // Shared memory failed, try REST API
          this.currentMethod = 'none'
          await this.detectWorkingMethod()
          return null
        }
        
      case 'restapi':
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
      case 'sharedmemory':
        return 'Shared Memory'
      case 'restapi':
        return 'REST API'
      default:
        return 'None'
    }
  }

  public disconnect(): void {
    this.sharedMemoryReader.disconnect()
    this.restApiReader.disconnect()
    this.currentMethod = 'none'
    this.connectionStatus = 'Disconnected'
  }
}
