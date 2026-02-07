import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// API routes must come before static file serving
// Mem0 API Proxy
app.post('/api/mem0/memories', async (req, res) => {
  try {
    const { message, sessionId, apiKey, apiUrl } = req.body
    
    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ 
        error: 'Mem0 API key is required. Please add it in the Settings page.' 
      })
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        error: 'Message is required' 
      })
    }

    const targetUrl = apiUrl || 'https://api.mem0.ai'
    const response = await axios.post(
      `${targetUrl}/v1/memories/`,
      {
        messages: [{ role: 'user', content: message }],
        user_id: sessionId || 'default-user',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
      }
    )

    res.json(response.data)
  } catch (error) {
    // Check for network/DNS errors
    const isNetworkError = error.code === 'ENOTFOUND' || 
                          error.code === 'ECONNREFUSED' || 
                          error.code === 'ETIMEDOUT' ||
                          error.code === 'EAI_AGAIN'
    
    if (isNetworkError) {
      const statusCode = 503
      const errorMessage = error.code === 'ENOTFOUND' 
        ? `Cannot reach Mem0 API (${error.hostname || 'api.mem0.ai'}). Please check your internet connection and API URL.`
        : `Network error connecting to Mem0 API: ${error.message}`
      
      console.error('Mem0 Proxy Network Error:', {
        code: error.code,
        hostname: error.hostname,
        message: error.message
      })
      
      return res.status(statusCode).json({
        error: errorMessage,
        code: error.code
      })
    }
    
    const statusCode = error.response?.status || 500
    const rawErrorData = error.response?.data
    // Handle both object and string error responses
    const errorData = typeof rawErrorData === 'string' 
      ? { message: rawErrorData.trim() } 
      : (rawErrorData || {})
    
    // Handle different error formats
    let errorMessage = 'Failed to communicate with Mem0 AI'
    
    if (statusCode === 401) {
      // Mem0 returns detailed error objects with 'detail' field
      if (errorData.detail) {
        errorMessage = 'Mem0 API key is invalid or expired. Please check your API key in Settings.'
      } else if (errorData.message) {
        errorMessage = `Mem0 API authentication failed: ${errorData.message}`
      } else if (typeof rawErrorData === 'string' && rawErrorData.toLowerCase().includes('unauthorized')) {
        errorMessage = 'Mem0 API key is invalid or expired. Please check your API key in Settings.'
      } else {
        errorMessage = 'Mem0 API key is invalid or expired. Please check your API key in Settings.'
      }
      // Don't log 401/400 errors - frontend will show them to users
    } else if (statusCode === 400) {
      errorMessage = errorData.message || errorData.detail || 'Invalid request to Mem0 API'
      // Don't log 401/400 errors - frontend will show them to users
    } else {
      // Log unexpected errors with full details
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : 'Mem0 API error occurred'
      } else if (error.message) {
        errorMessage = error.message
      }
      console.error('❌ Mem0 Proxy Error:', {
        status: statusCode,
        error: errorData,
        message: errorMessage
      })
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: errorData.detail || (typeof rawErrorData === 'string' ? rawErrorData.trim() : errorData)
    })
  }
})

// Zep API Proxy
app.post('/api/zep/messages', async (req, res) => {
  try {
    const { message, sessionId, apiKey, apiUrl } = req.body
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' })
    }

    const targetUrl = apiUrl || 'https://api.getzep.com'
    const sessionIdToUse = sessionId || `session-${Date.now()}`

    // Add message to session
    await axios.post(
      `${targetUrl}/api/v2/sessions/${sessionIdToUse}/messages`,
      {
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Get memory/context
    const memoryResponse = await axios.get(
      `${targetUrl}/api/v2/sessions/${sessionIdToUse}/memory`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    res.json(memoryResponse.data)
  } catch (error) {
    // Check for network/DNS errors
    const isNetworkError = error.code === 'ENOTFOUND' || 
                          error.code === 'ECONNREFUSED' || 
                          error.code === 'ETIMEDOUT' ||
                          error.code === 'EAI_AGAIN'
    
    if (isNetworkError) {
      const statusCode = 503
      const errorMessage = error.code === 'ENOTFOUND' 
        ? `Cannot reach Zep API (${error.hostname || 'api.getzep.com'}). Please check your internet connection and API URL.`
        : `Network error connecting to Zep API: ${error.message}`
      
      console.error('Zep Proxy Network Error:', {
        code: error.code,
        hostname: error.hostname,
        message: error.message
      })
      
      return res.status(statusCode).json({
        error: errorMessage,
        code: error.code
      })
    }
    
    const statusCode = error.response?.status || 500
    const rawErrorData = error.response?.data
    // Handle both object and string error responses
    const errorData = typeof rawErrorData === 'string' 
      ? { message: rawErrorData.trim() } 
      : (rawErrorData || {})
    
    let errorMessage = 'Failed to communicate with Zep AI'
    
    if (statusCode === 401) {
      // Check if error data contains unauthorized message
      if (typeof rawErrorData === 'string' && rawErrorData.toLowerCase().includes('unauthorized')) {
        errorMessage = 'Zep API key is invalid or expired. Please check your API key in Settings.'
      } else if (errorData.message) {
        errorMessage = `Zep API authentication failed: ${errorData.message}`
      } else {
        errorMessage = 'Zep API key is invalid or expired. Please check your API key in Settings.'
      }
      // Don't log 401/400 errors - frontend will show them to users
    } else if (statusCode === 400) {
      errorMessage = errorData.message || 'Invalid request to Zep API'
      // Don't log 401/400 errors - frontend will show them to users
    } else {
      // Log unexpected errors with full details
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (error.message) {
        errorMessage = error.message
      }
      console.error('❌ Zep Proxy Error:', {
        status: statusCode,
        error: errorData,
        message: errorMessage
      })
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: typeof rawErrorData === 'string' ? rawErrorData.trim() : errorData
    })
  }
})

// Serve static files from the React app in production
const distPath = join(__dirname, '../dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  
  // Serve React app for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  if (process.env.NODE_ENV === 'production') {
    console.log(`📦 Serving production build`)
  } else {
    console.log(`🔧 Development mode - Frontend should run separately on port 5173`)
  }
})
