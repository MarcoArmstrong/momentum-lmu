const fs = require('fs')
const path = require('path')

console.log('🔍 Le Mans Ultimate Plugin Installation Checker')
console.log('===============================================')
console.log('')

// Common installation paths
const possiblePaths = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Le Mans Ultimate',
  'C:\\Program Files\\Steam\\steamapps\\common\\Le Mans Ultimate',
  'D:\\Steam\\steamapps\\common\\Le Mans Ultimate',
  'E:\\Steam\\steamapps\\common\\Le Mans Ultimate'
]

let gamePath = null

// Find the game installation
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    gamePath = testPath
    break
  }
}

if (!gamePath) {
  console.log('❌ Could not find Le Mans Ultimate installation')
  console.log('Searched in:')
  possiblePaths.forEach(p => console.log(`  - ${p}`))
  console.log('')
  console.log('Please make sure Le Mans Ultimate is installed via Steam')
  process.exit(1)
}

console.log(`✅ Found Le Mans Ultimate at: ${gamePath}`)
console.log('')

// Check for plugin files
const pluginsPath = path.join(gamePath, 'Plugins')
const pluginFile = 'rFactor2SharedMemoryMapPlugin64.dll'

console.log('📁 Checking plugin files...')
console.log(`Plugin directory: ${pluginsPath}`)

if (!fs.existsSync(pluginsPath)) {
  console.log('❌ Plugins directory does not exist')
  console.log('This suggests the game installation might be incomplete')
  process.exit(1)
}

const pluginPath = path.join(pluginsPath, pluginFile)
if (!fs.existsSync(pluginPath)) {
  console.log(`❌ Plugin file not found: ${pluginFile}`)
  console.log('')
  console.log('🔧 To install the plugin:')
  console.log('1. Download rFactor2SharedMemoryMapPlugin64.dll from:')
  console.log('   https://github.com/TheIronWolfModding/rF2SharedMemoryMapPlugin')
  console.log('2. Place it in the Plugins folder:')
  console.log(`   ${pluginsPath}`)
  process.exit(1)
}

console.log(`✅ Plugin file found: ${pluginFile}`)

// Check plugin configuration
const userDataPath = path.join(gamePath, 'UserData', 'player')
const configFile = 'CustomPluginVariables.JSON'

console.log('')
console.log('⚙️  Checking plugin configuration...')
console.log(`Config directory: ${userDataPath}`)

if (!fs.existsSync(userDataPath)) {
  console.log('❌ UserData/player directory does not exist')
  console.log('This might be created when you first run the game')
  process.exit(1)
}

const configPath = path.join(userDataPath, configFile)
if (!fs.existsSync(configPath)) {
  console.log(`❌ Configuration file not found: ${configFile}`)
  console.log('')
  console.log('🔧 To enable the plugin:')
  console.log('1. Start Le Mans Ultimate at least once')
  console.log('2. Look for CustomPluginVariables.JSON in:')
  console.log(`   ${userDataPath}`)
  console.log('3. Add or modify the plugin entry to enable it')
  process.exit(1)
}

console.log(`✅ Configuration file found: ${configFile}`)

// Try to read and parse the config
try {
  const configContent = fs.readFileSync(configPath, 'utf8')
  console.log('')
  console.log('📄 Configuration file content:')
  console.log('─'.repeat(50))
  console.log(configContent)
  console.log('─'.repeat(50))
  
  // Check if plugin is enabled
  if (configContent.includes(pluginFile) && configContent.includes('" Enabled"') && configContent.includes('"1"')) {
    console.log('✅ Plugin appears to be enabled in configuration')
  } else if (configContent.includes(pluginFile)) {
    console.log('⚠️  Plugin found in configuration but may not be enabled')
    console.log('Look for a line like: " Enabled" : 1')
  } else {
    console.log('❌ Plugin not found in configuration')
    console.log('')
    console.log('🔧 To enable the plugin, add this to CustomPluginVariables.JSON:')
    console.log('{')
    console.log(`  "rFactor2SharedMemoryMapPlugin64.dll" : {`)
    console.log(`    " Enabled" : 1`)
    console.log(`  }`)
    console.log('}')
  }
  
} catch (error) {
  console.log(`❌ Failed to read configuration file: ${error.message}`)
}

console.log('')
console.log('🎮 Next steps:')
console.log('1. Make sure Le Mans Ultimate is running')
console.log('2. Run the game in Borderless or Windowed mode (not Fullscreen)')
console.log('3. If you modified the configuration, restart the game')
console.log('4. Run the shared memory test to verify it works')
console.log('')
console.log('Test command: node test-shared-memory-detailed.js')
