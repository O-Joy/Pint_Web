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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Pedidos Pendentes', valor: stats.pendentes, icon: <MdAssignment style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Consultores Ativos', valor: stats.consultores, icon: <MdPerson style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Badges Atribuídos', valor: stats.aprovados, icon: <MdMilitaryTech style={{ color: '#39639C', fontSize: 22 }} /> },
          ].map((c, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#e8f0fb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#39639C', flexShrink: 0,
              }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.valor}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{c.label}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {consultores.map((c, i) => (
                <div key={i} style={{
                  background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12,
                  padding: '14px 16px', display: 'flex', alignItems: 'center',
                  gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#c8c8c8', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#333', marginBottom: 8 }}>{c.nome}</div>
                    <div style={{ height: 15, background: '#e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.progresso}%`, background: '#10b4db', borderRadius: 10 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/serviceline/consultores" style={{
              display: 'block', textAlign: 'center', marginTop: 16,
              color: '#39639C', fontSize: 13, textDecoration: 'underline',
            }}>
              Ver Consultores
            </Link>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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

        {/* ── Gamification — top consultores da SL ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 15, margin: 0 }}>
              Melhores Consultores - GAMIFICATION
            </h4>
            <Link to="/serviceline/gamification" style={{ color: '#39639C', fontSize: 13, textDecoration: 'none' }}>
              Ver Todos
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {topConsultores.map((c, i) => (
              <div key={i} style={{ border: '1px solid #7dd8f0', borderRadius: 14, padding: '16px 14px', background: '#fff' }}>
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
            ))}
          </div>
        </div>

        {/* ── Ações Rápidas ── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 15, marginBottom: 16, textAlign: 'center' }}>
            Ações Rápidas
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Badges', path: '/serviceline/badges', itens: ['Badges Disponíveis', 'Badges Especiais', 'Badges a Expirar'] },
              { label: 'Validações', path: '/serviceline/validacoes', itens: ['Candidaturas Pendentes', 'Evidências Submetidas', 'SLA do Pedido', 'Histórico das Validações'] },
              { label: 'Consultores', path: '/serviceline/consultores', itens: ['Lista Completa', 'Pontos Acumulados', 'Timeline Profissional'] },
              { label: 'Relatórios', path: '/serviceline/relatorios', itens: ['Exportação de Dados', 'Desenvolver Relatório'] },
            ].map((a, i) => (
              <div key={i} style={{
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
                <div style={{ textAlign: 'center' }}>
                  <Link to={a.path} style={{
                    display: 'inline-block', background: '#39639C', color: '#fff',
                    borderRadius: 8, padding: '8px 18px', textDecoration: 'none',
                    fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    {a.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Footer />

      </div>
    </LayoutSL>
  )
}