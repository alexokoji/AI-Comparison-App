import { useState, useEffect } from 'react'
import { Plus, Save, Trash2, Edit2 } from 'lucide-react'
import { format } from 'date-fns'

interface UseCase {
  id: string
  title: string
  description: string
  ai: 'mem0' | 'zep' | 'both'
  category: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

const Documentation = () => {
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<UseCase | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ai: 'both' as 'mem0' | 'zep' | 'both',
    category: '',
    notes: '',
  })

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('ai-use-cases')
    if (saved) {
      const parsed = JSON.parse(saved).map((uc: any) => ({
        ...uc,
        createdAt: new Date(uc.createdAt),
        updatedAt: new Date(uc.updatedAt),
      }))
      setUseCases(parsed)
    }
  }, [])

  const saveToStorage = (cases: UseCase[]) => {
    localStorage.setItem('ai-use-cases', JSON.stringify(cases))
  }

  const handleOpenModal = (caseToEdit?: UseCase) => {
    if (caseToEdit) {
      setEditingCase(caseToEdit)
      setFormData({
        title: caseToEdit.title,
        description: caseToEdit.description,
        ai: caseToEdit.ai,
        category: caseToEdit.category,
        notes: caseToEdit.notes,
      })
    } else {
      setEditingCase(null)
      setFormData({
        title: '',
        description: '',
        ai: 'both',
        category: '',
        notes: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!formData.title.trim()) return

    const now = new Date()
    let updatedCases: UseCase[]

    if (editingCase) {
      updatedCases = useCases.map((uc) =>
        uc.id === editingCase.id
          ? {
              ...uc,
              ...formData,
              updatedAt: now,
            }
          : uc
      )
    } else {
      const newCase: UseCase = {
        id: Date.now().toString(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      }
      updatedCases = [...useCases, newCase]
    }

    setUseCases(updatedCases)
    saveToStorage(updatedCases)
    setIsModalOpen(false)
    setEditingCase(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this use case?')) {
      const updatedCases = useCases.filter((uc) => uc.id !== id)
      setUseCases(updatedCases)
      saveToStorage(updatedCases)
    }
  }

  const getAIBadgeColor = (ai: string) => {
    switch (ai) {
      case 'mem0':
        return 'bg-blue-100 text-blue-700'
      case 'zep':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Documentation</h1>
            <p className="text-gray-600">
              Document and track the best use cases for each AI platform
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Use Case</span>
          </button>
        </div>

        {useCases.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No use cases documented yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Start documenting your findings by adding a use case
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Use Case</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {useCase.title}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getAIBadgeColor(
                        useCase.ai
                      )}`}
                    >
                      {useCase.ai === 'both' ? 'Both' : useCase.ai.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(useCase)}
                      className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(useCase.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {useCase.category && (
                  <p className="text-xs text-gray-500 mb-2">Category: {useCase.category}</p>
                )}

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {useCase.description}
                </p>

                {useCase.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Notes:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{useCase.notes}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-4">
                  {format(useCase.updatedAt, 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCase ? 'Edit Use Case' : 'New Use Case'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Long-term conversation memory"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Describe the use case..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Platform
                  </label>
                  <select
                    value={formData.ai}
                    onChange={(e) =>
                      setFormData({ ...formData, ai: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="both">Both</option>
                    <option value="mem0">Mem0</option>
                    <option value="zep">Zep</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Memory, Context"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Add your observations, test results, or findings..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Documentation
