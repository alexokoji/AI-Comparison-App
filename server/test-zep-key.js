import axios from 'axios'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try loading from server/.env first, then root .env
dotenv.config({ path: join(__dirname, '.env') })
if (!process.env.ZEP_API_KEY && !process.env.VITE_ZEP_API_KEY) {
  // Try root .env
  const rootEnvPath = join(__dirname, '..', '.env')
  if (existsSync(rootEnvPath)) {
    const envContent = readFileSync(rootEnvPath, 'utf-8')
    const envLines = envContent.split('\n')
    envLines.forEach(line => {
      const match = line.match(/^VITE_ZEP_API_KEY=(.+)$/)
      if (match) {
        process.env.VITE_ZEP_API_KEY = match[1].trim()
      }
    })
  }
  dotenv.config({ path: rootEnvPath })
}

// Load API key from environment or .env
const zepApiKey = process.env.ZEP_API_KEY || process.env.VITE_ZEP_API_KEY
const zepApiUrl = process.env.ZEP_API_URL || process.env.VITE_ZEP_API_URL || 'https://api.getzep.com'

console.log('='.repeat(60))
console.log('ZEP API KEY VALIDATION TEST')
console.log('='.repeat(60))
console.log()

if (!zepApiKey) {
  console.error('❌ ERROR: ZEP_API_KEY not found in environment variables')
  console.log('Please set ZEP_API_KEY in your .env file')
  process.exit(1)
}

console.log('✅ API Key found')
console.log('📏 Key Length:', zepApiKey.length)
console.log('🔑 Key Preview (first 20):', zepApiKey.substring(0, 20) + '...')
console.log('🔑 Key Preview (last 10):', '...' + zepApiKey.substring(zepApiKey.length - 10))
console.log('🌐 API URL:', zepApiUrl)
console.log()

// Clean the key
const trimmedKey = zepApiKey.trim().replace(/\s+/g, '')
console.log('🧹 Trimmed Key Length:', trimmedKey.length)
console.log('✅ Starts with "z_":', trimmedKey.startsWith('z_'))
console.log()

// Test 1: Try to list sessions (simple endpoint that requires auth)
console.log('Test 1: Testing API key with GET /api/v2/sessions')
console.log('-'.repeat(60))
try {
  const response = await axios.get(
    `${zepApiUrl}/api/v2/sessions`,
    {
      headers: {
        'Authorization': `Bearer ${trimmedKey}`,
      },
      params: {
        limit: 1
      }
    }
  )
  console.log('✅ SUCCESS: API key is VALID')
  console.log('📊 Response Status:', response.status)
  console.log('📦 Response Data:', JSON.stringify(response.data, null, 2))
} catch (error) {
  if (error.response) {
    console.log('❌ FAILED: API key is INVALID or REJECTED')
    console.log('📊 Status Code:', error.response.status)
    console.log('📦 Response Data:', error.response.data)
    console.log('📋 Response Headers:', JSON.stringify(error.response.headers, null, 2))
    
    if (error.response.status === 401) {
      console.log()
      console.log('🔍 DIAGNOSIS:')
      console.log('   - The API key was sent correctly')
      console.log('   - Zep API received the request')
      console.log('   - Zep API rejected the key as invalid/unauthorized')
      console.log()
      console.log('💡 SOLUTIONS:')
      console.log('   1. Verify the API key in your Zep dashboard')
      console.log('   2. Check if the key is expired or revoked')
      console.log('   3. Generate a new API key from https://www.getzep.com/')
      console.log('   4. Ensure you copied the complete key (no truncation)')
    }
  } else {
    console.log('❌ NETWORK ERROR:', error.message)
    console.log('   This might be a connectivity issue, not an API key issue')
  }
}

console.log()
console.log('='.repeat(60))

// Test 2: Try to create a test session
console.log()
console.log('Test 2: Testing API key with POST /api/v2/sessions (create session)')
console.log('-'.repeat(60))
const testSessionId = `test-session-${Date.now()}`
try {
  const response = await axios.post(
    `${zepApiUrl}/api/v2/sessions`,
    {
      session_id: testSessionId,
      user_id: 'test-user',
    },
    {
      headers: {
        'Authorization': `Bearer ${trimmedKey}`,
        'Content-Type': 'application/json',
      },
    }
  )
  console.log('✅ SUCCESS: Can create sessions')
  console.log('📊 Response Status:', response.status)
  console.log('📦 Session Created:', response.data)
} catch (error) {
  if (error.response) {
    console.log('❌ FAILED:', error.response.status === 401 ? 'Authentication failed' : 'Request failed')
    console.log('📊 Status Code:', error.response.status)
    console.log('📦 Response Data:', error.response.data)
  } else {
    console.log('❌ NETWORK ERROR:', error.message)
  }
}

console.log()
console.log('='.repeat(60))
console.log('Test Complete')
console.log('='.repeat(60))
