import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Medications from './pages/Medications'
import MedicationDetail from './pages/MedicationDetail'
import AddMedication from './pages/AddMedication'
import HealthMeasurements from './pages/HealthMeasurements'
import Appointments from './pages/Appointments'
import MedFriends from './pages/MedFriends'
import Profile from './pages/Profile'

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/medications/add" element={<AddMedication />} />
        <Route path="/medications/:id" element={<MedicationDetail />} />
        <Route path="/health" element={<HealthMeasurements />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/medfriends" element={<MedFriends />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
