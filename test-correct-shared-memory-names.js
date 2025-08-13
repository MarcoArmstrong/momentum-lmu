const koffi = require('koffi')

console.log('🎉 Testing Correct Shared Memory Names')
console.log('======================================')
console.log('')
console.log('Based on the Reddit discovery, testing the correct')
console.log('shared memory names that the plugin actually uses.')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

// Correct shared memory names based on Reddit discovery
const correctNames = [
  // Main telemetry object (most important)
  '$rFactor2SMMP_Telemetry$',
  
  // Other possible objects based on the pattern
  '$rFactor2SMMP_Scoring$',
  '$rFactor2SMMP_Weather$',
  '$rFactor2SMMP_Game$',
  '$rFactor2SMMP_Input$',
  '$rFactor2SMMP_Graphics$',
  '$rFactor2SMMP_Pit$',
  '$rFactor2SMMP_Camera$',
  '$rFactor2SMMP_Radio$',
  '$rFactor2SMMP_Time$',
  '$rFactor2SMMP_Flags$',
  '$rFactor2SMMP_Player$',
  '$rFactor2SMMP_Drivers$',
  '$rFactor2SMMP_Vehicles$',
  '$rFactor2SMMP_Classes$',
  '$rFactor2SMMP_Results$',
  '$rFactor2SMMP_Standings$',
  '$rFactor2SMMP_Leaderboard$',
  '$rFactor2SMMP_Statistics$',
  '$rFactor2SMMP_Data$',
  
  // Variations without $ prefix/suffix (just in case)
  'rFactor2SMMP_Telemetry',
  'rFactor2SMMP_Scoring',
  'rFactor2SMMP_Weather',
  'rFactor2SMMP_Game',
  'rFactor2SMMP_Input',
  'rFactor2SMMP_Graphics',
  'rFactor2SMMP_Pit',
  'rFactor2SMMP_Camera',
  'rFactor2SMMP_Radio',
  'rFactor2SMMP_Time',
  'rFactor2SMMP_Flags',
  'rFactor2SMMP_Player',
  'rFactor2SMMP_Drivers',
  'rFactor2SMMP_Vehicles',
  'rFactor2SMMP_Classes',
  'rFactor2SMMP_Results',
  'rFactor2SMMP_Standings',
  'rFactor2SMMP_Leaderboard',
  'rFactor2SMMP_Statistics',
  'rFactor2SMMP_Data'
]

console.log('🔍 Testing correct shared memory names...')
console.log('')

let foundCount = 0
const foundObjects = []

for (const name of correctNames) {
  try {
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
    
    if (handle) {
      console.log(`✅ Found: "${name}" (Handle: ${handle})`)
      
      // Try to map the view and read data
      const mappedView = MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 32768)
      
      if (mappedView) {
        try {
          const buffer = koffi.decode(mappedView, 'uint8[32]')
          console.log(`  📊 First 32 bytes: ${Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' ')}`)
          
          // Check if it looks like valid data
          const buildVersionNumber = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
          console.log(`  🔢 Build version number: ${buildVersionNumber}`)
          
          if (buildVersionNumber > 0) {
            console.log(`  🎉 This appears to be valid rF2 shared memory data!`)
            console.log(`  💡 Use this name in your implementation: "${name}"`)
          }
          
          // Try to read more data to see what's available
          if (name.includes('Telemetry')) {
            console.log(`  🚗 This is the main telemetry object!`)
            console.log(`  📏 Size: ${buffer.length} bytes`)
          }
          
        } catch (error) {
          console.log(`  ⚠️  Could not read data: ${error.message}`)
        }
        
        UnmapViewOfFile(mappedView)
      }
      
      foundObjects.push(name)
      foundCount++
      CloseHandle(handle)
    }
  } catch (error) {
    // Ignore errors
  }
}

console.log('')
console.log(`📊 Summary: Found ${foundCount} shared memory object(s)`)
console.log('')

if (foundCount > 0) {
  console.log('🎉 Found shared memory objects:')
  foundObjects.forEach(name => console.log(`  - ${name}`))
  console.log('')
  console.log('✅ These objects exist and can be accessed!')
  console.log('💡 The Reddit discovery was correct!')
  console.log('🚀 You can now use these names in your shared memory implementation.')
} else {
  console.log('❌ No shared memory objects found with correct names')
  console.log('')
  console.log('🔧 This suggests:')
  console.log('1. The plugin might not be loaded properly')
  console.log('2. You might not be in a driving session')
  console.log('3. The game might need to be restarted after plugin installation')
  console.log('4. The plugin might be incompatible with this version of LMU')
  console.log('')
  console.log('💡 Next steps:')
  console.log('1. Make sure you are driving in the game')
  console.log('2. Restart Le Mans Ultimate after plugin installation')
  console.log('3. Check if the plugin is properly loaded')
  console.log('4. Try the monitoring script while driving')
}

console.log('')
console.log('Press any key to exit...')
