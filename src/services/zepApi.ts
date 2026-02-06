import axios from 'axios'

// Get configuration from environment variables or localStorage
const getConfig = () => {
  const saved = localStorage.getItem('api-settings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      return {
        apiUrl: settings.zepApiUrl || import.meta.env.VITE_ZEP_API_URL || 'https://api.getzep.com',
        apiKey: settings.zepApiKey || import.meta.env.VITE_ZEP_API_KEY,
      }
    } catch {
      // Fallback to env vars if parsing fails
    }
  }
  return {
    apiUrl: import.meta.env.VITE_ZEP_API_URL || 'https://api.getzep.com',
    apiKey: import.meta.env.VITE_ZEP_API_KEY,
  }
}

const createClient = () => {
  const config = getConfig()
  return axios.create({
    baseURL: config.apiUrl,
    headers: {
      'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : '',
      'Content-Type': 'application/json',
    },
  })
}

export interface ZepMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ZepResponse {
  response: string
  context?: any
}

export const zepApi = {
  async sendMessage(message: string, sessionId?: string): Promise<ZepResponse> {
    try {
      const client = createClient()
      const sessionIdToUse = sessionId || `session-${Date.now()}`
      
      // First, add the message to the session
      await client.post(`/api/v2/sessions/${sessionIdToUse}/messages`, {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      })

      // Then get the memory/context
      const memoryResponse = await client.get(`/api/v2/sessions/${sessionIdToUse}/memory`)
      
      return {
        response: memoryResponse.data?.summary?.content || 'Response received',
        context: memoryResponse.data,
      }
    } catch (error: any) {
      console.error('Zep API Error:', error)
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to communicate with Zep AI'
      )
    }
  },

  async getSession(sessionId: string) {
    try {
      const client = createClient()
      const response = await client.get(`/api/v2/sessions/${sessionId}`)
      return response.data
    } catch (error: any) {
      console.error('Zep Get Session Error:', error)
      throw new Error('Failed to retrieve session')
    }
  },
}
