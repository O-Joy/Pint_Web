import { getUtilizador } from '../utils/auth'
import Sidebar, { icons } from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { FaMedal, FaTrophy, FaLinkedin, FaGlobe } from 'react-icons/fa'
import { FaPhone } from 'react-icons/fa6'
import { LuTarget } from 'react-icons/lu'
import { IoIosTrendingUp } from 'react-icons/io'
import { MdEmail, MdCalendarToday, MdSchool, MdApartment } from 'react-icons/md'

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
    { icone: <FaMedal />, label: 'Badges', valor: utilizador?.totalBadges || 0, cor: '#39639C' },
    { icone: <LuTarget />, label: 'Objetivos', valor: utilizador?.totalObjetivos || 0, cor: '#11a9d6' },
    { icone: <FaTrophy />, label: 'Ranking', valor: `${utilizador?.posicaoRanking || '—'}º`, cor: '#f0b429' },
    { icone: <IoIosTrendingUp />, label: 'Pontos', valor: utilizador?.totalPontos || 0, cor: '#16a34a' },
  ] : []

  const detalhes = [
    { icone: <MdCalendarToday />, label: 'Membro desde', valor: dataMembro },
    ...(utilizador?.nomeLearningPath ? [{ icone: <MdSchool />, label: 'Learning Path', valor: utilizador.nomeLearningPath }] : []),
    ...(utilizador?.nomeArea ? [{ icone: <MdApartment />, label: 'Área', valor: utilizador.nomeArea }] : []),
    ...(utilizador?.urlLinkedin ? [{ icone: <FaLinkedin />, label: 'LinkedIn', valor: utilizador.urlLinkedin, link: utilizador.urlLinkedin }] : []),
    ...(perfil === 'consultor' ? [{
      icone: <FaGlobe />, label: 'Galeria Pública',
      valor: `softinsa.pt/galeria-publica/${utilizador?.nome?.split(' ')[0] || ''}`,
      link: `https://www.softinsa.pt/galeria-publica/${utilizador?.nome?.split(' ')[0] || ''}`,
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
              <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 900, margin: '0 auto' }}>

                {/* ── Cabeçalho: banner + avatar + nome ── */}
                <div style={{
                  background: '#fff', borderRadius: 20, overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: 20,
                }}>
                  <div style={{ height: 96, background: 'linear-gradient(120deg, #39639C 0%, #11a9d6 100%)' }} />

                  <div style={{ padding: '0 32px', marginTop: -48, display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 96, height: 96, borderRadius: '50%', background: '#fff',
                      padding: 4, boxShadow: '0 4px 14px rgba(0,0,0,0.12)', flexShrink: 0,
                    }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e8f0fb, #dbeeff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 34, fontWeight: 700, color: '#39639C', overflow: 'hidden',
                      }}>
                        {utilizador?.urlFoto
                          ? <img src={utilizador.urlFoto} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : inicial}
                      </div>
                    </div>
                    <div style={{ flex: 1, paddingBottom: 6, minWidth: 200 }}>
                      <h2 style={{ fontWeight: 700, fontSize: 22, color: '#1a1a2e', margin: 0 }}>{utilizador?.nome || '—'}</h2>
                      <span style={{
                        display: 'inline-block', marginTop: 6, background: '#e8f0fb', color: '#39639C',
                        borderRadius: 20, padding: '3px 14px', fontSize: 12, fontWeight: 600,
                      }}>
                        {perfilLabel}
                      </span>
                    </div>
                  </div>

                  {/* Chips de contacto */}
                  <div style={{ display: 'flex', gap: 10, padding: '20px 32px 28px', flexWrap: 'wrap' }}>
                    {utilizador?.email && (
                      <span style={chip}><MdEmail style={{ color: '#39639C' }} /> {utilizador.email}</span>
                    )}
                    {utilizador?.telefone && (
                      <span style={chip}><FaPhone style={{ color: '#39639C' }} /> {utilizador.telefone}</span>
                    )}
                  </div>
                </div>

                {/* ── Estatísticas (apenas consultor) ── */}
                {statsCards.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                    {statsCards.map((c, i) => (
                      <div key={i} style={{
                        background: '#fff', borderRadius: 16, padding: '20px', textAlign: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, background: `${c.cor}1A`, color: c.cor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 18,
                        }}>
                          {c.icone}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{c.valor}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Detalhes adicionais ── */}
                {detalhes.length > 0 && (
                  <div style={{
                    background: '#fff', borderRadius: 16, padding: 24,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18,
                  }}>
                    {detalhes.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, background: '#f4f6fa', color: '#39639C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15,
                        }}>
                          {d.icone}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{d.label}</div>
                          {d.link ? (
                            <a
                              href={d.link.startsWith('http') ? d.link : `https://${d.link}`}
                              target="_blank" rel="noreferrer"
                              style={{
                                fontSize: 13, fontWeight: 600, color: '#39639C', textDecoration: 'none',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                              }}
                            >
                              {d.valor}
                            </a>
                          ) : (
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{d.valor}</div>
                          )}
                        </div>
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

const chip = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: '#f4f6fa', borderRadius: 20, padding: '7px 14px',
  fontSize: 12.5, color: '#374151', fontWeight: 500,
}
