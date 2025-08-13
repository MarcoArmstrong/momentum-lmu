const koffi = require('koffi')

console.log('🔍 Scanning Memory While Driving')
console.log('=================================')
console.log('')
console.log('💡 Drive in the game and shift gears to help find correct offsets!')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function scanMemoryWhileDriving() {
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
    console.log('📊 Scanning for changing values while you drive...')
    console.log('')

    let previousValues = new Map()
    let scanCount = 0

    const interval = setInterval(() => {
      try {
        const buffer = koffi.decode(mappedView, 'uint8[32768]')
        const view = new DataView(buffer.buffer, buffer.byteOffset, 32768)
        
        scanCount++
        
        // Scan for gear values (int32, int16, int8)
        console.log(`\n🔄 Scan #${scanCount} - ${new Date().toLocaleTimeString()}`)
        console.log('=== GEAR CANDIDATES ===')
        
        for (let offset = 0; offset < 512; offset += 4) {
          try {
            const int32 = view.getInt32(offset, true)
            const int16 = view.getInt16(offset, true)
            const int8 = view.getInt8(offset)
            
            // Look for reasonable gear values
            if (int32 >= -1 && int32 <= 10) {
              const key = `gear_int32_${offset}`
              const currentValue = int32
              const previousValue = previousValues.get(key)
              
              if (previousValue !== currentValue) {
                console.log(`⚙️  0x${offset.toString(16).padStart(4, '0')}: ${currentValue} (int32) - CHANGED from ${previousValue}`)
                previousValues.set(key, currentValue)
              }
            }
            
            if (int16 >= -1 && int16 <= 10) {
              const key = `gear_int16_${offset}`
              const currentValue = int16
              const previousValue = previousValues.get(key)
              
              if (previousValue !== currentValue) {
                console.log(`⚙️  0x${offset.toString(16).padStart(4, '0')}: ${currentValue} (int16) - CHANGED from ${previousValue}`)
                previousValues.set(key, currentValue)
              }
            }
            
            if (int8 >= -1 && int8 <= 10) {
              const key = `gear_int8_${offset}`
              const currentValue = int8
              const previousValue = previousValues.get(key)
              
              if (previousValue !== currentValue) {
                console.log(`⚙️  0x${offset.toString(16).padStart(4, '0')}: ${currentValue} (int8) - CHANGED from ${previousValue}`)
                previousValues.set(key, currentValue)
              }
            }
          } catch (error) {
            // Skip if we can't read
          }
        }
        
        // Scan for RPM values (float64, float32)
        console.log('\n=== RPM CANDIDATES ===')
        for (let offset = 0; offset < 2048; offset += 4) {
          try {
            const float64 = view.getFloat64(offset, true)
            const float32 = view.getFloat32(offset, true)
            
            // Look for reasonable RPM values
            if (float64 >= 1000 && float64 <= 50000) {
              const key = `rpm_float64_${offset}`
              const currentValue = Math.round(float64)
              const previousValue = previousValues.get(key)
              
              if (previousValue !== currentValue) {
                console.log(`🏎️  0x${offset.toString(16).padStart(4, '0')}: ${currentValue} RPM (float64) - CHANGED from ${previousValue}`)
                previousValues.set(key, currentValue)
              }
            }
            
            if (float32 >= 1000 && float32 <= 50000) {
              const key = `rpm_float32_${offset}`
              const currentValue = Math.round(float32)
              const previousValue = previousValues.get(key)
              
              if (previousValue !== currentValue) {
                console.log(`🏎️  0x${offset.toString(16).padStart(4, '0')}: ${currentValue} RPM (float32) - CHANGED from ${previousValue}`)
                previousValues.set(key, currentValue)
              }
            }
          } catch (error) {
            // Skip if we can't read
          }
        }
        
        // Scan for speed values (positive float64, float32)
        console.log('\n=== SPEED CANDIDATES ===')
        for (let offset = 0; offset < 2048; offset += 4) {
          try {
            const float64 = view.getFloat64(offset, true)
            const float32 = view.getFloat32(offset, true)
            
            // Look for reasonable positive speed values
            if (float64 > 0 && float64 < 200) {
              const key = `speed_float64_${offset}`
              const currentValue = Math.round(float64 * 3.6) // Convert to km/h
              const previousValue = previousValues.get(key)
              
              if (previousValue !== currentValue) {
                console.log(`🚗  0x${offset.toString(16).padStart(4, '0')}: ${currentValue} km/h (float64) - CHANGED from ${previousValue}`)
                previousValues.set(key, currentValue)
              }
            }
            
            if (float32 > 0 && float32 < 200) {
              const key = `speed_float32_${offset}`
              const currentValue = Math.round(float32 * 3.6) // Convert to km/h
              const previousValue = previousValues.get(key)
              
              if (previousValue !== currentValue) {
                console.log(`🚗  0x${offset.toString(16).padStart(4, '0')}: ${currentValue} km/h (float32) - CHANGED from ${previousValue}`)
                previousValues.set(key, currentValue)
              }
            }
          } catch (error) {
            // Skip if we can't read
          }
        }
        
        // Only show scans every 10 seconds to avoid spam
        if (scanCount % 20 === 0) {
          console.log('\n💡 Keep driving and shifting gears to see more changes!')
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
      console.log('\n🛑 Stopping scan...')
      clearInterval(interval)
      cleanup()
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

scanMemoryWhileDriving()
