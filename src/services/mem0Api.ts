import apiClient from './apiClient'

// Get configuration from environment variables or localStorage
const getConfig = () => {
  const saved = localStorage.getItem('api-settings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      return {
        apiUrl: settings.mem0ApiUrl || import.meta.env.VITE_MEM0_API_URL || 'https://api.mem0.ai',
        apiKey: settings.mem0ApiKey || import.meta.env.VITE_MEM0_API_KEY,
      }
    } catch {
      // Fallback to env vars if parsing fails
    }
  }
  return {
    apiUrl: import.meta.env.VITE_MEM0_API_URL || 'https://api.mem0.ai',
    apiKey: import.meta.env.VITE_MEM0_API_KEY,
  }
}

// Use backend proxy to avoid CORS issues
const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001')

export interface Mem0Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Mem0Response {
  response: string
  memories?: any[]
}

export const mem0Api = {
  async sendMessage(message: string, sessionId?: string): Promise<Mem0Response> {
    try {
      const config = getConfig()
      
      if (!config.apiKey) {
        throw new Error('Mem0 API key is not configured. Please add it in Settings.')
      }

      const response = await apiClient.post(`${API_PROXY_URL}/api/mem0/memories`, {
        message,
        sessionId: sessionId || 'default-user',
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
      })
      
      return {
        response: response.data.response || response.data.message || 'No response available',
        memories: response.data.memories || [],
      }
    } catch (error: any) {
      // Extract error message from response
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to communicate with Mem0 AI'
      
      // Handle 401 authentication errors
      if (error.response?.status === 401) {
        const userMessage = 'Mem0 API key is invalid or expired. Please check your API key in Settings.'
        // Don't log expected authentication errors - UI will show them to users
        throw new Error(userMessage)
      }
      
      // Handle missing/invalid API key messages
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        throw new Error('Mem0 API key is missing or invalid. Please check your Settings.')
      }
      
      // Log unexpected errors
      console.error('Mem0 API Error:', {
        status: error.response?.status,
        message: errorMessage
      })
      
      throw new Error(errorMessage)
    }
  },

  async getMemories(userId: string = 'default-user') {
    try {
      const config = getConfig()
      if (!config.apiKey) {
        throw new Error('Mem0 API key is not configured')
      }
      
      // This would need a separate proxy endpoint, for now return empty
      return { memories: [] }
    } catch (error: any) {
      console.error('Mem0 Get Memories Error:', error)
      throw new Error('Failed to retrieve memories')
    }
  },
}
