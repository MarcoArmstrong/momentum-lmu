const koffi = require('koffi')

console.log('🔍 Testing UI Data Flow')
console.log('=======================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function testUIDataFlow() {
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
    console.log('📊 Reading telemetry data every 500ms...')
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

        // Read the data using the same logic as the shared memory reader
        const gearCandidates = [
          buffer[0x156], // Original candidate
          buffer[0x02b1], // Alternative 1
          buffer[0x0585], // Alternative 2
          buffer[0x01da]  // Alternative 3
        ]
        
        let gear = 0
        for (const candidate of gearCandidates) {
          if (candidate >= 0 && candidate <= 10) {
            gear = candidate
            break
          }
        }
        
        const rpmCandidates = [
          view.getFloat32(0x588, true),
          view.getFloat32(0x68c, true),
          view.getFloat32(0x370, true),
          view.getFloat32(0x598, true)
        ]
        
        let rpm = 0
        for (const candidate of rpmCandidates) {
          if (candidate > 1000 && candidate < 50000) {
            rpm = candidate
            break
          }
        }
        
        const speed = view.getFloat32(0x20, true)
        const maxRpm = view.getFloat32(0x68c, true)

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
          previousData.speed !== currentData.speed

        if (dataChanged) {
          updateCount++
          console.log(`🔄 Update #${updateCount} - ${new Date().toLocaleTimeString()}`)
          console.log(`🏎️  RPM: ${currentData.rpm}`)
          console.log(`🔥 Max RPM: ${currentData.maxRpm}`)
          console.log(`🚗 Speed: ${currentData.speed} km/h`)
          console.log(`⚙️  Gear: ${currentData.gear}`)
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

testUIDataFlow()
