import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LayoutSL from './components/LayoutSL'
import api from '../../services/api'
import Footer from '../../components/Footer'
import { MdAssignment, MdPerson, MdMilitaryTech } from 'react-icons/md'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function DashboardServiceLine() {
  const [stats, setStats] = useState({ pendentes: 0, consultores: 0, aprovados: 0 })
  const [topConsultores, setTopConsultores] = useState([])
  const [consultores, setConsultores] = useState([])
  const [dadosGrafico, setDadosGrafico] = useState([])

  useEffect(() => {
    api.get('/sl/dashboard').then(res => setStats(res.data)).catch(() => {})

    api.get('/sl/top-consultores').then(res => {
      const dados = Array.isArray(res.data) ? res.data : []
      setTopConsultores(dados.slice(0, 4).map(c => ({
        nome: c.nome, badges: c.totalBadges, pontos: c.totalPontos,
      })))
      // 6 consultores para o "Progresso dos Consultores" (2 colunas x 3 linhas)
      setConsultores(dados.slice(0, 6).map(c => ({
        nome: c.nome,
        progresso: c.progresso ?? 0,
      })))
    }).catch(() => {})

    api.get('/sl/estatisticas-mensais').then(res => {
      setDadosGrafico(Array.isArray(res.data) ? res.data : [])
    }).catch(() => {})
  }, [])

  return (
    <LayoutSL>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 20, textAlign: 'center', fontSize: 18 }}>
          RESUMO DA MINHA SERVICE LINE
        </h2>

        {/* ── KPIs ── */}
        <div className="row g-3" style={{ marginBottom: 28 }}>
          {[
            { label: 'Pedidos Pendentes', valor: stats.pendentes, icon: <MdAssignment style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Consultores Ativos', valor: stats.consultores, icon: <MdPerson style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Badges Atribuídos', valor: stats.aprovados, icon: <MdMilitaryTech style={{ color: '#39639C', fontSize: 22 }} /> },
          ].map((c, i) => (
            <div key={i} className="col-12 col-md-4">
            <div className="card h-100">
              <div className="card-body d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 44, height: 44, background: '#e8f0fb', color: '#39639C', fontSize: 20 }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.valor}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{c.label}</div>
              </div>
              </div>
            </div>
            </div>
          ))}
        </div>

        {/* ── Progresso dos Consultores + Pedidos de Badges ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>

          <div>
            <h4 style={{ color: '#39639C', fontWeight: 600, marginBottom: 20, fontSize: 15 }}>
              Progresso dos Consultores
            </h4>
            <div className="row row-cols-2 g-3">
              {consultores.map((c, i) => (
                <div key={i} className="col">
                <div className="card">
                  <div className="card-body d-flex align-items-center gap-3" style={{ padding: '14px 16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#c8c8c8', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#333', marginBottom: 8 }}>{c.nome}</div>
                    <div style={{ height: 15, background: '#e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.progresso}%`, background: '#10b4db', borderRadius: 10 }} />
                    </div>
                  </div>
                  </div>
                </div>
                </div>
              ))}
            </div>
            <Link to="/serviceline/consultores" className="d-block text-center text-primary text-decoration-underline" style={{ marginTop: 16, fontSize: 13 }}>
              Ver Consultores
            </Link>
          </div>

          <div className="card">
            <div className="card-body">
            <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 13, margin: '0 0 12px', textAlign: 'center' }}>
              Pedidos de Badges
            </h4>
            <Bar
              data={{
                labels: dadosGrafico.map(d => d.mes),
                datasets: [
                  { label: 'Aprovadas',  data: dadosGrafico.map(d => d.aprovadas),  backgroundColor: '#7dd8f0', borderRadius: 4, barThickness: 10 },
                  { label: 'Rejeitadas', data: dadosGrafico.map(d => d.rejeitadas), backgroundColor: '#7eecd4', borderRadius: 4, barThickness: 10 },
                ],
              }}
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
            </div>
          </div>
        </div>

        {/* ── Gamification — top consultores da SL ── */}
        <div className="card mb-4">
          <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 15, margin: 0 }}>
              Melhores Consultores - GAMIFICATION
            </h4>
            <Link to="/serviceline/gamification" className="text-primary text-decoration-none" style={{ fontSize: 13 }}>
              Ver Todos
            </Link>
          </div>
          <div className="row g-3">
            {topConsultores.map((c, i) => (
              <div key={i} className="col-6 col-lg-3">
              <div className="card h-100" style={{ border: '1px solid #7dd8f0' }}>
                <div className="card-body" style={{ padding: '16px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#bdbdbd', flexShrink: 0 }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333', lineHeight: 1.3 }}>{c.nome}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#11a9d6', lineHeight: 1 }}>{c.badges}</div>
                    <div style={{ fontSize: 10, color: '#39639C', fontWeight: 600 }}>BADGES</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', margin: '0 auto 4px',
                      background: i === 0 ? '#f0b429' : i === 1 ? '#b0b0b0' : i === 2 ? '#a0522d' : '#1cd6c4',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{c.pontos} PONTOS</div>
                  </div>
                </div>
                </div>
              </div>
              </div>
            ))}
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
              { label: 'Badges', path: '/serviceline/badges', itens: ['Badges Disponíveis', 'Badges Especiais', 'Badges a Expirar'] },
              { label: 'Validações', path: '/serviceline/validacoes', itens: ['Candidaturas Pendentes', 'Evidências Submetidas', 'SLA do Pedido', 'Histórico das Validações'] },
              { label: 'Consultores', path: '/serviceline/consultores', itens: ['Lista Completa', 'Pontos Acumulados', 'Timeline Profissional'] },
              { label: 'Relatórios', path: '/serviceline/relatorios', itens: ['Exportação de Dados', 'Desenvolver Relatório'] },
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

        <Footer />

      </div>
    </LayoutSL>
  )
}