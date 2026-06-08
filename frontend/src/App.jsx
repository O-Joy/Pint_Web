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
//import Validacoes from './views/talentmanager/Validacoes'
import Badges from './views/talentmanager/Badges'
//import Consultores from './views/talentmanager/Consultores'
//import Relatorios from './views/talentmanager/Relatorios'
//import Notificacoes from './views/talentmanager/Notificacoes'
//import Gamification from './views/talentmanager/Gamification'

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
        <Route path="/talent/badges" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <Badges />
          </ProtectedRoute>
        } />
        {/*<Route path="/talent/validacoes" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <Validacoes />
          </ProtectedRoute>
        } />
        
        <Route path="/talent/consultores" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <Consultores />
          </ProtectedRoute>
        } />
        <Route path="/talent/relatorios" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <Relatorios />
          </ProtectedRoute>
        } />
        <Route path="/talent/notificacoes" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <Notificacoes />
          </ProtectedRoute>
        } />
        <Route path="/talent/gamification" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <Gamification />
          </ProtectedRoute>
        } />*/}

        {/* Rotas do Service Line Leader — só perfil 'sl_leader' tem acesso */}
        <Route path="/serviceline/dashboard" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <DashboardServiceLine />
          </ProtectedRoute>
        } />

        {/* Rotas do Service Line Leader */}
        <Route path="/serviceline/dashboard" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <DashboardServiceLine />
          </ProtectedRoute>
        } />
        <Route path="/serviceline/validacoes" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <div>Validações — em construção</div>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/badges" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <div>Badges — em construção</div>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/consultores" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <div>Consultores — em construção</div>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/relatorios" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <div>Relatórios — em construção</div>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/notificacoes" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <div>Notificações — em construção</div>
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
