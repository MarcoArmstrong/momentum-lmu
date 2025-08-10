import * as sharedMemory from 'shared-memory'

// Basic structure for rF2 shared memory data
interface rF2Data {
  rpm: number
  maxRpm: number
  speed: number
  gear: number
  engineMaxRpm: number
}

export class SharedMemoryReader {
  private sharedMemory: any
  private isConnected = false
  private sharedMemoryNames = [
    'Local\\rFactor2SMMPData',
    'Local\\rFactor2SMMPData_0',
    'Local\\rFactor2SMMPData_1',
    'Local\\rFactor2SMMPData_2'
  ]

  constructor() {
    this.initSharedMemory()
  }

  private initSharedMemory(): void {
    for (const memoryName of this.sharedMemoryNames) {
      try {
        console.log(`Trying to connect to shared memory: ${memoryName}`)
        this.sharedMemory = sharedMemory.open(memoryName, 32768)
        this.isConnected = true
        console.log(`Successfully connected to: ${memoryName}`)
        return
      } catch (error) {
        console.log(`Failed to connect to ${memoryName}:`, (error as Error).message)
      }
    }
    
    console.error('Failed to connect to any shared memory. Make sure:')
    console.error('1. Le Mans Ultimate is running')
    console.error('2. rFactor2SharedMemoryMapPlugin64.dll is installed in Le Mans Ultimate\\Plugins folder')
    console.error('3. Plugin is enabled in CustomPluginVariables.JSON')
    this.isConnected = false
  }

  public readRPMData(): rF2Data | null {
    if (!this.isConnected || !this.sharedMemory) {
      return null
    }

    try {
      // Read basic telemetry data from shared memory
      // These offsets are based on rF2 shared memory structure
      const buffer = this.sharedMemory.read(0, 32768)
      
      // Check if we have valid data (game is running)
      const buildVersionNumber = buffer.readInt32LE(0x0)
      if (buildVersionNumber === 0) {
        return null // Game not running or no valid data
      }
      
      // Basic data structure - simplified for RPM reading
      const data: rF2Data = {
        rpm: buffer.readFloatLE(0x1C), // Engine RPM
        maxRpm: buffer.readFloatLE(0x20), // Max RPM
        speed: buffer.readFloatLE(0x24), // Speed in m/s
        gear: buffer.readInt8(0x28), // Current gear
        engineMaxRpm: buffer.readFloatLE(0x2C) // Engine max RPM
      }

      // Validate data
      if (data.rpm < 0 || data.rpm > 50000 || data.speed < 0 || data.speed > 1000) {
        return null // Invalid data
      }

      return data
    } catch (error) {
      console.error('Error reading shared memory:', error)
      return null
    }
  }

  public isGameRunning(): boolean {
    if (!this.isConnected) {
      return false
    }
    
    try {
      // Try to read a small amount of data to verify connection is still alive
      const buffer = this.sharedMemory.read(0, 4)
      const buildVersionNumber = buffer.readInt32LE(0x0)
      return buildVersionNumber > 0
    } catch (error) {
      console.log('Game connection lost, attempting to reconnect...')
      this.isConnected = false
      this.initSharedMemory()
      return this.isConnected
    }
  }

  public disconnect(): void {
    if (this.sharedMemory) {
      this.sharedMemory.close()
      this.isConnected = false
    }
  }
}
