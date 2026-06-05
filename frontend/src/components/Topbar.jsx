// Barra superior com barra de pesquisa e ícone de notificações
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoIosNotifications } from "react-icons/io";

export default function Topbar() {
  const navigate = useNavigate()
  const [pesquisa, setPesquisa] = useState('')

  return (
    <>
      {/* Logo — lado esquerdo da topbar */}
      <img src="/logo-softinsa.svg" alt="Softinsa" style={{ height: '40px' }} />

      {/* Pesquisa — centro */}
      <div className="topbar-search">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="topbar-search-input"
        />
      </div>

      {/* Notificações — lado direito */}
      <button className="topbar-notif-btn" onClick={() => navigate('/consultor/notificacoes')}>
        <IoIosNotifications size={28}/>
      </button>
    </>
  )
}