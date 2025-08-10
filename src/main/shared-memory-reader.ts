import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
        console.log('macOS detected - using alternative approach')
        await this.tryMacOSSharedMemory()
      } else {
        console.log('Windows detected - using Windows shared memory')
        await this.tryWindowsSharedMemory()
      }
    } catch (error) {
      console.error('Failed to connect to shared memory:', error)
      console.log('Falling back to mock data')
      this.useMock = true
      this.initMockData()
    }
  }

  private async tryMacOSSharedMemory(): Promise<void> {
    // On macOS, we'll try to use a different approach
    // For now, we'll check if the game process is running
    try {
      const { stdout } = await execAsync('ps aux | grep -i "le mans ultimate" | grep -v grep')
      if (stdout.trim()) {
        console.log('Le Mans Ultimate process detected')
        // TODO: Implement macOS shared memory reading
        // For now, fall back to mock
        this.useMock = true
        this.initMockData()
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

  private async tryWindowsSharedMemory(): Promise<void> {
    try {
      console.log('Attempting to connect to Windows shared memory...')
      
      // Dynamic import for Windows-specific modules
      if (process.platform === 'win32') {
        const ffi = require('ffi-napi')
        const ref = require('ref-napi')
        
        // Windows API functions for shared memory
        const kernel32 = ffi.Library('kernel32', {
          'OpenFileMappingA': ['pointer', ['ulong', 'bool', 'string']],
          'MapViewOfFile': ['pointer', ['pointer', 'ulong', 'ulong', 'ulong', 'size_t']],
          'UnmapViewOfFile': ['bool', ['pointer']],
          'CloseHandle': ['bool', ['pointer']]
        })

        const FILE_MAP_READ = 0x0004
        const PAGE_READONLY = 0x0002

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
        console.log('Not on Windows, using mock data')
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
    if (!this.sharedMemoryHandle || process.platform !== 'win32') {
      return null
    }

    try {
      const { view } = this.sharedMemoryHandle
      const ref = require('ref-napi')
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
}
