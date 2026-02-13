import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Pill, Clock, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatTime } from '@/lib/utils'

export default function Medications() {
  const { data: medications, isLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const response = await api.get('/medications?isActive=true')
      return response.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Medications</h1>
        <Link
          to="/medications/add"
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Link>
      </div>

      {medications?.length === 0 ? (
        <div className="card p-12 text-center">
          <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No medications yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first medication to start tracking
          </p>
          <Link to="/medications/add" className="btn-primary">
            Add Medication
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications?.map((med: any) => (
            <Link
              key={med.id}
              to={`/medications/${med.id}`}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{med.name}</h3>
                  <p className="text-sm text-gray-600">{med.dosage}</p>
                </div>
                {med.quantityRemaining <= med.refillThreshold && (
                  <AlertCircle className="w-5 h-5 text-warning-600" />
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Pill className="w-4 h-4 mr-2" />
                  {med.form}
                </div>
                
                {med.schedules?.[0] && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {med.schedules[0].timeSlots.map(formatTime).join(', ')}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span
                    className={`font-medium ${
                      med.quantityRemaining <= med.refillThreshold
                        ? 'text-warning-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {med.quantityRemaining} / {med.quantityTotal}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
