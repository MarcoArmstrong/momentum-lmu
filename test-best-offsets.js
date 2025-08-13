const koffi = require('koffi')

console.log('🔍 Testing Best Offsets from Scan')
console.log('=================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function testBestOffsets() {
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

    const buffer = koffi.decode(mappedView, 'uint8[32768]')
    const view = new DataView(buffer.buffer, buffer.byteOffset, 32768)

    console.log('🎯 Testing Most Promising Offsets from Scan:')
    console.log('')

    // Test gear offsets that showed changes in scan
    console.log('⚙️  GEAR CANDIDATES:')
    console.log(`   0x00d4: ${view.getInt8(0x00d4)} (int8)`)
    console.log(`   0x00e4: ${view.getInt8(0x00e4)} (int8)`)
    console.log(`   0x00fc: ${view.getInt8(0x00fc)} (int8)`)
    console.log(`   0x01a8: ${view.getInt8(0x01a8)} (int8)`)
    console.log(`   0x01c8: ${view.getInt8(0x01c8)} (int8)`)
    console.log('')

    // Test RPM offsets that showed realistic values
    console.log('🏎️  RPM CANDIDATES:')
    console.log(`   0x0370: ${view.getFloat64(0x0370, true).toFixed(0)} RPM (float64)`)
    console.log(`   0x0474: ${view.getFloat64(0x0474, true).toFixed(0)} RPM (float64)`)
    console.log(`   0x0578: ${view.getFloat64(0x0578, true).toFixed(0)} RPM (float64)`)
    console.log(`   0x067c: ${view.getFloat64(0x067c, true).toFixed(0)} RPM (float64)`)
    console.log('')

    // Test speed offsets that showed realistic values
    console.log('🚗 SPEED CANDIDATES:')
    console.log(`   0x0730: ${view.getFloat32(0x0730, true).toFixed(1)} km/h (float32)`)
    console.log(`   0x071c: ${view.getFloat64(0x071c, true).toFixed(1)} km/h (float64)`)
    console.log(`   0x00cc: ${view.getFloat32(0x00cc, true).toFixed(1)} km/h (float32)`)
    console.log(`   0x00d4: ${view.getFloat64(0x00d4, true).toFixed(1)} km/h (float64)`)
    console.log('')

    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)

  } catch (error) {
    console.error('Error:', error)
  }
}

testBestOffsets()
