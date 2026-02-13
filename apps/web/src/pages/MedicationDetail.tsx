import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Pill, Clock, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatTime, formatDate } from '@/lib/utils'

export default function MedicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: medication, isLoading } = useQuery({
    queryKey: ['medication', id],
    queryFn: async () => {
      const response = await api.get(`/medications/${id}`)
      return response.data.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!medication) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Medication not found</p>
        <button
          onClick={() => navigate('/medications')}
          className="btn-primary mt-4"
        >
          Back to Medications
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/medications')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Medications
      </button>

      <div className="card">
        <div className="card-header flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{medication.name}</h1>
            <p className="text-gray-600">{medication.dosage}</p>
          </div>
          {medication.quantityRemaining <= medication.refillThreshold && (
            <div className="flex items-center text-warning-600 bg-warning-50 px-3 py-1 rounded-full text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Refill needed
            </div>
          )}
        </div>

        <div className="card-body space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Form</p>
              <p className="font-medium text-gray-900">{medication.form}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium text-gray-900">
                {medication.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            {medication.genericName && (
              <div>
                <p className="text-sm text-gray-600">Generic Name</p>
                <p className="font-medium text-gray-900">{medication.genericName}</p>
              </div>
            )}
            {medication.instructions && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Instructions</p>
                <p className="font-medium text-gray-900">{medication.instructions}</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
            {medication.schedules?.map((schedule: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4" />
                <span>{schedule.scheduleType}</span>
                <span className="text-gray-400">|</span>
                <span>{schedule.timeSlots.map(formatTime).join(', ')}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-medium text-gray-900">{medication.quantityTotal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`font-medium ${
                  medication.quantityRemaining <= medication.refillThreshold
                    ? 'text-warning-600'
                    : 'text-gray-900'
                }`}>
                  {medication.quantityRemaining}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Refill Alert At</p>
                <p className="font-medium text-gray-900">{medication.refillThreshold}</p>
              </div>
            </div>
          </div>

          {medication.doseLogs?.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {medication.doseLogs.slice(0, 5).map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        log.action === 'TAKEN' ? 'bg-success-500' :
                        log.action === 'MISSED' ? 'bg-danger-500' :
                        'bg-warning-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">
                        {log.action}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatDate(log.scheduledTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
