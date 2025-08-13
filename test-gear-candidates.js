const koffi = require('koffi')

console.log('🔍 Testing Gear Candidate Offsets')
console.log('==================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

// Promising gear candidates from monitoring
const gearCandidates = [
  0x0156, // 2 → 4
  0x01da, // 4 → 5
  0x02b1, // 6 → 3
  0x0585  // 7 → 6
]

let previousValues = new Map()

function testGearCandidates() {
  try {
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, '$rFactor2SMMP_Telemetry$')
    
    if (!handle) {
      console.log('❌ Could not open shared memory handle')
      return
    }
    
    const mappedView = MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 32768)
    
    if (!mappedView) {
      console.log('❌ Could not map view of file')
      CloseHandle(handle)
      return
    }
    
    const buffer = koffi.decode(mappedView, 'uint8[32768]')
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length)
    
    console.log('🔍 Current gear candidate values:')
    console.log('================================')
    
    gearCandidates.forEach(offset => {
      const byteValue = buffer[offset]
      const int32Value = view.getInt32(offset, true)
      const floatValue = view.getFloat32(offset, true)
      
      const prevByte = previousValues.get(`byte_${offset}`)
      const prevInt32 = previousValues.get(`int32_${offset}`)
      const prevFloat = previousValues.get(`float_${offset}`)
      
      let byteChange = ''
      let int32Change = ''
      let floatChange = ''
      
      if (prevByte !== undefined && prevByte !== byteValue) {
        byteChange = ` (${prevByte} → ${byteValue})`
      }
      if (prevInt32 !== undefined && prevInt32 !== int32Value) {
        int32Change = ` (${prevInt32} → ${int32Value})`
      }
      if (prevFloat !== undefined && prevFloat !== floatValue) {
        floatChange = ` (${prevFloat.toFixed(2)} → ${floatValue.toFixed(2)})`
      }
      
      console.log(`0x${offset.toString(16).padStart(4, '0')}: byte=${byteValue}${byteChange}, int32=${int32Value}${int32Change}, float=${floatValue.toFixed(2)}${floatChange}`)
      
      previousValues.set(`byte_${offset}`, byteValue)
      previousValues.set(`int32_${offset}`, int32Value)
      previousValues.set(`float_${offset}`, floatValue)
    })
    
    // Also test some RPM candidates
    console.log('\n🏎️ RPM candidates (float values > 1000):')
    console.log('========================================')
    
    for (let offset = 0; offset < buffer.length - 4; offset += 4) {
      const value = view.getFloat32(offset, true)
      if (value > 1000 && value < 50000) {
        const prevValue = previousValues.get(`rpm_${offset}`)
        let change = ''
        if (prevValue !== undefined && Math.abs(prevValue - value) > 100) {
          change = ` (${prevValue.toFixed(0)} → ${value.toFixed(0)})`
        }
        console.log(`0x${offset.toString(16).padStart(4, '0')}: ${value.toFixed(0)} RPM${change}`)
        previousValues.set(`rpm_${offset}`, value)
      }
    }
    
    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)
    
  } catch (error) {
    console.error('❌ Error reading shared memory:', error.message)
  }
}

// Test every 500ms
setInterval(testGearCandidates, 500)

console.log('🔍 Starting gear candidate testing...')
console.log('💡 Change gears in the game to see which values change!')
console.log('Press Ctrl+C to stop\n')
