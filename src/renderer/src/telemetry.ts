function initTelemetryWindow(): void {
  console.log('🚀 Telemetry window script loaded!')
  window.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Telemetry window DOM loaded!')
    initTelemetryData()
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
  replaceTelemetryText('#gear', `Raw: ${data.gear} (${typeof data.gear})`)
  
  // Display throttle and brake as percentages (0-100%)
  const throttlePercent = Math.round((data.throttle || 0) * 100)
  const brakePercent = Math.round((data.brake || 0) * 100)
  
  replaceTelemetryText('#throttle', `${throttlePercent}%`)
  replaceTelemetryText('#brake', `${brakePercent}%`)
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

initTelemetryWindow()
