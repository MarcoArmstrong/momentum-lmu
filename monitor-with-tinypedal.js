const koffi = require('koffi')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

console.log('🔍 Tinypedal Shared Memory Monitor')
console.log('==================================')
console.log('')
console.log('This script will monitor for shared memory objects')
console.log('while Tinypedal is running with Le Mans Ultimate.')
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

// Comprehensive list of possible shared memory names
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
  'TrackIR_LMU_Plugin_2',
  
  // Tinypedal specific names
  'Local\\TinyPedalData',
  'Local\\TinyPedalData_0',
  'Local\\TinyPedalData_1',
  'Local\\TinyPedalData_2',
  'TinyPedalData',
  'TinyPedalData_0',
  'TinyPedalData_1',
  'TinyPedalData_2',
  
  // Python-specific names (since Tinypedal uses Python)
  'Local\\pyRfactor2SharedMemory',
  'Local\\pyRfactor2SharedMemory_0',
  'Local\\pyRfactor2SharedMemory_1',
  'Local\\pyRfactor2SharedMemory_2',
  'pyRfactor2SharedMemory',
  'pyRfactor2SharedMemory_0',
  'pyRfactor2SharedMemory_1',
  'pyRfactor2SharedMemory_2',
  
  // More variations
  'Local\\rF2Data',
  'Local\\rF2Data_0',
  'Local\\rF2Data_1',
  'Local\\rF2Data_2',
  'rF2Data',
  'rF2Data_0',
  'rF2Data_1',
  'rF2Data_2',
  
  // Without Local/ prefix
  'rFactor2SMMPData',
  'rFactor2SMMPData_0',
  'rFactor2SMMPData_1',
  'rFactor2SMMPData_2',
  'rF2SMMPData',
  'rF2SMMPData_0',
  'rF2SMMPData_1',
  'rF2SMMPData_2',
  'SMMPData',
  'SMMPData_0',
  'SMMPData_1',
  'SMMPData_2'
]

let foundObjects = new Set()
let lastCheckTime = Date.now()

async function checkForSharedMemoryObjects() {
  const currentTime = Date.now()
  const timeSinceLastCheck = currentTime - lastCheckTime
  
  for (const name of possibleNames) {
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
  }
  
  lastCheckTime = currentTime
}

async function checkTinypedalProcess() {
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq python.exe" /FO CSV')
    if (stdout.includes('python.exe')) {
      console.log('🐍 Tinypedal (Python) process detected')
      return true
    }
  } catch (error) {
    // Ignore errors
  }
  
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq tinypedal.exe" /FO CSV')
    if (stdout.includes('tinypedal.exe')) {
      console.log('🐍 Tinypedal process detected')
      return true
    }
  } catch (error) {
    // Ignore errors
  }
  
  return false
}

async function main() {
  console.log('🔍 Starting monitoring...')
  console.log('Press Ctrl+C to stop\n')
  
  // Check if Tinypedal is running
  const tinypedalRunning = await checkTinypedalProcess()
  if (!tinypedalRunning) {
    console.log('⚠️  Warning: Tinypedal process not detected')
    console.log('   Make sure Tinypedal is running and connected to Le Mans Ultimate')
    console.log('')
  }
  
  // Initial check
  await checkForSharedMemoryObjects()
  
  // Monitor continuously
  setInterval(checkForSharedMemoryObjects, 1000) // Check every second
  
  // Also check for Tinypedal process every 10 seconds
  setInterval(async () => {
    const running = await checkTinypedalProcess()
    if (!running && foundObjects.size === 0) {
      console.log('⏳ Waiting for Tinypedal to start...')
    }
  }, 10000)
}

main().catch(console.error)
