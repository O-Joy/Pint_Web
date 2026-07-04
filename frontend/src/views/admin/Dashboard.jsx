import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LayoutAdmin from './components/LayoutAdmin'
import api from '../../services/api'
import { MdPeopleAlt, MdMilitaryTech, MdAssignment } from 'react-icons/md'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function DashboardAdmin() {
  const [stats, setStats] = useState({
    totalUtilizadores: 0,
    totalAtivos: 0,
    totalBadgesAtribuidos: 0,
    candidaturasPorEstado: [],
    badgesPorNivel: [],
    badgesPorMes: [],
  })

  useEffect(() => {
    api.get('/admin/reporting').then(res => setStats(res.data)).catch(() => {})
  }, [])

  const totalCandidaturas = stats.candidaturasPorEstado?.reduce((s, e) => s + e.total, 0) || 0

  // Prepara os dados do gráfico no estilo das colegas (Aprovadas vs Rejeitadas por mês)
  const aprovadas  = stats.candidaturasPorEstado?.find(e => e.idEstado === 5)?.total || 0
  const rejeitadas = stats.candidaturasPorEstado?.find(e => e.idEstado === 6)?.total || 0

  const dadosGrafico = {
    labels: stats.badgesPorMes?.map(m =>
      new Date(m.mes).toLocaleDateString('pt-PT', { month: 'short' })
    ) || [],
    datasets: [
      {
        label: 'Aprovadas',
        data: stats.badgesPorMes?.map(m => m.total) || [],
        backgroundColor: '#7dd8f0',
        borderRadius: 4,
        barThickness: 10,
      },
      {
        label: 'Rejeitadas',
        data: stats.badgesPorMes?.map(() => 0) || [],
        backgroundColor: '#7eecd4',
        borderRadius: 4,
        barThickness: 10,
      },
    ],
  }

  return (
    <LayoutAdmin>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 20, textAlign: 'center', fontSize: 18 }}>
          RESUMO DA PLATAFORMA
        </h2>

        {/* ── KPIs ── */}
        <div className="row g-3" style={{ marginBottom: 28 }}>
          {[
            { label: 'Utilizadores Registados', valor: stats.totalUtilizadores, sub: `${stats.totalAtivos} ativos`, icon: <MdPeopleAlt style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Badges Atribuídos',        valor: stats.totalBadgesAtribuidos,                                 icon: <MdMilitaryTech style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Candidaturas Totais',      valor: totalCandidaturas,                                           icon: <MdAssignment style={{ color: '#39639C', fontSize: 22 }} /> },
          ].map((c, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="card h-100">
                <div className="card-body d-flex align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{ width: 44, height: 44, background: '#e8f0fb', color: '#39639C', fontSize: 20 }}>
                      {c.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.valor}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{c.label}</div>
                    </div>
                  </div>
                  {c.sub && <div style={{ fontSize: 11, color: '#39639C', fontWeight: 600 }}>{c.sub}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Candidaturas por estado + Gráfico ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Candidaturas por estado */}
          <div>
            <h4 style={{ color: '#39639C', fontWeight: 600, marginBottom: 20, fontSize: 15 }}>
              Candidaturas por Estado
            </h4>
            <div className="row row-cols-2 g-3">
              {stats.candidaturasPorEstado?.filter(e => e.total > 0).map(e => (
                <div key={e.idEstado} className="col">
                  <div className="card">
                    <div className="card-body d-flex align-items-center justify-content-between" style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{e.nomeEstado}</span>
                      <span style={{
                        fontWeight: 700, fontSize: 14, color: '#39639C',
                        background: '#e8f0fb', borderRadius: 8, padding: '2px 10px',
                      }}>{e.total}</span>
                    </div>
                  </div>
                </div>
              ))}
              {stats.candidaturasPorEstado?.every(e => e.total === 0) && (
                <p style={{ color: '#aaa', fontSize: 13 }}>Sem candidaturas.</p>
              )}
            </div>
            <Link to="/admin/candidaturas" className="d-block text-center text-primary text-decoration-underline" style={{ marginTop: 16, fontSize: 13 }}>
              Ver Candidaturas
            </Link>
          </div>

          {/* Gráfico de pedidos de badges */}
          <div className="card">
            <div className="card-body">
              <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 13, margin: '0 0 12px', textAlign: 'center' }}>
                Pedidos de Badges
              </h4>
              {dadosGrafico.labels.length > 0 ? (
                <Bar
                  data={dadosGrafico}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { size: 10 } } },
                      tooltip: { mode: 'index' },
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                      y: { grid: { color: '#f0f0f0' }, border: { display: false }, ticks: { font: { size: 10 } } },
                    },
                  }}
                />
              ) : (
                <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Sem dados.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Badges por nível ── */}
        <div className="card mb-4">
          <div className="card-body">
            <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 15, marginBottom: 16 }}>
              Badges por Nível
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.badgesPorNivel?.map(n => {
                const max = Math.max(...(stats.badgesPorNivel.map(x => x.total)), 1)
                return (
                  <div key={n.tipo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, color: '#333' }}>{n.tipo}</span>
                      <span style={{ color: '#6b7280' }}>{n.total} badges</span>
                    </div>
                    <div style={{ height: 15, background: '#e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(n.total / max) * 100}%`, background: '#10b4db', borderRadius: 10 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Ações Rápidas ── */}
        <div className="card">
          <div className="card-body">
            <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 15, marginBottom: 16, textAlign: 'center' }}>
              Ações Rápidas
            </h4>
            <div className="row g-3">
              {[
                { label: 'Utilizadores',   path: '/admin/utilizadores',   itens: ['Listar utilizadores', 'Criar utilizador', 'Editar perfil', 'Ativar / Desativar'] },
                { label: 'Learning Paths', path: '/admin/learning-paths', itens: ['Learning Paths', 'Service Lines', 'Áreas e Níveis', 'Requisitos'] },
                { label: 'Badges',         path: '/admin/badges',         itens: ['Badges Regulares', 'Badges Especiais', 'Gerir pontos', 'Validade'] },
                { label: 'Candidaturas',   path: '/admin/candidaturas',   itens: ['Ver todas', 'Filtrar por estado', 'Ver histórico', 'Exportar dados'] },
              ].map((a, i) => (
                <div key={i} className="col-6 col-lg-3">
                  <div style={{
                    background: '#f9f9f9', borderRadius: 10, padding: '16px 14px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180,
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 12, color: '#333', marginBottom: 10 }}>
                        Nesta página está presente
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', color: '#888', fontSize: 11, lineHeight: 1.9 }}>
                        {a.itens.map((item, j) => <li key={j}>{item}</li>)}
                      </ul>
                    </div>
                    <div className="text-center">
                      <Link to={a.path} className="btn btn-primary btn-sm text-uppercase" style={{ letterSpacing: 0.5 }}>
                        {a.label}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: 12, fontSize: 11, color: '#aaa' }}>
          Política de Privacidade e RGPD
        </div>

      </div>
    </LayoutAdmin>
  )
}
