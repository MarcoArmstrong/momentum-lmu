const koffi = require('koffi')

console.log('🔍 Testing Speed Offset and Data Types')
console.log('=====================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function testSpeedOffset() {
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
    console.log('📊 Testing speed offset 0x00b8 with different data types...')
    console.log('')

    const buffer = koffi.decode(mappedView, 'uint8[32768]')
    const view = new DataView(buffer.buffer, buffer.byteOffset, 32768)
    
    // Test different data types at offset 0x00b8
    console.log('=== TESTING OFFSET 0x00b8 ===')
    console.log(`int32: ${view.getInt32(0x00b8, true)}`)
    console.log(`uint32: ${view.getUint32(0x00b8, true)}`)
    console.log(`float32: ${view.getFloat32(0x00b8, true)}`)
    console.log(`float64: ${view.getFloat64(0x00b8, true)}`)
    console.log('')
    
    // Test nearby offsets for speed
    console.log('=== TESTING NEARBY OFFSETS ===')
    for (let offset = 0x00b0; offset <= 0x00c8; offset += 4) {
      try {
        const float64 = view.getFloat64(offset, true)
        const float32 = view.getFloat32(offset, true)
        const int32 = view.getInt32(offset, true)
        
        console.log(`0x${offset.toString(16).padStart(4, '0')}:`)
        console.log(`  float64: ${float64.toFixed(2)}`)
        console.log(`  float32: ${float32.toFixed(2)}`)
        console.log(`  int32: ${int32}`)
        console.log('')
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

testSpeedOffset()
