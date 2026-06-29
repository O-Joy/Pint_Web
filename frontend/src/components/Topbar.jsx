// Barra superior com barra de pesquisa e ícone de notificações
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoIosNotifications } from "react-icons/io";
import { FaSearch } from "react-icons/fa";

export default function Topbar() {
  const navigate = useNavigate()
  const [pesquisa, setPesquisa] = useState('')

  return (
    <>
      <div style={{
        width: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexShrink: 0,
      }}>
        <img src="/logo-softinsa.svg" alt="Softinsa" style={{ height: '60px' }} />
      </div>


      <div className="topbar-search">
        <FaSearch />
        <input
          type="text"
          placeholder="Search..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="topbar-search-input"
        />
      </div>

      <button className="topbar-notif-btn" onClick={() => navigate('/consultor/notificacoes')}>
        <IoIosNotifications size={28}/>
      </button>
    </>
  )
}