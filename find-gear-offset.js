const koffi = require('koffi')

console.log('🔍 Finding Gear Offset in Real-Time')
console.log('===================================')
console.log('')
console.log('This script will monitor shared memory data in real-time')
console.log('to find the correct gear offset.')
console.log('')
console.log('Instructions:')
console.log('1. Start this script')
console.log('2. Drive in the game and change gears')
console.log('3. Watch for values that change when you shift')
console.log('4. The script will highlight changing values')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

let previousValues = new Map()
let changeCount = new Map()

function monitorSharedMemory() {
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
    
    // Monitor different data types at various offsets
    const offsets = []
    
    // Test byte values (possible gear)
    for (let i = 0; i < buffer.length; i++) {
      offsets.push({ offset: i, type: 'byte', value: buffer[i] })
    }
    
    // Test 32-bit integer values
    for (let i = 0; i < buffer.length - 4; i += 4) {
      offsets.push({ offset: i, type: 'int32', value: view.getInt32(i, true) })
    }
    
    // Test float values
    for (let i = 0; i < buffer.length - 4; i += 4) {
      offsets.push({ offset: i, type: 'float', value: view.getFloat32(i, true) })
    }
    
    // Check for changes
    offsets.forEach(({ offset, type, value }) => {
      const key = `${type}_${offset}`
      const prevValue = previousValues.get(key)
      
      if (prevValue !== undefined && prevValue !== value) {
        // Value changed
        const count = (changeCount.get(key) || 0) + 1
        changeCount.set(key, count)
        
        // Only show changes for reasonable values
        if (type === 'byte' && value >= 0 && value <= 10) {
          console.log(`🔄 ${type} at 0x${offset.toString(16).padStart(4, '0')}: ${prevValue} → ${value} (changes: ${count})`)
        } else if (type === 'int32' && value >= 0 && value <= 10) {
          console.log(`🔄 ${type} at 0x${offset.toString(16).padStart(4, '0')}: ${prevValue} → ${value} (changes: ${count})`)
        } else if (type === 'float' && value >= 0 && value <= 50000) {
          console.log(`🔄 ${type} at 0x${offset.toString(16).padStart(4, '0')}: ${prevValue.toFixed(2)} → ${value.toFixed(2)} (changes: ${count})`)
        }
      }
      
      previousValues.set(key, value)
    })
    
    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)
    
  } catch (error) {
    console.error('❌ Error reading shared memory:', error.message)
  }
}

// Monitor every 100ms
setInterval(monitorSharedMemory, 100)

console.log('🔍 Starting real-time monitoring...')
console.log('💡 Change gears in the game to see which values change!')
console.log('Press Ctrl+C to stop\n')
