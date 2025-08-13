const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

console.log('🔍 Tinypedal Network Activity Monitor')
console.log('=====================================')
console.log('')
console.log('This script will monitor Tinypedal\'s network connections')
console.log('to see if it\'s using the REST API instead of shared memory.')
console.log('')

async function checkTinypedalProcess() {
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq tinypedal.exe" /FO CSV')
    if (stdout.includes('tinypedal.exe')) {
      const lines = stdout.split('\n').filter(line => line.includes('tinypedal.exe'))
      const parts = lines[0].split(',')
      if (parts.length >= 2) {
        const pid = parts[1].replace(/"/g, '')
        console.log(`🎮 Tinypedal process found (PID: ${pid})`)
        return pid
      }
    }
  } catch (error) {
    // Ignore errors
  }
  return null
}

async function checkNetworkConnections(pid) {
  console.log(`\n🌐 Checking network connections for PID ${pid}...`)
  
  try {
    // Use netstat to check connections
    const { stdout } = await execAsync(`netstat -ano | findstr ${pid}`)
    
    if (stdout.trim()) {
      console.log('📡 Network connections found:')
      const lines = stdout.split('\n').filter(line => line.trim())
      
      lines.forEach(line => {
        console.log(`  ${line.trim()}`)
        
        // Check if it's connecting to localhost on port 8080 (REST API)
        if (line.includes('127.0.0.1:8080') || line.includes('localhost:8080')) {
          console.log(`  🎉 Found REST API connection!`)
        }
      })
    } else {
      console.log('❌ No network connections found')
    }
  } catch (error) {
    console.log('❌ Error checking network connections:', error.message)
  }
}

async function checkLocalhostConnections() {
  console.log('\n🔍 Checking all localhost connections...')
  
  try {
    const { stdout } = await execAsync('netstat -ano | findstr 127.0.0.1')
    
    if (stdout.trim()) {
      console.log('📡 Localhost connections found:')
      const lines = stdout.split('\n').filter(line => line.trim())
      
      lines.forEach(line => {
        console.log(`  ${line.trim()}`)
        
        // Check for port 8080 (REST API)
        if (line.includes(':8080')) {
          console.log(`  🎉 Found REST API connection on port 8080!`)
        }
      })
    } else {
      console.log('❌ No localhost connections found')
    }
  } catch (error) {
    console.log('❌ Error checking localhost connections:', error.message)
  }
}

async function testRestApiConnection() {
  console.log('\n🔍 Testing REST API connection...')
  
  try {
    const { stdout } = await execAsync('curl -s http://localhost:8080/api/v1/telemetry')
    
    if (stdout && !stdout.includes('curl: (7)')) {
      console.log('✅ REST API is responding!')
      console.log('📊 Response preview:', stdout.substring(0, 200) + '...')
      
      try {
        const data = JSON.parse(stdout)
        console.log('📋 Available telemetry data:')
        Object.keys(data).forEach(key => {
          console.log(`  - ${key}`)
        })
      } catch (error) {
        console.log('❌ Response is not valid JSON')
      }
    } else {
      console.log('❌ REST API is not responding')
    }
  } catch (error) {
    console.log('❌ Error testing REST API:', error.message)
  }
}

async function checkProcessModules(pid) {
  console.log(`\n🔍 Checking loaded modules for PID ${pid}...`)
  
  try {
    const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /M`)
    
    if (stdout.includes('tinypedal.exe')) {
      console.log('📦 Loaded modules:')
      const lines = stdout.split('\n')
      
      lines.forEach(line => {
        if (line.includes('.dll') || line.includes('.exe')) {
          console.log(`  ${line.trim()}`)
        }
      })
    }
  } catch (error) {
    console.log('❌ Error checking process modules:', error.message)
  }
}

async function main() {
  console.log('Starting Tinypedal network analysis...\n')
  
  // Check if Tinypedal is running
  const pid = await checkTinypedalProcess()
  
  if (!pid) {
    console.log('❌ Tinypedal is not running!')
    console.log('   Please start Tinypedal and make sure it\'s connected to Le Mans Ultimate')
    return
  }
  
  // Check network connections
  await checkNetworkConnections(pid)
  
  // Check all localhost connections
  await checkLocalhostConnections()
  
  // Test REST API connection
  await testRestApiConnection()
  
  // Check process modules
  await checkProcessModules(pid)
  
  console.log('\n📋 Analysis complete!')
  console.log('')
  console.log('💡 If Tinypedal is using the REST API:')
  console.log('   - It will show connections to localhost:8080')
  console.log('   - The REST API will respond to requests')
  console.log('   - This means shared memory is not being used')
  console.log('')
  console.log('💡 If Tinypedal is using shared memory:')
  console.log('   - No network connections will be found')
  console.log('   - We need to find the correct shared memory names')
}

main().catch(console.error)
