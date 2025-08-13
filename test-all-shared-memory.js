const koffi = require('koffi')

console.log('🔍 Testing All Shared Memory Objects')
console.log('====================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004
const FILE_MAP_READ = 0x0004

// All possible shared memory names
const sharedMemoryNames = [
  '$rFactor2SMMP_Telemetry$',
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
  'rFactor2SMMP_Data',
  'Local\\rFactor2SMMPData',
  'rFactor2SMMPData',
  'Local\\SMMPData',
  'SMMPData',
  'Global\\rF2SMMPData_2',
  'Global\\SMMPData',
  'Global\\SMMPData_0',
  'Global\\SMMPData_1',
  'Global\\SMMPData_2'
]

function testSharedMemoryObject(memoryName) {
  try {
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, memoryName)
    
    if (!handle) {
      return null
    }

    const mappedView = MapViewOfFile(handle, FILE_MAP_READ, 0, 0, 32768)
    
    if (!mappedView) {
      CloseHandle(handle)
      return null
    }

    // Read first few bytes to check if it's valid
    const buffer = koffi.decode(mappedView, 'uint8[32]')
    const buildVersionNumber = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
    
    // Cleanup
    UnmapViewOfFile(mappedView)
    CloseHandle(handle)
    
    return {
      name: memoryName,
      buildVersion: buildVersionNumber,
      isValid: buildVersionNumber > 0
    }
  } catch (error) {
    return null
  }
}

function testAllSharedMemory() {
  console.log('Testing all shared memory objects...')
  console.log('')
  
  const results = []
  
  for (const memoryName of sharedMemoryNames) {
    const result = testSharedMemoryObject(memoryName)
    if (result) {
      results.push(result)
      console.log(`✅ ${memoryName}: BuildVersion=${result.buildVersion} (${result.isValid ? 'VALID' : 'INVALID'})`)
    } else {
      console.log(`❌ ${memoryName}: Not found`)
    }
  }
  
  console.log('')
  console.log('=== SUMMARY ===')
  console.log(`Found ${results.length} shared memory objects`)
  
  const validResults = results.filter(r => r.isValid)
  console.log(`Valid objects: ${validResults.length}`)
  
  if (validResults.length > 0) {
    console.log('')
    console.log('Valid shared memory objects:')
    validResults.forEach(result => {
      console.log(`  - ${result.name} (BuildVersion: ${result.buildVersion})`)
    })
  }
}

testAllSharedMemory()
