const koffi = require('koffi')

// Windows API function definitions
const kernel32 = koffi.load('kernel32.dll')

// Function signatures
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const MapViewOfFile = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])
const UnmapViewOfFile = kernel32.func('UnmapViewOfFile', 'bool', ['void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])
const GetLastError = kernel32.func('GetLastError', 'uint32', [])

// Constants
const FILE_MAP_READ = 0x0004
const SECTION_MAP_READ = 0x0004
const SECTION_MAP_WRITE = 0x0002
const SECTION_MAP_EXECUTE = 0x0008
const STANDARD_RIGHTS_READ = 0x00020000
const SECTION_QUERY = 0x0001
const SECTION_EXTEND_SIZE = 0x0010

// Error codes
const ERROR_FILE_NOT_FOUND = 2
const ERROR_ACCESS_DENIED = 5
const ERROR_INVALID_HANDLE = 6
const ERROR_NOT_ENOUGH_MEMORY = 8
const ERROR_INVALID_PARAMETER = 87
const ERROR_BAD_PATHNAME = 161

function getErrorMessage(errorCode) {
  const errorMessages = {
    [ERROR_FILE_NOT_FOUND]: 'ERROR_FILE_NOT_FOUND - The specified file was not found',
    [ERROR_ACCESS_DENIED]: 'ERROR_ACCESS_DENIED - Access is denied',
    [ERROR_INVALID_HANDLE]: 'ERROR_INVALID_HANDLE - The handle is invalid',
    [ERROR_NOT_ENOUGH_MEMORY]: 'ERROR_NOT_ENOUGH_MEMORY - Not enough memory',
    [ERROR_INVALID_PARAMETER]: 'ERROR_INVALID_PARAMETER - The parameter is incorrect',
    [ERROR_BAD_PATHNAME]: 'ERROR_BAD_PATHNAME - The specified path is invalid'
  }
  return errorMessages[errorCode] || `Unknown error code: ${errorCode}`
}

console.log('🔍 Detailed Shared Memory Test')
console.log('==============================')
console.log('')

// Test different shared memory names
const memoryNames = [
  'Local\\rFactor2SMMPData',
  'Local\\rFactor2SMMPData_0',
  'Local\\rFactor2SMMPData_1',
  'Local\\rFactor2SMMPData_2',
  'rFactor2SMMPData',
  'rFactor2SMMPData_0',
  'rFactor2SMMPData_1',
  'rFactor2SMMPData_2'
]

// Test different access methods
const accessMethods = [
  { name: 'SECTION_MAP_READ', flag: SECTION_MAP_READ },
  { name: 'SECTION_MAP_READ | SECTION_MAP_WRITE', flag: SECTION_MAP_READ | SECTION_MAP_WRITE },
  { name: 'STANDARD_RIGHTS_READ | SECTION_MAP_READ', flag: STANDARD_RIGHTS_READ | SECTION_MAP_READ },
  { name: 'SECTION_ALL_ACCESS', flag: SECTION_QUERY | SECTION_MAP_READ | SECTION_MAP_WRITE | SECTION_MAP_EXECUTE | SECTION_EXTEND_SIZE }
]

let foundAny = false

for (const memoryName of memoryNames) {
  console.log(`📁 Testing memory name: "${memoryName}"`)
  console.log('─'.repeat(50))
  
  for (const method of accessMethods) {
    console.log(`  🔧 Trying access method: ${method.name}`)
    
    let fileMappingHandle = null
    let mappedView = null
    
    try {
      // Try to open the file mapping
      fileMappingHandle = OpenFileMappingA(method.flag, false, memoryName)
      const lastError = GetLastError()
      
      if (!fileMappingHandle) {
        console.log(`    ❌ OpenFileMappingA failed: ${getErrorMessage(lastError)}`)
        continue
      }
      
      console.log(`    ✅ OpenFileMappingA succeeded! Handle: ${fileMappingHandle}`)
      
      // Try to map the view
      mappedView = MapViewOfFile(fileMappingHandle, FILE_MAP_READ, 0, 0, 32768)
      const mapError = GetLastError()
      
      if (!mappedView) {
        console.log(`    ❌ MapViewOfFile failed: ${getErrorMessage(mapError)}`)
        CloseHandle(fileMappingHandle)
        continue
      }
      
      console.log(`    ✅ MapViewOfFile succeeded! View: ${mappedView}`)
      
      // Try to read some data
      try {
        const buffer = koffi.decode(mappedView, 'uint8[16]')
        const buildVersionNumber = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
        
        console.log(`    📊 First 16 bytes: [${Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' ')}]`)
        console.log(`    🏷️  Build version number: ${buildVersionNumber}`)
        
        if (buildVersionNumber > 0) {
          console.log(`    🎉 SUCCESS! Found valid shared memory data!`)
          foundAny = true
        } else {
          console.log(`    ⚠️  Shared memory exists but no valid data (game not running?)`)
        }
        
      } catch (readError) {
        console.log(`    ❌ Failed to read data: ${readError.message}`)
      }
      
      // Cleanup
      if (mappedView) {
        UnmapViewOfFile(mappedView)
      }
      if (fileMappingHandle) {
        CloseHandle(fileMappingHandle)
      }
      
    } catch (error) {
      console.log(`    ❌ Exception: ${error.message}`)
      
      // Cleanup on error
      if (mappedView) {
        try { UnmapViewOfFile(mappedView) } catch (e) {}
      }
      if (fileMappingHandle) {
        try { CloseHandle(fileMappingHandle) } catch (e) {}
      }
    }
    
    console.log('')
  }
  
  console.log('')
}

if (!foundAny) {
  console.log('❌ No shared memory objects found or accessible')
  console.log('')
  console.log('🔧 Troubleshooting tips:')
  console.log('1. Make sure Le Mans Ultimate is running')
  console.log('2. Ensure rFactor2SharedMemoryMapPlugin64.dll is installed in Le Mans Ultimate\\Plugins')
  console.log('3. Check that the plugin is enabled in CustomPluginVariables.JSON')
  console.log('4. Try running the game in Borderless or Windowed mode (not Fullscreen)')
  console.log('5. Restart the game after enabling the plugin')
} else {
  console.log('✅ Found accessible shared memory! Your implementation should work.')
}

console.log('')
console.log('Press Ctrl+C to exit')
