// Canvas and graph setup
const canvas = document.getElementById('pedalsGraph') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

// Improve canvas rendering quality
ctx.imageSmoothingEnabled = false // Disable anti-aliasing for crisp lines
ctx.imageSmoothingQuality = 'high'

const canvasWidth = canvas.width
const canvasHeight = canvas.height

const colors: Record<string, string> = {
  throttle: '#00d492', // emerald-400
  brake: '#ff6467' // red-400
}

const dataPoints: Record<string, number[]> = {
  throttle: new Array(canvasWidth).fill(0),
  brake: new Array(canvasWidth).fill(0)
}

function initTelemetryWindow(): void {
  console.log('🚀 Telemetry window script loaded!')
  window.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Telemetry window DOM loaded!')
    initTelemetryData()
    initLockFunctionality()
    animateGraph()
  })
}

function initTelemetryData(): void {
  console.log('📊 Initializing telemetry data polling...')
  
  // Test IPC connection
  try {
    window.api.testTelemetryWindow().then((result) => {
      console.log('✅ IPC test result:', result)
    }).catch((error) => {
      console.error('❌ IPC test failed:', error)
    })
  } catch (error) {
    console.error('❌ IPC test error:', error)
  }
  
  // Start telemetry polling
  setInterval(async () => {
    try {
      const isRunning = await window.api.isGameRunning()
      await updateTelemetryConnectionStatus(isRunning)
      
      if (isRunning) {
        const data = await window.api.getRpmData()
        if (data) {
          updateTelemetryDisplay(data)
        }
      }
    } catch (error) {
      console.error('Error reading telemetry:', error)
      updateTelemetryConnectionStatus(false)
    }
  }, 50) // Update every 50ms for more responsive UI
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateTelemetryDisplay(data: any): void {
  replaceTelemetryText('#rpm', Math.round(data.rpm).toString())
  replaceTelemetryText('#maxRpm', Math.round(data.maxRpm).toString())
  replaceTelemetryText('#speed', data.speed.toFixed(0)) // Speed is already in km/h from shared memory
  replaceTelemetryText('#gear', data.gear)
  
  // Display throttle and brake as percentages (0-100%)
  const throttlePercent = Math.round((data.throttle || 0) * 100)
  const brakePercent = Math.round((data.brake || 0) * 100)
  
  replaceTelemetryText('#throttle', `${throttlePercent}`)
  replaceTelemetryText('#brake', `${brakePercent}`)

  // Update throttle and brake bars
  const throttleBar = document.getElementById('throttleBar') as HTMLDivElement
  const brakeBar = document.getElementById('brakeBar') as HTMLDivElement
  
  throttleBar.style.height = `${throttlePercent}%`
  brakeBar.style.height = `${brakePercent}%`
  
  // Update pedal graph
  updatePedalGraph(data.throttle || 0, data.brake || 0)
}

function drawGraph(): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  const padding = 0
  const usableHeight = canvasHeight - padding * 2
  
  for (const pedal of ['throttle', 'brake']) {
    const color = colors[pedal]
    const values = dataPoints[pedal]
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2 // Use integer line width for crisp rendering
    ctx.lineCap = 'round' // Round line caps for smoother appearance
    ctx.lineJoin = 'round' // Round line joins for smoother curves
    
    for (let i = 0; i < values.length; i++) {
      const val = values[values.length - 1 - i]
      const x = canvasWidth - 1 - i
      const y = padding + (1 - val) * usableHeight
      if (i == 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.stroke()
  }
}

function updatePedalGraph(throttle: number, brake: number): void {
  dataPoints.throttle.push(throttle)
  dataPoints.brake.push(brake)
  
  dataPoints.throttle = dataPoints.throttle.slice(-canvasWidth)
  dataPoints.brake = dataPoints.brake.slice(-canvasWidth)
}

function animateGraph(): void {
  drawGraph()
  requestAnimationFrame(animateGraph)
}

async function updateTelemetryConnectionStatus(isConnected: boolean): Promise<void> {
  const statusElement = document.querySelector<HTMLElement>('#status')
  if (statusElement) {
    if (isConnected) {
      statusElement.textContent = 'Connected'
      statusElement.className = 'text-xs font-semibold text-green-400'
    } else {
      statusElement.textContent = 'Disconnected'
      statusElement.className = 'text-xs font-semibold text-red-400'
    }
  }
}

function replaceTelemetryText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    element.innerText = text
  }
}

// Lock functionality
let isLocked = true

function initLockFunctionality(): void {
  // Listen for lock change messages from main process
  window.api.onTelemetryLockChanged((locked) => {
    isLocked = locked
    updateLockUI()
    console.log(`🔒 Telemetry window ${isLocked ? 'locked' : 'unlocked'}`)
  })
}

function updateLockUI(): void {
  const telemetryContainer = document.querySelector<HTMLElement>('#app')
  const lockIndicator = document.querySelector<HTMLElement>('#lockIndicator')
  const dragZone = document.querySelector<HTMLElement>('#dragZone')
  
  if (telemetryContainer) {
    if (isLocked) {
      telemetryContainer.classList.remove('is-unlocked')
    } else {
      // Add a subtle visual indicator
      telemetryContainer.classList.add('is-unlocked')
    }
  }
  
  if (lockIndicator) {
    if (isLocked) {
      lockIndicator.textContent = 'Press F7 to unlock and move window'
      lockIndicator.className = 'text-xs text-gray-500'
    } else {
      lockIndicator.textContent = 'Press F7 to lock window (currently movable)'
      lockIndicator.className = 'text-xs text-blue-400 font-semibold'
    }
  }
  
  if (dragZone) {
    if (isLocked) {
      dragZone.classList.add('hidden')
      dragZone.classList.remove('-webkit-app-region-drag')
    } else {
      dragZone.classList.remove('hidden')
      dragZone.classList.add('-webkit-app-region-drag')
    }
  }
}

initTelemetryWindow()
