const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

console.log('🔍 Testing All Possible REST API Endpoints')
console.log('==========================================')
console.log('')
console.log('This script will test various possible REST API endpoints')
console.log('that Tinypedal might be using.')
console.log('')

async function testEndpoint(baseUrl, endpoint) {
  try {
    const url = `${baseUrl}${endpoint}`
    const { stdout } = await execAsync(`curl -s --connect-timeout 2 "${url}"`)
    
    if (stdout && !stdout.includes('curl: (7)') && !stdout.includes('curl: (28)') && stdout.trim() !== '') {
      console.log(`🎉 Found responding endpoint: ${url}`)
      console.log('📊 Response preview:', stdout.substring(0, 200) + '...')
      
      try {
        const data = JSON.parse(stdout)
        console.log('✅ Valid JSON response!')
        console.log('📋 Available fields:', Object.keys(data).slice(0, 10).join(', '))
      } catch (error) {
        console.log('⚠️  Response is not JSON')
      }
      console.log('')
      return true
    }
  } catch (error) {
    // Ignore errors
  }
  return false
}

async function testAllEndpoints() {
  const baseUrls = [
    'http://localhost:8080',
    'http://localhost:8081', 
    'http://localhost:8082',
    'http://localhost:9000',
    'http://localhost:9001',
    'http://localhost:9002',
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:5002',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082'
  ]
  
  const endpoints = [
    '/api/v1/telemetry',
    '/api/telemetry',
    '/telemetry',
    '/api/v1/data',
    '/api/data',
    '/data',
    '/api/v1/game',
    '/api/game',
    '/game',
    '/api/v1/rf2',
    '/api/rf2',
    '/rf2',
    '/api/v1/lmu',
    '/api/lmu',
    '/lmu',
    '/',
    '/health',
    '/status'
  ]
  
  console.log('🔍 Testing all possible endpoints...\n')
  
  let foundCount = 0
  
  for (const baseUrl of baseUrls) {
    for (const endpoint of endpoints) {
      const found = await testEndpoint(baseUrl, endpoint)
      if (found) {
        foundCount++
      }
    }
  }
  
  if (foundCount === 0) {
    console.log('❌ No responding endpoints found')
    console.log('')
    console.log('💡 This suggests:')
    console.log('1. Tinypedal is not using a REST API')
    console.log('2. Tinypedal is using a completely different method')
    console.log('3. The API might be on a different port or endpoint')
    console.log('4. Tinypedal might be using shared memory with different names')
  } else {
    console.log(`✅ Found ${foundCount} responding endpoint(s)`)
  }
}

async function checkLeMansUltimateProcess() {
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq Le Mans Ultimate.exe" /FO CSV')
    if (stdout.includes('Le Mans Ultimate.exe')) {
      console.log('🎮 Le Mans Ultimate is running')
      return true
    }
  } catch (error) {
    // Ignore errors
  }
  return false
}

async function main() {
  console.log('Starting endpoint test...\n')
  
  // Check if Le Mans Ultimate is running
  const gameRunning = await checkLeMansUltimateProcess()
  
  if (!gameRunning) {
    console.log('⚠️  Le Mans Ultimate is not running')
    console.log('   The REST API might not be available')
  }
  
  // Test all endpoints
  await testAllEndpoints()
  
  console.log('\n📋 Test complete!')
}

main().catch(console.error)
