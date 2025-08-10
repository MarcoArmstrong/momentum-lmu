import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Import shm-typed-array for cross-platform shared memory
let shm: any = null
try {
  shm = require('shm-typed-array')
} catch (error) {
  console.log('shm-typed-array not available, falling back to platform-specific implementations')
}

// Windows-specific dependencies - only load on Windows
let ffi: any = null
let ref: any = null
if (process.platform === 'win32') {
  try {
    ffi = require('ffi-napi')
    ref = require('ref-napi')
  } catch (error: any) {
    console.log('Windows shared memory dependencies not available:', error.message)
  }
}

// Real rF2 shared memory data structure
interface rF2Data {
  rpm: number
  maxRpm: number
  speed: number
  gear: number
  engineMaxRpm: number
}

export class SharedMemoryReader {
  private isConnected = false
  private mockData: rF2Data = {
    rpm: 0,
    maxRpm: 8000,
    speed: 0,
    gear: 1,
    engineMaxRpm: 8000
  }
  private mockCounter = 0
  private useMock = process.platform !== 'win32' // Use mock on non-Windows platforms
  private sharedMemoryHandle: any = null
  private shmBuffer: any = null
  private shmKey: string | number | null = null

  constructor() {
    this.initTelemetry()
  }

  private async initTelemetry(): Promise<void> {
    if (this.useMock) {
      this.initMockData()
      return
    }

    // Try to connect to real shared memory
    await this.tryConnectToSharedMemory()
  }

  private initMockData(): void {
    console.log('Initializing mock telemetry data for testing')
    this.isConnected = true
    
    // Simulate realistic telemetry data
    setInterval(() => {
      this.mockCounter++
      
      // Simulate RPM changes
      if (this.mockCounter % 50 < 25) {
        this.mockData.rpm = Math.min(8000, this.mockData.rpm + 200)
      } else {
        this.mockData.rpm = Math.max(800, this.mockData.rpm - 150)
      }
      
      // Simulate speed changes based on RPM
      this.mockData.speed = Math.round(this.mockData.rpm / 100)
      
      // Simulate gear changes
      if (this.mockData.rpm > 7500) {
        this.mockData.gear = Math.min(6, this.mockData.gear + 1)
        this.mockData.rpm = 2000
      } else if (this.mockData.rpm < 1000 && this.mockData.gear > 1) {
        this.mockData.gear = Math.max(1, this.mockData.gear - 1)
        this.mockData.rpm = 6000
      }
    }, 100)
  }

  private async tryConnectToSharedMemory(): Promise<void> {
    try {
      console.log('Attempting to connect to real shared memory...')
      
      // Check if we're on macOS
      if (process.platform === 'darwin') {
        console.log('macOS detected - using shm-typed-array approach')
        await this.tryMacOSSharedMemory()
      } else if (process.platform === 'win32') {
        console.log('Windows detected - using Windows shared memory')
        await this.tryWindowsSharedMemory()
      } else {
        console.log('Linux detected - using shm-typed-array approach')
        await this.tryLinuxSharedMemory()
      }
    } catch (error) {
      console.error('Failed to connect to shared memory:', error)
      console.log('Falling back to mock data')
      this.useMock = true
      this.initMockData()
    }
  }

  private async tryMacOSSharedMemory(): Promise<void> {
    if (!shm) {
      console.log('shm-typed-array not available, using mock data')
      this.useMock = true
      this.initMockData()
      return
    }

    try {
      // Check if the game process is running
      const { stdout } = await execAsync('ps aux | grep -i "le mans ultimate" | grep -v grep')
      if (stdout.trim()) {
        console.log('Le Mans Ultimate process detected')
        
        // Try to connect to existing shared memory or create new one
        await this.tryShmConnection()
      } else {
        console.log('Le Mans Ultimate not running')
        this.useMock = true
        this.initMockData()
      }
    } catch (error) {
      console.log('Error checking for game process:', error)
      this.useMock = true
      this.initMockData()
    }
  }

  private async tryLinuxSharedMemory(): Promise<void> {
    if (!shm) {
      console.log('shm-typed-array not available, using mock data')
      this.useMock = true
      this.initMockData()
      return
    }

    try {
      // Check if the game process is running
      const { stdout } = await execAsync('ps aux | grep -i "le mans ultimate" | grep -v grep')
      if (stdout.trim()) {
        console.log('Le Mans Ultimate process detected')
        
        // Try to connect to existing shared memory or create new one
        await this.tryShmConnection()
      } else {
        console.log('Le Mans Ultimate not running')
        this.useMock = true
        this.initMockData()
      }
    } catch (error) {
      console.log('Error checking for game process:', error)
      this.useMock = true
      this.initMockData()
    }
  }

  private async tryShmConnection(): Promise<void> {
    try {
      // Try different shared memory keys for rFactor 2
      const memoryKeys = [
        '/rFactor2SMMPData',
        '/rFactor2SMMPData_0',
        '/rFactor2SMMPData_1',
        '/rFactor2SMMPData_2',
        'rFactor2SMMPData',
        'rFactor2SMMPData_0',
        'rFactor2SMMPData_1',
        'rFactor2SMMPData_2'
      ]

      for (const key of memoryKeys) {
        try {
          console.log(`Trying to connect to shared memory: ${key}`)
          
          // Try to get existing shared memory
          let buffer = shm.get(key, 'Buffer')
          
          if (!buffer) {
            // Try to create new shared memory segment
            buffer = shm.create(32768, 'Buffer', key)
          }
          
          if (buffer) {
            this.shmBuffer = buffer
            this.shmKey = key
            this.isConnected = true
            console.log(`Successfully connected to: ${key}`)
            return
          }
        } catch (error) {
          console.log(`Failed to connect to ${key}:`, error)
        }
      }
      
      console.log('Failed to connect to any shared memory')
      this.useMock = true
      this.initMockData()
    } catch (error) {
      console.error('Error in shm connection:', error)
      this.useMock = true
      this.initMockData()
    }
  }

  private async tryWindowsSharedMemory(): Promise<void> {
    try {
      console.log('Attempting to connect to Windows shared memory...')
      
      // Check if Windows dependencies are available
      if (process.platform === 'win32' && ffi && ref) {
        // Windows API functions for shared memory
        const kernel32 = ffi.Library('kernel32', {
          'OpenFileMappingA': ['pointer', ['ulong', 'bool', 'string']],
          'MapViewOfFile': ['pointer', ['pointer', 'ulong', 'ulong', 'ulong', 'size_t']],
          'UnmapViewOfFile': ['bool', ['pointer']],
          'CloseHandle': ['bool', ['pointer']]
        })

        const FILE_MAP_READ = 0x0004

        // Try different shared memory names
        const memoryNames = [
          'Local\\rFactor2SMMPData',
          'Local\\rFactor2SMMPData_0',
          'Local\\rFactor2SMMPData_1',
          'Local\\rFactor2SMMPData_2'
        ]

        for (const memoryName of memoryNames) {
          try {
            console.log(`Trying to open shared memory: ${memoryName}`)
            
            const handle = kernel32.OpenFileMappingA(FILE_MAP_READ, false, memoryName)
            if (!handle.isNull()) {
              const view = kernel32.MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 32768)
              if (!view.isNull()) {
                this.sharedMemoryHandle = { handle, view, kernel32 }
                this.isConnected = true
                console.log(`Successfully connected to: ${memoryName}`)
                return
              } else {
                kernel32.CloseHandle(handle)
              }
            }
          } catch (error) {
            console.log(`Failed to open ${memoryName}:`, error)
          }
        }
        
        console.log('Failed to connect to any shared memory')
        this.useMock = true
        this.initMockData()
      } else {
        console.log('Windows shared memory dependencies not available, using mock data')
        this.useMock = true
        this.initMockData()
      }
    } catch (error) {
      console.error('Error in Windows shared memory:', error)
      this.useMock = true
      this.initMockData()
    }
  }

  public readRPMData(): rF2Data | null {
    if (!this.isConnected) {
      return null
    }

    if (this.useMock) {
      // Return mock data
      return { ...this.mockData }
    } else {
      // Read from real shared memory
      return this.readFromSharedMemory()
    }
  }

  private readFromSharedMemory(): rF2Data | null {
    if (this.shmBuffer) {
      // Read from shm-typed-array buffer
      return this.readFromShmBuffer()
    } else if (this.sharedMemoryHandle && process.platform === 'win32') {
      // Read from Windows shared memory
      return this.readFromWindowsSharedMemory()
    }
    
    return null
  }

  private readFromShmBuffer(): rF2Data | null {
    try {
      if (!this.shmBuffer) {
        return null
      }

      // Check if we have valid data (game is running)
      const buildVersionNumber = this.shmBuffer.readInt32LE(0x0)
      if (buildVersionNumber === 0) {
        return null // Game not running or no valid data
      }

      // Read telemetry data from shared memory
      const data: rF2Data = {
        rpm: this.shmBuffer.readFloatLE(0x1C), // Engine RPM
        maxRpm: this.shmBuffer.readFloatLE(0x20), // Max RPM
        speed: this.shmBuffer.readFloatLE(0x24), // Speed in m/s
        gear: this.shmBuffer.readInt8(0x28), // Current gear
        engineMaxRpm: this.shmBuffer.readFloatLE(0x2C) // Engine max RPM
      }

      // Validate data
      if (data.rpm < 0 || data.rpm > 50000 || data.speed < 0 || data.speed > 1000) {
        return null // Invalid data
      }

      return data
    } catch (error) {
      console.error('Error reading shm buffer:', error)
      return null
    }
  }

  private readFromWindowsSharedMemory(): rF2Data | null {
    if (!this.sharedMemoryHandle || process.platform !== 'win32' || !ref) {
      return null
    }

    try {
      const { view } = this.sharedMemoryHandle
      const buffer = ref.reinterpret(view, 32768, 0, ref.types.void)

      // Check if we have valid data (game is running)
      const buildVersionNumber = buffer.readInt32LE(0x0)
      if (buildVersionNumber === 0) {
        return null // Game not running or no valid data
      }

      // Read telemetry data from shared memory
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
    return this.isConnected
  }

  public disconnect(): void {
    if (this.shmBuffer && this.shmKey && shm) {
      try {
        shm.detach(this.shmKey)
        this.shmBuffer = null
        this.shmKey = null
      } catch (error) {
        console.error('Error detaching shm buffer:', error)
      }
    }
    
    if (this.sharedMemoryHandle && process.platform === 'win32') {
      try {
        const { handle, view, kernel32 } = this.sharedMemoryHandle
        kernel32.UnmapViewOfFile(view)
        kernel32.CloseHandle(handle)
        this.sharedMemoryHandle = null
      } catch (error) {
        console.error('Error closing shared memory:', error)
      }
    }
    this.isConnected = false
  }

  // Debug method to show current data
  public debugDumpMemory(): void {
    if (!this.isConnected) {
      console.log('Telemetry not running')
      return
    }

    if (this.useMock) {
      console.log('Mock telemetry data:')
      console.log(`RPM: ${this.mockData.rpm}`)
      console.log(`Max RPM: ${this.mockData.maxRpm}`)
      console.log(`Speed: ${this.mockData.speed} km/h`)
      console.log(`Gear: ${this.mockData.gear}`)
      console.log(`Engine Max RPM: ${this.mockData.engineMaxRpm}`)
    } else {
      const data = this.readFromSharedMemory()
      if (data) {
        console.log('Real telemetry data:')
        console.log(`RPM: ${data.rpm}`)
        console.log(`Max RPM: ${data.maxRpm}`)
        console.log(`Speed: ${data.speed} m/s (${Math.round(data.speed * 3.6)} km/h)`)
        console.log(`Gear: ${data.gear}`)
        console.log(`Engine Max RPM: ${data.engineMaxRpm}`)
      } else {
        console.log('No real telemetry data available')
      }
    }
  }

  // Method to toggle between mock and real data
  public toggleMockMode(): void {
    this.useMock = !this.useMock
    console.log(`Switched to ${this.useMock ? 'mock' : 'real'} mode`)
    
    if (this.useMock) {
      this.initMockData()
    } else {
      this.tryConnectToSharedMemory()
    }
  }

  // Method to get current mode
  public getCurrentMode(): string {
    return this.useMock ? 'mock' : 'real'
  }

  // Method to get shared memory info
  public getSharedMemoryInfo(): any {
    if (this.shmBuffer && shm) {
      return {
        type: 'shm-typed-array',
        key: this.shmKey,
        totalSize: shm.getTotalSize(),
        totalCreatedSize: shm.getTotalCreatedSize()
      }
    } else if (this.sharedMemoryHandle) {
      return {
        type: 'windows-shared-memory',
        handle: this.sharedMemoryHandle ? 'active' : 'none'
      }
    } else {
      return {
        type: 'mock',
        message: 'No shared memory connection'
      }
    }
  }
}
