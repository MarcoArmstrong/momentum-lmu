const koffi = require('koffi')

console.log('🔍 Finding RPM and Gear Offsets')
console.log('===============================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function findRPMAndGear() {
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
    console.log('📊 Scanning for RPM and Gear data...')
    console.log('')

    const buffer = koffi.decode(mappedView, 'uint8[32768]')
    const view = new DataView(buffer.buffer, buffer.byteOffset, 32768)
    
    // Scan for RPM values (should be between 1000-50000)
    console.log('=== SCANNING FOR RPM (1000-50000) ===')
    const rpmCandidates = []
    
    for (let offset = 0; offset < 2048; offset += 4) {
      try {
        const float64 = view.getFloat64(offset, true)
        const float32 = view.getFloat32(offset, true)
        
        if (float64 >= 1000 && float64 <= 50000) {
          rpmCandidates.push({ offset, value: float64, type: 'float64' })
        }
        if (float32 >= 1000 && float32 <= 50000) {
          rpmCandidates.push({ offset, value: float32, type: 'float32' })
        }
      } catch (error) {
        // Skip if we can't read
      }
    }
    
    console.log(`Found ${rpmCandidates.length} RPM candidates:`)
    rpmCandidates.slice(0, 10).forEach(candidate => {
      console.log(`  0x${candidate.offset.toString(16).padStart(4, '0')}: ${candidate.value.toFixed(0)} (${candidate.type})`)
    })
    
    // Scan for gear values (should be -1 to 10)
    console.log('')
    console.log('=== SCANNING FOR GEAR (-1 to 10) ===')
    const gearCandidates = []
    
    for (let offset = 0; offset < 2048; offset += 4) {
      try {
        const int32 = view.getInt32(offset, true)
        const int16 = view.getInt16(offset, true)
        const int8 = view.getInt8(offset)
        
        if (int32 >= -1 && int32 <= 10) {
          gearCandidates.push({ offset, value: int32, type: 'int32' })
        }
        if (int16 >= -1 && int16 <= 10) {
          gearCandidates.push({ offset, value: int16, type: 'int16' })
        }
        if (int8 >= -1 && int8 <= 10) {
          gearCandidates.push({ offset, value: int8, type: 'int8' })
        }
      } catch (error) {
        // Skip if we can't read
      }
    }
    
    console.log(`Found ${gearCandidates.length} gear candidates:`)
    gearCandidates.slice(0, 10).forEach(candidate => {
      console.log(`  0x${candidate.offset.toString(16).padStart(4, '0')}: ${candidate.value} (${candidate.type})`)
    })
    
    // Test current offsets
    console.log('')
    console.log('=== CURRENT OFFSETS TEST ===')
    console.log(`Current gear offset 0x000c: ${view.getInt32(0x000c, true)}`)
    console.log(`Current speed offset 0x00b0: ${view.getFloat64(0x00b0, true).toFixed(2)}`)
    
    // Test some promising RPM offsets from the scan
    console.log('')
    console.log('=== TESTING PROMISING RPM OFFSETS ===')
    const testRPMOffsets = [0x0164, 0x0170, 0x0178, 0x0180, 0x0188, 0x0190, 0x0198, 0x01a0, 0x01a8, 0x01b0]
    
    testRPMOffsets.forEach(offset => {
      try {
        const float64 = view.getFloat64(offset, true)
        const float32 = view.getFloat32(offset, true)
        console.log(`0x${offset.toString(16).padStart(4, '0')}: float64=${float64.toFixed(0)}, float32=${float32.toFixed(0)}`)
      } catch (error) {
        // Skip if we can't read
      }
    })
    
    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

findRPMAndGear()
