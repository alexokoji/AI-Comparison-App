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
    const userId = sessionId || 'default-user'
    
    // Step 1: Add the message to memory
    await axios.post(
      `${targetUrl}/v1/memories/`,
      {
        user_id: userId,
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          'Authorization': `Token ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Step 2: Try to search/retrieve relevant memories to get context
    let memories = []
    let memoryText = ''
    
    try {
      const searchResponse = await axios.post(
        `${targetUrl}/v1/memories/search/`,
        {
          user_id: userId,
          query: message,
          limit: 5,
        },
        {
          headers: {
            'Authorization': `Token ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
        }
      )
      memories = searchResponse.data?.results || searchResponse.data || []
    } catch (searchError) {
      // If search fails, try to get all memories for the user
      try {
        const listResponse = await axios.get(
          `${targetUrl}/v1/memories/?user_id=${userId}`,
          {
            headers: {
              'Authorization': `Token ${apiKey.trim()}`,
            },
          }
        )
        memories = listResponse.data?.results || listResponse.data || []
      } catch (listError) {
        // If both fail, just use the add response
        memories = []
      }
    }

    // Step 3: Generate a conversational response based on memories and message
    let responseText = ''
    
    // Extract memory content
    const memoryContents = memories
      .map((mem) => mem.memory || mem.content || mem.text)
      .filter(Boolean)
      .slice(0, 3)
    
    // Generate contextual response
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      if (memoryContents.length > 0) {
        responseText = `Hello! I remember our previous conversations. ${memoryContents[0]}. How can I help you today?`
      } else {
        responseText = 'Hello! Nice to meet you. How can I help you today?'
      }
    } else if (lowerMessage.includes('how are you') || lowerMessage.includes('how are')) {
      responseText = "I'm doing well, thank you for asking! I'm here to help you with anything you need. How can I assist you?"
    } else if (lowerMessage.includes('what') && (lowerMessage.includes('remember') || lowerMessage.includes('know'))) {
      if (memoryContents.length > 0) {
        responseText = `Based on our previous conversations, I remember: ${memoryContents.join('. ')}. Is there something specific you'd like me to recall?`
      } else {
        responseText = "I don't have any specific memories yet, but I'm ready to learn! What would you like me to remember?"
      }
    } else if (lowerMessage.includes('remember') || lowerMessage.includes('remember that')) {
      responseText = `Got it! I've stored that information. ${memoryContents.length > 0 ? `I now remember: ${memoryContents[0]}.` : 'I\'ll remember this for our future conversations.'}`
    } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      responseText = "You're welcome! I'm happy to help. Is there anything else you'd like to know or discuss?"
    } else if (memoryContents.length > 0) {
      // Use memories to provide contextual response
      responseText = `Based on what I remember: ${memoryContents[0]}. Regarding your question "${message}", I can help you with that. ${memoryContents.length > 1 ? `I also recall: ${memoryContents[1]}.` : ''}`
    } else {
      // Default conversational response
      responseText = `I understand you're asking about "${message}". I've stored this in my memory. Could you tell me more about what you'd like to know?`
    }

    // Step 4: Store the assistant response in memory
    try {
      await axios.post(
        `${targetUrl}/v1/memories/`,
        {
          user_id: userId,
          messages: [{ role: 'assistant', content: responseText }],
        },
        {
          headers: {
            'Authorization': `Token ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
        }
      )
    } catch (storeError) {
      // If storing assistant response fails, continue anyway
    }

    res.json({
      response: responseText,
      memories: memories,
      message: message,
    })
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
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Load ZEP_API_KEY from environment variables (backend .env) or use from request body
    // Priority: 1) process.env.ZEP_API_KEY, 2) request body apiKey
    const zepApiKey = process.env.ZEP_API_KEY || apiKey
    
    if (!zepApiKey) {
      console.error('ZEP_API_KEY not found in environment variables or request body')
      return res.status(500).json({ 
        error: 'Zep API key not configured. Please set ZEP_API_KEY in server .env file or provide it in the request.' 
      })
    }
    
    console.log('ZEP API KEY SOURCE:', process.env.ZEP_API_KEY ? 'ENV' : 'REQUEST BODY')

    // Debug: Log API key details (remove after debugging)
    console.log('ZEP KEY FROM ENV EXISTS:', !!zepApiKey)
    console.log('ZEP KEY LENGTH:', zepApiKey ? zepApiKey.length : 0)
    console.log('ZEP KEY PREVIEW (first 20):', zepApiKey ? `${zepApiKey.trim().substring(0, 20)}...` : 'MISSING')
    console.log('ZEP KEY PREVIEW (last 10):', zepApiKey && zepApiKey.length > 10 ? `...${zepApiKey.trim().substring(zepApiKey.length - 10)}` : 'MISSING')
    console.log('ZEP KEY HAS WHITESPACE:', zepApiKey ? zepApiKey !== zepApiKey.trim() : false)
    console.log('ZEP KEY STARTS WITH z_:', zepApiKey ? zepApiKey.trim().startsWith('z_') : false)

    const targetUrl = apiUrl || process.env.ZEP_API_URL || 'https://api.getzep.com'
    const sessionIdToUse = sessionId || `session-${Date.now()}`
    
    // Ensure API key is properly trimmed - remove ALL whitespace
    const trimmedApiKey = zepApiKey.trim().replace(/\s+/g, '')
    
    // Verify key format - Zep keys should start with "z_"
    if (!trimmedApiKey.startsWith('z_')) {
      console.error('ZEP KEY FORMAT WARNING: Key does not start with "z_" - this may be invalid')
    }
    
    // Zep ONLY accepts Authorization: Bearer format - no other formats work
    const authHeader = `Bearer ${trimmedApiKey}`
    
    console.log('ZEP AUTH HEADER LENGTH:', authHeader.length)
    console.log('ZEP AUTH HEADER PREVIEW:', authHeader.substring(0, 25) + '...')
    console.log('ZEP TARGET URL:', targetUrl)
    console.log('ZEP SESSION ID:', sessionIdToUse)

    // Create or get session first (if needed)
    try {
      console.log('ZEP: Checking session:', `${targetUrl}/api/v2/sessions/${sessionIdToUse}`)
      await axios.get(
        `${targetUrl}/api/v2/sessions/${sessionIdToUse}`,
        {
          headers: {
            'Authorization': authHeader,
          },
        }
      )
      console.log('ZEP: Session exists')
    } catch (sessionError) {
      console.log('ZEP: Session check error status:', sessionError.response?.status)
      console.log('ZEP: Session check error data:', sessionError.response?.data)
      
      // If session doesn't exist, create it
      if (sessionError.response?.status === 404) {
        console.log('ZEP: Creating new session')
        try {
          await axios.post(
            `${targetUrl}/api/v2/sessions`,
            {
              session_id: sessionIdToUse,
              user_id: sessionIdToUse,
            },
            {
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
            }
          )
          console.log('ZEP: Session created successfully')
        } catch (createError) {
          console.error('ZEP: Session creation failed:', createError.response?.status, createError.response?.data)
          throw createError
        }
      } else if (sessionError.response?.status === 401) {
        // If 401, log the exact error from Zep with full details
        console.error('ZEP: Authentication failed - API key rejected by Zep')
        console.error('ZEP: Error status:', sessionError.response?.status)
        console.error('ZEP: Error headers:', JSON.stringify(sessionError.response?.headers, null, 2))
        console.error('ZEP: Error data:', sessionError.response?.data)
        console.error('ZEP: Error data type:', typeof sessionError.response?.data)
        console.error('ZEP: Full error response:', JSON.stringify(sessionError.response?.data, null, 2))
        console.error('ZEP: Request URL was:', sessionError.config?.url)
        console.error('ZEP: Request headers sent:', JSON.stringify(sessionError.config?.headers, null, 2))
        
        // Check if the API key might be invalid
        if (trimmedApiKey.length < 50) {
          console.error('ZEP: WARNING - API key seems too short. Zep keys are typically longer.')
        }
        if (!trimmedApiKey.startsWith('z_')) {
          console.error('ZEP: WARNING - API key does not start with "z_" - this is likely invalid')
        }
        
        throw sessionError
      } else {
        throw sessionError
      }
    }

    // Add message to session - Zep expects messages in request body
    console.log('ZEP: Adding message to session')
    try {
      await axios.post(
        `${targetUrl}/api/v2/sessions/${sessionIdToUse}/messages`,
        {
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        },
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('ZEP: Message added successfully')
    } catch (messageError) {
      console.error('ZEP: Message add failed:', messageError.response?.status, messageError.response?.data)
      throw messageError
    }

    // Get memory/context - Zep returns a summary and memories
    console.log('ZEP: Retrieving memory')
    let memoryResponse
    try {
      memoryResponse = await axios.get(
        `${targetUrl}/api/v2/sessions/${sessionIdToUse}/memory`,
        {
          headers: {
            'Authorization': authHeader,
          },
        }
      )
      console.log('ZEP: Memory retrieved successfully')
    } catch (memoryError) {
      console.error('ZEP: Memory retrieval failed:', memoryError.response?.status, memoryError.response?.data)
      throw memoryError
    }

    const memoryData = memoryResponse.data
    
    // Generate conversational response from Zep memory
    let responseText = ''
    const lowerMessage = message.toLowerCase()
    
    // Extract context from Zep memory
    const summary = memoryData.summary?.content || ''
    const recentMessages = memoryData.messages || []
    const memories = memoryData.memories || []
    
    // Generate contextual response
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      if (summary) {
        responseText = `Hello! ${summary} How can I help you today?`
      } else if (recentMessages.length > 0) {
        responseText = 'Hello! I remember our conversation. How can I assist you?'
      } else {
        responseText = 'Hello! Nice to meet you. How can I help you today?'
      }
    } else if (lowerMessage.includes('how are you') || lowerMessage.includes('how are')) {
      responseText = "I'm doing well, thank you! I'm here to help you with anything you need. How can I assist you?"
    } else if (lowerMessage.includes('what') && (lowerMessage.includes('remember') || lowerMessage.includes('know'))) {
      if (summary) {
        responseText = `Based on our conversation history: ${summary} Is there something specific you'd like me to recall?`
      } else if (memories.length > 0) {
        const memoryText = memories.slice(0, 2).map((mem) => mem.content || mem.memory).filter(Boolean).join('. ')
        responseText = `I remember: ${memoryText}. What would you like to know?`
      } else {
        responseText = "I don't have specific memories yet, but I'm ready to learn! What would you like me to remember?"
      }
    } else if (summary) {
      // Use Zep's summary for contextual response
      responseText = `${summary} Regarding "${message}", I can help you with that.`
    } else if (recentMessages.length > 0) {
      // Use conversation context
      const assistantMessages = recentMessages.filter((msg) => msg.role === 'assistant' || msg.role_type === 'ai')
      if (assistantMessages.length > 0) {
        responseText = `Based on our conversation, ${assistantMessages[assistantMessages.length - 1].content || `I understand you're asking about "${message}". How can I help?`}`
      } else {
        responseText = `I understand you're asking about "${message}". I've stored this in my memory. Could you tell me more?`
      }
    } else if (memories.length > 0) {
      const memoryText = memories.slice(0, 2).map((mem) => mem.content || mem.memory).filter(Boolean).join('. ')
      responseText = `Based on what I remember: ${memoryText}. Regarding "${message}", I can help you with that.`
    } else {
      // Default conversational response
      responseText = `I understand you're asking about "${message}". I've stored this in my memory. How can I help you further?`
    }
    
    // Store assistant response in Zep
    try {
      await axios.post(
        `${targetUrl}/api/v2/sessions/${sessionIdToUse}/messages`,
        {
          messages: [
            {
              role: 'assistant',
              content: responseText,
            },
          ],
        },
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      )
    } catch (storeError) {
      // If storing assistant response fails, continue anyway
    }

    res.json({
      response: responseText,
      context: memoryData,
      summary: memoryData.summary,
      memories: memoryData.memories || [],
    })
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
        message: errorMessage,
        stack: error.stack
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
