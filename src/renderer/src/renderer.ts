function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Main window loaded, initializing connection status...')
    initConnectionStatus()
  })
}

function initConnectionStatus(): void {
  // Start connection status polling (less frequent since we don't need real-time telemetry here)
  setInterval(async () => {
    try {
      const isRunning = await window.api.isGameRunning()
      await updateConnectionStatus(isRunning)
    } catch (error) {
      console.error('Error checking connection:', error)
      updateConnectionStatus(false)
    }
  }, 1000) // Update every second for connection status
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
    } catch {
      methodElement.textContent = 'Error'
    }
  }

  // Update debug info
  const debugElement = document.querySelector<HTMLElement>('#debug')
  if (debugElement) {
    try {
      const debugInfo = await window.api.getDebugInfo()
      debugElement.textContent = JSON.stringify(debugInfo, null, 2)
    } catch {
      debugElement.textContent = 'Error loading debug info'
    }
  }
}

init()
