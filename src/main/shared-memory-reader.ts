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

  constructor() {
    this.initSharedMemory()
  }

  private initSharedMemory(): void {
    try {
      // rF2 shared memory name - Le Mans Ultimate uses the same format
      this.sharedMemory = sharedMemory.open('Local\\rFactor2SMMPData', 32768)
      this.isConnected = true
      console.log('Connected to Le Mans Ultimate shared memory')
    } catch (error) {
      console.error('Failed to connect to shared memory:', error)
      this.isConnected = false
    }
  }

  public readRPMData(): rF2Data | null {
    if (!this.isConnected || !this.sharedMemory) {
      return null
    }

    try {
      // Read basic telemetry data from shared memory
      // These offsets are based on rF2 shared memory structure
      const buffer = this.sharedMemory.read(0, 32768)
      
      // Basic data structure - simplified for RPM reading
      const data: rF2Data = {
        rpm: buffer.readFloatLE(0x1C), // Engine RPM
        maxRpm: buffer.readFloatLE(0x20), // Max RPM
        speed: buffer.readFloatLE(0x24), // Speed in m/s
        gear: buffer.readInt8(0x28), // Current gear
        engineMaxRpm: buffer.readFloatLE(0x2C) // Engine max RPM
      }

      return data
    } catch (error) {
      console.error('Error reading shared memory:', error)
      return null
    }
  }

  public isGameRunning(): boolean {
    return this.isConnected
  }

  public disconnect(): void {
    if (this.sharedMemory) {
      this.sharedMemory.close()
      this.isConnected = false
    }
  }
}
