const koffi = require('koffi')

console.log('🔍 Listing All Shared Memory Objects')
console.log('====================================')
console.log('')

const kernel32 = koffi.load('kernel32.dll')
const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])
const GetLastError = kernel32.func('GetLastError', 'uint32', [])

const SECTION_MAP_READ = 0x0004

// Common shared memory names to test
const commonNames = [
  // rFactor2 related
  'Local\\rFactor2SMMPData',
  'Local\\rFactor2SMMPData_0',
  'Local\\rFactor2SMMPData_1',
  'Local\\rFactor2SMMPData_2',
  'rFactor2SMMPData',
  'rFactor2SMMPData_0',
  'rFactor2SMMPData_1',
  'rFactor2SMMPData_2',
  
  // Le Mans Ultimate specific
  'Local\\LeMansUltimateSMMPData',
  'Local\\LeMansUltimateSMMPData_0',
  'Local\\LeMansUltimateSMMPData_1',
  'Local\\LeMansUltimateSMMPData_2',
  'LeMansUltimateSMMPData',
  'LeMansUltimateSMMPData_0',
  'LeMansUltimateSMMPData_1',
  'LeMansUltimateSMMPData_2',
  
  // Generic names
  'Local\\SMMPData',
  'Local\\SMMPData_0',
  'Local\\SMMPData_1',
  'Local\\SMMPData_2',
  'SMMPData',
  'SMMPData_0',
  'SMMPData_1',
  'SMMPData_2',
  
  // Other possible variations
  'Local\\rF2SMMPData',
  'Local\\rF2SMMPData_0',
  'Local\\rF2SMMPData_1',
  'Local\\rF2SMMPData_2',
  'rF2SMMPData',
  'rF2SMMPData_0',
  'rF2SMMPData_1',
  'rF2SMMPData_2',
  
  // Global namespace
  'Global\\rFactor2SMMPData',
  'Global\\rFactor2SMMPData_0',
  'Global\\rFactor2SMMPData_1',
  'Global\\rFactor2SMMPData_2',
  'Global\\LeMansUltimateSMMPData',
  'Global\\LeMansUltimateSMMPData_0',
  'Global\\LeMansUltimateSMMPData_1',
  'Global\\LeMansUltimateSMMPData_2',
  'Global\\SMMPData',
  'Global\\SMMPData_0',
  'Global\\SMMPData_1',
  'Global\\SMMPData_2'
]

console.log('🔍 Testing for existing shared memory objects...')
console.log('')

let foundCount = 0
const foundObjects = []

for (const name of commonNames) {
  try {
    const handle = OpenFileMappingA(SECTION_MAP_READ, false, name)
    const error = GetLastError()
    
    if (handle) {
      console.log(`✅ Found: "${name}" (Handle: ${handle})`)
      foundObjects.push(name)
      foundCount++
      CloseHandle(handle)
    } else {
      // Only show specific errors for debugging
      if (error !== 2) { // 2 = ERROR_FILE_NOT_FOUND (expected for most)
        console.log(`❌ Error for "${name}": ${error}`)
      }
    }
  } catch (error) {
    console.log(`❌ Exception for "${name}": ${error.message}`)
  }
}

console.log('')
console.log(`📊 Summary: Found ${foundCount} shared memory object(s)`)
console.log('')

if (foundCount > 0) {
  console.log('🎉 Found shared memory objects:')
  foundObjects.forEach(name => console.log(`  - ${name}`))
  console.log('')
  console.log('These objects exist and can be accessed!')
} else {
  console.log('❌ No shared memory objects found')
  console.log('')
  console.log('🔧 This suggests:')
  console.log('1. The plugin might not be creating shared memory objects')
  console.log('2. The plugin might be using different names')
  console.log('3. The plugin might not be working correctly')
  console.log('4. The game might need to be in a specific state')
  console.log('')
  console.log('💡 Try:')
  console.log('- Make sure you are actually driving in the game (not just in menus)')
  console.log('- Check if the plugin is actually loaded (look for plugin messages in game)')
  console.log('- Try different game modes (practice, race, etc.)')
  console.log('- Check if there are any error messages in the game console')
}

console.log('')
console.log('Press Ctrl+C to exit')
