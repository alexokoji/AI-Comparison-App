import axios from 'axios'

// Create a custom axios instance
// Note: Browser network logs (401, etc.) are from the browser itself and cannot be suppressed
// This is normal browser behavior for failed HTTP requests
const apiClient = axios.create()

export default apiClient
