import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Pill,
  Activity,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { api } from '@/lib/api'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/users/dashboard')
      return response.data.data
    },
  })

  const { data: refillNeeded } = useQuery({
    queryKey: ['refill-needed'],
    queryFn: async () => {
      const response = await api.get('/medications/refill-needed')
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/medications/add"
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Pill className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Medications</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.medicationCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-success-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Doses</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.todayDoses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Adherence</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.adherenceRate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Need Refill</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.medicationsNeedingRefill || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Refill Alerts */}
      {refillNeeded && refillNeeded.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-warning-600" />
              Refill Reminders
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {refillNeeded.map((med: any) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 bg-warning-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{med.name}</p>
                    <p className="text-sm text-gray-600">
                      {med.quantityRemaining} pills remaining
                    </p>
                  </div>
                  <Link
                    to={`/medications/${med.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Order Refill
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/medications"
          className="card p-6 hover:shadow-md transition-shadow"
        >
          <Pill className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900">My Medications</h3>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all your medications
          </p>
        </Link>

        <Link
          to="/health"
          className="card p-6 hover:shadow-md transition-shadow"
        >
          <Activity className="w-8 h-8 text-success-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Health Tracking</h3>
          <p className="text-sm text-gray-600 mt-1">
            Log and track your health measurements
          </p>
        </Link>

        <Link
          to="/appointments"
          className="card p-6 hover:shadow-md transition-shadow"
        >
          <Activity className="w-8 h-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Appointments</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your doctor appointments
          </p>
        </Link>
      </div>
    </div>
  )
}
