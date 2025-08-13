const koffi = require('koffi')

console.log('🔍 Testing Updated Shared Memory Reader')
console.log('=======================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function testUpdatedReader() {
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
    
    // Test the new offsets we found
    const rpm = view.getFloat32(0x588, true)
    const maxRpm = view.getFloat32(0x68c, true)
    const speed = view.getFloat32(0x20, true)
    const gear = buffer[0x156]
    
    console.log('📊 Updated Telemetry Data:')
    console.log('==========================')
    console.log(`🏎️ RPM: ${rpm.toFixed(0)}`)
    console.log(`🔥 Max RPM: ${maxRpm.toFixed(0)}`)
    console.log(`🚗 Speed: ${speed.toFixed(2)} m/s (${(speed * 3.6).toFixed(1)} km/h)`)
    console.log(`⚙️ Gear: ${gear}`)
    
    // Also test some alternative gear offsets
    console.log('\n🔍 Alternative Gear Offsets:')
    console.log('============================')
    console.log(`0x0156: ${buffer[0x156]} (primary)`)
    console.log(`0x01da: ${buffer[0x01da]}`)
    console.log(`0x02b1: ${buffer[0x02b1]}`)
    console.log(`0x0585: ${buffer[0x0585]}`)
    
    // Test some RPM alternatives
    console.log('\n🏎️ RPM Alternatives:')
    console.log('=====================')
    console.log(`0x588: ${view.getFloat32(0x588, true).toFixed(0)} RPM (primary)`)
    console.log(`0x68c: ${view.getFloat32(0x68c, true).toFixed(0)} RPM`)
    console.log(`0x370: ${view.getFloat32(0x370, true).toFixed(0)} RPM`)
    console.log(`0x598: ${view.getFloat32(0x598, true).toFixed(0)} RPM`)
    
    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)
    
  } catch (error) {
    console.error('❌ Error reading shared memory:', error.message)
  }
}

// Test every 2 seconds
setInterval(testUpdatedReader, 2000)

console.log('🔍 Starting updated reader test...')
console.log('💡 Drive in the game to see real-time data!')
console.log('Press Ctrl+C to stop\n')
