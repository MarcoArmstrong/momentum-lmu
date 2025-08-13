const koffi = require('koffi')

console.log('🔍 Testing Actual Data Structure Offsets')
console.log('=======================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function testActualOffsets() {
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
    console.log('📊 Reading telemetry data with ACTUAL offsets...')
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

        // Use the ACTUAL offsets from the real data structure
        const gear = view.getInt32(0x000c, true) // Gear (int32) - found from actual data!
        const speed = view.getFloat64(0x00b8, true) // Speed (double) - found from actual data!
        const rpm = 0 // RPM not found yet
        const maxRpm = 0 // Max RPM not found yet

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
          console.log(`📊 Raw values - Speed: ${speed.toFixed(2)} m/s`)
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

testActualOffsets()
