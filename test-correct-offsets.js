const koffi = require('koffi')

console.log('🔍 Testing Correct rF2 Offsets')
console.log('==============================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function testCorrectOffsets() {
  try {
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, '$rFactor2SMMP_Telemetry$')
    
    if (!handle) {
      console.log('❌ Could not open shared memory')
      return
    }

    const mappedView = MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 32768)
    
    if (!mappedView) {
      console.log('❌ Could not map view of file')
      CloseHandle(handle)
      return
    }

    console.log('✅ Connected to shared memory')
    console.log('📊 Reading telemetry data with CORRECT offsets...')
    console.log('')

    let previousData = null
    let updateCount = 0

    const interval = setInterval(() => {
      try {
        const buffer = koffi.decode(mappedView, 'uint8[32768]')
        const view = new DataView(buffer.buffer, buffer.byteOffset, 32768)
        
        // Check if we have valid data
        const buildVersionNumber = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
        if (buildVersionNumber === 0) {
          console.log('⏸️  No valid data (game not in driving state)')
          return
        }

        // Use the CORRECT offsets from the official rF2 data structure
        const gear = view.getInt32(0x160, true) // mGear (int32)
        const rpm = view.getFloat64(0x164, true) // mEngineRPM (double)
        const maxRpm = view.getFloat64(0x214, true) // mEngineMaxRPM (double)
        
        // Speed calculation - use mLocalVel.x for forward speed (most common)
        const speedX = view.getFloat64(0x0b8, true) // mLocalVel.x (double)
        const speedY = view.getFloat64(0x0c0, true) // mLocalVel.y (double) 
        const speedZ = view.getFloat64(0x0c8, true) // mLocalVel.z (double)
        
        // Calculate speed magnitude (sqrt(x² + y² + z²))
        const speed = Math.sqrt(speedX * speedX + speedY * speedY + speedZ * speedZ)

        const currentData = {
          rpm: Math.round(rpm),
          maxRpm: Math.round(maxRpm),
          speed: Math.round(speed * 3.6), // Convert to km/h
          gear: gear
        }

        // Check if data changed
        const dataChanged = !previousData || 
          previousData.rpm !== currentData.rpm ||
          previousData.gear !== currentData.gear ||
          previousData.speed !== currentData.speed ||
          Math.abs(previousData.speed - currentData.speed) > 1 // Speed changes more than 1 km/h

        if (dataChanged) {
          updateCount++
          console.log(`🔄 Update #${updateCount} - ${new Date().toLocaleTimeString()}`)
          console.log(`🏎️  RPM: ${currentData.rpm}`)
          console.log(`🔥 Max RPM: ${currentData.maxRpm}`)
          console.log(`🚗 Speed: ${currentData.speed} km/h`)
          console.log(`⚙️  Gear: ${currentData.gear}`)
          console.log(`📊 Raw values - SpeedX: ${speedX.toFixed(2)}, SpeedY: ${speedY.toFixed(2)}, SpeedZ: ${speedZ.toFixed(2)}`)
          console.log('')
          
          previousData = currentData
        }

      } catch (error) {
        console.error('❌ Error reading data:', error.message)
        clearInterval(interval)
        cleanup()
      }
    }, 500)

    // Cleanup function
    function cleanup() {
      if (mappedView) {
        UnmapViewOfFile(mappedView)
      }
      if (handle) {
        CloseHandle(handle)
      }
    }

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping test...')
      clearInterval(interval)
      cleanup()
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testCorrectOffsets()
