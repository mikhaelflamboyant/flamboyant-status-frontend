import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import NewProject from './pages/NewProject'
import ArchivedProjects from './pages/ArchivedProjects'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />

        <Route path="/projetos" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />

        <Route path="/projetos/novo" element={
          <ProtectedRoute>
            <NewProject />
          </ProtectedRoute>
        } />

        <Route path="/projetos/arquivados" element={
          <ProtectedRoute>
            <ArchivedProjects />
          </ProtectedRoute>
        } />

        <Route path="/projetos/:id" element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        } />

        <Route path="/usuarios" element={
          <ProtectedRoute allowedRoles={['ANALISTA_MASTER', 'SUPERINTENDENTE', 'DIRETOR', 'GERENTE', 'COORDENADOR']}>
            <Users />
          </ProtectedRoute>
        } />

        <Route path="/perfil" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="/notificacoes" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/projetos" replace />} />
        <Route path="*" element={<Navigate to="/projetos" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App