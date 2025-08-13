const koffi = require('koffi')

console.log('🔍 Dumping Shared Memory Structure')
console.log('==================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

function dumpSharedMemory() {
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
    console.log('📊 Dumping first 512 bytes...')
    console.log('')

    const buffer = koffi.decode(mappedView, 'uint8[512]')
    const view = new DataView(buffer.buffer, buffer.byteOffset, 512)
    
    // Dump as hex
    console.log('=== HEX DUMP (first 512 bytes) ===')
    for (let i = 0; i < 512; i += 16) {
      const hex = Array.from(buffer.slice(i, i + 16))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ')
      const ascii = Array.from(buffer.slice(i, i + 16))
        .map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')
        .join('')
      console.log(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48)} |${ascii}|`)
    }
    
    console.log('')
    console.log('=== DATA ANALYSIS ===')
    
    // Try to read different data types at different offsets
    console.log('Reading different data types at various offsets:')
    console.log('')
    
    for (let offset = 0; offset < 256; offset += 4) {
      try {
        const int32 = view.getInt32(offset, true)
        const float32 = view.getFloat32(offset, true)
        const float64 = view.getFloat64(offset, true)
        
        // Look for reasonable values
        if (int32 >= -10 && int32 <= 10) {
          console.log(`0x${offset.toString(16).padStart(4, '0')}: int32=${int32} (possible gear?)`)
        }
        if (float32 > 1000 && float32 < 50000) {
          console.log(`0x${offset.toString(16).padStart(4, '0')}: float32=${float32.toFixed(0)} (possible RPM?)`)
        }
        if (float64 > 1 && float64 < 100) {
          console.log(`0x${offset.toString(16).padStart(4, '0')}: float64=${float64.toFixed(2)} (possible speed?)`)
        }
      } catch (error) {
        // Skip if we can't read at this offset
      }
    }
    
    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

dumpSharedMemory()
