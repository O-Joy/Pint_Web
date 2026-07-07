import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IoIosNotifications } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { getPerfil } from '../utils/auth'
import NotificacoesDropdown from './NotificacoesDropdown';

const ROTA_NOTIFICACOES_POR_PERFIL = {
  consultor: '/consultor/notificacoes',
  talent_manager: '/talent/notificacoes',
  sl_leader: '/serviceline/notificacoes',
  administrador: '/admin/notificacoes',
}

export default function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pesquisa, setPesquisa] = useState('')
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false)

  // Já estamos na página de notificações? Nesse caso não faz sentido abrir o dropdown por cima.
  const rotaNotificacoes = ROTA_NOTIFICACOES_POR_PERFIL[getPerfil()]
  const naPaginaDeNotificacoes = location.pathname === rotaNotificacoes

  function clicarSino() {
    if (naPaginaDeNotificacoes) return // já lá estamos, não há nada para mostrar por cima
    setNotificacoesAbertas(prev => !prev)
  }

  return (
    <>
      {/* ── 1. BLOCO DO LOGO ── */}
      <div style={{
        width: '200px', // Largura exata da Sidebar
        marginLeft: '-1.5rem', // Anula o padding esquerdo
        display: 'flex',
        justifyContent: 'center', // Mantém o centramento perfeito
        alignItems: 'center',
        flexShrink: 0
      }}>
        {/* Altura aumentada para 42px para o logo ter presença e peso visual */}
        <img src="/logo-softinsa.svg" alt="Softinsa" style={{ height: '42px' }} />
      </div>


      {/* ── 2. BLOCO DE PESQUISA E NOTIFICAÇÕES ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: '0.8rem', 
      }}>
        
        {/* BARRA DE PESQUISA (Sem borda, super clean) */}
        <div style={{
          width: '100%',
          maxWidth: '750px', 
          background: '#fff',
          border: 'none', 
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0px 0px 40px 5px #EDEDED'
        }}>
          <FiSearch style={{ color: '#39639C', fontSize: '18px' }} />
          <input
            type="text"
            placeholder="Search..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            style={{ 
              border: 'none', 
              outline: 'none', 
              width: '100%', 
              fontSize: '14px', 
              color: '#334155',
              background: 'transparent'
            }}
          />
        </div>

        {/* ÍCONE DE NOTIFICAÇÕES */}
        <div style={{ position: 'relative' }}>
          <button 
            className="topbar-notif-btn" 
            onClick={clicarSino}
            style={{
              background: 'none', 
              border: 'none', 
              cursor: naPaginaDeNotificacoes ? 'default' : 'pointer',
              color: naPaginaDeNotificacoes ? '#9ca3af' : '#39639C', 
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            <IoIosNotifications size={32}/>
          </button>

          {notificacoesAbertas && !naPaginaDeNotificacoes && (
            <NotificacoesDropdown onClose={() => setNotificacoesAbertas(false)} />
          )}
        </div>
      </div>
    </>
  )
}