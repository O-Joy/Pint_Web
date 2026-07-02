import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoIosNotifications } from "react-icons/io";
import { FiSearch } from "react-icons/fi";

export default function Topbar() {
  const navigate = useNavigate()
  const [pesquisa, setPesquisa] = useState('')

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
          border: 'none', // <-- Borda removida aqui!
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
        <button 
          className="topbar-notif-btn" 
          onClick={() => navigate('/consultor/notificacoes')}
          style={{
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            color: '#39639C', 
            display: 'flex',
            alignItems: 'center',
            padding: '4px'
          }}
        >
          <IoIosNotifications size={32}/>
        </button>
      </div>
    </>
  )
}