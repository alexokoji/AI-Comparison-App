import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { mem0Api } from '../services/mem0Api'
import { zepApi } from '../services/zepApi'

interface ComparisonResult {
  mem0: {
    response: string
    loading: boolean
    error?: string
  }
  zep: {
    response: string
    loading: boolean
    error?: string
  }
}

const Comparison = () => {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ComparisonResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleCompare = async () => {
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput('')
    setIsLoading(true)

    const newResult: ComparisonResult = {
      mem0: { response: '', loading: true },
      zep: { response: '', loading: true },
    }

    setResults((prev) => [...prev, newResult])

    // Call both APIs in parallel
    const [mem0Result, zepResult] = await Promise.allSettled([
      mem0Api.sendMessage(query),
      zepApi.sendMessage(query),
    ])

    setResults((prev) => {
      const updated = [...prev]
      const lastIndex = updated.length - 1

      if (mem0Result.status === 'fulfilled') {
        updated[lastIndex].mem0 = {
          response: mem0Result.value.response,
          loading: false,
        }
      } else {
        updated[lastIndex].mem0 = {
          response: '',
          loading: false,
          error: mem0Result.reason?.message || 'Failed to get response',
        }
      }

      if (zepResult.status === 'fulfilled') {
        updated[lastIndex].zep = {
          response: zepResult.value.response,
          loading: false,
        }
      } else {
        updated[lastIndex].zep = {
          response: '',
          loading: false,
          error: zepResult.reason?.message || 'Failed to get response',
        }
      }

      return updated
    })

    setIsLoading(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-gray-900">Side-by-Side Comparison</h2>
        <p className="text-sm text-gray-500 mt-1">
          Test both AIs with the same input to compare their responses
        </p>
      </div>

      {/* Input */}
      <div className="border-b border-gray-200 bg-white p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleCompare() }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a query to compare both AIs..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Compare</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400 text-lg">No comparisons yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Enter a query above to compare both AIs side-by-side
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mem0 Result */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">Mem0 AI</h3>
                  </div>
                  {result.mem0.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    </div>
                  ) : result.mem0.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{result.mem0.error}</p>
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{result.mem0.response}</p>
                  )}
                </div>

                {/* Zep Result */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900">Zep AI</h3>
                  </div>
                  {result.zep.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    </div>
                  ) : result.zep.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{result.zep.error}</p>
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{result.zep.response}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Comparison
