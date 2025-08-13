const koffi = require('koffi')

console.log('🔍 Shared Memory Monitor During Tinypedal')
console.log('=========================================')
console.log('')
console.log('This script will monitor for shared memory objects')
console.log('while Tinypedal is running and connected to Le Mans Ultimate.')
console.log('')
console.log('Instructions:')
console.log('1. Make sure Tinypedal is running and connected to Le Mans Ultimate')
console.log('2. Start this script')
console.log('3. Drive around in the game')
console.log('4. Watch for shared memory objects to appear')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])

const SECTION_MAP_READ = 0x0004

// Focus on the most likely names that Tinypedal would use
const testNames = [
  // Standard rF2 names (most likely)
  'Local\\rFactor2SMMPData',
  'rFactor2SMMPData',
  'Local\\SMMPData',
  'SMMPData',
  
  // Python-specific names (since Tinypedal uses Python)
  'Local\\pyRfactor2SharedMemory',
  'pyRfactor2SharedMemory',
  'Local\\PythonRfactor2Data',
  'PythonRfactor2Data',
  
  // Tinypedal-specific names
  'Local\\TinyPedalData',
  'TinyPedalData',
  'Local\\TinyPedalSharedMemory',
  'TinyPedalSharedMemory',
  
  // Alternative names
  'Local\\rF2Data',
  'rF2Data',
  'Local\\GameData',
  'GameData',
  'Local\\TelemetryData',
  'TelemetryData'
]

let foundObjects = new Set()
let checkCount = 0

function checkForSharedMemoryObjects() {
  checkCount++
  
  for (const name of testNames) {
    try {
      const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
      
      if (handle) {
        if (!foundObjects.has(name)) {
          console.log(`🎉 NEW: Found shared memory object: "${name}" (Handle: ${handle})`)
          foundObjects.add(name)
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
  } else if (checkCount % 10 === 0) {
    console.log(`⏳ Check ${checkCount}: No shared memory objects found yet...`)
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
