import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutTM from './components/LayoutTM'
import AcoesRapidas from '../../components/AcoesRapidas'
import api from '../../services/api'
import { MdPendingActions, MdPeopleAlt, MdVerified } from 'react-icons/md'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const CARDS_ACOES_RAPIDAS = [
  {
    descricao: 'Nesta página está presente',
    items: ['Badges Disponíveis', 'Badges Especiais', 'Badges a Expirar'],
    botao: 'Badges',
    path: '/talent/badges',
  },
  {
    descricao: 'Nesta página está presente',
    items: ['Candidaturas Pendentes', 'Evidências Submetidas', 'Histórico das Validações', 'SLA do Perfil'],
    botao: 'Validações',
    path: '/talent/validacoes',
  },
  {
    descricao: 'Nesta página está presente',
    items: ['Lista Completa', 'Pontos Acumulados', 'Timeline Profissional'],
    botao: 'Consultores',
    path: '/talent/consultores',
  },
  {
    descricao: 'Nesta página está presente',
    items: ['Exportação de Dados', 'Desenvolver Relatório'],
    botao: 'Relatórios',
    path: '/talent/relatorios',
  },
]

const CORES_MEDALHA = ['#ad9409', '#a9a9a9', '#965e25', '#1cd6d6']

export default function DashboardTalent() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({ pendentes: 0, consultores: 0, validadas: 0, variacao: 0 })
  const [topConsultores, setTopConsultores] = useState([])
  const [consultores, setConsultores] = useState([])
  const [dadosGrafico, setDadosGrafico] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/tm/dashboard'),
      api.get('/tm/top-consultores'),
      api.get('/tm/estatisticas-mensais'),
    ])
      .then(([resStats, resConsultores, resGrafico]) => {
        setStats(resStats.data)

        const dados = Array.isArray(resConsultores.data) ? resConsultores.data : []
        setTopConsultores(dados.slice(0, 4).map(c => ({
          nome: c.nome, badges: c.totalBadges, pontos: c.totalPontos,
        })))
        setConsultores(dados.slice(0, 4).map(c => ({
          nome: c.nome,
          progresso: c.totalBadges > 0 ? Math.min(c.totalBadges * 10, 100) : 10,
        })))

        setDadosGrafico(Array.isArray(resGrafico.data) ? resGrafico.data : [])
      })
      .catch((err) => console.error('[DashboardTalent]', err))
      .finally(() => setLoading(false))
  }, [])

  const cartoesResumo = [
    { icone: <MdPendingActions />, valor: stats.pendentes, label: 'Pedidos Pendentes', sub: `${stats.variacao >= 0 ? '+' : ''}${stats.variacao}% Este Mês` },
    { icone: <MdPeopleAlt />, valor: stats.consultores, label: 'Consultores Ativos' },
    { icone: <MdVerified />, valor: stats.validadas, label: 'Candidaturas Validadas' },
  ]

  return (
    <LayoutTM>
      <div className="dashboard-wrapper">

        <h2 className="dashboard-titulo">Resumo da minha Service Line</h2>

        {loading ? (
          <p className="dashboard-vazio">A carregar...</p>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="row g-3 dashboard-resumo">
              {cartoesResumo.map((c, i) => (
                <div key={i} className="col-12 col-sm-6 col-lg-4">
                  <div className="dashboard-resumo-card">
                    <span className="dashboard-resumo-icone">{c.icone}</span>
                    <div style={{ flex: 1 }}>
                      <div className="dashboard-resumo-valor">{c.valor}</div>
                      <div className="dashboard-resumo-label">{c.label}</div>
                    </div>
                    {c.sub && <div className="dashboard-resumo-sub">{c.sub}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Progresso dos Consultores | Pedidos de Badges - Mensal */}
            <div className="row g-3 dashboard-linha-meio">

              <div className="col-12 col-lg-7">
                <div className="dashboard-card h-100">
                  <h3 className="dashboard-card-titulo">Progresso dos Consultores</h3>
                  <div className="row g-3">
                    {consultores.length ? consultores.map((c, i) => (
                      <div key={i} className="col-12 col-sm-6">
                        <div className="consultor-progresso-item">
                          <div className="consultor-progresso-avatar" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="consultor-progresso-nome">{c.nome}</p>
                            <div className="consultor-progresso-barra">
                              <div className="consultor-progresso-barra-fill" style={{ width: `${c.progresso}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="dashboard-vazio">Sem consultores para mostrar.</p>
                    )}
                  </div>
                  <button className="dashboard-verlink" onClick={() => navigate('/talent/consultores')}>
                    Ver Consultores
                  </button>
                </div>
              </div>

              <div className="col-12 col-lg-5">
                <div className="dashboard-card h-100">
                  <h3 className="dashboard-card-titulo">Pedidos de Badges - Mensal</h3>
                  <div style={{ position: 'relative', height: 260 }}>
                    <Bar
                      data={{
                        labels: dadosGrafico.map(d => d.mes),
                        datasets: [
                          { label: 'Aprovadas', data: dadosGrafico.map(d => d.aprovadas), backgroundColor: '#4a9fd4', borderRadius: 6, barThickness: 14 },
                          { label: 'Rejeitadas', data: dadosGrafico.map(d => d.rejeitadas), backgroundColor: '#7eecd4', borderRadius: 6, barThickness: 14 },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
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
              </div>
            </div>

            {/* Melhores Consultores - GAMIFICATION */}
            <div className="dashboard-secao">
              <div className="dashboard-secao-cabecalho">
                <h3 className="dashboard-card-titulo">Melhores Consultores - Gamification</h3>
                <button className="dashboard-verlink" onClick={() => navigate('/talent/gamification')}>
                  Ver Todos
                </button>
              </div>
              <div className="row g-3">
                {topConsultores.length ? topConsultores.map((c, i) => (
                  <div key={i} className="col-6 col-lg-3">
                    <div className="top-consultor-card">
                      <div className="top-consultor-cabecalho">
                        <div className="top-consultor-avatar" />
                        <p className="top-consultor-nome">{c.nome}</p>
                        <div className="top-consultor-medalha" style={{ background: CORES_MEDALHA[i] }}>
                          {i + 1}
                        </div>
                      </div>
                      <div className="top-consultor-stats">
                        <div>
                          <div className="top-consultor-stat-valor">{c.badges}</div>
                          <div className="top-consultor-stat-label">BADGES</div>
                        </div>
                        <div>
                          <div className="top-consultor-stat-valor" style={{ color: 'var(--cor-primaria)' }}>{c.pontos}</div>
                          <div className="top-consultor-stat-label">PONTOS</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="dashboard-vazio">Sem consultores para mostrar.</p>
                )}
              </div>
            </div>

            {/* Ações Rápidas — componente partilhado */}
            <AcoesRapidas cards={CARDS_ACOES_RAPIDAS} />
          </>
        )}

        <div style={{ textAlign: 'right', marginTop: 12, fontSize: 11, color: '#aaa' }}>
          Política de Privacidade e RGPD
        </div>
      </div>
    </LayoutTM>
  )
}