import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Activity, TrendingUp, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const METRIC_TYPES = [
  { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg' },
  { value: 'glucose', label: 'Blood Glucose', unit: 'mg/dL' },
  { value: 'weight', label: 'Weight', unit: 'lbs' },
  { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm' },
  { value: 'temperature', label: 'Temperature', unit: '°F' },
]

export default function HealthMeasurements() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('blood_pressure')

  const { data: measurements } = useQuery({
    queryKey: ['measurements', selectedMetric],
    queryFn: async () => {
      const response = await api.get(`/health-measurements?metricType=${selectedMetric}`)
      return response.data.data
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['measurement-stats', selectedMetric],
    queryFn: async () => {
      const response = await api.get(`/health-measurements/stats?metricType=${selectedMetric}`)
      return response.data.data
    },
  })

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post('/health-measurements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-stats'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/health-measurements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-stats'] })
    },
  })

  const currentMetric = METRIC_TYPES.find((m) => m.value === selectedMetric)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Health Measurements</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Measurement
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {METRIC_TYPES.map((metric) => (
          <button
            key={metric.value}
            onClick={() => setSelectedMetric(metric.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedMetric === metric.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add {currentMetric?.label}
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const data = {
                metricType: selectedMetric,
                value: parseFloat(formData.get('value') as string),
                valueSecondary: formData.get('valueSecondary')
                  ? parseFloat(formData.get('valueSecondary') as string)
                  : undefined,
                unit: currentMetric?.unit,
                measuredAt: new Date().toISOString(),
                notes: formData.get('notes') as string,
              }
              addMutation.mutate(data)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value ({currentMetric?.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="value"
                  className="input"
                  required
                />
              </div>
              {selectedMetric === 'blood_pressure' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    name="valueSecondary"
                    className="input"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea name="notes" className="input" rows={2} />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="btn-primary"
              >
                {addMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-600">Latest</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.latest?.value || '-'}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Average</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.avg || '-'}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Min</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.min || '-'}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600">Max</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.max || '-'}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
        </div>
        <div className="card-body">
          {measurements?.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No measurements recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {measurements?.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {m.value}
                      {m.valueSecondary && `/${m.valueSecondary}`} {m.unit}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(m.measuredAt)}
                    </p>
                    {m.notes && (
                      <p className="text-sm text-gray-500 mt-1">{m.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(m.id)}
                    className="p-2 text-gray-400 hover:text-danger-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
