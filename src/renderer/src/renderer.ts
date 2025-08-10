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
      updateConnectionStatus(isRunning)
      
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
  }, 100) // Update every 100ms
}

function updateTelemetryDisplay(data: any): void {
  replaceText('#rpm', Math.round(data.rpm).toString())
  replaceText('#maxRpm', Math.round(data.maxRpm).toString())
  replaceText('#speed', Math.round(data.speed * 3.6).toString()) // Convert m/s to km/h
  replaceText('#gear', data.gear.toString())
}

function updateConnectionStatus(isConnected: boolean): void {
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
}

function replaceText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    element.innerText = text
  }
}

init()
