const koffi = require('koffi')

console.log('🔍 Comprehensive Shared Memory Search')
console.log('====================================')
console.log('')
console.log('This script will try to find ANY shared memory objects')
console.log('that might be created by Le Mans Ultimate or its plugins.')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004

// Try a much broader range of possible shared memory names
const possibleNames = [
  // Standard rF2 names
  'Local\\rFactor2SMMPData',
  'Local\\rFactor2SMMPData_0',
  'Local\\rFactor2SMMPData_1',
  'Local\\rFactor2SMMPData_2',
  'rFactor2SMMPData',
  'rFactor2SMMPData_0',
  'rFactor2SMMPData_1',
  'rFactor2SMMPData_2',
  
  // Le Mans Ultimate specific names
  'Local\\LeMansUltimateSMMPData',
  'Local\\LeMansUltimateSMMPData_0',
  'Local\\LeMansUltimateSMMPData_1',
  'Local\\LeMansUltimateSMMPData_2',
  'LeMansUltimateSMMPData',
  'LeMansUltimateSMMPData_0',
  'LeMansUltimateSMMPData_1',
  'LeMansUltimateSMMPData_2',
  
  // LMU variations
  'Local\\LMUSMMPData',
  'Local\\LMUSMMPData_0',
  'Local\\LMUSMMPData_1',
  'Local\\LMUSMMPData_2',
  'LMUSMMPData',
  'LMUSMMPData_0',
  'LMUSMMPData_1',
  'LMUSMMPData_2',
  
  // Generic names
  'Local\\SMMPData',
  'Local\\SMMPData_0',
  'Local\\SMMPData_1',
  'Local\\SMMPData_2',
  'SMMPData',
  'SMMPData_0',
  'SMMPData_1',
  'SMMPData_2',
  
  // Plugin-specific names
  'Local\\rF2SharedMemoryMapPlugin',
  'Local\\rF2SharedMemoryMapPlugin_0',
  'Local\\rF2SharedMemoryMapPlugin_1',
  'Local\\rF2SharedMemoryMapPlugin_2',
  'rF2SharedMemoryMapPlugin',
  'rF2SharedMemoryMapPlugin_0',
  'rF2SharedMemoryMapPlugin_1',
  'rF2SharedMemoryMapPlugin_2',
  
  // Telemetry names
  'Local\\TelemetryData',
  'Local\\TelemetryData_0',
  'Local\\TelemetryData_1',
  'Local\\TelemetryData_2',
  'TelemetryData',
  'TelemetryData_0',
  'TelemetryData_1',
  'TelemetryData_2',
  
  // Game-specific names
  'Local\\GameData',
  'Local\\GameData_0',
  'Local\\GameData_1',
  'Local\\GameData_2',
  'GameData',
  'GameData_0',
  'GameData_1',
  'GameData_2',
  
  // Shared memory variations
  'Local\\SharedMemory',
  'Local\\SharedMemory_0',
  'Local\\SharedMemory_1',
  'Local\\SharedMemory_2',
  'SharedMemory',
  'SharedMemory_0',
  'SharedMemory_1',
  'SharedMemory_2',
  
  // Global namespace versions
  'Global\\rFactor2SMMPData',
  'Global\\rFactor2SMMPData_0',
  'Global\\rFactor2SMMPData_1',
  'Global\\rFactor2SMMPData_2',
  'Global\\LeMansUltimateSMMPData',
  'Global\\LeMansUltimateSMMPData_0',
  'Global\\LeMansUltimateSMMPData_1',
  'Global\\LeMansUltimateSMMPData_2',
  'Global\\LMUSMMPData',
  'Global\\LMUSMMPData_0',
  'Global\\LMUSMMPData_1',
  'Global\\LMUSMMPData_2',
  'Global\\SMMPData',
  'Global\\SMMPData_0',
  'Global\\SMMPData_1',
  'Global\\SMMPData_2',
  'Global\\TelemetryData',
  'Global\\TelemetryData_0',
  'Global\\TelemetryData_1',
  'Global\\TelemetryData_2',
  'Global\\GameData',
  'Global\\GameData_0',
  'Global\\GameData_1',
  'Global\\GameData_2',
  'Global\\SharedMemory',
  'Global\\SharedMemory_0',
  'Global\\SharedMemory_1',
  'Global\\SharedMemory_2',
  
  // Process-specific names (using Le Mans Ultimate process ID)
  'Local\\LeMansUltimate_30468_Data',
  'Local\\LeMansUltimate_30468_SMMPData',
  'Local\\LeMansUltimate_30468_Telemetry',
  'Global\\LeMansUltimate_30468_Data',
  'Global\\LeMansUltimate_30468_SMMPData',
  'Global\\LeMansUltimate_30468_Telemetry',
  
  // Plugin-specific variations
  'Local\\rF2SharedMemeryMapPlugin', // Note the typo in the loaded DLL name
  'Local\\rF2SharedMemeryMapPlugin_0',
  'Local\\rF2SharedMemeryMapPlugin_1',
  'Local\\rF2SharedMemeryMapPlugin_2',
  'rF2SharedMemeryMapPlugin',
  'rF2SharedMemeryMapPlugin_0',
  'rF2SharedMemeryMapPlugin_1',
  'rF2SharedMemeryMapPlugin_2',
  
  // TrackIR plugin variations
  'Local\\TrackIR_LMU_Plugin',
  'Local\\TrackIR_LMU_Plugin_0',
  'Local\\TrackIR_LMU_Plugin_1',
  'Local\\TrackIR_LMU_Plugin_2',
  'TrackIR_LMU_Plugin',
  'TrackIR_LMU_Plugin_0',
  'TrackIR_LMU_Plugin_1',
  'TrackIR_LMU_Plugin_2'
]

console.log('🔍 Testing for shared memory objects...')
console.log('')

let foundCount = 0
const foundObjects = []

for (const name of possibleNames) {
  try {
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
    
    if (handle) {
      console.log(`✅ Found: "${name}" (Handle: ${handle})`)
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
  console.log('💡 Try using these names in your shared memory implementation.')
} else {
  console.log('❌ No shared memory objects found')
  console.log('')
  console.log('🔧 This suggests:')
  console.log('1. The plugin might not be creating shared memory objects at all')
  console.log('2. The plugin might be using a completely different approach')
  console.log('3. The plugin might only work with specific game settings')
  console.log('4. The plugin might be incompatible with Le Mans Ultimate')
  console.log('')
  console.log('💡 Next steps:')
  console.log('1. Check if Tinypedal actually works with Le Mans Ultimate')
  console.log('2. Research if the plugin uses a different method (UDP, files, etc.)')
  console.log('3. Check if there are alternative telemetry plugins')
  console.log('4. Consider using only the REST API approach')
}

console.log('')
console.log('Press any key to exit...')
