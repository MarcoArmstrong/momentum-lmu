const koffi = require('koffi')

console.log('🔍 Testing Shared Memory Data Reading')
console.log('=====================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function readSharedMemoryData() {
  try {
    // Try to connect to the telemetry shared memory
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, '$rFactor2SMMP_Telemetry$')
    
    if (!handle) {
      console.log('❌ Could not open shared memory handle')
      return
    }
    
    console.log('✅ Successfully opened shared memory handle')
    
    // Map the view
    const mappedView = MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 32768)
    
    if (!mappedView) {
      console.log('❌ Could not map view of file')
      CloseHandle(handle)
      return
    }
    
    console.log('✅ Successfully mapped view of file')
    
    // Read the entire buffer
    const buffer = koffi.decode(mappedView, 'uint8[32768]')
    
    console.log('📊 Buffer size:', buffer.length, 'bytes')
    
    // Display first 256 bytes as hex for inspection
    console.log('\n🔍 First 256 bytes (hex):')
    for (let i = 0; i < Math.min(256, buffer.length); i += 16) {
      const hex = Array.from(buffer.slice(i, i + 16))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ')
      const ascii = Array.from(buffer.slice(i, i + 16))
        .map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')
        .join('')
      console.log(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48)} |${ascii}|`)
    }
    
    // Try to read some basic values at common offsets
    console.log('\n🔢 Testing common telemetry offsets:')
    
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.length)
    
    // Test different offsets for build version number
    const offsets = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60]
    
    offsets.forEach(offset => {
      if (offset + 4 <= buffer.length) {
        const value = view.getUint32(offset, true) // little endian
        if (value > 0 && value < 1000000) {
          console.log(`  Offset 0x${offset.toString(16).padStart(2, '0')}: ${value} (possible build version)`)
        }
      }
    })
    
    // Test for RPM values (usually floats)
    console.log('\n🏎️ Testing for RPM values (float):')
    for (let offset = 0; offset < buffer.length - 4; offset += 4) {
      const value = view.getFloat32(offset, true)
      if (value > 0 && value < 50000 && value === Math.floor(value)) {
        console.log(`  Offset 0x${offset.toString(16).padStart(4, '0')}: ${value} (possible RPM)`)
      }
    }
    
    // Test for gear values (usually single bytes)
    console.log('\n⚙️ Testing for gear values (byte):')
    for (let offset = 0; offset < buffer.length - 1; offset++) {
      const value = buffer[offset]
      if (value >= 0 && value <= 10) {
        console.log(`  Offset 0x${offset.toString(16).padStart(4, '0')}: ${value} (possible gear)`)
      }
    }
    
    // Test for speed values (usually floats in m/s)
    console.log('\n🚗 Testing for speed values (float, m/s):')
    for (let offset = 0; offset < buffer.length - 4; offset += 4) {
      const value = view.getFloat32(offset, true)
      if (value > 0 && value < 200) {
        console.log(`  Offset 0x${offset.toString(16).padStart(4, '0')}: ${value.toFixed(2)} m/s (${(value * 3.6).toFixed(1)} km/h)`)
      }
    }
    
    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)
    
    console.log('\n✅ Shared memory data reading complete')
    
  } catch (error) {
    console.error('❌ Error reading shared memory:', error.message)
  }
}

// Run the test
readSharedMemoryData()
