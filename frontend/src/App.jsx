// App.jsx — Ponto de entrada da aplicação React
// Define todas as rotas da aplicação usando React Router v6

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import Perfil from './components/Perfil'

import ProtectedRoute from './components/ProtectedRoute'

// Páginas de autenticação (qualquer utilizador)
import Login from './views/auth/Login'
import RecuperarPassword from './views/auth/RecuperarPassword'
import VerificarCodigo from './views/auth/VerificarCodigo'
import RedefinirPassword from './views/auth/RedefinirPassword'

//Admin
import DashboardAdmin from './views/admin/Dashboard'

//SLL
import DashboardServiceLine from './views/serviceline/Dashboard'

//Talent Manager
import DashboardTalent from './views/talentmanager/Dashboard'

//consultor
import EscolhaArea from './views/auth/EscolhaArea'
import DashboardConsultor from './views/consultor/Dashboard'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz — redireciona para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rotas públicas — não precisam de autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/verificar-codigo" element={<VerificarCodigo />} />
        <Route path="/redefinir-password" element={<RedefinirPassword />} />
        <Route path="/escolha-area" element={<EscolhaArea />} />

        {/* Rotas do Consultor — só perfil 'consultor' tem acesso */}
        <Route path="/consultor/dashboard" element={
          <ProtectedRoute perfisPermitidos={['consultor']}>
            <DashboardConsultor />
          </ProtectedRoute>
        } />

        {/* Rotas do Talent Manager — só perfil 'talent_manager' tem acesso */}
        <Route path="/talent/dashboard" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <DashboardTalent />
          </ProtectedRoute>
        } />

        {/* Rotas do Service Line Leader — só perfil 'sl_leader' tem acesso */}
        <Route path="/serviceline/dashboard" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <DashboardServiceLine />
          </ProtectedRoute>
        } />

        {/* Rotas do Administrador — só perfil 'administrador' tem acesso */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute perfisPermitidos={['administrador']}>
            <DashboardAdmin />
          </ProtectedRoute>
        } />

        <Route path="/perfil" element={
          <ProtectedRoute perfisPermitidos={['consultor', 'talent_manager', 'sl_leader', 'administrador']}>
            <Perfil />
          </ProtectedRoute>
} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
