// Página de perfil partilhada por todos os perfis
// Recebe Cards e Info como props —> variam por perfil
// Vai buscar os dados do utilizador diretamente do sessionStorage/localStorage
// Deteta automaticamente o perfil e mostra os campos correspondentes

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUtilizador } from '../utils/auth'
import api from '../services/api'
import Sidebar, { icons } from './Sidebar'
import Topbar from './Topbar'
import { FaMedal } from 'react-icons/fa6'
import { LuTarget } from 'react-icons/lu'
import { FaTrophy } from 'react-icons/fa'
import { IoIosTrendingUp } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa";
import { FaGlobe } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { FaPen } from "react-icons/fa";

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

// A foto pode vir como URL completo ou como caminho do upload (uploads/fotos/xxx.jpg)
function urlFotoCompleto(urlFoto) {
  if (!urlFoto) return null
  return urlFoto.startsWith('http') ? urlFoto : `http://localhost:3001/${urlFoto}`
}

export default function Perfil() {
  const navigate = useNavigate()
  const utilizadorLocal = getUtilizador()
  const perfil = utilizadorLocal?.perfil || 'consultor'
  const navItems = NAV_ITEMS[perfil] || []
  const perfilLabel = PERFIL_LABELS[perfil] || ''

  const [dados, setDados] = useState(null)
  const [aCarregar, setACarregar] = useState(true)

  useEffect(() => {
    api.get('/perfil/me')
      .then((res) => setDados(res.data))
      .catch((err) => console.error('[Perfil]', err))
      .finally(() => setACarregar(false))
  }, [])

  // Enquanto a API não responde, usa o que ficou guardado no login para não mostrar tudo vazio
  const utilizador = dados || utilizadorLocal || {}
  const inicial = utilizador?.nome?.[0]?.toUpperCase() || 'U'

  const dataMembro = utilizador?.dataMembro
    ? new Date(utilizador.dataMembro).toLocaleDateString('pt-PT')
    : '—'

  const statsCards = perfil === 'consultor' ? [
    { icone: <FaMedal size={16} />, label: 'Badges:', valor: utilizador?.totalBadges ?? 0 },
    { icone: <LuTarget size={16} />, label: 'Objetivos:', valor: utilizador?.totalObjetivos ?? 0 },
    { icone: <FaTrophy size={16} />, label: 'Ranking:', valor: utilizador?.posicaoRanking ? `${utilizador.posicaoRanking}º` : '—' },
    { icone: <IoIosTrendingUp size={16}/>, label: 'Pontos:', valor: utilizador?.totalPontos ?? 0 },
  ] : []

  const camposInfo = [
    ...(utilizador?.nomeLearningPath ? [{ label: 'Learning Path:', valor: utilizador.nomeLearningPath }] : []),
    { label: 'Membro desde:', valor: dataMembro },
    ...(utilizador?.nomeServiceLine ? [{ label: 'Service Line:', valor: utilizador.nomeServiceLine }] : []),
        ...(utilizador?.urlLinkedin ? [{
      icone: <FaLinkedin />,
      valor: utilizador.urlLinkedin
    }] : []),
    ...(utilizador?.nomeArea ? [{ label: 'Área:', valor: utilizador.nomeArea }] : []),
   
    ...(perfil === 'consultor' ? [{
      icone: <FaGlobe />,
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
                            ? <img src={urlFotoCompleto(utilizador.urlFoto)} alt="avatar" />
                            : <span>{inicial}</span>
                            }
                        </div>
                        </div>

                        {/* Nome e contactos */}
                        <div className="col">
                        <h2 className="perfil-nome">{utilizador?.nome || '—'} {aCarregar && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>(a atualizar...)</span>}</h2>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <p className="perfil-cargo mb-0">{perfilLabel}</p>
                          <button
                            onClick={() => navigate('/definicoes')}
                            className="btn btn-sm d-inline-flex align-items-center gap-1"
                            style={{ border: '1px solid #39639C', color: '#39639C', background: '#fff', fontSize: 12, padding: '2px 10px', borderRadius: 20 }}
                          >
                            <FaPen size={11} /> Alterar Perfil
                          </button>
                        </div>
                        <div className="perfil-contactos">
                            {utilizador?.email && (
                            <div className="perfil-contacto-item">
                                <MdEmail />
                                <span>{utilizador.email}</span>
                            </div>
                            )}
                            {utilizador?.telefone && (
                            <div className="perfil-contacto-item">
                                <FaPhone />
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
