const koffi = require('koffi')

console.log('🔍 Monitor While Driving')
console.log('========================')
console.log('')
console.log('This script will monitor for shared memory objects')
console.log('while you are actively driving in Le Mans Ultimate.')
console.log('')
console.log('Instructions:')
console.log('1. Start this script')
console.log('2. Go to Le Mans Ultimate and start a practice session')
console.log('3. Start driving around the track')
console.log('4. Watch for shared memory objects to appear')
console.log('5. The script will check every second')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004

// Focus on the most likely names
const testNames = [
  'Local\\rFactor2SMMPData',
  'rFactor2SMMPData',
  'Local\\SMMPData',
  'SMMPData',
  'Local\\rF2SMMPData',
  'rF2SMMPData',
  'Local\\rF2Data',
  'rF2Data',
  'Local\\GameData',
  'GameData',
  'Local\\TelemetryData',
  'TelemetryData'
]

let foundObjects = new Set()
let checkCount = 0
let lastFoundTime = Date.now()

function checkForSharedMemoryObjects() {
  checkCount++
  const currentTime = Date.now()
  
  for (const name of testNames) {
    try {
      const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
      
      if (handle) {
        if (!foundObjects.has(name)) {
          const timeSinceLastFound = currentTime - lastFoundTime
          console.log(`🎉 NEW: Found shared memory object: "${name}" (Handle: ${handle})`)
          console.log(`    Time since last found: ${timeSinceLastFound}ms`)
          foundObjects.add(name)
          lastFoundTime = currentTime
        }
        CloseHandle(handle)
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  if (foundObjects.size > 0) {
    console.log(`\n📊 Currently found ${foundObjects.size} shared memory object(s):`)
    foundObjects.forEach(name => console.log(`  ✅ ${name}`))
    console.log('')
  } else if (checkCount % 30 === 0) {
    console.log(`⏳ Check ${checkCount}: No shared memory objects found yet... (${Math.floor((currentTime - lastFoundTime) / 1000)}s since last found)`)
  }
}

function startMonitoring() {
  console.log('🔍 Starting monitoring...')
  console.log('Press Ctrl+C to stop\n')
  
  // Check immediately
  checkForSharedMemoryObjects()
  
  // Check every second
  setInterval(checkForSharedMemoryObjects, 1000)
}

startMonitoring()
