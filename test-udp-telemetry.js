const dgram = require('dgram')

console.log('Testing for UDP telemetry broadcasts from Le Mans Ultimate...')
console.log('Many racing games send real-time telemetry via UDP packets')
console.log('')

// Common UDP ports used by racing games for telemetry
const commonPorts = [
  20777, // F1 series
  20888, // Dirt Rally
  9999,  // Generic
  12000, // Generic
  30000, // rFactor/ISI engine
  30001, // rFactor/ISI engine
  5606,  // Forza
  5607,  // Forza
  1024,  // Generic
  20202, // PCARS
]

const listeners = []

function createUdpListener(port) {
  const server = dgram.createSocket('udp4')
  
  server.on('error', (err) => {
    // Silently handle port in use errors
  })

  server.on('message', (msg, rinfo) => {
    console.log(`🎯 UDP DATA RECEIVED on port ${port}!`)
    console.log(`   From: ${rinfo.address}:${rinfo.port}`)
    console.log(`   Size: ${msg.length} bytes`)
    console.log(`   First 64 bytes (hex): ${msg.toString('hex', 0, Math.min(64, msg.length))}`)
    console.log(`   First 64 bytes (ascii): ${msg.toString('ascii', 0, Math.min(64, msg.length)).replace(/[^\x20-\x7E]/g, '.')}`)
    
    // Try to detect data patterns that suggest telemetry
    if (msg.length >= 4) {
      const floatArray = []
      for (let i = 0; i < Math.min(16, Math.floor(msg.length / 4)); i++) {
        const float = msg.readFloatLE(i * 4)
        if (!isNaN(float) && isFinite(float)) {
          floatArray.push(float.toFixed(2))
        }
      }
      if (floatArray.length > 0) {
        console.log(`   Interpreted as floats: ${floatArray.join(', ')}`)
      }
    }
    console.log('')
  })

  server.on('listening', () => {
    const address = server.address()
    console.log(`📡 UDP listener started on port ${address.port}`)
  })

  try {
    server.bind(port)
    listeners.push(server)
  } catch (err) {
    // Port might be in use
  }
}

console.log('Starting UDP listeners on common telemetry ports...')
console.log('Leave this running while you drive in Le Mans Ultimate')
console.log('Press Ctrl+C to stop')
console.log('')

// Start listeners on all common ports
commonPorts.forEach(port => {
  createUdpListener(port)
})

// Also check game settings
console.log('💡 IMPORTANT: In Le Mans Ultimate, check if there are settings for:')
console.log('   - UDP Telemetry Output')
console.log('   - External API/Broadcast')
console.log('   - Telemetry Export')
console.log('   - Data Export to External Applications')
console.log('')
console.log('   These settings are often in:')
console.log('   - Graphics/Display settings')
console.log('   - Gameplay settings') 
console.log('   - Advanced/Developer options')
console.log('')

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping UDP listeners...')
  listeners.forEach(server => {
    server.close()
  })
  console.log('Done.')
  process.exit(0)
})

// Timeout after 60 seconds if no data received
setTimeout(() => {
  console.log('⏰ No UDP telemetry detected after 60 seconds.')
  console.log('')
  console.log('This suggests Le Mans Ultimate either:')
  console.log('1. Doesn\'t broadcast UDP telemetry')
  console.log('2. Uses different ports than tested')
  console.log('3. Requires enabling UDP output in game settings')
  console.log('4. Only broadcasts when actively driving (not paused)')
  console.log('')
  console.log('Try starting/driving your car and run this again!')
  
  listeners.forEach(server => server.close())
  process.exit(0)
}, 60000)
