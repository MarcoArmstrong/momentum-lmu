const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Checking rF2SharedMemoryMapPlugin Status')
console.log('==========================================')
console.log('')

// Check if the plugin file exists and is accessible
const gamePath = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Le Mans Ultimate'
const pluginPath = path.join(gamePath, 'Plugins', 'rFactor2SharedMemoryMapPlugin64.dll')

console.log('📁 Plugin file check:')
if (fs.existsSync(pluginPath)) {
  const stats = fs.statSync(pluginPath)
  console.log(`✅ Plugin file exists: ${pluginPath}`)
  console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`)
  console.log(`   Modified: ${stats.mtime.toLocaleString()}`)
  
  // Check if file is readable
  try {
    fs.accessSync(pluginPath, fs.constants.R_OK)
    console.log('   ✅ File is readable')
  } catch (error) {
    console.log('   ❌ File is not readable')
  }
} else {
  console.log(`❌ Plugin file not found: ${pluginPath}`)
}

console.log('')

// Check if Le Mans Ultimate is running
console.log('🎮 Process check:')
try {
  const processes = execSync('tasklist /FI "IMAGENAME eq LeMansUltimate.exe" /FO CSV', { encoding: 'utf8' })
  if (processes.includes('LeMansUltimate.exe')) {
    console.log('✅ Le Mans Ultimate is running')
    
    // Get process details
    const processDetails = execSync('tasklist /FI "IMAGENAME eq LeMansUltimate.exe" /FO TABLE', { encoding: 'utf8' })
    console.log('   Process details:')
    console.log(processDetails.split('\n').slice(1).join('\n'))
  } else {
    console.log('❌ Le Mans Ultimate is not running')
  }
} catch (error) {
  console.log('❌ Could not check processes')
}

console.log('')

// Check for any DLL injection or loaded modules
console.log('🔧 DLL injection check:')
try {
  const modules = execSync('tasklist /FI "IMAGENAME eq LeMansUltimate.exe" /M', { encoding: 'utf8' })
  if (modules.includes('rFactor2SharedMemoryMapPlugin64.dll')) {
    console.log('✅ Plugin DLL is loaded in Le Mans Ultimate process')
  } else {
    console.log('❌ Plugin DLL is not loaded in Le Mans Ultimate process')
    console.log('   This suggests the plugin is not working')
  }
} catch (error) {
  console.log('❌ Could not check loaded modules')
}

console.log('')

// Check for any shared memory objects with different names
console.log('🔍 Alternative shared memory check:')
const alternativeNames = [
  'Local\\rFactor2SMMPData',
  'Local\\rF2SMMPData', 
  'Local\\SMMPData',
  'Local\\rFactor2SharedMemory',
  'Local\\rF2SharedMemory',
  'Local\\SharedMemory',
  'Global\\rFactor2SMMPData',
  'Global\\rF2SMMPData',
  'Global\\SMMPData'
]

const koffi = require('koffi')
const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])
const GetLastError = kernel32.func('GetLastError', 'uint32', [])

const SECTION_MAP_READ = 0x0004

let foundAny = false
for (const name of alternativeNames) {
  try {
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
    if (handle) {
      console.log(`✅ Found shared memory: "${name}"`)
      foundAny = true
      CloseHandle(handle)
    }
  } catch (error) {
    // Ignore errors
  }
}

if (!foundAny) {
  console.log('❌ No shared memory objects found with alternative names')
}

console.log('')

// Check plugin configuration again
console.log('⚙️  Plugin configuration check:')
const configPath = path.join(gamePath, 'UserData', 'player', 'CustomPluginVariables.JSON')
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const pluginConfig = config['rFactor2SharedMemoryMapPlugin64.dll']
    
    if (pluginConfig) {
      console.log('✅ Plugin configuration found:')
      console.log(`   Enabled: ${pluginConfig[' Enabled']}`)
      console.log(`   DebugISIInternals: ${pluginConfig['DebugISIInternals']}`)
      console.log(`   DebugOutputLevel: ${pluginConfig['DebugOutputLevel']}`)
      console.log(`   EnableDirectMemoryAccess: ${pluginConfig['EnableDirectMemoryAccess']}`)
      console.log(`   EnableHWControlInput: ${pluginConfig['EnableHWControlInput']}`)
    } else {
      console.log('❌ Plugin configuration not found')
    }
  } catch (error) {
    console.log(`❌ Error reading configuration: ${error.message}`)
  }
} else {
  console.log('❌ Configuration file not found')
}

console.log('')
console.log('🔧 Troubleshooting recommendations:')
console.log('1. Make sure you are actually driving in the game (not in menus)')
console.log('2. Try starting a practice session and driving around')
console.log('3. Check if there are any error messages in the game console')
console.log('4. Try restarting the game after enabling the plugin')
console.log('5. Check if the plugin requires specific game settings')
console.log('6. Verify that the plugin is compatible with Le Mans Ultimate')
console.log('')
console.log('💡 The plugin might only create shared memory when:')
console.log('   - You are actually driving (not in menus)')
console.log('   - You are in a specific game mode')
console.log('   - The car is on track and moving')
console.log('   - The plugin is properly initialized')
