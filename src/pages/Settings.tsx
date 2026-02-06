import { useState } from 'react'
import { Save, Key, Globe } from 'lucide-react'

const Settings = () => {
  const [settings, setSettings] = useState({
    mem0ApiKey: import.meta.env.VITE_MEM0_API_KEY || '',
    zepApiKey: import.meta.env.VITE_ZEP_API_KEY || '',
    mem0ApiUrl: import.meta.env.VITE_MEM0_API_URL || 'https://api.mem0.ai',
    zepApiUrl: import.meta.env.VITE_ZEP_API_URL || 'https://api.getzep.com',
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a real app, you'd save these securely
    // For now, we'll just show a message
    localStorage.setItem('api-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Configure your API keys and endpoints for Mem0 and Zep AI
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Mem0 Settings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Mem0 AI</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.mem0ApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, mem0ApiKey: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your Mem0 API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  API URL
                </label>
                <input
                  type="text"
                  value={settings.mem0ApiUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, mem0ApiUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://api.mem0.ai"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Zep Settings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Zep AI</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.zepApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, zepApiKey: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your Zep API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  API URL
                </label>
                <input
                  type="text"
                  value={settings.zepApiUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, zepApiUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://api.getzep.com"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{saved ? 'Saved!' : 'Save Settings'}</span>
            </button>
            {saved && (
              <p className="text-sm text-green-600 mt-2">Settings saved successfully!</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> For security, API keys should be stored in environment
              variables. Create a <code className="bg-blue-100 px-1 rounded">.env</code> file in
              the root directory with your API keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
