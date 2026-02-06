import axios from 'axios'

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
      const client = createClient()
      const response = await client.post('/v1/memories/', {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        user_id: sessionId || 'default-user',
      })
      
      return {
        response: response.data.response || response.data.message || 'Response received',
        memories: response.data.memories,
      }
    } catch (error: any) {
      console.error('Mem0 API Error:', error)
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to communicate with Mem0 AI'
      )
    }
  },

  async getMemories(userId: string = 'default-user') {
    try {
      const client = createClient()
      const response = await client.get(`/v1/memories/`, {
        params: { user_id: userId },
      })
      return response.data
    } catch (error: any) {
      console.error('Mem0 Get Memories Error:', error)
      throw new Error('Failed to retrieve memories')
    }
  },
}
