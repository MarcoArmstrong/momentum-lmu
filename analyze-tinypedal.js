const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const execAsync = promisify(exec)

console.log('🔍 Tinypedal Analysis Tool')
console.log('==========================')
console.log('')
console.log('This script will analyze Tinypedal to understand')
console.log('how it accesses shared memory with Le Mans Ultimate.')
console.log('')

async function findTinypedalProcess() {
  console.log('🔍 Looking for Tinypedal processes...')
  
  try {
    // Look for Python processes
    const { stdout: pythonOutput } = await execAsync('tasklist /FI "IMAGENAME eq python.exe" /FO CSV /V')
    const pythonLines = pythonOutput.split('\n').filter(line => line.includes('python.exe'))
    
    if (pythonLines.length > 0) {
      console.log('🐍 Found Python processes:')
      pythonLines.forEach(line => {
        const parts = line.split(',')
        if (parts.length >= 2) {
          const pid = parts[1].replace(/"/g, '')
          console.log(`  - Python.exe (PID: ${pid})`)
        }
      })
    }
    
    // Look for tinypedal.exe
    const { stdout: tinypedalOutput } = await execAsync('tasklist /FI "IMAGENAME eq tinypedal.exe" /FO CSV /V')
    const tinypedalLines = tinypedalOutput.split('\n').filter(line => line.includes('tinypedal.exe'))
    
    if (tinypedalLines.length > 0) {
      console.log('🎮 Found Tinypedal processes:')
      tinypedalLines.forEach(line => {
        const parts = line.split(',')
        if (parts.length >= 2) {
          const pid = parts[1].replace(/"/g, '')
          console.log(`  - tinypedal.exe (PID: ${pid})`)
        }
      })
    }
    
    return pythonLines.length > 0 || tinypedalLines.length > 0
  } catch (error) {
    console.log('❌ Error finding Tinypedal processes:', error.message)
    return false
  }
}

async function checkTinypedalFiles() {
  console.log('\n📁 Looking for Tinypedal files...')
  
  const possiblePaths = [
    'C:\\Program Files\\TinyPedal',
    'C:\\Program Files (x86)\\TinyPedal',
    path.join(process.env.USERPROFILE || '', 'AppData\\Local\\TinyPedal'),
    path.join(process.env.USERPROFILE || '', 'AppData\\Roaming\\TinyPedal'),
    path.join(process.env.USERPROFILE || '', 'Documents\\TinyPedal'),
    path.join(process.env.USERPROFILE || '', 'Downloads\\TinyPedal'),
    path.join(process.env.USERPROFILE || '', 'Desktop\\TinyPedal')
  ]
  
  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      console.log(`✅ Found Tinypedal directory: ${dirPath}`)
      
      try {
        const files = fs.readdirSync(dirPath)
        console.log(`   Files: ${files.join(', ')}`)
        
        // Look for Python files
        const pythonFiles = files.filter(file => file.endsWith('.py'))
        if (pythonFiles.length > 0) {
          console.log(`   Python files: ${pythonFiles.join(', ')}`)
        }
        
        // Look for configuration files
        const configFiles = files.filter(file => file.includes('config') || file.includes('settings'))
        if (configFiles.length > 0) {
          console.log(`   Config files: ${configFiles.join(', ')}`)
        }
      } catch (error) {
        console.log(`   Error reading directory: ${error.message}`)
      }
    }
  }
}

async function checkPythonModules() {
  console.log('\n🐍 Checking Python modules...')
  
  try {
    // Check if pyRfactor2SharedMemory is installed
    const { stdout } = await execAsync('python -c "import pyRfactor2SharedMemory; print(\'pyRfactor2SharedMemory found\')"')
    console.log('✅ pyRfactor2SharedMemory module is available')
    
    // Try to get more info about the module
    try {
      const { stdout: moduleInfo } = await execAsync('python -c "import pyRfactor2SharedMemory; print(dir(pyRfactor2SharedMemory))"')
      console.log('   Available functions:', moduleInfo.trim())
    } catch (error) {
      console.log('   Could not get module info')
    }
  } catch (error) {
    console.log('❌ pyRfactor2SharedMemory module not found')
    console.log('   This suggests Tinypedal might be using a different approach')
  }
}

async function checkSharedMemoryWithDifferentAccess() {
  console.log('\n🔍 Testing shared memory with different access methods...')
  
  const koffi = require('koffi')
  const kernel32 = koffi.load('kernel32.dll')
  const OpenFileMappingA = kernel32.func('OpenFileMappingA', 'void*', ['uint32', 'bool', 'str'])
  const CloseHandle = kernel32.func('CloseHandle', 'bool', ['void*'])
  
  const SECTION_MAP_READ = 0x0004
  const SECTION_MAP_WRITE = 0x0002
  const STANDARD_RIGHTS_READ = 0x00020000
  const SECTION_QUERY = 0x0001
  const SECTION_MAP_EXECUTE = 0x0008
  const SECTION_EXTEND_SIZE = 0x0010
  
  const accessMethods = [
    { name: 'SECTION_MAP_READ', flag: SECTION_MAP_READ },
    { name: 'SECTION_MAP_READ | SECTION_MAP_WRITE', flag: SECTION_MAP_READ | SECTION_MAP_WRITE },
    { name: 'STANDARD_RIGHTS_READ | SECTION_MAP_READ', flag: STANDARD_RIGHTS_READ | SECTION_MAP_READ },
    { name: 'SECTION_ALL_ACCESS', flag: SECTION_QUERY | SECTION_MAP_READ | SECTION_MAP_WRITE | SECTION_MAP_EXECUTE | SECTION_EXTEND_SIZE }
  ]
  
  const testNames = [
    'Local\\rFactor2SMMPData',
    'rFactor2SMMPData',
    'Local\\SMMPData',
    'SMMPData'
  ]
  
  for (const name of testNames) {
    for (const method of accessMethods) {
      try {
        const handle = OpenFileMappingA(method.flag, false, name)
        if (handle) {
          console.log(`✅ Found: "${name}" with ${method.name}`)
          CloseHandle(handle)
        }
      } catch (error) {
        // Ignore errors
      }
    }
  }
}

async function checkProcessHandles() {
  console.log('\n🔍 Checking process handles...')
  
  try {
    // Get handles for Python processes
    const { stdout } = await execAsync('handle.exe -a python.exe 2>nul || echo "handle.exe not found"')
    
    if (stdout.includes('handle.exe not found')) {
      console.log('⚠️  handle.exe not found - cannot check process handles')
      console.log('   You can download it from: https://docs.microsoft.com/en-us/sysinternals/downloads/handle')
    } else {
      const lines = stdout.split('\n')
      const sharedMemoryLines = lines.filter(line => 
        line.includes('Local\\') || 
        line.includes('Global\\') || 
        line.includes('rFactor') || 
        line.includes('SMMP')
      )
      
      if (sharedMemoryLines.length > 0) {
        console.log('🎉 Found shared memory handles in Python process:')
        sharedMemoryLines.forEach(line => console.log(`  ${line.trim()}`))
      } else {
        console.log('❌ No shared memory handles found in Python process')
      }
    }
  } catch (error) {
    console.log('❌ Error checking process handles:', error.message)
  }
}

async function main() {
  console.log('Starting Tinypedal analysis...\n')
  
  // Check if Tinypedal is running
  const tinypedalRunning = await findTinypedalProcess()
  
  if (!tinypedalRunning) {
    console.log('\n⚠️  Tinypedal is not running!')
    console.log('   Please start Tinypedal and make sure it\'s connected to Le Mans Ultimate')
    console.log('   Then run this script again.')
    return
  }
  
  // Check for Tinypedal files
  await checkTinypedalFiles()
  
  // Check Python modules
  await checkPythonModules()
  
  // Check shared memory with different access methods
  await checkSharedMemoryWithDifferentAccess()
  
  // Check process handles
  await checkProcessHandles()
  
  console.log('\n📋 Analysis complete!')
  console.log('')
  console.log('💡 Next steps:')
  console.log('1. If shared memory objects were found, try using those names in your implementation')
  console.log('2. If pyRfactor2SharedMemory is available, research its API')
  console.log('3. Check Tinypedal\'s source code or documentation for shared memory names')
  console.log('4. Try different access methods or timing')
}

main().catch(console.error)
