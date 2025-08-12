const koffi = require('koffi')

// Windows API function definitions
const kernel32 = koffi.load('kernel32.dll')

// Function signatures
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

// Constants
const SECTION_MAP_READ = 0x0004

console.log('Monitoring for shared memory objects...')
console.log('Press Ctrl+C to stop')
console.log('')

// Standard rF2 shared memory names
const memoryNames = [
  'Local\\rFactor2SMMPData',
  'Local\\rFactor2SMMPData_0',
  'Local\\rFactor2SMMPData_1',
  'Local\\rFactor2SMMPData_2'
]

let lastFoundCount = 0

function checkSharedMemory() {
  let foundCount = 0
  const foundNames = []
  
  for (const name of memoryNames) {
    try {
      const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
      
      if (handle) {
        foundNames.push(name)
        CloseHandle(handle)
        foundCount++
      }
    } catch (error) {
      // Silently ignore errors
    }
  }
  
  if (foundCount > 0) {
    console.log(`✅ Found ${foundCount} shared memory object(s) at ${new Date().toLocaleTimeString()}:`)
    foundNames.forEach(name => console.log(`  - ${name}`))
    console.log('')
    
    if (foundCount !== lastFoundCount) {
      console.log('🎉 Shared memory detected! Your implementation should work now.')
      console.log('')
    }
  } else if (lastFoundCount > 0) {
    console.log(`❌ Lost connection to shared memory at ${new Date().toLocaleTimeString()}`)
    console.log('')
  }
  
  lastFoundCount = foundCount
}

// Check every 2 seconds
const interval = setInterval(checkSharedMemory, 2000)

// Handle Ctrl+C
process.on('SIGINT', () => {
  clearInterval(interval)
  console.log('\nMonitoring stopped.')
  process.exit(0)
})

// Initial check
checkSharedMemory()
