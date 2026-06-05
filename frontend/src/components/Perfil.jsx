// Página de perfil partilhada por todos os perfis
// Recebe Cards e Info como props —> variam por perfil
// Vai buscar os dados do utilizador diretamente do sessionStorage/localStorage
// Deteta automaticamente o perfil e mostra os campos correspondentes
// Vai buscar os dados do utilizador diretamente do sessionStorage/localStorage
// Deteta automaticamente o perfil e mostra os campos correspondentes


import { getUtilizador } from '../utils/auth'
import Sidebar, { icons } from './Sidebar'
import Topbar from './Topbar'
import { FaMedal } from 'react-icons/fa6'
import { LuTarget } from 'react-icons/lu'
import { FaTrophy } from 'react-icons/fa'
import { IoIosTrendingUp } from "react-icons/io";

const NAV_ITEMS = {
  consultor: [
    { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
    { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
    { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
    { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
    { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
  ],
  talent_manager: [
    { label: 'Dashboard', path: '/talent/dashboard', icon: icons.dashboard },
    { label: 'Validações', path: '/talent/validacoes', icon: icons.validacoes },
  ],
  sl_leader: [
    { label: 'Dashboard', path: '/serviceline/dashboard', icon: icons.dashboard },
  ],
  administrador: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: icons.dashboard },
    { label: 'Utilizadores', path: '/admin/utilizadores', icon: icons.utilizadores },
  ],
}

const PERFIL_LABELS = {
  consultor: 'Consultor',
  talent_manager: 'Talent Manager',
  sl_leader: 'Service Line Leader',
  administrador: 'Administrador',
}

export default function Perfil() {
  const utilizador = getUtilizador()
  const perfil = utilizador?.perfil || 'consultor'
  const inicial = utilizador?.nome?.[0]?.toUpperCase() || 'U'
  const navItems = NAV_ITEMS[perfil] || []
  const perfilLabel = PERFIL_LABELS[perfil] || ''

  const dataMembro = utilizador?.dataMembro
    ? new Date(utilizador.dataMembro).toLocaleDateString('pt-PT')
    : '—'

  const statsCards = perfil === 'consultor' ? [
    { icone: <FaMedal size={16} />, label: 'Badges:', valor: utilizador?.totalBadges || 0 },
    { icone: <LuTarget size={16} />, label: 'Objetivos:', valor: utilizador?.totalObjetivos || 0 },
    { icone: <FaTrophy size={16} />, label: 'Ranking:', valor: `${utilizador?.posicaoRanking || '—'}º` },
    { icone: <IoIosTrendingUp size={16}/>, label: 'Pontos:', valor: utilizador?.totalPontos || 0 },
  ] : []

  const camposInfo = [
    ...(utilizador?.nomeLearningPath ? [{ label: 'Learning Path:', valor: utilizador.nomeLearningPath }] : []),
    { label: 'Membro desde:', valor: dataMembro },
    ...(utilizador?.nomeArea ? [{ label: 'Área:', valor: utilizador.nomeArea }] : []),
    ...(utilizador?.urlLinkedin ? [{
      icone: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 4a2 2 0 110 4 2 2 0 010-4z"/>
        </svg>
      ),
      valor: utilizador.urlLinkedin
    }] : []),
    ...(perfil === 'consultor' ? [{
      icone: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
      ),
      valor: `www.softinsa.pt/galeria-publica/${utilizador?.nome?.split(' ')[0]}`
    }] : []),
  ]

  return (
    <div className="pg-layout">
      <div className="pg-top">
        <Topbar />
      </div>

      <div className="container-fluid pg-body">
        <div className="row h-100">

          {/* Sidebar — esconde em ecrãs pequenos */}
          <div className="col-auto d-none d-md-flex p-0">
            <Sidebar navItems={navItems} perfil={perfilLabel} />
          </div>

          {/* Conteúdo principal */}
          <div className="col">
            <main className="pg-content">
              <div className="perfil-wrapper">

                {/* Cabeçalho */}
                <div className="perfil-header">
                    <div className="row align-items-center g-3 w-100">
                        
                        {/* Avatar */}
                        <div className="col-auto">
                        <div className="perfil-avatar">
                            {utilizador?.urlFoto
                            ? <img src={utilizador.urlFoto} alt="avatar" />
                            : <span>{inicial}</span>
                            }
                        </div>
                        </div>

                        {/* Nome e contactos */}
                        <div className="col">
                        <h2 className="perfil-nome">{utilizador?.nome || '—'}</h2>
                        <p className="perfil-cargo">{perfilLabel}</p>
                        <div className="perfil-contactos">
                            {utilizador?.email && (
                            <div className="perfil-contacto-item">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                <span>{utilizador.email}</span>
                            </div>
                            )}
                            {utilizador?.telefone && (
                            <div className="perfil-contacto-item">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                                </svg>
                                <span>{utilizador.telefone}</span>
                            </div>
                            )}
                        </div>
                    </div>

                    {/* Cards de estatísticas — col fixo em ecrãs grandes, full width em pequenos */}
                    {statsCards.length > 0 && (
                    <div className="col-12 col-lg-auto">
                        <div className="row g-2" style={{ maxWidth: '320px' }}>
                        {statsCards.map((card, i) => (
                            <div key={i} className="col-6">
                            <div className="perfil-stat-card">
                                <span className="perfil-stat-icon">{card.icone}</span>
                                <span className="perfil-stat-label">{card.label}</span>
                                <span className="perfil-stat-valor">{card.valor}</span>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                </div>
                </div>

                {/* Grelha de campos — Bootstrap grid para responsividade */}
                {camposInfo.length > 0 && (
                    <div className="perfil-campos">
                    {camposInfo.map((campo, i) => (
                        <div key={i} className="perfil-campo-item">
                        {campo.icone && <span className="perfil-campo-icone">{campo.icone}</span>}
                        {campo.label && <span className="perfil-campo-label">{campo.label}</span>}
                        <span className="perfil-campo-valor">{campo.valor || '—'}</span>
                        </div>
                    ))}
                    </div>
                )}

              </div>
            </main>
          </div>

        </div>
      </div>
    </div>
  )
}