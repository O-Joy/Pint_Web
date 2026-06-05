import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LayoutTM from './components/LayoutTM'
import api from '../../services/api'
import { MdPendingActions, MdPeopleAlt, MdVerified } from 'react-icons/md'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)



export default function DashboardTalent() {
  const [stats, setStats] = useState({ pendentes: 0, consultores: 0, validadas: 0, variacao: 0 })
  const [topConsultores, setTopConsultores] = useState([])
  const [consultores, setConsultores] = useState([])
  const [dadosGrafico, setDadosGrafico] = useState([])

  useEffect(() => {
  api.get('/tm/dashboard').then(res => setStats(res.data)).catch(() => {})

  api.get('/tm/top-consultores').then(res => {
    const dados = Array.isArray(res.data) ? res.data : []
    setTopConsultores(dados.slice(0, 4).map(c => ({
      nome: c.nome, badges: c.totalBadges, pontos: c.totalPontos,
    })))
    setConsultores(dados.slice(0, 4).map(c => ({
      nome: c.nome,
      progresso: c.totalBadges > 0 ? Math.min(c.totalBadges * 10, 100) : 10,
    })))
  }).catch(() => {})

  api.get('/tm/estatisticas-mensais').then(res => {
    setDadosGrafico(Array.isArray(res.data) ? res.data : [])
  }).catch(() => {})
}, [])

  return (
    <LayoutTM>
      <div style={{ fontFamily: 'Poppins, sans-serif' }}>

        <h2 style={{ color: '#39639C', fontWeight: 700, marginBottom: 20, textAlign: 'center', fontSize: 18 }}>
          RESUMO DA MINHA SERVICE LINE
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Pedidos Pendentes', valor: stats.pendentes, sub: `${stats.variacao >=0 ? '+' : ''}${stats.variacao}%\nEste Mês`, icon: <MdPendingActions style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Consultores Ativos', valor: stats.consultores, icon: <MdPeopleAlt style={{ color: '#39639C', fontSize: 22 }} /> },
            { label: 'Candidaturas Validadas', valor: stats.validadas, icon: <MdVerified style={{ color: '#39639C', fontSize: 22 }} /> },
          ].map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#39639C', flexShrink: 0 }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{c.valor}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{c.label}</div>
                </div>
              </div>
              {c.sub && (
                <div style={{ textAlign: 'right', fontSize: 11, color: '#39639C', fontWeight: 600, lineHeight: 1.5 }}>
                  {c.sub.split('\n').map((l, j) => <div key={j}>{l}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>

          <div>
            <h4 style={{ color: '#39639C', fontWeight: 600, marginBottom: 20, fontSize: 15 }}>Progresso dos Consultores</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {consultores.map((c, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
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
            <Link to="/talent/consultores" style={{ display: 'block', textAlign: 'center', marginTop: 16, color: '#39639C', fontSize: 13, textDecoration: 'underline' }}>
              Ver Consultores
            </Link>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 14, margin: '0 0 16px' }}>Pedidos de Badges - Mensal</h4>
          <Bar
            data={{
              labels: dadosGrafico.map(d => d.mes),
              datasets: [
                {
                  label: 'Aprovadas',
                  data: dadosGrafico.map(d => d.aprovadas),
                  backgroundColor: '#4a9fd4',
                  borderRadius: 6,
                  barThickness: 14,
                },
                {
                  label: 'Rejeitadas',
                  data: dadosGrafico.map(d => d.rejeitadas),
                  backgroundColor: '#7eecd4',
                  borderRadius: 6,
                  barThickness: 14,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8 } },
                tooltip: { mode: 'index' },
              },
              scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#f0f0f0' }, border: { display: false } },
              },
            }}
          />
        </div>
</div>
          


        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 15, margin: 0 }}>Melhores Consultores - GAMIFICATION</h4>
            <Link to="/talent/gamification" style={{ color: '#39639C', fontSize: 13, textDecoration: 'none' }}>Ver Todos</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {topConsultores.map((c, i) => (
              <div key={i} style={{ border: '1px solid #d0dff0', borderRadius: 14, padding: '16px 14px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#bdbdbd', flexShrink: 0 }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333', lineHeight: 1.3 }}>{c.nome}</div>
                  {i < 4 && (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', marginLeft: 'auto',
                      background: i === 0 ? '#ad9409' : i === 1 ? '#a9a9a9' : i === 2 ? '#965e25' : '#1cd6d6',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#11a9d6', lineHeight: 1 }}>{c.badges}</div>
                    <div style={{ fontSize: 10, color: '#39639C', fontWeight: 600 }}>BADGES</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#39639C', lineHeight: 1 }}>{c.pontos}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>PONTOS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h4 style={{ color: '#39639C', fontWeight: 600, fontSize: 15, marginBottom: 16, textAlign: 'center' }}>Ações Rápidas</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Badges', path: '/talent/badges', itens: ['Badges Disponíveis', 'Badges Especiais', 'Badges a Expirar'] },
              { label: 'Validações', path: '/talent/validacoes', itens: ['Candidaturas Pendentes', 'Evidências Submetidas', 'Histórico das Validações', 'SLA do Perfil'] },
              { label: 'Consultores', path: '/talent/consultores', itens: ['Lista Completa', 'Pontos Acumulados', 'Timeline Profissional'] },
              { label: 'Relatórios', path: '/talent/relatorios', itens: ['Exportação de Dados', 'Desenvolver Relatório'] },
            ].map((a, i) => (
              <div key={i} style={{ background: '#f9f9f9', borderRadius: 10, padding: '16px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 12, color: '#333', marginBottom: 10 }}>Nesta página está presente</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', color: '#888', fontSize: 11, lineHeight: 1.9 }}>
                    {a.itens.map((item, j) => <li key={j}>- {item}</li>)}
                  </ul>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Link to={a.path} style={{ display: 'inline-block', background: '#39639C', color: '#fff', borderRadius: 8, padding: '8px 18px', textDecoration: 'none', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {a.label}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: 12, fontSize: 11, color: '#aaa' }}>
          Política de Privacidade e RGPD
        </div>

      </div>
    </LayoutTM>
  )
}