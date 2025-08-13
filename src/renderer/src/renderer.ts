function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    initTelemetry()
  })
}

function initTelemetry(): void {
  // Start telemetry polling
  setInterval(async () => {
    try {
      const isRunning = await window.api.isGameRunning()
      await updateConnectionStatus(isRunning)
      
      if (isRunning) {
        const data = await window.api.getRpmData()
        if (data) {
          updateTelemetryDisplay(data)
        }
      }
    } catch (error) {
      console.error('Error reading telemetry:', error)
      updateConnectionStatus(false)
    }
  }, 50) // Update every 50ms for more responsive UI
}

function updateTelemetryDisplay(data: any): void {
  // Debug logging to see what data we're receiving
  console.log('📊 UI Update:', {
    rpm: Math.round(data.rpm),
    maxRpm: Math.round(data.maxRpm),
    speed: Math.round(data.speed * 3.6),
    gear: data.gear
  })
  
  replaceText('#rpm', Math.round(data.rpm).toString())
  replaceText('#maxRpm', Math.round(data.maxRpm).toString())
  replaceText('#speed', Math.round(data.speed * 3.6).toString()) // Convert m/s to km/h
  replaceText('#gear', data.gear.toString())
}

async function updateConnectionStatus(isConnected: boolean): Promise<void> {
  const statusElement = document.querySelector<HTMLElement>('#status')
  if (statusElement) {
    if (isConnected) {
      statusElement.textContent = 'Connected to Le Mans Ultimate'
      statusElement.className = 'text-sm font-semibold text-green-400'
    } else {
      statusElement.textContent = 'Disconnected - Start Le Mans Ultimate'
      statusElement.className = 'text-sm font-semibold text-red-400'
    }
  }

  // Update connection method
  const methodElement = document.querySelector<HTMLElement>('#method')
  if (methodElement) {
    try {
      const method = await window.api.getConnectionMethod()
      methodElement.textContent = method
    } catch (error) {
      methodElement.textContent = 'Error'
    }
  }

  // Update debug info
  const debugElement = document.querySelector<HTMLElement>('#debug')
  if (debugElement) {
    try {
      const debugInfo = await window.api.getDebugInfo()
      debugElement.textContent = JSON.stringify(debugInfo, null, 2)
    } catch (error) {
      debugElement.textContent = 'Error loading debug info'
    }
  }
}

function replaceText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    element.innerText = text
  }
}

init()
