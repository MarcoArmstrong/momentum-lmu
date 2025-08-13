const koffi = require('koffi')

console.log('🔬 Researching Tinypedal Shared Memory Approach')
console.log('==============================================')
console.log('')

// Based on research of Tinypedal's approach, they use different techniques
// Let's try various methods they might use

const kernel32 = koffi.load('kernel32.dll')

// Additional Windows API functions that Tinypedal might use
const OpenFileMappingW = kernel32.func('OpenFileMappingW', 'void*', ['uint32', 'bool', 'str'])
const CreateFileMappingA = kernel32.func('CreateFileMappingA', 'void*', ['void*', 'void*', 'uint32', 'uint32', 'uint32', 'str'])
const CreateFileMappingW = kernel32.func('CreateFileMappingW', 'void*', ['void*', 'void*', 'uint32', 'uint32', 'uint32', 'str'])
const MapViewOfFileEx = kernel32.func('MapViewOfFileEx', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t', 'void*'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])
const GetLastError = kernel32.func('GetLastError', 'uint32', [])

// Constants
const FILE_MAP_READ = 0x0004
const FILE_MAP_WRITE = 0x0002
const FILE_MAP_COPY = 0x0001
const FILE_MAP_EXECUTE = 0x0020
const FILE_MAP_RESERVE = 0x80000000
const FILE_MAP_TARGETS_INVALID = 0x40000000

const SECTION_MAP_READ = 0x0004
const SECTION_MAP_WRITE = 0x0002
const SECTION_MAP_EXECUTE = 0x0008
const SECTION_EXTEND_SIZE = 0x0010
const SECTION_QUERY = 0x0001
const STANDARD_RIGHTS_READ = 0x00020000

const PAGE_READONLY = 0x02
const PAGE_READWRITE = 0x04
const PAGE_EXECUTE_READ = 0x20
const PAGE_EXECUTE_READWRITE = 0x40

const INVALID_HANDLE_VALUE = -1

console.log('📋 Testing Tinypedal-style approaches...')
console.log('')

// Method 1: Try different shared memory names that Tinypedal might use
const tinypedalMemoryNames = [
  'Local\\rFactor2SMMPData',
  'Local\\rFactor2SMMPData_0',
  'Local\\rFactor2SMMPData_1',
  'Local\\rFactor2SMMPData_2',
  'rFactor2SMMPData',
  'rFactor2SMMPData_0',
  'rFactor2SMMPData_1',
  'rFactor2SMMPData_2',
  'Global\\rFactor2SMMPData',
  'Global\\rFactor2SMMPData_0',
  'Global\\rFactor2SMMPData_1',
  'Global\\rFactor2SMMPData_2'
]

// Method 2: Try different access patterns
const accessPatterns = [
  { name: 'Read Only', flags: SECTION_MAP_READ },
  { name: 'Read Write', flags: SECTION_MAP_READ | SECTION_MAP_WRITE },
  { name: 'Read Execute', flags: SECTION_MAP_READ | SECTION_MAP_EXECUTE },
  { name: 'Full Access', flags: SECTION_QUERY | SECTION_MAP_READ | SECTION_MAP_WRITE | SECTION_MAP_EXECUTE | SECTION_EXTEND_SIZE },
  { name: 'Standard Rights + Read', flags: STANDARD_RIGHTS_READ | SECTION_MAP_READ }
]

// Method 3: Try different mapping approaches
const mappingApproaches = [
  { name: 'OpenFileMappingA', func: kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str']) },
  { name: 'OpenFileMappingW', func: kernel32.func('OpenFileMappingW', 'void*', ['uint32', 'bool', 'str']) }
]

console.log('🔍 Testing different shared memory names and access methods...')
console.log('')

let foundWorking = false

for (const memoryName of tinypedalMemoryNames) {
  console.log(`📁 Testing: "${memoryName}"`)
  
  for (const pattern of accessPatterns) {
    for (const approach of mappingApproaches) {
      console.log(`  🔧 ${approach.name} with ${pattern.name}`)
      
      let handle = null
      let view = null
      
      try {
        // Try to open the mapping
        handle = approach.func(pattern.flags, false, memoryName)
        const error = GetLastError()
        
        if (!handle) {
          console.log(`    ❌ Failed (Error: ${error})`)
          continue
        }
        
        console.log(`    ✅ Opened! Handle: ${handle}`)
        
        // Try to map the view
        view = kernel32.func('MapViewOfFile', 'void*', ['void*', 'uint32', 'uint32', 'uint32', 'size_t'])(handle, FILE_MAP_READ, 0, 0, 32768)
        const mapError = GetLastError()
        
        if (!view) {
          console.log(`    ❌ Map failed (Error: ${mapError})`)
          CloseHandle(handle)
          continue
        }
        
        console.log(`    ✅ Mapped! View: ${view}`)
        
        // Try to read data
        try {
          const buffer = koffi.decode(view, 'uint8[32]')
          const buildVersion = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24)
          
          console.log(`    📊 Build version: ${buildVersion}`)
          console.log(`    📊 First 8 bytes: [${Array.from(buffer.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ')}]`)
          
          if (buildVersion > 0) {
            console.log(`    🎉 SUCCESS! Valid data found!`)
            foundWorking = true
            
            // Try to read more telemetry data
            const view32 = new DataView(buffer.buffer, buffer.byteOffset, 32768)
            const rpm = view32.getFloat32(0x1C, true)
            const speed = view32.getFloat32(0x24, true)
            const gear = buffer[0x28]
            
            console.log(`    🚗 RPM: ${rpm.toFixed(1)}`)
            console.log(`    🚗 Speed: ${(speed * 3.6).toFixed(1)} km/h`)
            console.log(`    🚗 Gear: ${gear}`)
          } else {
            console.log(`    ⚠️  Shared memory exists but no valid data`)
          }
          
        } catch (readError) {
          console.log(`    ❌ Read failed: ${readError.message}`)
        }
        
        // Cleanup
        if (view) {
          kernel32.func('UnmapViewOfFile', 'bool', ['void*'])(view)
        }
        if (handle) {
          CloseHandle(handle)
        }
        
      } catch (error) {
        console.log(`    ❌ Exception: ${error.message}`)
        if (view) {
          try { kernel32.func('UnmapViewOfFile', 'bool', ['void*'])(view) } catch (e) {}
        }
        if (handle) {
          try { CloseHandle(handle) } catch (e) {}
        }
      }
      
      console.log('')
    }
  }
  
  console.log('')
}

if (!foundWorking) {
  console.log('❌ No working shared memory access found')
  console.log('')
  console.log('🔬 Additional research needed:')
  console.log('1. Check if Tinypedal uses a different plugin or approach')
  console.log('2. Verify the shared memory plugin is properly installed')
  console.log('3. Check if there are different shared memory names for different games')
  console.log('4. Research if Tinypedal uses a different access method')
} else {
  console.log('✅ Found working shared memory access!')
  console.log('This approach can be used in your implementation.')
}

console.log('')
console.log('📚 Tinypedal Research Notes:')
console.log('- They use Python with ctypes for Windows API access')
console.log('- They may use different shared memory names for different games')
console.log('- They might use different access patterns for different scenarios')
console.log('- The key is finding the correct shared memory name and access method')
