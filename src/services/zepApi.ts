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

// Use backend proxy to avoid CORS issues
const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001')

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
      const config = getConfig()
      
      if (!config.apiKey) {
        throw new Error('Zep API key is not configured. Please add it in Settings.')
      }

      const sessionIdToUse = sessionId || `session-${Date.now()}`
      
      const response = await axios.post(`${API_PROXY_URL}/api/zep/messages`, {
        message,
        sessionId: sessionIdToUse,
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
      })
      
      return {
        response: response.data?.summary?.content || response.data?.message || 'Response received',
        context: response.data,
      }
    } catch (error: any) {
      console.error('Zep API Error:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to communicate with Zep AI'
      
      if (errorMessage.includes('API key') || errorMessage.includes('CORS')) {
        throw new Error('Zep API key is missing or invalid. Please check your Settings.')
      }
      
      if (error.response?.status === 401) {
        throw new Error('Zep API authentication failed. Please check your API key in Settings.')
      }
      
      if (error.message.includes('Network Error') || error.message.includes('CORS')) {
        throw new Error('CORS error: Please make sure the backend proxy server is running on port 3001')
      }
      
      throw new Error(errorMessage)
    }
  },

  async getSession(sessionId: string) {
    try {
      // This would need a separate proxy endpoint, for now return empty
      return {}
    } catch (error: any) {
      console.error('Zep Get Session Error:', error)
      throw new Error('Failed to retrieve session')
    }
  },
}
