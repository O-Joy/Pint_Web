// Menu lateral partilhado por todos os perfis
// Recebe os itens de navegação como prop -> varia de perfil para perfil

import { NavLink, useNavigate } from 'react-router-dom'
import { getUtilizador, limparSessao } from '../utils/auth'
import { FaTrophy } from 'react-icons/fa'
import { FaMedal } from 'react-icons/fa6'
import { FaClipboardList } from "react-icons/fa6"
import { IoGrid } from "react-icons/io5"
import { LuTarget } from "react-icons/lu"

export const icons = {
  dashboard: <IoGrid />,
  badges: <FaMedal size={18} />,
  pedidos: <FaClipboardList />,
  objetivos: <LuTarget />,
  gamification: <FaTrophy size={18} />,
  utilizadores: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  relatorios: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  validacoes: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  ),
}


export default function Sidebar({ navItems, perfil }) {
  const navigate = useNavigate()
  const utilizador = getUtilizador()
  const inicial = utilizador?.nome?.[0]?.toUpperCase() || 'U'

  const handleLogout = () => {
    limparSessao()
    navigate('/login')
  }

  return (
    <aside className="sidebar">

      {/* Navegação */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Rodapé — fixo na parte inferior */}
      <div style={{
        padding: '1rem 0.75rem',
        borderTop: '1px solid #d1d5db',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0
      }}>
        <button className="sidebar-logout" onClick={handleLogout}>
          {icons.logout}
          <span>Terminar Sessão</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{inicial}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{utilizador?.nome || 'Utilizador'}</span>
            <span className="sidebar-user-role">{perfil || 'Utilizador'}</span>
          </div>
        </div>

      </div>

    </aside>
  )
}