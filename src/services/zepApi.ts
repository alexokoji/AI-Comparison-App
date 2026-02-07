import apiClient from './apiClient'

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
      
      const response = await apiClient.post(`${API_PROXY_URL}/api/zep/messages`, {
        message,
        sessionId: sessionIdToUse,
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
      })
      
      return {
        response: response.data?.response || response.data?.summary?.content || response.data?.message || 'No response available',
        context: response.data?.context || response.data,
      }
    } catch (error: any) {
      // Extract error message from response
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to communicate with Zep AI'
      
      // Handle 401 authentication errors
      if (error.response?.status === 401) {
        const userMessage = 'Zep API key is invalid or expired. Please check your API key in Settings.'
        // Don't log expected authentication errors - UI will show them to users
        throw new Error(userMessage)
      }
      
      // Handle network/CORS errors
      if (error.message.includes('Network Error') || error.message.includes('CORS') || error.code === 'ERR_NETWORK') {
        throw new Error('Network error: Please make sure the backend proxy server is running on port 3001')
      }
      
      // Handle missing/invalid API key messages
      if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
        throw new Error('Zep API key is missing or invalid. Please check your Settings.')
      }
      
      // Log unexpected errors
      console.error('Zep API Error:', {
        status: error.response?.status,
        message: errorMessage
      })
      
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
