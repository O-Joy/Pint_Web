// App.jsx — Ponto de entrada da aplicação React
// Define todas as rotas da aplicação usando React Router

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './views/serviceline/styles.css'
import './App.css'
import Perfil from './components/Perfil'
import Definicoes from './components/Definicoes'

import ProtectedRoute from './components/ProtectedRoute'

// Páginas públicas (site antes do login)
import PublicHome from './views/public/Home'
import BadgeVerify from './views/public/BadgeVerify'

// Páginas de autenticação (qualquer utilizador)
import Login from './views/auth/Login'
import RecuperarPassword from './views/auth/RecuperarPassword'
import VerificarCodigo from './views/auth/VerificarCodigo'
import RedefinirPassword from './views/auth/RedefinirPassword'

//Admin
import DashboardAdmin from './views/admin/Dashboard'
import AdminUtilizadores from './views/admin/Utilizadores'
import AdminLearningPaths from './views/admin/LearningPaths'
import AdminBadges from './views/admin/Badges'
import AdminCandidaturas from './views/admin/Candidaturas'
import AdminNotificacoes from './views/admin/Notificacoes'

//SLL
import DashboardServiceLine from './views/serviceline/Dashboard'
import Consultores from './views/serviceline/Consultores'
import ConsultorDetalhe from './views/serviceline/ConsultorDetalhe'
import ValidacoesSL from './views/serviceline/Validacoes'
import Relatorios from './views/serviceline/Relatorios'
import Gamification from './views/serviceline/Gamification'
import BadgesSL from './views/serviceline/Badges'
import NotificacoesSL from './views/serviceline/Notificacoes'

//Talent Manager
import DashboardTalent from './views/talentmanager/Dashboard'
import ValidacoesTM from './views/talentmanager/Validacoes'
import Badges from './views/talentmanager/Badges'
import ConsultoresTM from './views/talentmanager/Consultores'
import ConsultorDetalheTM from './views/talentmanager/ConsultorDetalhe'
import RelatoriosTM from './views/talentmanager/Relatorios'
import GamificationTM from './views/talentmanager/Gamification'
import NotificacoesTM from './views/talentmanager/Notificacoes'

//consultor
import EscolhaArea from './views/auth/EscolhaArea'
import DashboardConsultor from './views/consultor/Dashboard'
import BadgesConsultor from './views/consultor/Badges'
import ObjetivosConsultor from './views/consultor/Objetivos'
import GamificationConsultor from './views/consultor/Gamification'
import PedidosConsultor from './views/consultor/Pedidos'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz — site público (antes do login) */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/badges/verify/:token" element={<BadgeVerify />} />

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
        <Route path="/consultor/badges" element={
          <ProtectedRoute perfisPermitidos={['consultor']}>
            <BadgesConsultor />
          </ProtectedRoute>
        } />
        <Route path="/consultor/objetivos" element={
          <ProtectedRoute perfisPermitidos={['consultor']}>
            <ObjetivosConsultor />
          </ProtectedRoute>
        } />
        <Route path="/consultor/gamification" element={
          <ProtectedRoute perfisPermitidos={['consultor']}>
            <GamificationConsultor />
          </ProtectedRoute>
        } />
        <Route path="/consultor/pedidos" element={
          <ProtectedRoute perfisPermitidos={['consultor']}>
            <PedidosConsultor />
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

        <Route path="/talent/validacoes" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <ValidacoesTM />
          </ProtectedRoute>
        } />

        {/*
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

        <Route path="/talent/notificacoes" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <NotificacoesTM />
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
            <ValidacoesSL/>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/badges" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <BadgesSL/>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/consultores" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <Consultores/>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/consultores/:id" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <ConsultorDetalhe/>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/relatorios" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <Relatorios />
          </ProtectedRoute>
        } />
        <Route path="/serviceline/gamification" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <Gamification/>
          </ProtectedRoute>
        } />
        <Route path="/serviceline/notificacoes" element={
          <ProtectedRoute perfisPermitidos={['sl_leader']}>
            <NotificacoesSL/>
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

        <Route path="/admin/notificacoes" element={
          <ProtectedRoute perfisPermitidos={['administrador']}>
            <AdminNotificacoes />
          </ProtectedRoute>
} />

        <Route path="/definicoes" element={
          <ProtectedRoute perfisPermitidos={['consultor', 'talent_manager', 'sl_leader', 'administrador']}>
            <Definicoes />
          </ProtectedRoute>
} />
      </Routes>
    </BrowserRouter>
  )
}

export default App