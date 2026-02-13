import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  genericName: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required'),
  form: z.enum(['PILL', 'CAPSULE', 'LIQUID', 'INJECTION', 'PATCH', 'INHALER', 'DROPS', 'CREAM', 'OTHER']),
  instructions: z.string().optional(),
  quantityTotal: z.number().min(0),
  quantityRemaining: z.number().min(0),
  refillThreshold: z.number().min(0),
  isAsNeeded: z.boolean().default(false),
  startDate: z.string().min(1, 'Start date is required'),
  schedules: z.array(z.object({
    scheduleType: z.enum(['DAILY', 'SPECIFIC_DAYS', 'INTERVAL', 'CYCLE']),
    timesPerDay: z.number().min(1),
    timeSlots: z.array(z.string()),
    daysOfWeek: z.array(z.number()).optional(),
  })).min(1, 'At least one schedule is required'),
})

type MedicationForm = z.infer<typeof medicationSchema>

export default function AddMedication() {
  const navigate = useNavigate()
  const [timeSlots, setTimeSlots] = useState<string[]>(['08:00'])

  const { data: pharmacies } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      const response = await api.get('/pharmacies')
      return response.data.data
    },
  })

  const mutation = useMutation({
    mutationFn: (data: MedicationForm) => api.post('/medications', data),
    onSuccess: () => {
      navigate('/medications')
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MedicationForm>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      form: 'PILL',
      quantityTotal: 30,
      quantityRemaining: 30,
      refillThreshold: 5,
      isAsNeeded: false,
      startDate: new Date().toISOString().split('T')[0],
      schedules: [{
        scheduleType: 'DAILY',
        timesPerDay: 1,
        timeSlots: ['08:00'],
      }],
    },
  })

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, '12:00'])
  }

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index))
  }

  const onSubmit = (data: MedicationForm) => {
    mutation.mutate({
      ...data,
      schedules: [{
        ...data.schedules[0],
        timeSlots,
      }],
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/medications')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Medications
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Medication</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        {mutation.isError && (
          <div className="p-3 bg-danger-50 text-danger-600 rounded-lg text-sm">
            {(mutation.error as any)?.response?.data?.error?.message || 'Failed to add medication'}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medication Name *
            </label>
            <input
              type="text"
              {...register('name')}
              className="input"
              placeholder="e.g., Lisinopril"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generic Name
            </label>
            <input
              type="text"
              {...register('genericName')}
              className="input"
              placeholder="e.g., Lisinopril"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dosage *
            </label>
            <input
              type="text"
              {...register('dosage')}
              className="input"
              placeholder="e.g., 10mg"
            />
            {errors.dosage && (
              <p className="mt-1 text-sm text-danger-600">{errors.dosage.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form *
            </label>
            <select {...register('form')} className="input">
              <option value="PILL">Pill</option>
              <option value="CAPSULE">Capsule</option>
              <option value="LIQUID">Liquid</option>
              <option value="INJECTION">Injection</option>
              <option value="PATCH">Patch</option>
              <option value="INHALER">Inhaler</option>
              <option value="DROPS">Drops</option>
              <option value="CREAM">Cream</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions
          </label>
          <textarea
            {...register('instructions')}
            className="input"
            rows={2}
            placeholder="e.g., Take with food"
          />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Type
              </label>
              <select {...register('schedules.0.scheduleType')} className="input">
                <option value="DAILY">Daily</option>
                <option value="SPECIFIC_DAYS">Specific Days</option>
                <option value="INTERVAL">Every X Days</option>
                <option value="CYCLE">Cycle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Slots
              </label>
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot}
                      onChange={(e) => {
                        const newSlots = [...timeSlots]
                        newSlots[index] = e.target.value
                        setTimeSlots(newSlots)
                      }}
                      className="input w-32"
                    />
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="p-2 text-gray-400 hover:text-danger-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Time
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Quantity
              </label>
              <input
                type="number"
                {...register('quantityTotal', { valueAsNumber: true })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remaining
              </label>
              <input
                type="number"
                {...register('quantityRemaining', { valueAsNumber: true })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refill Alert At
              </label>
              <input
                type="number"
                {...register('refillThreshold', { valueAsNumber: true })}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary flex items-center justify-center min-w-[120px]"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Add Medication'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/medications')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
