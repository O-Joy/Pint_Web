import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/Topbar'
import Sidebar, { icons } from '../../components/Sidebar'
import api from '../../services/api'
import { getUtilizador } from '../../utils/auth'
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/consultor/dashboard', icon: icons.dashboard },
  { label: 'Badges', path: '/consultor/badges', icon: icons.badges },
  { label: 'Pedidos', path: '/consultor/pedidos', icon: icons.pedidos },
  { label: 'Objetivos', path: '/consultor/objetivos', icon: icons.objetivos },
  { label: 'Gamification', path: '/consultor/gamification', icon: icons.gamification },
]

function Evolucao({ valor }) {
  if (valor === null || valor === undefined) {
    return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
  }
  if (valor === 0) {
    return <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>0</span>
  }
  const subiu = valor > 0
  return (
    <span style={{ color: subiu ? '#2ecc71' : '#e74c3c', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {subiu ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(valor)}
    </span>
  )
}

export default function GamificationConsultor() {
  const navigate = useNavigate()
  const utilizador = getUtilizador()

  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/ranking')
      .then((res) => setRanking(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error('[GamificationConsultor]', err))
      .finally(() => setLoading(false))
  }, [])

  const top3 = ranking.slice(0, 3)
  const resto = ranking.slice(3)
  const meuDesempenho = ranking.find((r) => r.idUtilizador === utilizador?.id)

  const podio = [
    { dados: top3[1], posicao: 2, altura: 90 },
    { dados: top3[0], posicao: 1, altura: 130 },
    { dados: top3[2], posicao: 3, altura: 65 },
  ]

  return (
    <div className="pg-layout">
      <div className="pg-top"><Topbar /></div>

      <div className="container-fluid pg-body">
        <div className="row h-100">
          <div className="col-auto d-none d-md-flex p-0">
            <Sidebar navItems={NAV_ITEMS} perfil="Consultor" />
          </div>

          <div className="col">
            <main className="pg-content">
              <div className="p-4">

                {loading ? (
                  <p className="text-center text-muted">A carregar...</p>
                ) : (
                  <div className="row g-4 mb-4">

                    {/* Ranking — pódio top 3 */}
                    <div className="col-12 col-lg-7">
                      <h4 className="fw-bold mb-4" style={{ color: '#39639C' }}>Ranking</h4>
                      <div className="d-flex align-items-end justify-content-center gap-4">
                        {podio.map((p) => (
                          <div key={p.posicao} className="text-center" style={{ width: 110 }}>
                            <div
                              className="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
                              style={{ width: 56, height: 56, background: '#e2e8f0', color: '#6b7280', fontWeight: 700, fontSize: 20 }}
                            >
                              {p.dados?.nome?.[0] ?? '?'}
                            </div>
                            <div className="fw-semibold" style={{ fontSize: 14 }}>{p.dados?.nome?.split(' ')[0] ?? '—'}</div>
                            <div className="text-muted mb-2" style={{ fontSize: 12 }}>{p.dados?.totalPontos ?? 0} pts</div>
                            <div
                              className="d-flex align-items-end justify-content-center text-white fw-bold"
                              style={{ height: p.altura, background: 'linear-gradient(180deg, rgba(74, 159, 212, 0.35) 0%, #39639C 100%)', borderRadius: '8px 8px 0 0', paddingBottom: 10, fontSize: 16 }}
                            >
                              {p.posicao}º
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* O teu desempenho */}
                    <div className="col-12 col-lg-5">
                      <h4 className="fw-bold mb-4" style={{ color: '#39639C' }}>O teu desempenho</h4>
                      <div className="bg-white p-3 rounded-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                          <div className="bg-light rounded-2 px-3 py-3 fw-semibold" style={{ fontSize: 14, paddingRight: 60 }}>
                            {meuDesempenho?.nome ?? utilizador?.nome ?? '—'}
                          </div>
                          <div
                            className="rounded-circle d-flex flex-column align-items-center justify-content-center text-white flex-shrink-0"
                            style={{
                              width: 64, height: 64, background: '#4a9fd4',
                              position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                            }}
                          >
                            <span className="fw-bold" style={{ fontSize: 18, lineHeight: 1 }}>{meuDesempenho?.posicao ?? '—'}ª</span>
                            <span style={{ fontSize: 9 }}>Posição</span>
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <span style={{ fontSize: 15 }}>
                            <strong style={{ color: '#39639C' }}>{meuDesempenho?.totalPontos ?? 0}</strong> Pontos
                          </span>
                          <span style={{ fontSize: 13 }}>
                            <Evolucao valor={meuDesempenho?.evolucao} /> {meuDesempenho?.evolucao ? 'Lugar' : ''}
                          </span>
                        </div>

                        <div className="text-center">
                          <button
                            className="btn text-white px-4"
                            style={{ background: '#39639C' }}
                            onClick={() => navigate('/consultor/badges')}
                          >
                            Obter um novo badge
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabela completa — todos os consultores, sem paginação nem "View All" */}
                {!loading && (
                  <div className="table-responsive">
                    <table className="table align-middle bg-white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th>Posição</th>
                          <th>Consultor</th>
                          <th>Pontuação</th>
                          <th>Evolução</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resto.map((r) => (
                          <tr key={r.idUtilizador} style={r.idUtilizador === utilizador?.id ? { background: '#eef3fa' } : undefined}>
                            <td className="fw-semibold" style={{ color: '#39639C' }}>{r.posicao}º</td>
                            <td>{r.nome}</td>
                            <td>{r.totalPontos} pts</td>
                            <td><Evolucao valor={r.evolucao} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {resto.length === 0 && (
                      <p className="text-muted text-center">Ainda não há mais consultores no ranking.</p>
                    )}
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