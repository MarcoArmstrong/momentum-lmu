import koffi from 'koffi'

// Windows API function definitions for shared memory
const kernel32 = koffi.load('kernel32.dll')

// Function signatures
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

// Constants - try different access flags
const FILE_MAP_READ = 0x0004
const SECTION_MAP_READ = 0x0004
const SECTION_MAP_WRITE = 0x0002
const SECTION_MAP_EXECUTE = 0x0008
const STANDARD_RIGHTS_READ = 0x00020000
const SECTION_QUERY = 0x0001
const SECTION_EXTEND_SIZE = 0x0010

// rF2 Shared Memory Data Structure (based on TinyPedal's pyRfactor2SharedMemory)
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

export class SharedMemoryReader {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fileMappingHandle: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mappedView: any = null
  private isConnected = false
  private retryInterval: NodeJS.Timeout | null = null
  private sharedMemoryNames = [
    'Local\\rFactor2SMMPData',
    'Local\\rFactor2SMMPData_0',
    'Local\\rFactor2SMMPData_1',
    'Local\\rFactor2SMMPData_2',
    'Local\\rFactor2SMMPData_3',
    'Local\\rFactor2SMMPData_4',
    'Local\\rFactor2SMMPData_5',
    'Local\\rFactor2SMMPData_6',
    'Local\\rFactor2SMMPData_7',
    'Local\\rFactor2SMMPData_8',
    'Local\\rFactor2SMMPData_9',
    'Local\\rFactor2SMMPData_10',
    'Local\\rFactor2SMMPData_11',
    'Local\\rFactor2SMMPData_12',
    'Local\\rFactor2SMMPData_13',
    'Local\\rFactor2SMMPData_14',
    'Local\\rFactor2SMMPData_15',
    'Local\\rFactor2SMMPData_16',
    'Local\\rFactor2SMMPData_17',
    'Local\\rFactor2SMMPData_18',
    'Local\\rFactor2SMMPData_19',
    'Local\\rFactor2SMMPData_20',
    'Local\\rFactor2SMMPData_21',
    'Local\\rFactor2SMMPData_22',
    'Local\\rFactor2SMMPData_23',
    'Local\\rFactor2SMMPData_24',
    'Local\\rFactor2SMMPData_25',
    'Local\\rFactor2SMMPData_26',
    'Local\\rFactor2SMMPData_27',
    'Local\\rFactor2SMMPData_28',
    'Local\\rFactor2SMMPData_29',
    'Local\\rFactor2SMMPData_30',
    'Local\\rFactor2SMMPData_31'
  ]

  constructor() {
    // Start with a delay to allow the app to fully initialize
    setTimeout(() => {
      this.initSharedMemory()
    }, 1000)
  }

  private initSharedMemory(): void {
    // Use the exact same approach as the working monitoring script
    console.log('Initializing shared memory connection...')
    
    // Try the main shared memory name first (the one that works in monitoring)
    try {
      console.log('Trying to connect to Local\\rFactor2SMMPData...')
      
      // Open the file mapping using the same approach as monitoring script
      this.fileMappingHandle = OpenFileMappingA(SECTION_MAP_READ, false, 'Local\\rFactor2SMMPData')
      
      if (!this.fileMappingHandle) {
        console.log('Failed to open file mapping for Local\\rFactor2SMMPData')
      } else {
        console.log('✅ Successfully opened file mapping for Local\\rFactor2SMMPData')

        // Map the view of the file - rF2 shared memory is 32768 bytes
        this.mappedView = MapViewOfFile(this.fileMappingHandle, FILE_MAP_READ, 0, 0, 32768)
        
        if (!this.mappedView) {
          console.log('Failed to map view of file for Local\\rFactor2SMMPData')
          CloseHandle(this.fileMappingHandle)
          this.fileMappingHandle = null
        } else {
          this.isConnected = true
          console.log('✅ Successfully connected to Local\\rFactor2SMMPData')
          return
        }
      }
    } catch (error) {
      console.log('Failed to connect to Local\\rFactor2SMMPData:', (error as Error).message)
      this.cleanup()
    }

    // If the main one fails, try other names with different access methods
    const accessMethods = [
      { name: 'SECTION_MAP_READ', flag: SECTION_MAP_READ },
      { name: 'SECTION_MAP_READ | SECTION_MAP_WRITE', flag: SECTION_MAP_READ | SECTION_MAP_WRITE },
      { name: 'STANDARD_RIGHTS_READ | SECTION_MAP_READ', flag: STANDARD_RIGHTS_READ | SECTION_MAP_READ },
      { name: 'SECTION_ALL_ACCESS', flag: SECTION_QUERY | SECTION_MAP_READ | SECTION_MAP_WRITE | SECTION_MAP_EXECUTE | SECTION_EXTEND_SIZE }
    ]

    for (const memoryName of this.sharedMemoryNames) {
      for (const method of accessMethods) {
        try {
          console.log(`Trying to connect to ${memoryName} with ${method.name}`)
          
          // Open the file mapping
          this.fileMappingHandle = OpenFileMappingA(method.flag, false, memoryName)
          
          if (!this.fileMappingHandle) {
            console.log(`Failed to open file mapping for ${memoryName} with ${method.name}`)
            continue
          }

          // Map the view of the file - rF2 shared memory is 32768 bytes
          this.mappedView = MapViewOfFile(this.fileMappingHandle, FILE_MAP_READ, 0, 0, 32768)
          
          if (!this.mappedView) {
            console.log(`Failed to map view of file for ${memoryName}`)
            CloseHandle(this.fileMappingHandle)
            this.fileMappingHandle = null
            continue
          }

          this.isConnected = true
          console.log(`Successfully connected to: ${memoryName} using ${method.name}`)
          return
        } catch (error) {
          console.log(`Failed to connect to ${memoryName} with ${method.name}:`, (error as Error).message)
          this.cleanup()
        }
      }
    }
    
    console.error('Failed to connect to any shared memory. Make sure:')
    console.error('1. Le Mans Ultimate is running')
    console.error('2. rFactor2SharedMemoryMapPlugin64.dll is installed in Le Mans Ultimate\\Plugins folder')
    console.error('3. Plugin is enabled in CustomPluginVariables.JSON')
    this.isConnected = false
    
    // Start retry mechanism
    this.startRetryMechanism()
  }

  public readRPMData(): rF2Data | null {
    if (!this.isConnected || !this.mappedView) {
      return null
    }

    try {
      // Read the entire shared memory buffer as bytes first
      const buffer = koffi.decode(this.mappedView, 'uint8[32768]')
      
      // Check if we have valid data (game is running)
      const buildVersionNumber = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
      if (buildVersionNumber === 0) {
        return null // Game not running or no valid data
      }
      
      // Read telemetry data using DataView for better precision (same as working test)
      const view = new DataView(buffer.buffer, buffer.byteOffset, 32768)
      
      const data: rF2Data = {
        buildVersionNumber: buildVersionNumber,
        gameMode: view.getInt32(0x4, true),
        raceState: view.getInt32(0x8, true),
        rpm: view.getFloat32(0x1C, true), // Engine RPM
        maxRpm: view.getFloat32(0x20, true), // Max RPM
        speed: view.getFloat32(0x24, true), // Speed in m/s
        gear: buffer[0x28], // Current gear
        engineMaxRpm: view.getFloat32(0x2C, true), // Engine max RPM
        lapNumber: view.getInt32(0x30, true),
        lapTime: view.getFloat32(0x34, true),
        lastLapTime: view.getFloat32(0x38, true),
        bestLapTime: view.getFloat32(0x3C, true),
        fuel: view.getFloat32(0x40, true),
        maxFuel: view.getFloat32(0x44, true),
        brake: view.getFloat32(0x48, true),
        throttle: view.getFloat32(0x4C, true),
        clutch: view.getFloat32(0x50, true),
        steering: view.getFloat32(0x54, true),
        trackTemp: view.getFloat32(0x58, true),
        ambientTemp: view.getFloat32(0x5C, true),
        weatherType: view.getInt32(0x60, true),
        trackName: this.readString(buffer, 0x64, 64), // Track name (64 chars)
        carName: this.readString(buffer, 0xA4, 64)   // Car name (64 chars)
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
    if (!this.isConnected || !this.mappedView) {
      return false
    }
    
    try {
      // Try to read a small amount of data to verify connection is still alive
      const buffer = koffi.decode(this.mappedView, 'uint8[4]')
      const buildVersionNumber = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
      return buildVersionNumber > 0
    } catch (error) {
      console.log('Game connection lost, attempting to reconnect...', (error as Error).message)
      this.isConnected = false
      this.cleanup()
      this.initSharedMemory()
      return this.isConnected
    }
  }

  // Helper methods to read different data types from buffer
  private readInt32LE(buffer: Uint8Array, offset: number): number {
    return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24)
  }

  private readFloatLE(buffer: Uint8Array, offset: number): number {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset, 4)
    return view.getFloat32(0, true) // true = little endian
  }

  private readInt8(buffer: Uint8Array, offset: number): number {
    return buffer[offset]
  }

  private readString(buffer: Uint8Array, offset: number, length: number): string {
    const bytes = buffer.slice(offset, offset + length)
    // Find null terminator
    const nullIndex = bytes.findIndex(byte => byte === 0)
    const endIndex = nullIndex !== -1 ? nullIndex : length
    return new TextDecoder('utf-8').decode(bytes.slice(0, endIndex)).trim()
  }

  private cleanup(): void {
    if (this.mappedView) {
      UnmapViewOfFile(this.mappedView)
      this.mappedView = null
    }
    if (this.fileMappingHandle) {
      CloseHandle(this.fileMappingHandle)
      this.fileMappingHandle = null
    }
  }

  public disconnect(): void {
    this.cleanup()
    this.isConnected = false
    this.stopRetryMechanism()
  }

  private startRetryMechanism(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval)
    }
    
    console.log('Starting retry mechanism - will attempt to connect every 5 seconds...')
    this.retryInterval = setInterval(() => {
      if (!this.isConnected) {
        console.log('Retrying connection...')
        this.initSharedMemory()
      }
    }, 5000)
  }

  private stopRetryMechanism(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval)
      this.retryInterval = null
    }
  }
}
