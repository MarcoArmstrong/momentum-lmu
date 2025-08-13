const koffi = require('koffi')

console.log('🔍 Finding Correct Offsets from Actual Data')
console.log('==========================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function findCorrectOffsets() {
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
    console.log('📊 Analyzing data structure...')
    console.log('')

    const buffer = koffi.decode(mappedView, 'uint8[1024]')
    const view = new DataView(buffer.buffer, buffer.byteOffset, 1024)
    
    // Based on the hex dump analysis, let's test the likely offsets
    console.log('=== TESTING LIKELY OFFSETS ===')
    
    // Test gear candidates (int32 values around 0-10)
    console.log('Testing gear candidates:')
    const gearCandidates = [0x000c, 0x0010, 0x0024, 0x0050, 0x0054, 0x0058, 0x005c, 0x0060, 0x0064, 0x0068, 0x006c, 0x0090, 0x0094, 0x0098, 0x009c, 0x00a0, 0x00a4, 0x00a8, 0x00ac, 0x00b8]
    
    for (const offset of gearCandidates) {
      try {
        const value = view.getInt32(offset, true)
        if (value >= -1 && value <= 10) {
          console.log(`  0x${offset.toString(16).padStart(4, '0')}: ${value} (possible gear)`)
        }
      } catch (error) {
        // Skip if we can't read
      }
    }
    
    console.log('')
    console.log('Testing speed candidates:')
    const speedCandidates = [0x00b0, 0x00b8, 0x00c0, 0x00c8, 0x00d0, 0x00d8, 0x00e0, 0x00e8, 0x00f0, 0x00f8, 0x0100, 0x0108, 0x0110, 0x0118, 0x0120, 0x0128, 0x0130, 0x0138, 0x0140, 0x0148, 0x0150, 0x0158, 0x0160, 0x0168, 0x0170, 0x0178, 0x0180, 0x0188, 0x0190, 0x0198, 0x01a0, 0x01a8, 0x01b0, 0x01b8, 0x01c0, 0x01c8, 0x01d0, 0x01d8, 0x01e0, 0x01e8, 0x01f0, 0x01f8]
    
    for (const offset of speedCandidates) {
      try {
        const value = view.getFloat64(offset, true)
        if (value > 0 && value < 500) {
          console.log(`  0x${offset.toString(16).padStart(4, '0')}: ${value.toFixed(2)} m/s (${(value * 3.6).toFixed(1)} km/h)`)
        }
      } catch (error) {
        // Skip if we can't read
      }
    }
    
    console.log('')
    console.log('Testing RPM candidates:')
    const rpmCandidates = [0x0170, 0x0178, 0x0180, 0x0188, 0x0190, 0x0198, 0x01a0, 0x01a8, 0x01b0, 0x01b8, 0x01c0, 0x01c8, 0x01d0, 0x01d8, 0x01e0, 0x01e8, 0x01f0, 0x01f8]
    
    for (const offset of rpmCandidates) {
      try {
        const value = view.getFloat64(offset, true)
        if (value > 1000 && value < 50000) {
          console.log(`  0x${offset.toString(16).padStart(4, '0')}: ${value.toFixed(0)} RPM`)
        }
      } catch (error) {
        // Skip if we can't read
      }
    }
    
    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

findCorrectOffsets()
