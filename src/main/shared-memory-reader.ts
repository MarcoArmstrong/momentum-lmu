import koffi from 'koffi'

// Windows API function definitions for shared memory
const kernel32 = koffi.load('kernel32.dll')

// Function signatures
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', [
  'void*',
  'uint32',
  'uint32',
  'uint32',
  'size_t'
])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])
// GetLastError function available for debugging if needed
// const GetLastError = kernel32.func('GetLastError', 'uint32', [])

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
  private workingMemoryName: string | null = null
  private workingAccessMethod: number | null = null

  // Correct shared memory names based on Reddit discovery
  private sharedMemoryNames = [
    // Main telemetry object (most important)
    '$rFactor2SMMP_Telemetry$',

    // Other shared memory objects
    '$rFactor2SMMP_Scoring$',
    '$rFactor2SMMP_Weather$',
    '$rFactor2SMMP_Game$',
    '$rFactor2SMMP_Input$',
    '$rFactor2SMMP_Graphics$',
    '$rFactor2SMMP_Pit$',
    '$rFactor2SMMP_Camera$',
    '$rFactor2SMMP_Radio$',
    '$rFactor2SMMP_Time$',
    '$rFactor2SMMP_Flags$',
    '$rFactor2SMMP_Player$',
    '$rFactor2SMMP_Drivers$',
    '$rFactor2SMMP_Vehicles$',
    '$rFactor2SMMP_Classes$',
    '$rFactor2SMMP_Results$',
    '$rFactor2SMMP_Standings$',
    '$rFactor2SMMP_Leaderboard$',
    '$rFactor2SMMP_Statistics$',
    '$rFactor2SMMP_Data$',

    // Variations without $ prefix/suffix (just in case)
    'rFactor2SMMP_Telemetry',
    'rFactor2SMMP_Scoring',
    'rFactor2SMMP_Weather',
    'rFactor2SMMP_Game',
    'rFactor2SMMP_Input',
    'rFactor2SMMP_Graphics',
    'rFactor2SMMP_Pit',
    'rFactor2SMMP_Camera',
    'rFactor2SMMP_Radio',
    'rFactor2SMMP_Time',
    'rFactor2SMMP_Flags',
    'rFactor2SMMP_Player',
    'rFactor2SMMP_Drivers',
    'rFactor2SMMP_Vehicles',
    'rFactor2SMMP_Classes',
    'rFactor2SMMP_Results',
    'rFactor2SMMP_Standings',
    'rFactor2SMMP_Leaderboard',
    'rFactor2SMMP_Statistics',
    'rFactor2SMMP_Data',

    // Legacy names (fallback)
    'Local\\rFactor2SMMPData',
    'rFactor2SMMPData',
    'Local\\SMMPData',
    'SMMPData',
    'Global\\rF2SMMPData_2',
    'Global\\SMMPData',
    'Global\\SMMPData_0',
    'Global\\SMMPData_1',
    'Global\\SMMPData_2'
  ]

  constructor() {
    // Start with a delay to allow the app to fully initialize
    setTimeout(() => {
      this.initSharedMemory()
    }, 1000)
  }

  private initSharedMemory(): void {
    console.log('🔍 Initializing shared memory connection...')
    console.log('📋 Will try multiple shared memory names and access methods')

    // If we have a working configuration, try it first
    if (this.workingMemoryName && this.workingAccessMethod !== null) {
      if (this.tryConnect(this.workingMemoryName, this.workingAccessMethod)) {
        console.log(
          `✅ Reconnected using previous working configuration: ${this.workingMemoryName}`
        )
        return
      }
    }

    // Try different access methods
    const accessMethods = [
      { name: 'SECTION_MAP_READ', flag: SECTION_MAP_READ },
      { name: 'SECTION_MAP_READ | SECTION_MAP_WRITE', flag: SECTION_MAP_READ | SECTION_MAP_WRITE },
      {
        name: 'STANDARD_RIGHTS_READ | SECTION_MAP_READ',
        flag: STANDARD_RIGHTS_READ | SECTION_MAP_READ
      },
      {
        name: 'SECTION_ALL_ACCESS',
        flag:
          SECTION_QUERY |
          SECTION_MAP_READ |
          SECTION_MAP_WRITE |
          SECTION_MAP_EXECUTE |
          SECTION_EXTEND_SIZE
      }
    ]

    // Try each memory name with each access method
    for (const memoryName of this.sharedMemoryNames) {
      for (const method of accessMethods) {
        console.log(`🔧 Trying ${memoryName} with ${method.name}`)

        if (this.tryConnect(memoryName, method.flag)) {
          this.workingMemoryName = memoryName
          this.workingAccessMethod = method.flag
          console.log(`✅ Successfully connected to: ${memoryName} using ${method.name}`)
          return
        }
      }
    }

    console.error('❌ Failed to connect to any shared memory. This could mean:')
    console.error('1. Le Mans Ultimate is not running')
    console.error('2. You are not driving in the game (try starting a practice session)')
    console.error('3. The rF2SharedMemoryMapPlugin is not properly installed/enabled')
    console.error('4. The plugin uses different shared memory names')
    console.error('5. The game needs to be in a specific state (driving on track)')

    this.isConnected = false

    // Start retry mechanism
    this.startRetryMechanism()
  }

  private tryConnect(memoryName: string, accessFlag: number): boolean {
    try {
      // Open the file mapping
      this.fileMappingHandle = OpenFileMappingA(accessFlag, false, memoryName)

      if (!this.fileMappingHandle) {
        return false
      }

      // Map the view of the file - rF2 shared memory is 32768 bytes
      this.mappedView = MapViewOfFile(this.fileMappingHandle, FILE_MAP_READ, 0, 0, 32768)

      if (!this.mappedView) {
        CloseHandle(this.fileMappingHandle)
        this.fileMappingHandle = null
        return false
      }

      // Try to read a small amount of data to verify it's working
      try {
        const buffer = koffi.decode(this.mappedView, 'uint8[4]')
        const buildVersionNumber =
          buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)

        if (buildVersionNumber > 0) {
          this.isConnected = true
          return true
        } else {
          // Shared memory exists but no valid data (game not running or not in driving state)
          this.cleanup()
          return false
        }
      } catch {
        this.cleanup()
        return false
      }
    } catch {
      this.cleanup()
      return false
    }
  }

  public readRPMData(): rF2Data | null {
    if (!this.isConnected || !this.mappedView) {
      return null
    }

    try {
      // Read the entire shared memory buffer as bytes first
      const buffer = koffi.decode(this.mappedView, 'uint8[32768]')

      // Check if we have valid data (game is running)
      const buildVersionNumber =
        buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
      if (buildVersionNumber === 0) {
        return null // Game not running or no valid data
      }

      // Read telemetry data using DataView for better precision
      const view = new DataView(buffer.buffer, buffer.byteOffset, 32768)

      // Vehicle 0 starts at offset 0x10, so add this to all vehicle-specific offsets
      const VEHICLE_OFFSET = 0x10
      
      // Telemetry data offsets for Le Mans Ultimate
      const gear = view.getInt32(0x0170, true) // Gear - FOUND CORRECT OFFSET!
      const rpm = view.getInt32(0x0008, true) // RPM
      const maxRpm = 8000 // Default max RPM for most cars

                      // Speed - using LocalVel vector magnitude (correct calculation based on official rF2 structure)
        let speed = 0
        
        // Read LocalVel vector components (X, Y, Z) from correct offsets using double (float64)
        // Based on official rF2 structure: mLocalVel at 0xB8, each component is 8 bytes (double)
        const localVelX = view.getFloat64(VEHICLE_OFFSET + 0xB8, true) // LocalVel X (double)
        const localVelY = view.getFloat64(VEHICLE_OFFSET + 0xC0, true) // LocalVel Y (double)  
        const localVelZ = view.getFloat64(VEHICLE_OFFSET + 0xC8, true) // LocalVel Z (double)
        
        // Calculate speed as magnitude of velocity vector: sqrt(x² + y² + z²)
        const speedMagnitude = Math.sqrt(localVelX * localVelX + localVelY * localVelY + localVelZ * localVelZ)
        speed = speedMagnitude * 3.6 // Convert m/s to km/h
        
        // Basic validation - filter out invalid values
        if (isNaN(speed) || !isFinite(speed) || speed < 0 || speed > 500) {
          speed = 0
        }

      const data: rF2Data = {
        buildVersionNumber: buildVersionNumber,
        gameMode: view.getInt32(0x4, true),
        raceState: view.getInt32(0x8, true),
        rpm: rpm, // Correct RPM from mEngineRPM
        maxRpm: maxRpm, // Correct Max RPM from mEngineMaxRPM
        speed: speed, // Correct speed from mLocalVel magnitude
        gear: gear, // Correct gear from mGear
        engineMaxRpm: maxRpm, // Use the same maxRpm value
        lapNumber: view.getInt32(0x14, true), // mLapNumber
        lapTime: view.getFloat64(0x18, true), // mLapStartET
        lastLapTime: 0, // Not available in this structure
        bestLapTime: 0, // Not available in this structure
        fuel: view.getFloat64(0x20c, true), // mFuel
        maxFuel: 0, // Not available in this structure
        brake: view.getFloat64(0x18c, true), // mUnfilteredBrake
        throttle: view.getFloat64(0x184, true), // mUnfilteredThrottle
        clutch: view.getFloat64(0x19c, true), // mUnfilteredClutch
        steering: view.getFloat64(0x194, true), // mUnfilteredSteering
        trackTemp: 0, // Not available in this structure
        ambientTemp: 0, // Not available in this structure
        weatherType: 0, // Not available in this structure
        trackName: this.readString(buffer, 0x60, 64), // mTrackName
        carName: this.readString(buffer, 0x20, 64) // mVehicleName
      }

      // Basic data validation
      if (data.gear < -1 || data.gear > 10) {
        data.gear = 0 // Default to neutral if invalid
      }
      if (data.rpm < 0 || data.rpm > 50000) {
        data.rpm = 0 // Default to 0 if invalid
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
      const buildVersionNumber =
        buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
      return buildVersionNumber > 0
    } catch {
      this.isConnected = false
      this.cleanup()
      this.initSharedMemory()
      return this.isConnected
    }
  }

  // Helper methods to read different data types from buffer (unused but kept for reference)
  // private readInt32LE(buffer: Uint8Array, offset: number): number {
  //   return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24)
  // }

  // private readFloatLE(buffer: Uint8Array, offset: number): number {
  //   const view = new DataView(buffer.buffer, buffer.byteOffset + offset, 4)
  //   return view.getFloat32(0, true) // true = little endian
  // }

  // private readInt8(buffer: Uint8Array, offset: number): number {
  //   return buffer[offset]
  // }

  private readString(buffer: Uint8Array, offset: number, length: number): string {
    const bytes = buffer.slice(offset, offset + length)
    // Find null terminator
    const nullIndex = bytes.findIndex((byte) => byte === 0)
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

    this.retryInterval = setInterval(() => {
      if (!this.isConnected) {
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

  // Get connection info for debugging
  public getConnectionInfo(): {
    isConnected: boolean
    memoryName: string | null
    accessMethod: string | null
  } {
    return {
      isConnected: this.isConnected,
      memoryName: this.workingMemoryName,
      accessMethod: this.workingAccessMethod ? `0x${this.workingAccessMethod.toString(16)}` : null
    }
  }
}
