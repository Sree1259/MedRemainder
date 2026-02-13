import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, Clock, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'

export default function Appointments() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await api.get('/appointments')
      return response.data.data
    },
  })

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post('/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  const upcomingAppointments = appointments?.filter(
    (a: any) => new Date(a.appointmentAt) > new Date()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Appointment
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            New Appointment
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              addMutation.mutate({
                title: formData.get('title'),
                doctorName: formData.get('doctorName'),
                location: formData.get('location'),
                appointmentAt: formData.get('appointmentAt'),
                reminderMinutesBefore: parseInt(formData.get('reminder') as string),
                notes: formData.get('notes'),
              })
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input type="text" name="title" className="input" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Name
                </label>
                <input type="text" name="doctorName" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input type="text" name="location" className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="appointmentAt"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reminder (minutes before)
                </label>
                <input
                  type="number"
                  name="reminder"
                  defaultValue="60"
                  className="input"
                />
              </div>
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

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
        </div>
        <div className="card-body">
          {upcomingAppointments?.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No upcoming appointments
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments?.map((apt: any) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{apt.title}</h3>
                    {apt.doctorName && (
                      <p className="text-sm text-gray-600">Dr. {apt.doctorName}</p>
                    )}
                    {apt.location && (
                      <p className="text-sm text-gray-500">{apt.location}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDateTime(apt.appointmentAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(apt.id)}
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
