const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

console.log('🔍 Testing if Tinypedal uses REST API')
console.log('====================================')
console.log('')
console.log('This script will test if Tinypedal is actually')
console.log('using the REST API instead of shared memory.')
console.log('')

async function testRestApiWhileTinypedalRunning() {
  console.log('🔍 Testing REST API while Tinypedal is running...')
  
  try {
    // Test the REST API endpoint
    const { stdout } = await execAsync('curl -s http://localhost:8080/api/v1/telemetry')
    
    if (stdout && !stdout.includes('curl: (7)')) {
      console.log('✅ REST API is responding!')
      
      try {
        const data = JSON.parse(stdout)
        console.log('📊 Telemetry data available:')
        
        // Check for key telemetry fields
        const keyFields = ['rpm', 'speed', 'gear', 'fuel', 'brake', 'throttle']
        keyFields.forEach(field => {
          if (data[field] !== undefined) {
            console.log(`  ✅ ${field}: ${data[field]}`)
          } else {
            console.log(`  ❌ ${field}: Not available`)
          }
        })
        
        console.log('')
        console.log('🎉 This suggests Tinypedal might be using the REST API!')
        console.log('💡 Your application should work with the same approach.')
        
      } catch (error) {
        console.log('❌ Response is not valid JSON')
      }
    } else {
      console.log('❌ REST API is not responding')
      console.log('   This means Tinypedal is using a different method')
    }
  } catch (error) {
    console.log('❌ Error testing REST API:', error.message)
  }
}

async function checkTinypedalProcess() {
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq tinypedal.exe" /FO CSV')
    if (stdout.includes('tinypedal.exe')) {
      console.log('🎮 Tinypedal is running')
      return true
    }
  } catch (error) {
    // Ignore errors
  }
  return false
}

async function testAlternativePorts() {
  console.log('\n🔍 Testing alternative ports that Tinypedal might use...')
  
  const ports = [8080, 8081, 8082, 9000, 9001, 9002, 5000, 5001, 5002]
  
  for (const port of ports) {
    try {
      const { stdout } = await execAsync(`curl -s --connect-timeout 1 http://localhost:${port}/api/v1/telemetry`)
      
      if (stdout && !stdout.includes('curl: (7)') && !stdout.includes('curl: (28)')) {
        console.log(`🎉 Found responding API on port ${port}!`)
        console.log('📊 Response preview:', stdout.substring(0, 200) + '...')
      }
    } catch (error) {
      // Ignore errors
    }
  }
}

async function main() {
  console.log('Starting Tinypedal REST API test...\n')
  
  // Check if Tinypedal is running
  const tinypedalRunning = await checkTinypedalProcess()
  
  if (!tinypedalRunning) {
    console.log('❌ Tinypedal is not running!')
    console.log('   Please start Tinypedal and make sure it\'s connected to Le Mans Ultimate')
    return
  }
  
  // Test REST API
  await testRestApiWhileTinypedalRunning()
  
  // Test alternative ports
  await testAlternativePorts()
  
  console.log('\n📋 Test complete!')
  console.log('')
  console.log('💡 If the REST API is responding:')
  console.log('   - Tinypedal might be using the REST API')
  console.log('   - Your application should work with the same approach')
  console.log('')
  console.log('💡 If no REST API is found:')
  console.log('   - Tinypedal is using a completely different method')
  console.log('   - We need to investigate further')
}

main().catch(console.error)
