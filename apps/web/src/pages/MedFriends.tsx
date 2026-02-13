import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserPlus, UserCheck, Trash2, Mail } from 'lucide-react'
import { api } from '@/lib/api'

export default function MedFriends() {
  const queryClient = useQueryClient()
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  const { data: myMedfriends } = useQuery({
    queryKey: ['my-medfriends'],
    queryFn: async () => {
      const response = await api.get('/medfriends/my-medfriends')
      return response.data.data
    },
  })

  const { data: myPatients } = useQuery({
    queryKey: ['my-patients'],
    queryFn: async () => {
      const response = await api.get('/medfriends/my-patients')
      return response.data.data
    },
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      api.post('/medfriends/invite', { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-medfriends'] })
      setShowInviteForm(false)
      setInviteEmail('')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/medfriends/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-medfriends'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">MedFriends</h1>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="btn-primary flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite MedFriend
        </button>
      </div>

      <p className="text-gray-600">
        MedFriends can view your medication schedule and receive notifications if you miss a dose.
      </p>

      {showInviteForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Invite a MedFriend
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              inviteMutation.mutate(inviteEmail)
            }}
            className="flex gap-2"
          >
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address"
              className="input flex-1"
              required
            />
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="btn-primary"
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </button>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">My MedFriends</h2>
        </div>
        <div className="card-body">
          {myMedfriends?.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No MedFriends yet. Invite someone to help you stay on track!
            </p>
          ) : (
            <div className="space-y-3">
              {myMedfriends?.map((link: any) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      {link.caregiver ? (
                        <>
                          <p className="font-medium text-gray-900">
                            {link.caregiver.firstName} {link.caregiver.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {link.caregiver.email}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-900">
                            Invitation Pending
                          </p>
                          <p className="text-sm text-gray-600">{link.inviteEmail}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeMutation.mutate(link.id)}
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

      {myPatients && myPatients.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              People I Care For
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {myPatients?.map((link: any) => (
                <div
                  key={link.id}
                  className="flex items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-success-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      {link.patient.firstName} {link.patient.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{link.patient.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
