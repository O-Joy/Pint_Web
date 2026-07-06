// App.jsx — Ponto de entrada da aplicação React
// Define todas as rotas da aplicação usando React Router

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './views/serviceline/styles.css'
import './App.css'
import Perfil from './components/Perfil'
import Definicoes from './components/Definicoes'

import ProtectedRoute from './components/ProtectedRoute'

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

//consultor
import EscolhaArea from './views/auth/EscolhaArea'
import DashboardConsultor from './views/consultor/Dashboard'
import BadgesConsultor from './views/consultor/Badges'
import ObjetivosConsultor from './views/consultor/Objetivos'
import GamificationConsultor from './views/consultor/Gamification'
import PedidosConsultor from './views/consultor/Pedidos'
import NotificacoesConsultor from './views/consultor/Notificacoes'



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

        <Route path="/consultor/notificacoes" element={
          <ProtectedRoute perfisPermitidos={['consultor']}>
            <NotificacoesConsultor />
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

        <Route path="/talent/consultores" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <ConsultoresTM />
          </ProtectedRoute>
        } />

        <Route path="/talent/consultores/:id" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <ConsultorDetalheTM />
          </ProtectedRoute>
        } />
        
        <Route path="/talent/relatorios" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <RelatoriosTM />
          </ProtectedRoute>
        } />

        <Route path="/talent/gamification" element={
          <ProtectedRoute perfisPermitidos={['talent_manager']}>
            <GamificationTM />
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
        <Route path="/admin/utilizadores" element={
          <ProtectedRoute perfisPermitidos={['administrador']}>
            <AdminUtilizadores />
          </ProtectedRoute>
        } />
        <Route path="/admin/learning-paths" element={
          <ProtectedRoute perfisPermitidos={['administrador']}>
            <AdminLearningPaths />
          </ProtectedRoute>
        } />
        <Route path="/admin/badges" element={
          <ProtectedRoute perfisPermitidos={['administrador']}>
            <AdminBadges />
          </ProtectedRoute>
        } />
        <Route path="/admin/candidaturas" element={
          <ProtectedRoute perfisPermitidos={['administrador']}>
            <AdminCandidaturas />
          </ProtectedRoute>
        } />

        <Route path="/perfil" element={
          <ProtectedRoute perfisPermitidos={['consultor', 'talent_manager', 'sl_leader', 'administrador']}>
            <Perfil />
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