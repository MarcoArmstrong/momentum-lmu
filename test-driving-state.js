const koffi = require('koffi')

console.log('🚗 Driving State Shared Memory Monitor')
console.log('=====================================')
console.log('')
console.log('This script will continuously monitor for shared memory objects')
console.log('while you drive in Le Mans Ultimate.')
console.log('')
console.log('Instructions:')
console.log('1. Start this script')
console.log('2. Go to Le Mans Ultimate and start a practice session')
console.log('3. Start driving around the track')
console.log('4. Watch for shared memory objects to appear')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004

// Key shared memory names to monitor
const keyMemoryNames = [
  'Local\\rFactor2SMMPData',
  'Local\\rFactor2SMMPData_0',
  'Local\\rFactor2SMMPData_1',
  'Local\\rFactor2SMMPData_2',
  'rFactor2SMMPData',
  'rFactor2SMMPData_0',
  'rFactor2SMMPData_1',
  'rFactor2SMMPData_2',
  'Local\\rF2SMMPData',
  'Local\\rF2SMMPData_0',
  'Local\\rF2SMMPData_1',
  'Local\\rF2SMMPData_2',
  'rF2SMMPData',
  'rF2SMMPData_0',
  'rF2SMMPData_1',
  'rF2SMMPData_2'
]

let lastFoundCount = 0
let foundObjects = new Set()

function checkSharedMemory() {
  const timestamp = new Date().toLocaleTimeString()
  let foundCount = 0
  const currentFound = []
  
  for (const name of keyMemoryNames) {
    try {
      const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
      
      if (handle) {
        currentFound.push(name)
        foundCount++
        CloseHandle(handle)
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  // Check for new objects
  const newObjects = currentFound.filter(name => !foundObjects.has(name))
  const lostObjects = Array.from(foundObjects).filter(name => !currentFound.includes(name))
  
  if (foundCount > 0) {
    console.log(`[${timestamp}] ✅ Found ${foundCount} shared memory object(s):`)
    currentFound.forEach(name => console.log(`  - ${name}`))
    
    if (newObjects.length > 0) {
      console.log(`🎉 NEW OBJECTS DETECTED: ${newObjects.join(', ')}`)
      console.log('🚗 This suggests you are now driving in the game!')
    }
    
    if (lostObjects.length > 0) {
      console.log(`⚠️  LOST OBJECTS: ${lostObjects.join(', ')}`)
    }
    
    console.log('')
  } else if (lastFoundCount > 0) {
    console.log(`[${timestamp}] ❌ Lost connection to shared memory`)
    console.log('💡 This might happen when you stop driving or exit the session')
    console.log('')
  }
  
  // Update tracking
  foundObjects = new Set(currentFound)
  lastFoundCount = foundCount
}

// Check every 2 seconds
const interval = setInterval(checkSharedMemory, 2000)

// Handle Ctrl+C
process.on('SIGINT', () => {
  clearInterval(interval)
  console.log('\n🛑 Monitoring stopped.')
  console.log('')
  if (foundObjects.size > 0) {
    console.log('📊 Summary:')
    console.log(`Found ${foundObjects.size} shared memory object(s):`)
    Array.from(foundObjects).forEach(name => console.log(`  - ${name}`))
    console.log('')
    console.log('✅ Your shared memory implementation should work with these names!')
  } else {
    console.log('❌ No shared memory objects were found.')
    console.log('💡 Make sure you are driving in the game, not just in menus.')
  }
  process.exit(0)
})

// Initial check
console.log('🔍 Starting monitoring...')
console.log('Press Ctrl+C to stop')
console.log('')
checkSharedMemory()
