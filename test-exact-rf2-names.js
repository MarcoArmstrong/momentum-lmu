const koffi = require('koffi')

console.log('🔍 Testing Exact rF2 Shared Memory Names')
console.log('========================================')
console.log('')
console.log('Testing the most likely shared memory names')
console.log('that Tinypedal would use with Le Mans Ultimate.')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

// The most likely names based on rF2 conventions
const testNames = [
  'Local\\rFactor2SMMPData',
  'rFactor2SMMPData',
  'Local\\SMMPData',
  'SMMPData'
]

console.log('🔍 Testing shared memory names...')
console.log('')

for (const name of testNames) {
  console.log(`Testing: "${name}"`)
  
  try {
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
    
    if (handle) {
      console.log(`  ✅ Found! Handle: ${handle}`)
      
      // Try to map the view
      const mappedView = MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 32768)
      
      if (mappedView) {
        console.log(`  ✅ Successfully mapped view: ${mappedView}`)
        
        // Try to read some data
        try {
          const buffer = koffi.decode(mappedView, 'uint8[16]')
          console.log(`  📊 First 16 bytes: ${Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' ')}`)
          
          // Check if it looks like valid data
          const buildVersionNumber = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
          console.log(`  🔢 Build version number: ${buildVersionNumber}`)
          
          if (buildVersionNumber > 0) {
            console.log(`  🎉 This appears to be valid rF2 shared memory data!`)
            console.log(`  💡 Use this name in your implementation: "${name}"`)
          }
        } catch (error) {
          console.log(`  ❌ Error reading data: ${error.message}`)
        }
        
        UnmapViewOfFile(mappedView)
      } else {
        console.log(`  ❌ Failed to map view`)
      }
      
      CloseHandle(handle)
    } else {
      console.log(`  ❌ Not found`)
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
  }
  
  console.log('')
}

console.log('📋 Test complete!')
console.log('')
console.log('💡 If any shared memory objects were found,')
console.log('   use those names in your shared memory implementation.')
