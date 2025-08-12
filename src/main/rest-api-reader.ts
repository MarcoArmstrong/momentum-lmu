import http from 'http'

// rF2 Data structure (same as shared memory version)
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

export class RestApiReader {
  private isConnected = false
  private baseUrl = 'http://localhost:6397'
  private retryInterval: NodeJS.Timeout | null = null
  private lastSuccessfulEndpoint: string | null = null
  
  // Working API endpoints discovered from Le Mans Ultimate
  private endpoints = {
    standings: '/rest/watch/standings',      // Main telemetry data (car position, velocity, lap times)
    gameState: '/rest/sessions/GetGameState', // Game phase, pit state, control status
    sessionInfo: '/rest/watch/sessionInfo',  // Lap distance, event time, player info
    pitStopEstimate: '/rest/strategy/pitstop-estimate' // Fuel usage data
  }

  constructor() {
    this.initConnection()
  }

  private async initConnection(): Promise<void> {
    console.log('Initializing REST API connection...')
    
    // Test the main standings endpoint which contains most telemetry data
    try {
      console.log(`Testing REST API endpoint: ${this.baseUrl}${this.endpoints.standings}`)
      const data = await this.fetchData(this.endpoints.standings)
      
      if (data && Array.isArray(data) && data.length > 0) {
        this.isConnected = true
        console.log(`✅ Successfully connected to REST API: ${this.baseUrl}${this.endpoints.standings}`)
        console.log(`Found ${data.length} vehicle(s) in standings data`)
        return
      }
    } catch (error) {
      console.log(`Failed to connect to standings endpoint:`, (error as Error).message)
    }
    
    console.error('Failed to connect to REST API. Make sure Le Mans Ultimate is running and in a session.')
    this.isConnected = false
    this.startRetryMechanism()
  }

  private async fetchData(endpoint: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 6397,
        path: endpoint,
        method: 'GET',
        timeout: 3000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Momentum-LMU-Overlay'
        }
      }

      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            if (data.length === 0) {
              resolve(null)
              return
            }
            
            // Try to parse as JSON
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (e) {
            // If not JSON, try to parse as raw data
            resolve({ rawData: data })
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    })
  }

  public async readRPMData(): Promise<rF2Data | null> {
    if (!this.isConnected) {
      return null
    }

    try {
      // Fetch data from multiple endpoints concurrently
      const [standingsData, gameStateData, sessionInfoData, pitStopData] = await Promise.all([
        this.fetchData(this.endpoints.standings),
        this.fetchData(this.endpoints.gameState),
        this.fetchData(this.endpoints.sessionInfo),
        this.fetchData(this.endpoints.pitStopEstimate)
      ])

      if (!standingsData || !Array.isArray(standingsData) || standingsData.length === 0) {
        return null
      }

      // Find the player's vehicle data (usually first entry or find by player name)
      const playerVehicle = standingsData[0] // Le Mans Ultimate typically puts player first
      
      if (!playerVehicle) {
        return null
      }

      // Calculate speed from velocity vector (m/s to km/h)
      const velocity = playerVehicle.carVelocity || { x: 0, y: 0, z: 0 }
      const speedMs = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z)
      const speedKmh = speedMs * 3.6

      // Extract RPM from engine data (RPM is often in engineRotation or similar)
      const rpm = playerVehicle.engineRotation || playerVehicle.rpm || 0

      // Convert REST API data to our rF2Data format using the actual LMU structure
      const rF2Data: rF2Data = {
        buildVersionNumber: 1, // Not available in REST API
        gameMode: gameStateData?.gamePhase || 0,
        raceState: gameStateData?.MultiStintState === 'DRIVING' ? 5 : 0, // 5 = green flag
        rpm: rpm,
        maxRpm: playerVehicle.engineMaxRotation || 8000,
        speed: speedKmh,
        gear: playerVehicle.gear || 0,
        engineMaxRpm: playerVehicle.engineMaxRotation || 8000,
        lapNumber: playerVehicle.lapNumber || 0,
        lapTime: playerVehicle.currentLapTime || 0,
        lastLapTime: playerVehicle.lastLapTime || 0,
        bestLapTime: playerVehicle.bestLapTime || 0,
        fuel: playerVehicle.fuel || 0,
        maxFuel: playerVehicle.maxFuel || 100,
        brake: playerVehicle.brake || 0,
        throttle: playerVehicle.throttle || 0,
        clutch: playerVehicle.clutch || 0,
        steering: playerVehicle.steering || 0,
        trackTemp: sessionInfoData?.trackTemp || 25,
        ambientTemp: sessionInfoData?.ambientTemp || 20,
        weatherType: 0, // Not readily available
        trackName: sessionInfoData?.trackName || '',
        carName: playerVehicle.carClass || ''
      }

      // Validate data - ensure we have meaningful values
      if (gameStateData?.inControlOfVehicle === false) {
        return null // Player not in control
      }

      return rF2Data
    } catch (error) {
      console.error('Error reading REST API data:', error)
      return null
    }
  }

  public isGameRunning(): boolean {
    return this.isConnected
  }

  public disconnect(): void {
    this.isConnected = false
    this.stopRetryMechanism()
  }

  private startRetryMechanism(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval)
    }
    
    console.log('Starting REST API retry mechanism - will attempt to connect to LMU API every 10 seconds...')
    this.retryInterval = setInterval(() => {
      if (!this.isConnected) {
        console.log('Retrying REST API connection...')
        this.initConnection()
      }
    }, 10000)
  }

  private stopRetryMechanism(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval)
      this.retryInterval = null
    }
  }
}
