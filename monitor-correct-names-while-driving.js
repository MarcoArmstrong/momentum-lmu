const koffi = require('koffi')

console.log('🎉 Monitor Correct Shared Memory Names While Driving')
console.log('====================================================')
console.log('')
console.log('This script will monitor for the CORRECT shared memory objects')
console.log('based on the Reddit discovery: $rFactor2SMMP_Telemetry$ etc.')
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

// Correct shared memory names based on Reddit discovery
const correctNames = [
  // Main telemetry object (most important)
  '$rFactor2SMMP_Telemetry$',
  
  // Other shared memory objects
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
  '$rFactor2SMMP_Data$'
]

let foundObjects = new Set()
let checkCount = 0
let lastFoundTime = Date.now()

function checkForSharedMemoryObjects() {
  checkCount++
  const currentTime = Date.now()
  
  for (const name of correctNames) {
    try {
      const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
      
      if (handle) {
        if (!foundObjects.has(name)) {
          const timeSinceLastFound = currentTime - lastFoundTime
          console.log(`🎉 NEW: Found shared memory object: "${name}" (Handle: ${handle})`)
          console.log(`    Time since last found: ${timeSinceLastFound}ms`)
          
          if (name.includes('Telemetry')) {
            console.log(`    🚗 This is the MAIN TELEMETRY object!`)
            console.log(`    💡 Use this name in your implementation: "${name}"`)
          }
          
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
    foundObjects.forEach(name => {
      const isTelemetry = name.includes('Telemetry') ? ' 🚗' : ''
      console.log(`  ✅ ${name}${isTelemetry}`)
    })
    console.log('')
  } else if (checkCount % 30 === 0) {
    console.log(`⏳ Check ${checkCount}: No shared memory objects found yet... (${Math.floor((currentTime - lastFoundTime) / 1000)}s since last found)`)
    console.log(`   💡 Make sure you are actively driving in the game!`)
  }
}

function startMonitoring() {
  console.log('🔍 Starting monitoring with CORRECT shared memory names...')
  console.log('Press Ctrl+C to stop\n')
  
  // Check immediately
  checkForSharedMemoryObjects()
  
  // Check every second
  setInterval(checkForSharedMemoryObjects, 1000)
}

startMonitoring()
